const categories = new Set(["all", "poster", "brand", "ip", "other", "motion"]);
export function portfolioRoute(hash = "") {
  const path = hash.replace(/^#/, "").replace(/\/$/, "");
  if (path === "works" || path === "/works") return { kind: "works", category: "all" };
  if (path === "/characters") return { kind: "characters" };
  const category = /^\/works\/([a-z]+)$/.exec(path)?.[1];
  if (categories.has(category)) return { kind: "works", category };
  const id = /^\/work\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (id) return { kind: "work", id };
  return { kind: "home" };
}
export function portfolioHash(route) {
  if (route.kind === "work" && /^[a-z0-9-]+$/.test(route.id)) return `#/work/${route.id}`;
  if (route.kind === "characters") return "#/characters";
  if (route.kind === "works") return route.category && route.category !== "all" && categories.has(route.category) ? `#/works/${route.category}` : "#/works";
  return "#/";
}
export function panelRoute(kind, category = "all") {
  if (kind === "characters") return { kind: "characters" };
  const mapped = { works: category, posters: "poster", vi: "brand", ip: "ip", other: "other", motion: "motion" }[kind];
  return mapped && categories.has(mapped) ? { kind: "works", category: mapped } : null;
}
export function scenePosition(scrollTop, trackTop, trackHeight, viewportHeight) {
  return { top: scrollTop, progress: Math.max(0, Math.min(1, (scrollTop - trackTop) / Math.max(1, trackHeight - viewportHeight))) };
}
