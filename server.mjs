import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8788);
const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const distRoot = join(projectRoot, "dist");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
};

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "GET" && url.pathname === "/api/health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, service: "portfolio-backend" }));
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET") {
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = normalize(join(distRoot, requestedPath));
    const safePath = filePath.startsWith(distRoot) ? filePath : join(distRoot, "index.html");
    const finalPath = existsSync(safePath) && statSync(safePath).isFile() ? safePath : join(distRoot, "index.html");

    if (existsSync(finalPath)) {
      const stats = statSync(finalPath);
      const contentType = mimeTypes[extname(finalPath)] || "application/octet-stream";
      const range = request.headers.range;

      if (range && extname(finalPath) === ".mp4") {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        const start = Number(match?.[1] || 0);
        const end = Math.min(Number(match?.[2] || stats.size - 1), stats.size - 1);

        if (!match || start > end || start >= stats.size) {
          response.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
          response.end();
          return;
        }

        response.writeHead(206, {
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
          "Content-Range": `bytes ${start}-${end}/${stats.size}`,
          "Content-Type": contentType,
        });
        createReadStream(finalPath, { start, end }).pipe(response);
        return;
      }

      response.writeHead(200, {
        "Accept-Ranges": extname(finalPath) === ".mp4" ? "bytes" : "none",
        "Content-Length": stats.size,
        "Content-Type": contentType,
      });
      createReadStream(finalPath).pipe(response);
      return;
    }
  }

  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: false, error: "Not Found" }));
});

server.listen(port, host, () => {
  console.log(`[portfolio-backend] listening on http://${host}:${port}`);
});

server.on("error", (error) => {
  console.error(`[portfolio-backend] ${error.message}`);
  process.exitCode = 1;
});
