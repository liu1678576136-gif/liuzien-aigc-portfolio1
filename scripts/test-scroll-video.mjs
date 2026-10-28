import assert from "node:assert/strict";
import { test } from "node:test";
import { createFragmentedVideo, containsTime, segmentAt, selectStreamVariant } from "../src/media/createFragmentedVideo.js";

const settle = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
const ranges = values => ({ length: values.length, start: i => values[i][0], end: i => values[i][1] });
function harness({ delayed = [], failures = [], native = false, master } = {}) {
  const saved = { fetch: globalThis.fetch, document: globalThis.document, MediaSource: globalThis.MediaSource, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const requests = [], revoked = [], sources = new Map();
  const manifest = { version: 1, duration: 10, mime: 'video/mp4; codecs="avc1.640033"', init: "init.mp4", playlist: "stream.m3u8", segments: Array.from({ length: 20 }, (_, i) => ({ file: `part-${i}.m4s`, start: i / 2, end: (i + 1) / 2 })) };
  let video;
  class SourceBuffer extends EventTarget {
    constructor() { super(); this.parts = new Set(); this.updating = false; this.operations = 0; }
    get buffered() {
      const values = [];
      for (const i of [...this.parts].sort((a, b) => a - b)) {
        if (values.at(-1)?.[1] === i / 2) values.at(-1)[1] = (i + 1) / 2; else values.push([i / 2, (i + 1) / 2]);
      }
      return ranges(values);
    }
    appendBuffer(bytes) {
      assert.equal(this.updating, false, "SourceBuffer mutations must be serialized"); this.updating = true;
      queueMicrotask(() => {
        if (new Uint8Array(bytes)[0] === 255) { video.readyState = 1; video.dispatchEvent(new Event("loadedmetadata")); }
        else this.parts.add(new Uint8Array(bytes)[0] - 1);
        this.updating = false; this.dispatchEvent(new Event("updateend")); video.decode();
      });
    }
    remove(start, end) {
      assert(++this.operations < 500, "No repeated empty buffer removals");
      assert.equal(this.updating, false); this.updating = true;
      queueMicrotask(() => {
        for (const i of this.parts) if (i / 2 < end && (i + 1) / 2 > start) this.parts.delete(i);
        this.updating = false; this.dispatchEvent(new Event("updateend")); video.decode();
      });
    }
  }
  class MediaSource extends EventTarget {
    static isTypeSupported(mime) { return !mime.includes("hvc1"); }
    constructor() { super(); this.buffer = null; }
    addSourceBuffer() { return this.buffer = new SourceBuffer(); }
    set duration(value) { video.duration = value; }
  }
  class Video extends EventTarget {
    constructor() { super(); this.dataset = { streamSrc: "/repo/stream/stream.json" }; this.readyState = 0; this.duration = NaN; this.seeking = false; this.time = 0; this.seekRequests = []; this.classes = new Set(); this.classList = { add: v => this.classes.add(v) }; this.holdDecode = false; }
    get buffered() { return sources.get(this.src)?.buffer?.buffered || ranges([]); }
    get currentTime() { return this.time; }
    set currentTime(value) { this.time = value; this.seeking = true; this.seekRequests.push(value); queueMicrotask(() => this.decode()); }
    pause() {}
    load() { if (this.src?.startsWith("blob:")) queueMicrotask(() => sources.get(this.src)?.dispatchEvent(new Event("sourceopen"))); }
    removeAttribute(name) { if (name === "src") this.src = ""; }
    canPlayType() { return native ? "probably" : ""; }
    decode() {
      if (this.holdDecode || !containsTime(this.buffered, this.time)) return;
      const wasSeeking = this.seeking, wasUnready = this.readyState < 2;
      this.seeking = false; this.readyState = 2;
      if (wasSeeking) this.dispatchEvent(new Event("seeked")); else if (wasUnready) this.dispatchEvent(new Event("loadeddata"));
    }
  }
  video = new Video();
  globalThis.document = { baseURI: "https://example.test/repo/" };
  globalThis.MediaSource = native ? undefined : MediaSource;
  URL.createObjectURL = value => { const key = `blob:video-${sources.size}`; sources.set(key, value); return key; };
  URL.revokeObjectURL = value => { revoked.push(value); sources.delete(value); };
  globalThis.fetch = async (url, { signal } = {}) => {
    const path = new URL(url).pathname, index = /part-(\d+)/.exec(path)?.[1];
    requests.push({ path, signal });
    if (path.endsWith("stream.json")) return { ok: true, json: async () => master && path === "/repo/stream/stream.json" ? master : manifest };
    if (index !== undefined && delayed.includes(Number(index))) return new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
    if (index !== undefined && failures.includes(Number(index))) return { ok: false, status: 503 };
    return { ok: true, arrayBuffer: async () => Uint8Array.of(index === undefined ? 255 : Number(index) + 1).buffer };
  };
  const controller = createFragmentedVideo(video, { fps: 25 });
  return { video, controller, requests, revoked, buffer: () => [...sources.values()][0]?.buffer,
    restore() { controller.dispose(); globalThis.fetch = saved.fetch; globalThis.document = saved.document; globalThis.MediaSource = saved.MediaSource; URL.createObjectURL = saved.create; URL.revokeObjectURL = saved.revoke; } };
}

test("segment boundaries select the next independent segment", () => {
  const segments = [{ start: 0, end: .24 }, { start: .24, end: .48 }, { start: .48, end: .6 }];
  assert.equal(segmentAt(segments, 0), 0); assert.equal(segmentAt(segments, .24), 1); assert.equal(segmentAt(segments, .599), 2);
});
test("initial load fetches only neighboring video fragments", async () => {
  const h = harness();
  try {
    h.controller.update(0, true); await settle();
    assert.equal(h.video.dataset.firstFrame, "true"); assert.equal(h.video.dataset.buffering, "false");
    assert.deepEqual(h.requests.filter(r => r.path.includes("part-")).map(r => r.path), ["/repo/stream/part-0.m4s", "/repo/stream/part-1.m4s"]);
    assert(!h.requests.some(r => r.path.includes("film.mp4")));
  } finally { h.restore(); }
});
const variants = [
  { url: "hevc/stream.json", codec: "hevc", mime: 'video/mp4; codecs="hvc1.1.6.L120.90"', width: 2490, height: 1440, bitrate: 10000000, fps: 30 },
  { url: "avc/stream.json", codec: "avc", mime: 'video/mp4; codecs="avc1.640028"', width: 1868, height: 1080, bitrate: 8000000, fps: 30 },
];
const noNative = { canPlayType: () => "" };
test("hardware-supported 2K HEVC is preferred", async () => {
  assert.equal((await selectStreamVariant(variants, noNative, { mediaSource: { isTypeSupported: () => true }, capabilities: { decodingInfo: async () => ({ supported: true, smooth: true, powerEfficient: true }) } })).codec, "hevc");
});
test("unsupported or inefficient HEVC automatically selects AVC", async () => {
  assert.equal((await selectStreamVariant(variants, noNative, { mediaSource: { isTypeSupported: mime => mime.includes("avc1") }, capabilities: null })).codec, "avc");
  assert.equal((await selectStreamVariant(variants, noNative, { mediaSource: { isTypeSupported: () => true }, capabilities: { decodingInfo: async () => ({ supported: true, smooth: false, powerEfficient: false }) } })).codec, "avc");
});
test("native HEVC HLS remains available without MediaSource", async () => {
  assert.equal((await selectStreamVariant(variants, { canPlayType: () => "probably" }, { mediaSource: null, capabilities: null })).codec, "hevc");
});
test("a stalled HEVC hardware query cannot block the opening scene", async () => {
  const variant = await selectStreamVariant(variants, noNative, { mediaSource: { isTypeSupported: () => true }, capabilities: { decodingInfo: () => new Promise(() => {}) }, capabilityTimeoutMs: 5 });
  assert.equal(variant.codec, "avc");
});
test("master selection downloads only the playable variant", async () => {
  const h = harness({ master: { version: 2, variants } });
  try {
    h.controller.update(0, true); await settle();
    assert.equal(h.video.dataset.firstFrame, "true");
    assert(h.requests.some(r => r.path === "/repo/stream/avc/stream.json"));
    assert(h.requests.some(r => r.path === "/repo/stream/avc/part-0.m4s"));
    assert(!h.requests.some(r => r.path.includes("/hevc/")));
  } finally { h.restore(); }
});
test("a newer scroll position replaces an obsolete unbuffered seek", async () => {
  const h = harness();
  try {
    h.controller.update(0, true); await settle();
    h.video.currentTime = 4; // A seek whose data will never arrive.
    assert(h.video.seeking);
    h.controller.update(.9, true); await settle();
    assert.equal(h.video.currentTime, 9); assert.equal(h.video.seeking, false); assert.equal(h.video.dataset.buffering, "false");
  } finally { h.restore(); }
});
test("frame listeners can synchronize the finale without recursive seeks", async () => {
  const h = harness(); let frames = 0;
  try {
    h.video.addEventListener("scroll-video-frame", () => { frames++; h.controller.update(0, true); });
    h.controller.update(0, true); await settle(); assert.equal(frames, 1);
  } finally { h.restore(); }
});
test("disposing during startup never attaches a late media source", async () => {
  const h = harness();
  try {
    h.controller.update(0, true); h.controller.dispose(); await settle();
    assert(!h.video.src); assert.equal(h.requests.length, 1);
  } finally { h.restore(); }
});
test("buffered decoding is not repeatedly interrupted by wheel events", async () => {
  const h = harness();
  try {
    h.controller.update(0, true); await settle(); h.video.holdDecode = true;
    h.controller.update(.032, true); h.controller.update(.052, true);
    assert.deepEqual(h.video.seekRequests, [.32]);
    h.video.holdDecode = false; h.video.decode(); await settle();
    assert.equal(h.video.currentTime, .52); assert.equal(h.video.seeking, false);
  } finally { h.restore(); }
});
test("fast scroll cancels obsolete downloads and prioritizes the latest target", async () => {
  const h = harness({ delayed: [0, 1] });
  try {
    h.controller.update(0, true); await settle();
    h.controller.update(.9, true); await settle();
    const old = h.requests.filter(r => /part-[01]\.m4s$/.test(r.path));
    assert.equal(old.length, 2); assert(old.every(r => r.signal.aborted));
    assert.equal(h.video.currentTime, 9); assert.notEqual(h.video.dataset.streamError, "true");
  } finally { h.restore(); }
});
test("reverse scrolling reloads evicted regions while bounding decoded memory", async () => {
  const h = harness();
  try {
    for (const position of [.1, .6, .9, .2, .8, .1]) {
      h.controller.update(position, true); await settle();
      assert.equal(h.video.currentTime, position * 10);
      assert(h.buffer().parts.size <= 7, "No unbounded full-film buffer");
    }
    assert(h.requests.filter(r => r.path.endsWith("part-2.m4s")).length >= 2);
  } finally { h.restore(); }
});
test("fragment failures become retryable and never silently freeze the poster", async () => {
  const failures = [18]; const h = harness({ failures });
  try {
    h.controller.update(.9, true); await settle(); assert.equal(h.video.dataset.streamError, "true");
    failures.length = 0; h.video.dispatchEvent(new Event("stream-retry")); await settle();
    assert.equal(h.video.currentTime, 9); assert.equal(h.video.dataset.streamError, "false");
  } finally { h.restore(); }
});
test("browser buffer eviction allows the current segment to be fetched again", async () => {
  const h = harness();
  try {
    h.controller.update(.5, true); await settle(); h.buffer().parts.clear();
    h.video.readyState = 1;
    h.controller.update(.5, true); await settle();
    assert(containsTime(h.video.buffered, 5));
    assert(h.requests.filter(r => r.path.endsWith("part-10.m4s")).length >= 2);
  } finally { h.restore(); }
});
test("a previously failed prefetch is reported when it becomes the current scene", async () => {
  const h = harness({ failures: [1] });
  try {
    h.controller.update(0, true); await settle(); assert.notEqual(h.video.dataset.streamError, "true");
    h.controller.update(.06, true); await settle(); assert.equal(h.video.dataset.streamError, "true");
  } finally { h.restore(); }
});
test("native HLS fallback uses the same lossless fragments", async () => {
  const h = harness({ native: true });
  try {
    h.controller.update(.5, true); await settle();
    assert.equal(h.video.src, "https://example.test/repo/stream/stream.m3u8"); assert.equal(h.requests.length, 1);
  } finally { h.restore(); }
});
test("disposing cancels downloads, releases the media URL and emits no late frame", async () => {
  const h = harness({ delayed: [0, 1] });
  try {
    h.controller.update(0, true); await settle(); h.controller.dispose(); await settle();
    assert(h.requests.filter(r => r.path.includes("part-")).every(r => r.signal.aborted));
    assert.equal(h.revoked.length, 1); assert.notEqual(h.video.dataset.firstFrame, "true");
  } finally { h.restore(); }
});
