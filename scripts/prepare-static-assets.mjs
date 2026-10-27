import { readdir, readFile, rm, stat, mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { creator, works } from "../src/data/studio.js";
import { characterImages, characterWebShowcase, characterVideos } from "../src/data/characterGallery.js";
import { curtainScenes } from "../src/data/curtainScenes.js";
import { mainVideo } from "../src/data/mainVideo.js";

const output = resolve("dist");
const assets = join(output, "assets");
const required = new Set();
const collect = value => {
  if (typeof value === "string" && value.startsWith("/assets/")) required.add(value.split("?")[0]);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === "object") Object.values(value).forEach(collect);
};
async function walk(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, item.name);
    if (item.isDirectory()) files.push(...await walk(file)); else files.push(file);
  }
  return files;
}
collect([creator, works, characterImages, characterWebShowcase, characterVideos]);
collect(["/assets/scene/studio-screen-loop.mp4", "/assets/scene/studio-screen-poster.webp", "/assets/audio/evening-breeze-v4-vocals.mp3", "/assets/audio/evening-breeze-v3-comparison.mp3"]);
for (const base of [curtainScenes.openingVideoBase, mainVideo.base, curtainScenes.finaleBase]) {
  const stream = JSON.parse(await readFile(join(output, base, "stream/stream.json"), "utf8"));
  const streamFiles = new Set(["stream.json", stream.init, stream.playlist, ...stream.segments.map(part => part.file)]);
  for (const file of await walk(join(output, base))) {
    const url = "/" + relative(output, file).split(sep).join("/");
    if (url.startsWith(base + "stream/") && !streamFiles.has(url.slice((base + "stream/").length))) continue;
    if (url !== base + "film.mp4") collect(url);
  }
}
for (const file of [join(output, "index.html"), ...await walk(assets)]) {
  if (!/\.(js|css|html)$/.test(file)) continue;
  for (const match of (await readFile(file, "utf8")).matchAll(/["'(](\/assets\/[^\s"'`?()]+)["')?]/g)) {
    try { if ((await stat(join(output, match[1]))).isFile()) collect(match[1]); } catch { /* Dynamic paths are collected from application data. */ }
  }
}
for (const url of required) if (!(await stat(join(output, url))).isFile()) throw new Error(`Missing media: ${url}`);
let excluded = 0;
for (const file of await walk(assets)) {
  const url = "/" + relative(output, file).split(sep).join("/");
  if (!/\.(js|css)$/.test(file) && !required.has(url)) {
    if (!resolve(file).startsWith(assets + sep)) throw new Error("Cleanup outside build assets");
    await rm(file); excluded++;
  }
}
const published = await walk(assets);
const bytes = (await Promise.all(published.map(file => stat(file)))).reduce((sum, file) => sum + file.size, 0);
if (bytes >= 1000000000) throw new Error("Build exceeds GitHub Pages 1 GB site limit");
await mkdir("outputs", { recursive: true });
await writeFile("outputs/static-media.json", JSON.stringify([...required].filter(url => !/\.(js|css)$/.test(url)), null, 2));
console.log(`High-quality static build: ${published.length} assets, ${(bytes / 1048576).toFixed(1)} MiB; ${excluded} unused assets excluded. Scroll films losslessly segmented; portfolio media retained.`);
