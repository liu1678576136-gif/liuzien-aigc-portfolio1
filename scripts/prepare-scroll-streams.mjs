import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";
import { curtainScenes } from "../src/data/curtainScenes.js";
import { mainVideo } from "../src/data/mainVideo.js";
import { scrollStreamDirectory, scrollStreamProfiles } from "../src/data/scrollMedia.js";
const run = promisify(execFile), root = process.cwd();
const attribute = (source, name) => new RegExp(`\\b${name}="([^"]+)"`).exec(source)?.[1];
const command = args => run(ffmpeg, args, { windowsHide: true, maxBuffer: 10000000 });
const portable = file => file.replaceAll("\\", "/");
async function hash(file) { const digest = createHash("sha256"); for await (const bytes of createReadStream(file)) digest.update(bytes); return digest.digest("hex"); }
async function frameRecords(file) {
  const output = (await command(["-v", "error", "-copyts", "-i", portable(file), "-map", "0:v:0", "-c:v", "copy", "-f", "framehash", "-hash", "sha256", "-"])).stdout;
  return output.split(/\r?\n/).filter(line => /^#tb|^0,/.test(line));
}
const timeline = rows => rows.map(line => line.startsWith("#") ? line : line.split(",").slice(0, 4).map(value => value.trim()).join(",")).join("\n");
let originalBytes = 0, hevcBytes = 0, avcBytes = 0;
for (const base of [curtainScenes.openingVideoBase, mainVideo.base, curtainScenes.finaleBase]) {
  const source = join(root, "public", base, "film.mp4");
  const original = JSON.parse(await readFile(join(root, "public", base, "manifest.json"), "utf8"));
  const sourceHash = await hash(source), sourceRecords = await frameRecords(source);
  originalBytes += (await stat(source)).size;
  const destination = join(root, "public", base, scrollStreamDirectory), variants = [];
  for (const profile of scrollStreamProfiles) {
    const cache = join(root, "outputs/scroll-streams", `${sourceHash}-${profile.id}-${profile.crf}-web-v3`);
    let manifest;
    try { manifest = JSON.parse(await readFile(join(cache, "stream.json"), "utf8")); if (!manifest.sourceTimelineSha256) throw new Error("Missing timeline proof"); }
    catch {
      await mkdir(cache, { recursive: true });
      const scale = Math.min(1, profile.maxWidth / original.width, profile.maxHeight / original.height);
      const width = Math.floor(original.width * scale / 2) * 2, height = Math.floor(original.height * scale / 2) * 2;
      const keyframes = Math.round(original.fps * .2), optimized = join(cache, "web.mp4");
      console.log(`Encoding ${profile.codec.toUpperCase()} CRF${profile.crf}, ${width}×${height}: ${base}`);
      const encoder = profile.codec === "hevc"
        ? ["-c:v", "libx265", "-crf", String(profile.crf), "-tag:v", "hvc1", "-x265-params", `keyint=${keyframes}:min-keyint=${keyframes}:scenecut=0:open-gop=0:bframes=0:repeat-headers=0:pools=4:frame-threads=2:log-level=error`]
        : ["-c:v", "libx264", "-crf", String(profile.crf), "-maxrate", "8M", "-bufsize", "8M", "-keyint_min", String(keyframes), "-sc_threshold", "0", "-threads", "4"];
      await command(["-v", "error", "-y", "-i", source, "-map", "0:v:0", "-an", "-vf", `scale=${width}:${height}:flags=lanczos,setsar=1`, ...encoder, "-preset", "medium", "-g", String(keyframes), "-bf", "0", "-pix_fmt", "yuv420p", "-fps_mode", "passthrough", "-video_track_timescale", String(original.fps * 512), "-movflags", "+faststart", optimized]);
      await run(ffmpeg, ["-v", "error", "-y", "-i", optimized, "-map", "0:v:0", "-an", "-c:v", "copy", ...(profile.codec === "hevc" ? ["-tag:v", "hvc1"] : []), "-f", "dash", "-seg_duration", "0.2", "-use_timeline", "1", "-use_template", "1", "-init_seg_name", "init.mp4", "-media_seg_name", "part-$Number%05d$.m4s", "stream.mpd"], { cwd: cache, windowsHide: true, maxBuffer: 10000000 });
      const mpd = await readFile(join(cache, "stream.mpd"), "utf8"), template = /<SegmentTemplate\b[^>]+>/.exec(mpd)[0];
      const timescale = Number(attribute(template, "timescale"));
      let number = Number(attribute(template, "startNumber") || 1), time = 0;
      const segments = [];
      for (const [tag] of mpd.matchAll(/<S\s[^>]+\/>/g)) {
        if (attribute(tag, "t") !== undefined) time = Number(attribute(tag, "t"));
        const duration = Number(attribute(tag, "d")), repeat = Number(attribute(tag, "r") || 0);
        for (let i = 0; i <= repeat; i++) {
          const file = `part-${String(number++).padStart(5, "0")}.m4s`;
          segments.push({ file, start: time / timescale, end: (time + duration) / timescale, bytes: (await stat(join(cache, file))).size }); time += duration;
        }
      }
      const optimizedRecords = await frameRecords(optimized), streamRecords = await frameRecords(join(cache, "stream.mpd"));
      if (optimizedRecords.join("\n") !== streamRecords.join("\n")) throw new Error(`Optimized video changed while segmenting: ${base}/${profile.id}`);
      if (timeline(sourceRecords) !== timeline(optimizedRecords)) throw new Error(`Original frame timing changed: ${base}/${profile.id}`);
      const codec = /codecs="([^"]+)"/.exec(mpd)[1], bytes = segments.reduce((sum, part) => sum + part.bytes, (await stat(join(cache, "init.mp4"))).size);
      manifest = { version: 1, duration: original.duration, fps: original.fps, width, height, codec: profile.codec, crf: profile.crf, bitrate: Math.ceil(bytes * 8 / original.duration), mime: `video/mp4; codecs="${codec}"`, init: "init.mp4", playlist: "stream.m3u8", sourceSha256: sourceHash, sourceTimelineSha256: createHash("sha256").update(timeline(sourceRecords)).digest("hex"), packetSha256: createHash("sha256").update(optimizedRecords.join("\n")).digest("hex"), timelineSha256: createHash("sha256").update(timeline(optimizedRecords)).digest("hex"), packetCount: optimizedRecords.filter(line => /^0,/.test(line)).length, bytes, segments };
      const playlist = ["#EXTM3U", "#EXT-X-VERSION:7", "#EXT-X-PLAYLIST-TYPE:VOD", "#EXT-X-INDEPENDENT-SEGMENTS", `#EXT-X-TARGETDURATION:${Math.ceil(Math.max(...segments.map(part => part.end - part.start)))}`, "#EXT-X-MEDIA-SEQUENCE:0", '#EXT-X-MAP:URI="init.mp4"', ...segments.flatMap(part => [`#EXTINF:${(part.end - part.start).toFixed(6)},`, part.file]), "#EXT-X-ENDLIST"].join("\n") + "\n";
      await writeFile(join(cache, "stream.m3u8"), playlist);
      await writeFile(join(cache, "stream.json"), JSON.stringify(manifest, null, 2) + "\n");
    }
    const variantDirectory = join(destination, profile.id); await mkdir(variantDirectory, { recursive: true });
    for (const file of ["stream.json", manifest.init, manifest.playlist, ...manifest.segments.map(part => part.file)]) await cp(join(cache, file), join(variantDirectory, file));
    variants.push({ url: `${profile.id}/stream.json`, codec: profile.codec, mime: manifest.mime, width: manifest.width, height: manifest.height, bitrate: manifest.bitrate, fps: manifest.fps });
    if (profile.codec === "hevc") hevcBytes += manifest.bytes; else avcBytes += manifest.bytes;
    console.log(`Ready ${profile.codec.toUpperCase()}: ${(manifest.bytes / 1048576).toFixed(1)} MiB, ${manifest.segments.length} segments; original frame timing preserved.`);
  }
  await writeFile(join(destination, "stream.json"), JSON.stringify({ version: 2, variants }, null, 2) + "\n");
}
console.log(`Background totals: original ${(originalBytes / 1048576).toFixed(1)} MiB; HEVC ${(hevcBytes / 1048576).toFixed(1)} MiB (${(100 - hevcBytes / originalBytes * 100).toFixed(1)}% smaller); AVC fallback ${(avcBytes / 1048576).toFixed(1)} MiB. Original files retained.`);
