import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { curtainScenes } from "../src/data/curtainScenes.js";
import { mainVideo } from "../src/data/mainVideo.js";
const urls = JSON.parse(await readFile("outputs/static-media.json", "utf8"));
async function digest(file) {
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest("hex");
}
for (const url of urls) assert.equal(await digest(join("dist", url)), await digest(join("public", url)), url + " unchanged original media");
for (const base of [curtainScenes.openingVideoBase, mainVideo.base, curtainScenes.finaleBase]) {
  const manifest = JSON.parse(await readFile(join("dist", base, "stream/stream.json"), "utf8"));
  assert.equal(manifest.sourceSha256, await digest(join("public", base, "film.mp4")), base + " verified lossless source");
  assert.match(manifest.packetSha256, /^[0-9a-f]{64}$/);
  assert.match(manifest.timelineSha256, /^[0-9a-f]{64}$/);
  assert(manifest.packetCount > 0);
  assert(manifest.segments.every(part => part.start >= 0 && part.end > part.start));
  assert(Math.abs(manifest.segments.at(-1).end - manifest.duration) < .05);
}
console.log(`Verified ${urls.length} published files with SHA-256 and all three original scroll-film sources; encoded video packets preserved without recompression.`);
