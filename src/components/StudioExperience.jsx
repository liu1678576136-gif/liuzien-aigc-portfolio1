import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, MoveDown, Play } from "lucide-react";
import { chapters, workById } from "../data/studio.js";
import { Artwork, FilmPreview } from "./StudioMedia.jsx";

gsap.registerPlugin(ScrollTrigger);
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function jumpToChapter(id, reduced = false) {
  const chapter = chapters.find((item) => item.id === id);
  if (!chapter) return;
  const section = document.getElementById("experience");
  if (!section) return;
  if (reduced) {
    document.getElementById(`static-${id}`)?.scrollIntoView({ behavior: "instant" });
    return;
  }
  const y = section.getBoundingClientRect().top + window.scrollY + (section.offsetHeight - window.innerHeight) * chapter.position / 6.5;
  window.scrollTo({ top: y, behavior: "instant" });
}

function PosterCopy() {
  return <>
    <div className="poster-eyebrow"><span className="tiny-square" />INDEPENDENT VISION. GENERATED WORLDS.</div>
    <h1 className="poster-name" lang="en"><span>LIU</span><span>ZIEN<span className="name-period">.</span></span></h1>
    <div className="poster-identity"><p>刘梓恩 <span>/</span> AIGC VISUAL DESIGNER</p><span>让想象，成为可交付的视觉。</span></div>
    <div className="poster-edition"><span>SELECTED WORKS</span><span>PORTFOLIO — 2026</span></div>
  </>;
}

function SceneCopy({ number, english, title, children, work, onOpen, className, hidden }) {
  return <div className={`scene-copy ${className}`} aria-hidden={hidden} inert={hidden ? true : undefined}>
    <p className="eyebrow"><span>{number}</span> / {english}</p>
    <h2>{title}</h2><p className="scene-description">{children}</p>
    <button className="text-action" onClick={() => onOpen(work.id)}>查看项目 <ArrowUpRight size={18} /></button>
    <span className="scene-project-title">{work.subtitle}</span>
  </div>;
}

function StaticExperience({ onOpen }) {
  const first = workById.orbital;
  return <section id="experience" className="static-experience" aria-label="创作空间">
    <div className="static-opening" id="static-opening"><PosterCopy /><div className="hero-film"><FilmPreview media={first.media[0]} enabled={false} /><span className="frame-label">01 / ORBITAL — CINEMATIC STUDY</span></div></div>
    {chapters.slice(1).map((chapter) => {
      const work = workById[chapter.id === "motion" ? "orbital" : chapter.id === "brand" ? "moxo" : "momo"];
      return <section className="static-chapter" id={`static-${chapter.id}`} key={chapter.id}><div><p className="eyebrow">{chapter.en}</p><h2>{chapter.label}</h2><p>{work.description}</p><button className="text-action" onClick={() => onOpen(work.id)}>查看项目 <ArrowUpRight size={18} /></button></div><button className="static-art" onClick={() => onOpen(work.id)} aria-label={`查看${work.title}`}><Artwork src={work.cover} original={work.coverOriginal} alt={work.title} /></button></section>;
    })}
  </section>;
}

export function StudioExperience({ onOpen, paused, reduced }) {
  const section = useRef(null);
  const triggerRef = useRef(null);
  const progressRef = useRef(null);
  const [phase, setPhase] = useState("opening");
  const [inView, setInView] = useState(true);
  const [prepared, setPrepared] = useState({ brand: false, ip: false });
  const film = workById.orbital;

  useLayoutEffect(() => {
    if (reduced) return;
    let lastPhase = "";
    let preparedBrand = false;
    let preparedIP = false;
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ paused: true });
      timeline.to({}, { duration: 6.5 }, 0);
      timeline.to(".poster-name", { scale: 0.32, xPercent: -3, yPercent: -25, opacity: 0, duration: 1.1, ease: "power1.inOut" }, 0.9);
      timeline.to(".poster-eyebrow, .poster-identity, .poster-edition, .opening-line, .hero-caption", { opacity: 0, duration: 0.55 }, 0.9);
      timeline.fromTo(".unfold-sheet", { opacity: 0 }, { opacity: 0.6, duration: 0.24 }, 0.95);
      timeline.to(".unfold-sheet-top", { xPercent: -24, yPercent: -30, rotateY: 24, rotateZ: -4, opacity: 0, duration: 0.85, ease: "power1.inOut" }, 1.14);
      timeline.to(".unfold-sheet-bottom", { xPercent: -10, yPercent: 42, rotateX: 58, opacity: 0, duration: 0.85, ease: "power1.inOut" }, 1.14);
      timeline.fromTo(".room-floor", { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.15, ease: "power1.inOut" }, 0.9);
      timeline.fromTo(".room-wing", { opacity: 0, scaleX: 0.4 }, { opacity: 1, scaleX: 1, duration: 1.15, ease: "power1.inOut" }, 0.9);
      timeline.fromTo(".room-signature", { opacity: 0 }, { opacity: 0.65, duration: 0.6 }, 1.5);
      timeline.to(".hero-film", { left: "34%", top: "23%", width: "54%", height: "47%", rotateY: -3, rotateX: 0, duration: 1.15, ease: "power1.inOut" }, 0.9);
      timeline.fromTo(".motion-copy", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35 }, 1.98);
      timeline.to(".hero-film", { scale: 1.025, duration: 0.45 }, 2.05);
      timeline.to(".motion-copy", { opacity: 0, y: -18, duration: 0.28 }, 3.2);
      timeline.to(".hero-film", { opacity: 0, xPercent: -12, scale: 0.88, duration: 0.4 }, 3.15);
      timeline.fromTo(".brand-installation", { opacity: 0, xPercent: 12, rotateY: -8 }, { opacity: 1, xPercent: 0, rotateY: -2, duration: 0.45 }, 3.35);
      timeline.fromTo(".brand-copy", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35 }, 3.5);
      timeline.to(".brand-installation", { xPercent: -3, duration: 0.5 }, 3.85);
      timeline.to(".brand-copy", { opacity: 0, y: -18, duration: 0.28 }, 4.7);
      timeline.to(".brand-installation", { opacity: 0, xPercent: -14, duration: 0.4 }, 4.7);
      timeline.fromTo(".ip-installation", { opacity: 0, xPercent: 12, scale: 0.92 }, { opacity: 1, xPercent: 0, scale: 1, duration: 0.45 }, 4.9);
      timeline.fromTo(".ip-copy", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35 }, 5.05);
      timeline.to(".ip-installation", { scale: 1.025, duration: 0.5 }, 5.35);
      timeline.to(".ip-installation", { scale: 0.96, duration: 0.4 }, 6.1);

      const trigger = ScrollTrigger.create({
        trigger: section.current, start: "top top", end: "bottom bottom", animation: timeline, scrub: true,
        onUpdate(self) {
          const position = self.progress * 6.5;
          if (position > 2.8 && !preparedBrand) { preparedBrand = true; setPrepared((previous) => ({ ...previous, brand: true })); }
          if (position > 4.4 && !preparedIP) { preparedIP = true; setPrepared((previous) => ({ ...previous, ip: true })); }
          const next = position < 1.95 ? "opening" : position < 3.38 ? "motion" : position < 4.95 ? "brand" : "ip";
          if (next !== lastPhase) { lastPhase = next; setPhase(next); }
          section.current?.style.setProperty("--story-progress", self.progress);
          if (progressRef.current) progressRef.current.textContent = `${String(Math.round(self.progress * 100)).padStart(2, "0")}%`;
        },
        onToggle(self) { setInView(self.isActive); },
      });
      triggerRef.current = trigger;
    }, section);
    return () => { ctx.revert(); triggerRef.current = null; };
  }, [reduced]);

  if (reduced) return <StaticExperience onOpen={onOpen} paused={paused} />;
  return <section ref={section} id="experience" className="studio-scroll" aria-label="滚动探索创作空间" data-phase={phase}>
    <div className="stage-viewport">
      <div className="room-light" aria-hidden="true" /><div className="room-wing room-wing-left" aria-hidden="true" /><div className="room-wing room-wing-right" aria-hidden="true" />
      <div className="room-floor" aria-hidden="true"><div className="floor-lines" /><div className="floor-reflection" /></div>
      <div className="room-signature" aria-hidden="true">LZ <span>THE CREATIVE ROOM</span></div>
      <div className="poster-composition" aria-hidden={phase !== "opening"}><PosterCopy /><div className="opening-line" aria-hidden="true" /></div>
      <div className="hero-film" aria-hidden={phase !== "opening" && phase !== "motion"} inert={phase !== "motion" ? true : undefined}>
        <button className="hero-film-hit" onClick={() => onOpen(film.id)} aria-label="查看失重之间完整影像">
          <FilmPreview media={film.media[0]} enabled={phase === "motion" && inView && !paused} />
          <span className="film-open-label"><Play size={15} fill="currentColor" /> VIEW FILM</span>
        </button>
        <div className="frame-foot"><span>01 / ORBITAL</span><span>CINEMATIC STUDY <ArrowUpRight size={12} /></span></div>
      </div>
      <div className="unfold-sheet unfold-sheet-top" style={{ backgroundImage: `url(${film.cover})` }} aria-hidden="true" />
      <div className="unfold-sheet unfold-sheet-bottom" style={{ backgroundImage: `url(${film.cover})` }} aria-hidden="true" />
      <div className="hero-caption"><span className="caption-rule" /><p>IMAGINATION,<br />GIVEN FORM.</p><span>从一张画面，走进我的创作空间。</span></div>
      <SceneCopy className="motion-copy" hidden={phase !== "motion"} number="01" english="AI MOTION" title={<>让想象<br />开始运动。</>} work={film} onOpen={onOpen}>从静帧到动态影像，<br />在光线、空间与时间里构建视觉叙事。</SceneCopy>
      <SceneCopy className="brand-copy" hidden={phase !== "brand"} number="02" english="COMMERCIAL VISUAL" title={<>让创意<br />落在实处。</>} work={workById.moxo} onOpen={onOpen}>从品牌识别到商业画面，<br />让视觉语言走进真实的应用场景。</SceneCopy>
      <div className="brand-installation" aria-hidden={phase !== "brand"} inert={phase !== "brand" ? true : undefined}>
        <button className="brand-frame brand-frame-main" onClick={() => onOpen("moxo")} aria-label="查看 MOXO 品牌视觉">{prepared.brand && <Artwork src={workById.moxo.cover} original={workById.moxo.coverOriginal} alt="MOXO 品牌视觉" eager />}<span>MOXO / IDENTITY <ArrowUpRight size={16} /></span></button>
        <button className="brand-frame brand-frame-side" onClick={() => onOpen("xtep")} aria-label="查看特步商业视觉">{prepared.brand && <Artwork src={workById.xtep.cover} original={workById.xtep.coverOriginal} alt="特步商业视觉" eager />}<span>XTEP / CAMPAIGN <ArrowUpRight size={16} /></span></button>
        <span className="installation-line" aria-hidden="true" />
      </div>
      <SceneCopy className="ip-copy" hidden={phase !== "ip"} number="03" english="CHARACTER & WORLD" title={<>给一个角色，<br />一个世界。</>} work={workById.momo} onOpen={onOpen}>从角色形象到场景延展，<br />让同一个小小角色，拥有不同的故事。</SceneCopy>
      <div className="ip-installation" aria-hidden={phase !== "ip"} inert={phase !== "ip" ? true : undefined}>
        <button className="ip-main-frame" onClick={() => onOpen("momo")} aria-label="查看 MOMO 角色系列">{prepared.ip && <Artwork src={workById.momo.cover} original={workById.momo.coverOriginal} alt="MOMO 的睡前世界" eager />}<span>MOMO / A LITTLE WORLD <ArrowUpRight size={16} /></span></button>
        <div className="ip-proof-strip" aria-hidden="true">{prepared.ip && workById.momo.media.slice(1, 3).map((media) => <Artwork key={media.src} src={media.src} original={media.original} alt="" />)}</div>
      </div>
      <div className="studio-bottom"><div className="scroll-prompt"><MoveDown size={20} strokeWidth={1} /><span>{phase === "opening" ? "向下滚动，展开想象" : "继续探索"}<small>SCROLL TO EXPLORE</small></span></div>
        <nav className="chapter-nav" aria-label="场景导航">{chapters.map((chapter, i) => <button key={chapter.id} onClick={() => jumpToChapter(chapter.id)} aria-current={phase === chapter.id ? "step" : undefined}><span>{String(i).padStart(2, "0")}</span>{chapter.label}</button>)}<a href="#about">04 <span>创作者</span></a></nav>
        <span className="story-percentage" ref={progressRef} aria-hidden="true">00%</span>
      </div>
    </div>
  </section>;
}
