import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] || "liuzien-aigc-portfolio1";
const base = repository.endsWith(".github.io") ? "/" : `/${repository}/`;
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, item.name);
    if (item.isDirectory()) await walk(file);
    else if (/\.(html|js|css)$/.test(file)) {
      let source = await readFile(file, "utf8");
      source = source.replace(/(["'`])\/assets\//g, `$1${base}assets/`).replace(/url\(\/assets\//g, `url(${base}assets/`);
      await writeFile(file, source);
      if (/["'`]\/assets\//.test(source) && base !== "/") throw new Error(`Unprefixed asset URL in ${file}`);
    }
  }
}
await walk("dist");
await writeFile("dist/.nojekyll", "");
console.log(`GitHub Pages base path: ${base}; media files left unchanged.`);
