import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useRef } from "react";
import "../video-scroll.css";
import CurtainFinale from "./CurtainFinale.jsx";
import VideoLoadStatus from "./VideoLoadStatus.jsx";
import ChapterNavigation from "./ChapterNavigation.jsx";
import SceneSurroundDim from "./SceneSurroundDim.jsx";
import SceneAtmosphere from "./SceneAtmosphere.jsx";
import PosterReflections from "./PosterReflections.jsx";
import SceneNodeControls from "./SceneNodeControls.jsx";
import useSceneParallax from "./useSceneParallax.js";
import { curtainScenes } from "../data/curtainScenes.js";
import { scrollStreamDirectory } from "../data/scrollMedia.js";
import { createScrollVideo } from "../media/createScrollVideo.js";
import { createMainVideo } from "../media/createMainVideo.js";
import { mainVideo } from "../data/mainVideo.js";
import { mergeSequenceFrames, nearestSequenceFrame } from "../data/sequenceFrames.js";
import { screenPresentation, screenProjection } from "../data/screenPresentation.js";
import { createVideoTimeline, originalScrollFraction, studioApproachStart, studioNodeProgress, roomNodeProgress } from "../data/videoScrollTimeline.js";

const clamp = (n) => Math.max(0, Math.min(1, n));
// Always use the complete six-scene experience, regardless of older URL parameters.
const surroundDimEnabled = new URLSearchParams(window.location.search).get("dim") !== "0";
const joinedTest = true;
const { totalScreens, storyProgress, scrollFraction, holdScrollTarget } = createVideoTimeline(joinedTest);
const finaleScreens = joinedTest ? 6 : 0;
const trackScreens = totalScreens + finaleScreens;
const clips = [curtainScenes.openingSequence, joinedTest ? mainVideo.id : "gallery-film", "desk-film", "computer-film"];
const visibleClips = joinedTest ? clips.slice(0, 2) : clips;
const scenePoster = (clip, index) => index === 0 ? `${curtainScenes.openingVideoBase}poster.webp` : joinedTest ? `${mainVideo.base}${index === 2 ? "book" : index === 3 ? "studio" : "poster"}.webp` : `/assets/scroll-sequence/${clip}/poster.webp`;
const chapterTitles = ["让想象，走进现实。", "走进我的视觉现场。", "从一个画面，到更多可能。", "影像工作站"];
const computerJoinStart = 1.44, computerJoinEnd = 1.48, computerEnd = 1.79;
const originalScreens = 11;
const deskJoinStart = .96, deskJoinEnd = .99, deskEnd = 1.33;
// Compress the original 17% transition span by one third.
const transitionStart = .395;
const transitionScale = 2 / 3;
const whitePeak = transitionStart + .05 * transitionScale;
const whiteFade = whitePeak + .045 * transitionScale;
const transitionEnd = whiteFade + .075 * transitionScale;
export function jumpToCinematicChapter(id) {
  const root = document.getElementById("experience");
  if (!root) return;
  const fraction = id === "opening" ? 0 : id === "contact" ? 1 : (totalScreens / trackScreens) * scrollFraction(id === "rooms" ? roomNodeProgress : id === "computer" ? (joinedTest ? studioNodeProgress : computerJoinEnd) : id === "desk" ? (joinedTest ? 1.05 : deskJoinEnd) : .58);
  const nodeInset = joinedTest && ["computer", "rooms"].includes(id) ? 2 : 0;
  window.scrollTo({ top: root.offsetTop + Math.max(0, root.offsetHeight - innerHeight) * fraction + nodeInset, behavior: "instant" });
}

// A small moving decode window keeps reverse scrubbing responsive without
// retaining hundreds of full-resolution decoded frames in memory.
function createSequence(canvas, name) {
  if (name === curtainScenes.openingSequence) return createScrollVideo(canvas);
  if (name === mainVideo.id) return createMainVideo(canvas);
  const base = `/assets/scroll-sequence/${name}/`;
  const cache = new Map(), failed = new Set();
  let frames = [], wanted = 0, active = 0, disposed = false, enabled = false;
  const context = canvas.getContext("2d");
  const track = canvas.closest(".video-scroll-track");
  function paint() {
    // On a reverse jump, never substitute a later frame for the held first frame.
    if (wanted === 0 && !cache.get(0)?.naturalWidth) {
      canvas.classList.remove("has-frame");
      return;
    }
    const candidates = [...cache.entries()].filter(([, image]) => image.complete && image.naturalWidth);
    candidates.sort((a, b) => Math.abs(a[0] - wanted) - Math.abs(b[0] - wanted));
    const selected = candidates[0];
    if (!selected) return;
    const [index, image] = selected;
    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    context.drawImage(image, (canvas.width - image.width * scale) / 2, (canvas.height - image.height * scale) / 2, image.width * scale, image.height * scale);
    canvas.dataset.frame = Number(frames[index].sourceFrame.toFixed(3));
    canvas.dataset.sequenceFrame = index;
    if (name === "gallery-main-v3") {
      const frame = frames[index];
      const corners = frame.screenCorners || (frame.sourceFrame === 391 ? [[391, 164], [905, 164], [905, 444], [391, 444]] : null);
      const presentation = screenPresentation(frame.sourceFrame);
      if (corners) {
        const points = corners.map(([x, y]) => [
          (x * scale + (canvas.width - image.width * scale) / 2) * canvas.clientWidth / canvas.width,
          (y * scale + (canvas.height - image.height * scale) / 2) * canvas.clientHeight / canvas.height,
        ]);
        const matrix = screenProjection(points);
        if (matrix) track.style.setProperty("--screen-projection", `matrix3d(${matrix.join(",")})`);
        track.style.setProperty("--studio-screen-bottom", `${Math.max(points[2][1], points[3][1])}px`);
      }
      track.style.setProperty("--screen-prelude-opacity", corners ? presentation.opacity : 0);
      track.style.setProperty("--screen-load-progress", presentation.progress);
      track.dataset.screenApproaching = String(Boolean(corners && presentation.opacity > .001));
      const percent = track.querySelector(".video-screen-progress");
      if (percent) percent.textContent = `${Math.round(presentation.progress * 100)}%`;
    }
    canvas.classList.add("has-frame");
  }
  function pump() {
    if (disposed || !enabled || !frames.length) return;
    const nearby = Array.from({ length: 25 }, (_, i) => wanted + (i % 2 ? -(i + 1) / 2 : i / 2)).filter(i => i >= 0 && i < frames.length);
    for (const [index, image] of cache) if (Math.abs(index - wanted) > 18 && image.complete) cache.delete(index);
    for (const index of nearby) {
      if (active >= 4) break;
      if (cache.has(index) || failed.has(index)) continue;
      const image = new Image();
      cache.set(index, image); active++;
      image.onload = () => { active--; if (!disposed) { paint(); pump(); } };
      image.onerror = () => { active--; failed.add(index); cache.delete(index); if (!disposed) pump(); };
      image.src = frames[index].src.startsWith("/") ? frames[index].src : base + frames[index].src;
    }
  }
  const controller = new AbortController();
  fetch(base + "manifest.json", { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("manifest"); return r.json(); }).then(async manifest => {
    const details = await Promise.all((manifest.detailRanges || []).map(async range => {
      try {
        const response = await fetch(range.manifest, { signal: controller.signal });
        if (!response.ok) throw new Error("detail manifest");
        return { ...range, base: range.manifest.slice(0, range.manifest.lastIndexOf("/") + 1), manifest: await response.json() };
      } catch { return null; /* Retain the original sequence if extra frames fail. */ }
    }));
    if (disposed) return;
    frames = mergeSequenceFrames(manifest, details);
    canvas.dataset.sequenceFrameCount = frames.length;
    wanted = nearestSequenceFrame(frames, clamp(Number(canvas.dataset.progress || 0)));
    pump();
  }).catch(() => { /* The poster remains visible if media cannot load. */ });
  return {
    update(progress, shouldLoad) {
      enabled = shouldLoad; canvas.dataset.progress = progress;
      wanted = nearestSequenceFrame(frames, clamp(progress));
      paint(); pump();
    },
    resize() {
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio); paint();
    },
    dispose() { disposed = true; controller.abort(); cache.forEach(image => { image.onload = null; image.onerror = null; }); cache.clear(); },
  };
}

export default function VideoScrollExperience({ onPanel, onBrowse, reduced, paused }) {
  const { t, language } = useLocale();
  const root = useRef(null), first = useRef(null), second = useRef(null), third = useRef(null), fourth = useRef(null);
  const atmosphereProgress = useRef(0);
  useSceneParallax(root, { reduced, paused });
  const effectsPaused = useRef(paused);
  effectsPaused.current = paused;
  useEffect(() => {
    if (reduced) return;
    const element = root.current;
    const sequences = visibleClips.map((clip, index) => createSequence([first, second, third, fourth][index].current, clip));
    let request = 0;
    let viewportWidth = innerWidth, viewportHeight = innerHeight;
    let trackTop = element.offsetTop, scrollDistance = Math.max(1, element.offsetHeight - viewportHeight);
    let scrollProgress = clamp((scrollY - trackTop) / scrollDistance);
    const render = () => {
      request = 0;
      const overall = scrollProgress;
      const p = storyProgress(clamp(overall * trackScreens / totalScreens));
      const finaleProgress = joinedTest ? clamp((overall * trackScreens - totalScreens) / finaleScreens) : 0;
      const finaleActive = finaleProgress > 0;
      element.dataset.finaleProgress = String(finaleProgress);
      element.dataset.finaleActive = String(finaleActive);
      const studioHolding = joinedTest && Math.abs(p - studioNodeProgress) < 1e-7;
      const roomsHolding = joinedTest && p >= roomNodeProgress && !finaleActive;
      element.dataset.sceneNode = studioHolding ? "studio" : roomsHolding ? "rooms" : "";
      if (joinedTest) {
        for (const [selector, visible] of [[".video-studio-node", studioHolding], [".video-rooms-node", roomsHolding]]) {
          const node = element.querySelector(selector);
          node.inert = !visible;
          node.setAttribute("aria-hidden", String(!visible));
        }
      }
      atmosphereProgress.current = p;
      const a = clamp(p / whitePeak);
      const heldFrame = joinedTest ? 139 / 479 : 137 / 178;
      const bookFrame = 265 / 479;
      const b = p < .79 ? clamp((p - transitionEnd) / (.79 - transitionEnd)) * heldFrame
        : p <= .89 ? heldFrame
        : joinedTest ? (p < deskEnd ? heldFrame + clamp((p - .89) / (deskEnd - .89)) * (bookFrame - heldFrame)
          : p <= computerJoinStart ? bookFrame : bookFrame + clamp((p - computerJoinStart) / (computerEnd - computerJoinStart)) * (1 - bookFrame))
        : heldFrame + clamp((p - .89) / .07) * (1 - heldFrame);
      const holding = p >= .79 && p <= .89;
      element.dataset.posterHold = String(holding);
      const posterInteraction = element.querySelector(".video-poster-interaction");
      posterInteraction.inert = !holding;
      posterInteraction.setAttribute("aria-hidden", String(!holding));
      sequences[0].update(a, p < .52);
      sequences[1].update(b, p > .34 && (joinedTest || p < 1.03));
      sequences[2]?.update(clamp((p - deskJoinEnd) / (deskEnd - deskJoinEnd)), !joinedTest && p > .85);
      // Reveal the incoming room's first frame through white; its camera only
      // advances once the exposure has cleared. All phases reverse with scrolling.
      const smooth = (value) => { const n = clamp(value); return n * n * (3 - 2 * n); };
      if (joinedTest) {
        const approach = clamp((p - studioApproachStart) / (studioNodeProgress - studioApproachStart));
        const copyIn = smooth(approach / .10);
        const copyOut = smooth((approach - .48) / .10);
        const copyOpacity = copyIn * (1 - copyOut);
        element.style.setProperty("--studio-transition-copy", copyOpacity);
        element.style.setProperty("--studio-transition-y", `${(1 - copyIn) * 14 - copyOut * 8}px`);
        element.querySelector(".video-studio-transition-copy").setAttribute("aria-hidden", String(copyOpacity < .01));
      }
      // Follow the approved 35–43 / 43–48 / 48–56% shots of the original cut,
      // so longer viewing holds do not shift the blur onto different frames.
      const focusProgress = originalScrollFraction(p);
      const edgeBlur = smooth((focusProgress - .35) / .08) * (1 - smooth((focusProgress - .48) / .08));
      element.style.setProperty("--edge-blur", edgeBlur);
      // Preserve the approved 73% cue of the original 15-screen cut.
      const entryStart = .73 * 15 / originalScreens;
      const entryFade = joinedTest ? 1.22 : 1.16;
      const entryIn = smooth((p - entryStart) / .05);
      const entryOut = smooth((p - entryFade) / .06);
      const entryOpacity = entryIn * (1 - entryOut);
      element.style.setProperty("--entry-copy", entryOpacity);
      element.style.setProperty("--desk-shade", entryOpacity);
      element.style.setProperty("--entry-y", `${(1 - entryIn) * 22 - entryOut * 12}px`);
      element.querySelector(".video-entry-copy").setAttribute("aria-hidden", String(entryOpacity < .01));
      element.style.setProperty("--desk-reveal", joinedTest ? 0 : smooth((p - deskJoinStart) / (deskJoinEnd - deskJoinStart)));
      const white = smooth((p - transitionStart) / (whitePeak - transitionStart)) * (1 - smooth((p - whiteFade) / (transitionEnd - whiteFade)));
      element.style.setProperty("--white-light", white);
      element.style.setProperty("--lens-bloom", .07 + smooth((p - .31) / .08) * (1 - smooth((p - whiteFade) / (transitionEnd - whiteFade))) * .65);
      document.body.classList.toggle("video-transition-bright", white > .65);
      element.style.setProperty("--reveal", clamp((p - (whitePeak + .005)) / .02));
      element.style.setProperty("--intro", 1 - clamp((p - .035) / .12));
      element.dataset.introVisible = String(p < .155);
      element.style.setProperty("--intro-y", `${-p * 450}px`);
      element.style.setProperty("--gallery-copy", clamp((p - transitionEnd) / .04) * (1 - clamp((p - .68) / .08)));
      element.style.setProperty("--gallery-y", `${(p - .55) * -160}px`);
      const bookOpacity = smooth((p - deskEnd) / .02) * (1 - smooth((p - (computerJoinStart - .02)) / .02));
      element.style.setProperty("--computer-reveal", joinedTest ? 0 : smooth((p - computerJoinStart) / (computerJoinEnd - computerJoinStart)));
      sequences[3]?.update(clamp((p - computerJoinEnd) / (computerEnd - computerJoinEnd)), !joinedTest && p > 1.34);
      element.style.setProperty("--book-entry", bookOpacity);
      element.style.setProperty("--progress", overall);
      element.dataset.chapter = finaleActive ? "finale" : roomsHolding ? "rooms" : p >= computerJoinStart ? "computer" : p >= (joinedTest ? 1.05 : deskJoinStart) ? "desk" : p < whitePeak + .015 ? "curtain" : "gallery";
      const bookInteraction = element.querySelector(".video-book-interaction");
      const bookVisible = bookOpacity >= .01;
      bookInteraction.inert = !bookVisible;
      bookInteraction.setAttribute("aria-hidden", String(!bookVisible));
    };
    const schedule = () => {
      // Resize can dispatch a scroll event before its resize event. Keep the
      // last progress measured in the old viewport until its geometry is reset.
      if (innerWidth !== viewportWidth || innerHeight !== viewportHeight) { resize(); return; }
      scrollProgress = clamp((scrollY - trackTop) / scrollDistance);
      if (!request) request = requestAnimationFrame(render);
    };
    const wheel = (event) => {
      if (effectsPaused.current || event.ctrlKey || !event.cancelable || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.target instanceof Element && event.target.closest('dialog, [popover]:popover-open')) return;
      const deltaPixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const units = Math.sign(deltaPixels) * (event.deltaMode ? 1 : Math.min(1, Math.abs(deltaPixels) / 100));
      // CSS viewport units can include fractional pixels. Use the measured
      // track distance so wheel boundaries match the actual rendered cues.
      const screenDistance = (element.offsetHeight - innerHeight) / trackScreens;
      const target = holdScrollTarget(scrollY, deltaPixels, screenDistance, element.offsetTop, units);
      if (target === null) return;
      event.preventDefault();
      window.scrollTo({ top: target, behavior: "instant" });
      schedule();
    };
    const resize = () => {
      viewportWidth = innerWidth; viewportHeight = innerHeight;
      trackTop = element.offsetTop;
      scrollDistance = Math.max(1, element.offsetHeight - viewportHeight);
      sequences.forEach(sequence => sequence.resize());
      element.style.setProperty("--poster-fit", Math.max(viewportWidth / 1280, viewportHeight / (joinedTest ? 740 : 720)));
      element.style.setProperty("--book-fit", Math.max(viewportWidth / 1280, viewportHeight / 740));
      window.scrollTo({ top: trackTop + scrollDistance * scrollProgress, behavior: "instant" });
      cancelAnimationFrame(request);
      render();
    };
    resize();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(request); window.removeEventListener("scroll", schedule); window.removeEventListener("wheel", wheel); window.removeEventListener("resize", resize); sequences.forEach(sequence => sequence.dispose()); document.body.classList.remove("video-transition-bright"); };
  }, [reduced]);

  if (reduced) return <section id="experience" className="video-quiet">{clips.map((clip, index) => <section key={clip} style={{ backgroundImage: `url(${scenePoster(clip, index)})` }}><div><p>0{index + 1} / LIU ZIEN</p><h1>{t(chapterTitles[index])}</h1><button onClick={() => onPanel("works")}>{t("浏览作品 ↗")}</button></div></section>)}{joinedTest && <section style={{ backgroundImage: `url(${curtainScenes.finaleBase}closed.webp)` }}><div><p>{t("刘梓恩 / LIU ZIEN")}</p><h2>{t("这一幕，先到这里。")}<br />{t("下一幕，期待与你一起。")}</h2><button onClick={() => onPanel("works")}>{t("查看全部作品 ↗")}</button></div></section>}<div className="portfolio-vignette" aria-hidden="true" /></section>;
  return <section id="experience" ref={root} className="video-scroll-track" style={{ "--video-track-height": `${(trackScreens + 1) * 100}vh` }} data-main-connection={joinedTest} data-surround-dim={surroundDimEnabled} data-effects-paused={Boolean(paused)} aria-label={t(joinedTest ? "滚轮控制的幕布、展廊、创作工作台、影像工作站与创意空间" : "滚轮控制的幕布、展廊、创作工作台与影像工作站")}>
    <div className="video-scroll-stage">
      {visibleClips.map((clip, index) => <div key={clip} className={`video-scroll-layer video-scroll-layer-${index}`}>
        <img src={scenePoster(clip, index)} loading={index >= 2 ? "lazy" : "eager"} alt={t(["舞台红幕徐徐开启", "红色展廊与海报作品", "暖光工作台与闭合画册", "从暖光书房转入摄影棚电脑工作站"][index])} />
        {index === 0 || joinedTest
          ? <video ref={index === 0 ? first : second} data-stream-src={`${index === 0 ? curtainScenes.openingVideoBase : mainVideo.base}${scrollStreamDirectory}/stream.json`} data-opening-video={index === 0 ? "true" : undefined} poster={scenePoster(clip, index)} preload={index === 0 ? "auto" : "none"} muted playsInline disablePictureInPicture aria-hidden="true" />
          : <canvas ref={[first, second, third, fourth][index]} aria-hidden="true" />}
      </div>)}
      <div className="video-edge-blur" aria-hidden="true" />
      <div className="video-scroll-shade" />
      <SceneAtmosphere progress={atmosphereProgress} paused={paused} />
      <div className="scene-lens-bloom" aria-hidden="true" />
      <div className="video-white-transition" aria-hidden="true" />
      <div className="video-desk-shade" aria-hidden="true" />
      <div className="video-intro"><p>AIGC / VISUAL DESIGN</p><h1 aria-label="LIU ZIEN">{"LIU ZIEN".split("").map((letter, index) => <span className={letter === " " ? "title-space" : "title-letter"} aria-hidden="true" key={index} style={{ animationDelay: `${index * .12}s` }}>{letter === " " ? "\u00a0" : letter}</span>)}</h1><span>{t("让想象，走进现实。")}</span></div>
      <div className="video-intro-continue" aria-hidden="true"><span>{t("继续向下滚动")}</span><svg width="20" height="28" viewBox="0 0 20 28" fill="none"><path d="M10 2v22m-5-5 5 5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div className="video-gallery-copy"><p>SELECTED VISUALS</p><h2>{t("走进我的视觉现场。")}</h2></div>
      <div className="video-entry-copy" aria-hidden="true">
        <div><p lang="en">IMAGINATION CONTINUES</p><h2 lang={language === "en" ? "en" : "zh-CN"}><span>{t("从一个画面")}</span><span>{t("到更多可能")}</span></h2></div>
      </div>
      {joinedTest && <div className="video-studio-transition-copy" aria-hidden="true" lang={language === "en" ? "en" : "zh-CN"}><p><span>{t("从脑海中的一瞬，")}</span><span>{t("到屏幕上的一个世界。")}</span></p></div>}
      <div className="video-poster-interaction" inert aria-hidden="true">
        <div className="video-poster-plane"><PosterReflections mainConnection={joinedTest} />{surroundDimEnabled && <SceneSurroundDim height={joinedTest ? 740 : 720} points={joinedTest ? "484,159 L800,159 L800,583 L484,583" : "484,155 L800,155 L800,568 L484,568"} />}<button className="video-poster-hotspot" aria-label={t("点击中央海报，浏览电商海报作品")} onClick={() => onPanel("posters")}><span className="poster-shine" /></button></div>
        <div className="video-poster-cta"><p>{t("你的下一段视觉灵感")}</p><button className="video-scene-cta video-scene-cta-compact" onClick={() => onPanel("posters")}><span>{t("点开这张让你心动的海报")}</span><span className="video-scene-arrow" aria-hidden="true">↗</span></button></div>
        <div className="video-poster-continue" aria-hidden="true">{t("继续向下滚动 ")}<span>↓</span></div>
      </div>
      <div className="video-book-interaction" inert aria-hidden="true">
        <div className="video-book-plane">
          {surroundDimEnabled && <SceneSurroundDim points="541,184 L841,185 L866,598 L523,600" />}
          <svg className="video-book-outline" viewBox="0 0 1280 740" aria-hidden="true"><polygon points="541,184 841,185 866,598 523,600" /></svg>
          <button className="video-book-hotspot" aria-label={t("点击画册，进入作品集")} onClick={() => onPanel("vi")}><span /></button>
        </div>
        <div className="video-book-cta"><p>{t("翻开画册，发现更多可能")}</p><button className="video-scene-cta video-scene-cta-compact" onClick={() => onPanel("vi")}><span>{t("进入我的作品集")}</span><span className="video-scene-arrow" aria-hidden="true">↗</span></button></div>
        <div className="video-book-continue" aria-hidden="true">{t("继续向下滚动")}<span>↓</span></div>
      </div>
      {joinedTest && <SceneNodeControls surroundDim={surroundDimEnabled} onBrowse={onBrowse || (() => onPanel("works"))} onCharacters={() => onPanel("characters")} />}
      <div className="video-scroll-footer"><ChapterNavigation joined={joinedTest} onNavigate={jumpToCinematicChapter} /></div>
      <div className="video-scroll-meter" />
      <div className="portfolio-vignette" aria-hidden="true" />
      {joinedTest && <CurtainFinale onPanel={onPanel} />}
      <VideoLoadStatus />
    </div>
  </section>;
}
