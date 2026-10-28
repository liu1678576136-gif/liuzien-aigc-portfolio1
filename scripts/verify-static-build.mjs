import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { curtainScenes } from "../src/data/curtainScenes.js";
import { mainVideo } from "../src/data/mainVideo.js";
import { scrollStreamDirectory, scrollStreamProfiles } from "../src/data/scrollMedia.js";
const urls = JSON.parse(await readFile("outputs/static-media.json", "utf8"));
async function digest(file) {
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest("hex");
}
for (const url of urls) assert.equal(await digest(join("dist", url)), await digest(join("public", url)), url + " unchanged original media");
for (const base of [curtainScenes.openingVideoBase, mainVideo.base, curtainScenes.finaleBase]) {
  const selector = JSON.parse(await readFile(join("dist", base, scrollStreamDirectory, "stream.json"), "utf8"));
  assert.equal(selector.version, 2); assert.equal(selector.variants.length, 2);
  for (const variant of selector.variants) {
  const manifest = JSON.parse(await readFile(join("dist", base, scrollStreamDirectory, variant.url), "utf8"));
  const profile = scrollStreamProfiles.find(item => item.codec === manifest.codec);
  assert(profile && manifest.width <= profile.maxWidth && manifest.height <= profile.maxHeight);
  assert.equal(manifest.crf, profile.crf);
  assert.equal(manifest.sourceSha256, await digest(join("public", base, "film.mp4")), base + " preserved original source");
  assert.match(manifest.packetSha256, /^[0-9a-f]{64}$/);
  assert.match(manifest.timelineSha256, /^[0-9a-f]{64}$/);
  assert(manifest.packetCount > 0);
  assert.equal(manifest.sourceTimelineSha256, manifest.timelineSha256, "All original frame times preserved");
  assert(manifest.segments.every(part => part.start >= 0 && part.end > part.start));
  assert(Math.abs(manifest.segments.at(-1).end - manifest.duration) < .05);
  }
}
console.log(`Verified ${urls.length} published files with SHA-256; 2K HEVC CRF23 and AVC fallback keep original frame timing. Original portfolio files unchanged.`);
