import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import StudioPortfolio, { WorkPage } from "./StudioPortfolio.jsx";
import { portfolioHash, portfolioRoute, scenePosition } from "../data/portfolioRoutes.js";

export default function PortfolioRouter() {
  const [entry, setEntry] = useState(() => ({ route: portfolioRoute(window.location.hash), state: window.history.state }));
  const homePosition = useRef(window.history.state?.scenePosition || null);
  const navigate = useCallback((route, { restart = false } = {}) => {
    const current = portfolioRoute(window.location.hash);
    const track = document.querySelector(".video-scroll-track");
    if (current.kind === "home" && track) homePosition.current = scenePosition(window.scrollY, track.offsetTop, track.offsetHeight, window.innerHeight);
    const previous = { ...window.history.state, portfolioEntry: true, pageScroll: window.scrollY, ...(current.kind === "home" ? { scenePosition: homePosition.current } : {}) };
    window.history.replaceState(previous, "", window.location.href);
    if (restart) homePosition.current = null;
    const state = { portfolioEntry: true, pageScroll: 0, scenePosition: homePosition.current };
    window.history.pushState(state, "", portfolioHash(route));
    setEntry({ route, state });
  }, []);
  useEffect(() => {
    const changed = () => { homePosition.current = window.history.state?.scenePosition || null; setEntry({ route: portfolioRoute(window.location.hash), state: window.history.state }); };
    window.addEventListener("popstate", changed); window.addEventListener("hashchange", changed);
    return () => { window.removeEventListener("popstate", changed); window.removeEventListener("hashchange", changed); };
  }, []);
  useLayoutEffect(() => {
    if (entry.route.kind !== "home") window.scrollTo({ top: entry.state?.pageScroll || 0, behavior: "instant" });
  }, [entry]);
  const back = () => window.history.state?.portfolioEntry && window.history.length > 1 ? window.history.back() : navigate({ kind: "home" });
  return entry.route.kind === "home"
    ? <StudioPortfolio onNavigate={navigate} initialScenePosition={entry.state?.scenePosition} />
    : <WorkPage route={entry.route} onNavigate={navigate} onBack={back} onHome={() => navigate({ kind: "home" })} onRestart={() => navigate({ kind: "home" }, { restart: true })} />;
}
