import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import ffmpeg from "ffmpeg-static";
import { curtainScenes } from "../src/data/curtainScenes.js";
import { mainVideo } from "../src/data/mainVideo.js";
import { scrollStreamDirectory, scrollStreamProfiles } from "../src/data/scrollMedia.js";
const decode = (args, input) => {
  const output = execFileSync(ffmpeg, ["-v", "error", ...args, "-map", "0:v:0", "-frames:v", "1", "-f", "framemd5", "-"], { input, encoding: "utf8", maxBuffer: 10000000, windowsHide: true });
  const row = output.split(/\r?\n/).find(line => /^0,/.test(line));
  assert(row, "A real video frame was decoded");
  return row.split(",").at(-1).trim();
};
let count = 0;
for (const base of [curtainScenes.openingVideoBase, mainVideo.base, curtainScenes.finaleBase]) {
  const directory = join("public", base, scrollStreamDirectory);
  const selector = JSON.parse(await readFile(join(directory, "stream.json"), "utf8"));
  for (const variant of selector.variants) {
    const manifest = JSON.parse(await readFile(join(directory, variant.url), "utf8"));
    const files = join(directory, variant.codec);
    const init = await readFile(join(files, manifest.init));
    const profile = scrollStreamProfiles.find(item => item.codec === manifest.codec);
    const reference = join("outputs/scroll-streams", `${manifest.sourceSha256}-${manifest.codec}-${manifest.crf}-web-v${profile.cacheVersion}`, "web.mp4");
    for (const index of [0, Math.floor(manifest.segments.length / 2), manifest.segments.length - 1]) {
      const part = manifest.segments[index];
      const frame = decode(["-i", "pipe:0"], Buffer.concat([init, await readFile(join(files, part.file))]));
      const expected = decode(["-ss", String(part.start), "-i", reference]);
      assert.equal(frame, expected, `${base}/${variant.codec} segment ${index} independently decodes the correct frame`);
      count++;
    }
  }
}
console.log(`Decoded ${count} independent first/middle/final segments for HEVC and AVC; pixels match the optimized films at the original scene times.`);
