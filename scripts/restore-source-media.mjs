import { createHash } from "node:crypto";
import { readFile, mkdir, open, stat } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

// The deployment checkout stores large source media in small Git-friendly parts.
// The normal local checkout already has its originals and requires no changes.
const root = process.cwd();
let manifest;
try { manifest = JSON.parse(await readFile(join(root, "source-media/manifest.json"), "utf8")); }
catch (error) { if (error.code === "ENOENT") process.exit(0); throw error; }
for (const [url, asset] of Object.entries(manifest)) {
  const target = resolve(root, "public", "." + url);
  if (!target.startsWith(resolve(root, "public") + sep)) throw new Error("Invalid media destination");
  try { if ((await stat(target)).size === asset.size) continue; } catch { /* Restore below. */ }
  await mkdir(dirname(target), { recursive: true });
  const output = await open(target, "w");
  const hash = createHash("sha256");
  try {
    for (const part of asset.parts) {
      const source = resolve(root, "source-media", part.replace(/^\/assets\/deploy-chunks\//, ""));
      if (!source.startsWith(resolve(root, "source-media") + sep)) throw new Error("Invalid media source");
      const bytes = await readFile(source); hash.update(bytes); await output.writeFile(bytes);
    }
  } finally { await output.close(); }
  if ('"' + hash.digest("hex") + '"' !== asset.etag || (await stat(target)).size !== asset.size) throw new Error(`Source media integrity failure: ${url}`);
  console.log(`Restored original media: ${url}`);
}
