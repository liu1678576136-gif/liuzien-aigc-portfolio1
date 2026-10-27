// Split large deployment assets without changing their original bytes or URLs.
export function createSiteWorker(chunkedAssets = {}, assetAliases = {}) {
  return {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (assetAliases[url.pathname]) {
      url.pathname = assetAliases[url.pathname];
      return env.ASSETS.fetch(new Request(url, request));
    }
    const asset = chunkedAssets[url.pathname];
    if (asset && ["GET", "HEAD"].includes(request.method)) {
      const headers = new Headers({
        "Content-Type": asset.type,
        "Accept-Ranges": "bytes",
        "ETag": asset.etag,
        "Cache-Control": "public, max-age=0, must-revalidate",
      });
      if (request.headers.get("If-None-Match")?.split(/\s*,\s*/).some(tag => tag === asset.etag || tag === "*")) {
        return new Response(null, { status: 304, headers });
      }
      let start = 0, end = asset.size - 1, status = 200;
      const range = request.headers.get("Range");
      const ifRange = request.headers.get("If-Range");
      if (range && (!ifRange || ifRange === asset.etag)) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match && (match[1] || match[2])) {
          if (!match[1]) start = Math.max(0, asset.size - Number(match[2]));
          else {
            start = Number(match[1]);
            if (match[2]) end = Math.min(end, Number(match[2]));
          }
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= asset.size || (!match[1] && Number(match[2]) === 0)) {
            headers.set("Content-Range", `bytes */${asset.size}`);
            return new Response(null, { status: 416, headers });
          }
          status = 206;
          headers.set("Content-Range", `bytes ${start}-${end}/${asset.size}`);
        }
      }
      headers.set("Content-Length", String(end - start + 1));
      if (request.method === "HEAD") return new Response(null, { status, headers });
      let partIndex = Math.floor(start / asset.chunkSize);
      const lastPart = Math.floor(end / asset.chunkSize);
      const body = new ReadableStream({
        async pull(controller) {
          if (partIndex > lastPart) { controller.close(); return; }
          try {
            const index = partIndex++;
            const part = await env.ASSETS.fetch(new Request(new URL(asset.parts[index], url)));
            if (!part.ok) throw new Error("Deployment media segment unavailable");
            const bytes = new Uint8Array(await part.arrayBuffer());
            const offset = index * asset.chunkSize;
            controller.enqueue(bytes.subarray(Math.max(0, start - offset), Math.min(bytes.length, end - offset + 1)));
            if (index === lastPart) controller.close();
          } catch (error) { controller.error(error); }
        },
      });
      return new Response(body, { status, headers });
    }
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) return response;

    if (url.pathname.includes(".")) return response;

    return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  },
  };
}

export default createSiteWorker();
