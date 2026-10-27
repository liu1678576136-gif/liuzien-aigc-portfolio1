import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
const urls = JSON.parse(await readFile("outputs/static-media.json", "utf8"));
async function digest(file) {
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest("hex");
}
for (const url of urls) assert.equal(await digest(join("dist", url)), await digest(join("public", url)), url + " unchanged original media");
console.log(`Verified ${urls.length} media files against local source with SHA-256; no deployment recompression.`);
