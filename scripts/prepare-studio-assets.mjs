import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { creator, works, derived } from "../src/data/studio.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(root, "public");
await mkdir(path.join(publicRoot, "assets/studio"), { recursive: true });
const requests = new Map();
function add(source, kind, usage) {
  const key = `${source}:${kind}`;
  const existing = requests.get(key);
  if (existing) existing.usages.push(usage);
  else requests.set(key, { source, kind, usages: [usage] });
}
for (const work of works) {
  add(work.coverOriginal, "cover", `${work.id}:gallery`);
  for (const media of [...work.media, ...(work.production || []).flatMap(step => step.media)]) {
    if (media.type === "image") add(media.original, "full", `${work.id}:detail`);
    else add(media.posterOriginal || media.poster, "cover", `${work.id}:poster`);
  }
}
add(creator.portraitOriginal, "full", "creator:portrait");
const assets = [];
let assetAliases = {};
try { assetAliases = JSON.parse(await readFile(path.join(root, "source-media/asset-aliases.json"), "utf8")); } catch { /* Local originals remain available. */ }
for (const request of requests.values()) {
  const { source, kind } = request;
  if (assetAliases[source]) {
    const output = derived(source, kind);
    const buffer = await readFile(path.join(publicRoot, output));
    const metadata = await sharp(buffer).metadata();
    assets.push({ ...request, output, originalWidth: metadata.width, originalHeight: metadata.height, width: metadata.width, height: metadata.height, bytes: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex") });
    continue;
  }
  const buffer = await readFile(path.join(publicRoot, source));
  const metadata = await sharp(buffer).metadata();
  const output = derived(source, kind);
  const target = path.join(publicRoot, output);
  let pipeline = sharp(buffer).rotate();
  pipeline = kind === "cover"
    ? pipeline.resize({ width: 1400, height: 1100, fit: "inside", withoutEnlargement: true })
    : pipeline.resize({ width: 1800, height: 16000, fit: "inside", withoutEnlargement: true });
  const result = await pipeline.webp({ quality: kind === "cover" ? 82 : 85 }).toFile(target);
  assets.push({ ...request, output, originalWidth: metadata.width, originalHeight: metadata.height, width: result.width, height: result.height, bytes: result.size, sha256: createHash("sha256").update(buffer).digest("hex") });
}
const byContent = new Map();
for (const asset of assets) {
  const list = byContent.get(asset.sha256) || new Set();
  list.add(asset.source);
  byContent.set(asset.sha256, list);
}
const manifest = { version: 1, assets, duplicates: [...byContent.values()].filter((set) => set.size > 1).map((set) => [...set]), pending: ["个人简历 PDF", "联系电话核实", "项目职责与过程资料", "正式连续场景影像"] };
await writeFile(path.join(publicRoot, "assets/studio/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared ${assets.length} derived images; ${new Set(works.map((w) => w.id)).size} unique projects. Originals preserved.`);
