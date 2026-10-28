import assert from "node:assert/strict";
import { test } from "node:test";
import { panelRoute, portfolioHash, portfolioRoute, scenePosition } from "../src/data/portfolioRoutes.js";
import { works } from "../src/data/studio.js";
test("every project has a refresh-safe independent URL", () => {
  for (const work of works) assert.deepEqual(portfolioRoute(portfolioHash({ kind: "work", id: work.id })), { kind: "work", id: work.id });
});
test("gallery entrances point to the corresponding work subpages", () => {
  for (const [panel, category] of [["posters", "poster"], ["vi", "brand"], ["ip", "ip"], ["other", "other"], ["motion", "motion"]]) {
    const route = panelRoute(panel); assert.equal(route.category, category); assert.deepEqual(portfolioRoute(portfolioHash(route)), route);
  }
  assert.deepEqual(panelRoute("characters"), { kind: "characters" }); assert.equal(panelRoute("about"), null);
});
test("legacy work links still open the index without an opening animation", () => {
  assert.deepEqual(portfolioRoute("#works"), { kind: "works", category: "all" });
  assert.deepEqual(portfolioRoute("#/works/"), { kind: "works", category: "all" });
});
test("invalid routes do not become media paths", () => {
  assert.deepEqual(portfolioRoute("#/work/../../secret"), { kind: "home" });
  assert.deepEqual(portfolioRoute("#/works/unknown"), { kind: "home" });
});
test("returning to the gallery stores scene progress independently of viewport height", () => {
  const saved = scenePosition(4000, 0, 10800, 800);
  assert.equal(saved.progress, .4);
  const newTrack = 13500, newViewport = 1000;
  const restoredTop = saved.progress * (newTrack - newViewport);
  assert.equal(restoredTop, 5000);
  assert.equal(scenePosition(restoredTop, 0, newTrack, newViewport).progress, .4);
});
