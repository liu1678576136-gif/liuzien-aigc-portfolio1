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
export function createFragmentedVideo(video, { fps = 25, timeAtProgress = (p, d) => p * d, onFrame = () => {} } = {}) {
  let manifestUrl = new URL(video.dataset.streamSrc, document.baseURI);
  const lifetime = new AbortController();
  const cache = new Map(), downloads = new Map(), appended = new Set(), retries = new Map();
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
  const fail = () => { if (!disposed) { fatal = true; notify(false, true); } };
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
  const fetchPart = index => {
    if (cache.has(index) || appended.has(index) || downloads.has(index) || (retries.get(index) || 0) >= 2) return;
    const controller = new AbortController();
    downloads.set(index, controller);
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    fetch(new URL(manifest.segments[index].file, manifestUrl), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`Video segment HTTP ${response.status}`); return response.arrayBuffer(); })
      .then(bytes => { if (!disposed && enabled && needed().includes(index)) cache.set(index, bytes); })
      .catch(() => {
        if (controller.signal.aborted && controller.signal.reason !== "timeout") return;
        if (disposed || !enabled || !needed().includes(index)) return;
        retries.set(index, (retries.get(index) || 0) + 1);
        if (index === needed()[0] && retries.get(index) >= 2) fail();
        clearTimeout(retryTimer);
        retryTimer = setTimeout(pump, 500);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (downloads.get(index) === controller) downloads.delete(index);
        if (!disposed) pump();
      });
  };
  const pump = () => {
    if (disposed || !enabled || fatal) return;
    if (!manifest || !initialized) { notify(true); return; }
    seek();
    if (native) return;
    const indexes = needed(), focus = indexes[0];
    if ((retries.get(focus) || 0) >= 2) { fail(); return; }
    if (!buffer.updating) for (const index of appended) {
      const part = manifest.segments[index];
      if (!containsTime(buffer.buffered, (part.start + part.end) / 2)) appended.delete(index);
    }
    for (const [index, controller] of downloads) if (!indexes.includes(index)) { controller.abort(); downloads.delete(index); }
    for (const index of cache.keys()) if (Math.abs(index - focus) > 3) cache.delete(index);
    for (const index of indexes) { if (downloads.size >= 2) break; fetchPart(index); }
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
    try { buffer.appendBuffer(cache.get(index)); } catch { fail(); }
  };
  const updated = () => {
    if (disposed) return;
    if (operation?.init) initialized = true;
    if (operation?.index !== undefined) { appended.add(operation.index); cache.delete(operation.index); }
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
        video.src = new URL(manifest.playlist, manifestUrl).href;
        video.preload = "auto";
        video.load();
        pump();
        return;
      }
      source = new MediaSource();
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
    retries.clear(); fatal = false; notify(true); pump();
  };
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
      progress = clamp(value, 0, 1); enabled = Boolean(shouldLoad);
      video.dataset.progress = String(progress);
      video.dataset.streamEnabled = String(enabled);
      if (enabled) { if (!initialized || fatal) notify(true, fatal); void start(); pump(); }
      else { for (const controller of downloads.values()) controller.abort(); downloads.clear(); notify(false); }
    },
    resize() { if (!disposed && video.readyState >= 2 && !video.seeking) onFrame(video); },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(retryTimer);
      clearTimeout(startTimer);
      lifetime.abort(); abortOpen?.();
      for (const controller of downloads.values()) controller.abort();
      if (buffer) { buffer.removeEventListener("updateend", updated); buffer.removeEventListener("error", fail); }
      video.removeEventListener("loadedmetadata", pump);
      video.removeEventListener("loadeddata", decoded);
      video.removeEventListener("seeked", decoded);
      video.removeEventListener("progress", pump);
      video.removeEventListener("error", fail);
      video.removeEventListener("stream-retry", retry);
      video.pause(); video.removeAttribute("src"); video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      cache.clear(); downloads.clear();
    },
  };
}
