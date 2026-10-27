import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";
import { curtainScenes } from "../src/data/curtainScenes.js";
import { mainVideo } from "../src/data/mainVideo.js";
const run = promisify(execFile);
const root = process.cwd();
const attribute = (source, name) => new RegExp(`\\b${name}="([^"]+)"`).exec(source)?.[1];
async function hash(file) { const digest = createHash("sha256"); for await (const bytes of createReadStream(file)) digest.update(bytes); return digest.digest("hex"); }
for (const base of [curtainScenes.openingVideoBase, mainVideo.base, curtainScenes.finaleBase]) {
  const source = join(root, "public", base, "film.mp4");
  const original = JSON.parse(await readFile(join(root, "public", base, "manifest.json"), "utf8"));
  const sourceHash = await hash(source);
  const cache = join(root, "outputs/scroll-streams", sourceHash + "-v2");
  let manifest;
  try { manifest = JSON.parse(await readFile(join(cache, "stream.json"), "utf8")); if (!manifest.timelineSha256) throw new Error("Refresh timing proof"); }
  catch {
    await mkdir(cache, { recursive: true });
    // Remux the existing encoded video packets. Never re-encode or resize.
    await run(ffmpeg, ["-v", "error", "-y", "-i", source, "-map", "0:v:0", "-an", "-c:v", "copy", "-f", "dash", "-seg_duration", "0.2", "-use_timeline", "1", "-use_template", "1", "-init_seg_name", "init.mp4", "-media_seg_name", "part-$Number%05d$.m4s", "stream.mpd"], { cwd: cache, maxBuffer: 10000000, windowsHide: true });
    const mpd = await readFile(join(cache, "stream.mpd"), "utf8");
    const template = /<SegmentTemplate\b[^>]+>/.exec(mpd)[0];
    const timescale = Number(attribute(template, "timescale"));
    let number = Number(attribute(template, "startNumber") || 1), time = 0;
    const segments = [];
    for (const [tag] of mpd.matchAll(/<S\s[^>]+\/>/g)) {
      if (attribute(tag, "t") !== undefined) time = Number(attribute(tag, "t"));
      const duration = Number(attribute(tag, "d"));
      const repeat = Number(attribute(tag, "r") || 0);
      for (let i = 0; i <= repeat; i++) {
        const file = `part-${String(number++).padStart(5, "0")}.m4s`;
        segments.push({ file, start: time / timescale, end: (time + duration) / timescale, bytes: (await stat(join(cache, file))).size });
        time += duration;
      }
    }
    const codec = /codecs="([^"]+)"/.exec(mpd)[1];
    manifest = { version: 1, duration: original.duration, fps: original.fps, width: original.width, height: original.height, mime: `video/mp4; codecs="${codec}"`, init: "init.mp4", playlist: "stream.m3u8", sourceSha256: sourceHash, segments };
    const packetHash = async file => (await run(ffmpeg, ["-v", "error", "-i", file.replaceAll("\\", "/"), "-map", "0:v:0", "-c:v", "copy", "-f", "hash", "-hash", "sha256", "-"], { maxBuffer: 10000000, windowsHide: true })).stdout.trim();
    const before = await packetHash(source), after = await packetHash(join(cache, "stream.mpd"));
    if (before !== after) throw new Error(`Encoded video packets changed: ${base}`);
    manifest.packetSha256 = before.split("=")[1];
    const timing = async file => (await run(ffmpeg, ["-v", "error", "-copyts", "-i", file.replaceAll("\\", "/"), "-map", "0:v:0", "-c:v", "copy", "-f", "framehash", "-hash", "sha256", "-"], { maxBuffer: 10000000, windowsHide: true })).stdout.split(/\r?\n/).filter(line => /^#tb|^0,/.test(line)).join("\n");
    const originalTiming = await timing(source), streamTiming = await timing(join(cache, "stream.mpd"));
    if (originalTiming !== streamTiming) throw new Error(`Video packet timestamps changed: ${base}`);
    manifest.timelineSha256 = createHash("sha256").update(originalTiming).digest("hex");
    manifest.packetCount = originalTiming.split("\n").filter(line => /^0,/.test(line)).length;
    const maxDuration = Math.max(...segments.map(part => part.end - part.start));
    const playlist = ["#EXTM3U", "#EXT-X-VERSION:7", `#EXT-X-TARGETDURATION:${Math.ceil(maxDuration)}`, "#EXT-X-MEDIA-SEQUENCE:0", '#EXT-X-MAP:URI="init.mp4"', ...segments.flatMap(part => [`#EXTINF:${(part.end - part.start).toFixed(6)},`, part.file]), "#EXT-X-ENDLIST"].join("\n") + "\n";
    await writeFile(join(cache, "stream.m3u8"), playlist);
    await writeFile(join(cache, "stream.json"), JSON.stringify(manifest, null, 2) + "\n");
  }
  const destination = join(root, "public", base, "stream");
  await mkdir(destination, { recursive: true });
  await cp(cache, destination, { recursive: true });
  console.log(`Lossless scroll stream: ${base} ${manifest.segments.length} fragments; original ${manifest.width}×${manifest.height} packets verified.`);
}
