import { chapterCacheBytes, chapterPreloadPlan, videoDownloads } from "./chapterPreload.js";
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export function segmentAt(segments, time) {
  let low = 0, high = segments.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (time >= segments[middle].end) low = middle + 1; else high = middle;
  }
  return low;
}
export function containsTime(ranges, time) {
  for (let i = 0; i < ranges.length; i++) if (time >= ranges.start(i) - .001 && time < ranges.end(i) - .001) return true;
  return false;
}

export async function selectStreamVariant(variants, video, { mediaSource = globalThis.MediaSource, capabilities = globalThis.navigator?.mediaCapabilities, capabilityTimeoutMs = 1000 } = {}) {
  for (const variant of variants) {
    const mse = Boolean(mediaSource?.isTypeSupported(variant.mime));
    const native = Boolean(video.canPlayType(variant.mime) && video.canPlayType("application/vnd.apple.mpegurl"));
    if (!mse && !native) continue;
    if (variant.codec === "hevc" && capabilities?.decodingInfo) {
      let timeout;
      try {
        const info = await Promise.race([capabilities.decodingInfo({ type: mse ? "media-source" : "file", video: { contentType: variant.mime, width: variant.width, height: variant.height, bitrate: variant.bitrate, framerate: variant.fps } }), new Promise(resolve => { timeout = setTimeout(() => resolve(null), capabilityTimeoutMs); })]);
        if (!info?.supported || !info.smooth || !info.powerEfficient) continue;
      } catch { continue; } finally { clearTimeout(timeout); }
    }
    return variant;
  }
  throw new Error("No supported scroll video format");
}

// Fetch the current region of the optimized video, retaining calibrated timing.
export function createFragmentedVideo(video, { fps = 25, timeAtProgress = (p, d) => p * d, onFrame = () => {}, chapters, prefetchBytes = chapterCacheBytes, coordinator = videoDownloads } = {}) {
  let manifestUrl = new URL(video.dataset.streamSrc, document.baseURI);
  const lifetime = new AbortController();
  const cache = new Map(), downloads = new Map(), appended = new Set(), retries = new Map();
  const speculativeFailures = new Set();
  const chapterCache = Boolean(chapters?.length), owner = Symbol("scroll-video");
  let cacheBytes = 0, direction = 1, planKey = "", cachedPlan;
  let disposed = false, enabled = false, progress = 0, manifest, source, buffer, objectUrl;
  let starting = false, initialized = false, native = false, init, operation, fatal = false;
  let retryTimer, startTimer, abortOpen, lastPainted = -1, seekStarted = 0;
  const target = () => manifest ? clamp(Math.round(timeAtProgress(progress, manifest.duration) * fps) / fps, 0, Math.max(0, manifest.duration - 1 / fps)) : 0;
  const notify = (loading, error = false) => {
    const next = enabled && loading ? "true" : "false";
    const problem = error ? "true" : "false";
    if (video.dataset.buffering === next && video.dataset.streamError === problem) return;
    video.dataset.buffering = next;
    video.dataset.streamError = problem;
    video.dispatchEvent(new CustomEvent("video-buffering", { bubbles: true }));
  };
  const syncUrgency = () => coordinator.setUrgent(owner, !disposed && !fatal && enabled && [...downloads.values()].some(entry => !entry.lease));
  const fail = () => { if (!disposed) { fatal = true; for (const entry of downloads.values()) entry.controller.abort(); coordinator.setUrgent(owner, false); notify(false, true); } };
  const plan = () => {
    if (!chapterCache || !manifest) return null;
    const key = `${segmentAt(manifest.segments, target())}:${direction}`;
    if (key !== planKey) { planKey = key; cachedPlan = chapterPreloadPlan(manifest.segments, chapters, target(), direction, prefetchBytes); }
    return cachedPlan;
  };
  const deleteCached = index => { const bytes = cache.get(index); if (bytes) { cacheBytes -= bytes.byteLength; cache.delete(index); } };
  const trimCache = () => {
    if (!chapterCache) return;
    const protectedIndexes = plan()?.retained || new Set();
    while (cacheBytes > prefetchBytes) {
      const index = [...cache.keys()].find(i => !protectedIndexes.has(i));
      if (index === undefined) break;
      deleteCached(index);
    }
  };
  const reportPreload = () => {
    const currentPlan = plan(); if (!currentPlan) return;
    const count = indexes => indexes.filter(i => cache.has(i) || appended.has(i)).length;
    const set = (key, value) => { if (video.dataset[key] !== String(value)) video.dataset[key] = String(value); };
    set("prefetchChapter", currentPlan.current); set("prefetchNextChapter", currentPlan.next);
    set("prefetchCurrent", `${count(currentPlan.currentIndexes)}/${currentPlan.currentIndexes.length}`);
    set("prefetchNext", `${count(currentPlan.nextIndexes)}/${currentPlan.nextIndexes.length}`);
    set("prefetchNextReady", currentPlan.nextIndexes.length > 0 && count(currentPlan.nextIndexes) === currentPlan.nextIndexes.length);
    set("prefetchCacheBytes", cacheBytes);
  };
  const paint = () => {
    if (disposed || video.seeking || video.readyState < 2) return;
    if (lastPainted === video.currentTime) return;
    lastPainted = video.currentTime;
    video.classList.add("has-frame");
    video.dataset.firstFrame = "true";
    onFrame(video);
    video.dispatchEvent(new Event("scroll-video-frame"));
  };
  const seek = () => {
    if (!enabled || !manifest || !video.readyState) return;
    const time = target();
    if (native || containsTime(video.buffered, time)) {
      // Replace an obsolete seek immediately. Waiting for its seeked event can
      // deadlock after the user scrolls away from an unbuffered position.
      if (Math.abs(video.currentTime - time) > .45 / fps) {
        const obsolete = !containsTime(video.buffered, video.currentTime) || Date.now() - seekStarted > 120;
        if (!video.seeking || obsolete) { seekStarted = Date.now(); video.currentTime = time; }
      }
      else if (!video.seeking) paint();
    }
    notify(video.seeking || video.readyState < 2 || Math.abs(video.currentTime - time) > .45 / fps, fatal);
  };
  const needed = () => {
    const index = segmentAt(manifest.segments, target());
    return [index, index + 1, index - 1].filter(i => i >= 0 && i < manifest.segments.length);
  };
  const fetchPart = (index, background = false) => {
    if (cache.has(index) || appended.has(index) || downloads.has(index) || (retries.get(index) || 0) >= 2) return false;
    const controller = new AbortController();
    const lease = background ? coordinator.claim(() => controller.abort()) : null;
    if (background && !lease) return false;
    const entry = { controller, lease };
    downloads.set(index, entry); syncUrgency();
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    fetch(new URL(manifest.segments[index].file, manifestUrl), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`Video segment HTTP ${response.status}`); return response.arrayBuffer(); })
      .then(bytes => {
        if (disposed || !enabled || !chapterCache && !needed().includes(index)) return;
        const expectedBytes = manifest.segments[index].bytes;
        if (expectedBytes !== undefined && bytes.byteLength !== expectedBytes) throw new Error("Incomplete video fragment");
        deleteCached(index); cache.set(index, bytes); cacheBytes += bytes.byteLength; trimCache();
      })
      .catch(() => {
        if (controller.signal.aborted && controller.signal.reason !== "timeout") return;
        if (disposed || !enabled || !(chapterCache ? plan()?.retained.has(index) : needed().includes(index))) return;
        retries.set(index, (retries.get(index) || 0) + 1);
        if (entry.lease) speculativeFailures.add(index);
        if (index === needed()[0] && retries.get(index) >= 2) fail();
        clearTimeout(retryTimer);
        retryTimer = setTimeout(pump, 500);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (downloads.get(index) === entry) downloads.delete(index);
        coordinator.release(entry.lease); syncUrgency();
        if (!disposed) pump();
      });
    return true;
  };
  const pump = () => {
    if (disposed || !enabled || fatal) return;
    if (!manifest || !initialized) { notify(true); return; }
    seek();
    if (native) return;
    const indexes = needed(), focus = indexes[0];
    // An earlier speculative failure must not consume the visible frame's
    // own retry budget when the user later reaches that scene.
    for (const index of indexes) if (speculativeFailures.delete(index)) retries.delete(index);
    if ((retries.get(focus) || 0) >= 2) { fail(); return; }
    if (!buffer.updating) for (const index of appended) {
      const part = manifest.segments[index];
      if (!containsTime(buffer.buffered, (part.start + part.end) / 2)) appended.delete(index);
    }
    const currentPlan = plan();
    for (const [index, entry] of downloads) {
      if (indexes.includes(index)) {
        if (entry.lease) { coordinator.release(entry.lease); entry.lease = null; }
      } else if (!entry.lease || !currentPlan?.retained.has(index)) {
        entry.controller.abort(); downloads.delete(index); coordinator.release(entry.lease);
      }
    }
    syncUrgency();
    if (chapterCache) trimCache();
    else for (const index of cache.keys()) if (Math.abs(index - focus) > 3) deleteCached(index);
    for (const index of indexes) {
      if ([...downloads.values()].filter(entry => !entry.lease).length >= 2) break;
      fetchPart(index);
    }
    // Raw bytes for the next act may fill while only nearby fragments are
    // appended to MSE. Never spend the foreground transfer slots on this work.
    if (currentPlan && video.readyState >= 2 && !video.seeking && indexes.every(i => cache.has(i) || appended.has(i))) {
      const next = currentPlan.background.find(i => !cache.has(i) && !appended.has(i) && !downloads.has(i) && (retries.get(i) || 0) < 2);
      if (next !== undefined) fetchPart(next, true);
    }
    reportPreload();
    if (buffer.updating) return;
    // Bound decoded buffer memory, especially on long sessions and reverse scroll.
    const keepStart = manifest.segments[Math.max(0, focus - 3)].start;
    const keepEnd = manifest.segments[Math.min(manifest.segments.length - 1, focus + 3)].end;
    const first = buffer.buffered.length ? buffer.buffered.start(0) : 0;
    const last = buffer.buffered.length ? buffer.buffered.end(buffer.buffered.length - 1) : 0;
    const remove = buffer.buffered.length && first < keepStart - .001 ? [0, keepStart] : last > keepEnd + .001 ? [keepEnd, last + 1] : null;
    if (remove) {
      operation = { remove };
      try { buffer.remove(...remove); } catch { fail(); }
      return;
    }
    const index = indexes.find(i => !appended.has(i) && cache.has(i));
    if (index === undefined) return;
    operation = { index };
    const bytes = cache.get(index);
    if (chapterCache) { cache.delete(index); cache.set(index, bytes); }
    try { buffer.appendBuffer(bytes); } catch { fail(); }
  };
  const updated = () => {
    if (disposed) return;
    if (operation?.init) initialized = true;
    if (operation?.index !== undefined) { appended.add(operation.index); if (!chapterCache) deleteCached(operation.index); }
    if (operation?.remove) {
      const [start, end] = operation.remove;
      for (const index of appended) if (manifest.segments[index].start < end && manifest.segments[index].end > start) appended.delete(index);
    }
    operation = null;
    pump();
  };
  const start = async () => {
    if (starting || disposed) return;
    starting = true;
    startTimer = setTimeout(() => { lifetime.abort(); abortOpen?.(); }, 15000);
    try {
      const response = await fetch(manifestUrl, { signal: lifetime.signal });
      if (!response.ok) throw new Error(`Video manifest HTTP ${response.status}`);
      manifest = await response.json();
      if (disposed) return;
      if (manifest.version === 2 && Array.isArray(manifest.variants)) {
        const variant = await selectStreamVariant(manifest.variants, video);
        if (disposed) return;
        manifestUrl = new URL(variant.url, manifestUrl);
        const selected = await fetch(manifestUrl, { signal: lifetime.signal });
        if (!selected.ok) throw new Error(`Selected video HTTP ${selected.status}`);
        manifest = await selected.json();
        if (disposed) return;
      }
      if (manifest.version !== 1 || !Number.isFinite(manifest.duration) || !manifest.segments?.length) throw new Error("Invalid video stream");
      video.dataset.streamCodec = manifest.codec || "avc";
      video.preload = "auto";
      if (!globalThis.MediaSource?.isTypeSupported(manifest.mime)) {
        if (!video.canPlayType("application/vnd.apple.mpegurl")) throw new Error("Video streaming unsupported");
        native = initialized = true;
        video.dataset.preloadStrategy = "native-hls";
        video.src = new URL(manifest.playlist, manifestUrl).href;
        video.preload = "auto";
        video.load();
        pump();
        return;
      }
      source = new MediaSource();
      video.dataset.preloadStrategy = chapterCache ? "current-and-next-chapter" : "nearby-frames";
      const opened = new Promise((resolve, reject) => {
        abortOpen = () => reject(new Error("Disposed video stream"));
        source.addEventListener("sourceopen", resolve, { once: true });
      });
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
      video.load();
      const [responseInit] = await Promise.all([fetch(new URL(manifest.init, manifestUrl), { signal: lifetime.signal }), opened]);
      if (!responseInit.ok) throw new Error(`Video initialization HTTP ${responseInit.status}`);
      init = await responseInit.arrayBuffer();
      if (disposed) return;
      buffer = source.addSourceBuffer(manifest.mime);
      buffer.addEventListener("updateend", updated);
      buffer.addEventListener("error", fail);
      source.duration = manifest.duration;
      operation = { init: true };
      buffer.appendBuffer(init);
      init = null;
    } catch { fail(); } finally { clearTimeout(startTimer); }
  };
  const decoded = () => { paint(); pump(); };
  const retry = () => {
    if (!manifest || !buffer && !native || video.error) { video.dispatchEvent(new CustomEvent("video-reload-required", { bubbles: true })); return; }
    retries.clear(); speculativeFailures.clear(); fatal = false; notify(true); pump();
  };
  const unsubscribe = chapterCache ? coordinator.subscribe(() => pump()) : () => {};
  video.pause();
  video.addEventListener("loadedmetadata", pump);
  video.addEventListener("loadeddata", decoded);
  video.addEventListener("seeked", decoded);
  video.addEventListener("progress", pump);
  video.addEventListener("error", fail);
  video.addEventListener("stream-retry", retry);
  return {
    update(value, shouldLoad) {
      if (disposed) return;
      if (Math.abs(value - progress) > 1e-7) direction = value < progress ? -1 : 1;
      progress = clamp(value, 0, 1); enabled = Boolean(shouldLoad);
      video.dataset.progress = String(progress);
      video.dataset.streamEnabled = String(enabled);
      if (enabled) { if (!initialized || fatal) notify(true, fatal); void start(); pump(); }
      else { for (const entry of downloads.values()) { entry.controller.abort(); coordinator.release(entry.lease); } downloads.clear(); syncUrgency(); notify(false); }
    },
    resize() { if (!disposed && video.readyState >= 2 && !video.seeking) onFrame(video); },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(retryTimer);
      clearTimeout(startTimer);
      lifetime.abort(); abortOpen?.();
      unsubscribe();
      for (const entry of downloads.values()) { entry.controller.abort(); coordinator.release(entry.lease); }
      coordinator.setUrgent(owner, false);
      if (buffer) { buffer.removeEventListener("updateend", updated); buffer.removeEventListener("error", fail); }
      video.removeEventListener("loadedmetadata", pump);
      video.removeEventListener("loadeddata", decoded);
      video.removeEventListener("seeked", decoded);
      video.removeEventListener("progress", pump);
      video.removeEventListener("error", fail);
      video.removeEventListener("stream-retry", retry);
      video.pause(); video.removeAttribute("src"); video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      cache.clear(); cacheBytes = 0; downloads.clear(); speculativeFailures.clear();
    },
  };
}
