import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { workById } from "../data/studio.js";
import { galleryPosterSlots, galleryFeaturedId } from "../data/cinematicGallery.js";
import { Artwork } from "./StudioMedia.jsx";

gsap.registerPlugin(ScrollTrigger);
const W = 1672, H = 941, LENGTH = 21;
const scenes = [
  { id: "opening", label: "序章", position: 0 },
  { id: "gallery", label: "海报艺术馆", position: 2.65 },
  { id: "brand", label: "品牌与视觉", position: 9.3 },
  { id: "motion", label: "影像现场", position: 13.1 },
  { id: "world", label: "进入想象", position: 16 },
  { id: "ip", label: "角色与世界", position: 18.5 },
  { id: "contact", label: "下一段创作", position: 20.7 },
];
export function jumpToCinematicChapter(id) {
  const item = scenes.find((scene) => scene.id === id);
  const track = document.getElementById("experience");
  if (!item || !track) return;
  if (track.classList.contains("cinematic-reduced")) {
    document.getElementById(`quiet-${id}`)?.scrollIntoView();
    return;
  }
  window.scrollTo({ top: track.offsetTop + (track.offsetHeight - innerHeight) * item.position / LENGTH, behavior: "instant" });
}

// Map a real artwork to the four corners of the photographed book cover.
function projectToQuad(points, width = 1000, height = 562.5) {
  const source = [[0, 0], [width, 0], [width, height], [0, height]];
  const matrix = source.flatMap(([x, y], i) => {
    const [u, v] = points[i];
    return [[x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]];
  });
  for (let column = 0; column < 8; column++) {
    let pivot = column;
    for (let row = column + 1; row < 8; row++) if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    const divisor = matrix[column][column];
    for (let j = column; j < 9; j++) matrix[column][j] /= divisor;
    for (let row = 0; row < 8; row++) if (row !== column) {
      const factor = matrix[row][column];
      for (let j = column; j < 9; j++) matrix[row][j] -= factor * matrix[column][j];
    }
  }
  const [a, b, c, d, e, f, g, h] = matrix.map((row) => row[8]);
  return `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1].join(",")})`;
}
const bookTransform = projectToQuad([[553, 350], [1174, 286], [1382, 550], [620, 670]]);
const galleryPosters = galleryPosterSlots.map((slot) => {
  const [a, b, c, d] = slot.points;
  const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  // Preserve the artwork's aspect ratio inside the photographed paper.
  // Using artwork dimensions for this plane would stretch landscape art vertically.
  const height = 1000 * (distance(a, d) + distance(b, c)) / (distance(a, b) + distance(d, c));
  return { ...slot, width: 1000, height, transform: projectToQuad(slot.points, 1000, height) };
});

function GalleryWall({ onOpen, focused = false }) {
  return <div className="scene-fit"><div className="scene-camera gallery-camera">
    <Artwork className="scene-photo gallery-background" src="/assets/cinematic/gallery.webp" original="/assets/cinematic/originals/gallery.png" alt="暖色射灯下的混凝土艺术馆，展墙上错落陈列多幅视觉作品" eager />
    {galleryPosters.map((poster) => {
      const work = workById[poster.id];
      return <button key={poster.id} className={`gallery-poster${poster.featured ? " gallery-poster-featured" : ""}`} style={{ width: poster.width, height: poster.height, transform: poster.transform }} tabIndex={focused && !poster.featured ? -1 : 0} onMouseDown={(event) => { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); }} onClick={() => onOpen(work.id)} aria-label={`查看展墙作品：${work.title}`}>
        <Artwork src={work.cover} original={work.coverOriginal} alt={work.title} eager />
      </button>;
    })}
  </div></div>;
}

function useScrubVideo(reference) {
  const desired = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const apply = () => {
    const video = reference.current;
    if (!video || video.readyState < 1 || !Number.isFinite(video.duration) || video.seeking) return;
    const target = Math.min(video.duration - 0.04, Math.max(0, desired.current * video.duration));
    if (Math.abs(video.currentTime - target) > 0.04) video.currentTime = target;
  };
  return {
    seek(progress) { desired.current = progress; apply(); }, ready, failed,
    events: { onLoadedMetadata: apply, onLoadedData: () => { setReady(true); apply(); }, onSeeked: apply, onError: () => setFailed(true) },
  };
}

function QuietGallery({ onOpen, onPanel }) {
  const room = useRef(null);
  useLayoutEffect(() => {
    const element = room.current;
    const fit = () => element.style.setProperty("--scene-fit", element.clientWidth / W);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <section className="quiet-gallery" id="quiet-gallery" aria-label="海报艺术馆"><div ref={room} className="quiet-gallery-room"><GalleryWall onOpen={onOpen} /></div><div className="quiet-gallery-info"><h2>有些想象，值得靠近。</h2><p>点击展墙上的作品，或浏览完整作品集。</p><button onClick={() => onPanel("works")}>浏览全部作品 <ArrowUpRight size={18} /></button></div></section>;
}

function QuietExperience({ onOpen, onPanel }) {
  return <section id="experience" className="cinematic-reduced">
    <section className="quiet-scene" id="quiet-opening" style={{ backgroundImage: "url(/assets/cinematic/curtain.webp)" }}><div><h1>LIU ZIEN</h1><p>刘梓恩 / AIGC Visual Designer</p><button onClick={() => onPanel("works")}>查看全部作品<ArrowUpRight size={18} /></button></div></section>
    <QuietGallery onOpen={onOpen} onPanel={onPanel} />
    {[{ id: "brand", image: "table", title: "想法，落在纸上。", action: () => onOpen("moxo"), label: "查看品牌作品" }, { id: "motion", image: "filmset", title: "让想象，开始运动。", action: () => onOpen("orbital"), label: "查看影像作品" }, { id: "ip", image: "corridor", title: "每一个想法，都有一个入口。", action: () => onOpen("momo"), label: "进入角色世界" }, { id: "contact", image: "corridor", title: "下一段创作，一起发生。", action: () => onPanel("contact"), label: "联系刘梓恩" }].map((scene) => <section className="quiet-scene" id={`quiet-${scene.id}`} key={scene.id} style={{ backgroundImage: `url(/assets/cinematic/${scene.image}.webp)` }}><div><h2>{scene.title}</h2><button onClick={scene.action}>{scene.label}<ArrowUpRight size={18} /></button></div></section>)}
  </section>;
}

export default function CinematicExperience({ onOpen, onPanel, paused, reduced }) {
  const root = useRef(null);
  const percentage = useRef(null);
  const progress = useRef(null);
  const projectedVideo = useRef(null);
  const worldVideo = useRef(null);
  const contextCleanup = useRef(null);
  const screenMedia = useScrubVideo(projectedVideo);
  const worldMedia = useScrubVideo(worldVideo);
  const mediaControls = useRef({ screenMedia, worldMedia });
  mediaControls.current = { screenMedia, worldMedia };
  const [chapter, setChapter] = useState("opening");
  const [galleryStage, setGalleryStage] = useState("wide");
  const [prepared, setPrepared] = useState(false);
  const [mediaPrepared, setMediaPrepared] = useState(false);
  const film = workById.orbital;
  const featured = workById[galleryFeaturedId];

  useEffect(() => {
    if (paused) { projectedVideo.current?.pause(); worldVideo.current?.pause(); }
  }, [paused]);

  useLayoutEffect(() => {
    if (reduced) return;
    let previous = "";
    let previousGalleryStage = "";
    let warmed = false;
    let warmedMedia = false;
    const context = gsap.context(() => {
      const fit = () => {
        const scale = Math.max(innerWidth / W, innerHeight / H);
        root.current.style.setProperty("--scene-fit", scale);
      };
      fit();
      window.addEventListener("resize", fit);
      const timeline = gsap.timeline({ paused: true });
      timeline.to({}, { duration: LENGTH }, 0);
      timeline.to(".cinema-opening-copy", { opacity: 0, y: -25, duration: .65 }, 1);
      timeline.to(".curtain-left", { xPercent: -108, duration: 1.25, ease: "power2.inOut" }, 1.05);
      timeline.to(".curtain-right", { xPercent: 108, duration: 1.25, ease: "power2.inOut" }, 1.05);
      // Establish the room first; approach the wall as a single camera move.
      // Artwork stays attached to the same photographed paper throughout.
      timeline.fromTo(".gallery-wide-copy", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .4 }, 2.2);
      timeline.to(".gallery-wide-copy", { opacity: 0, duration: .35 }, 3.15);
      timeline.to(".gallery-camera", { scale: 1.42, x: -18, y: 42, duration: 1.35, ease: "power1.in" }, 3.05);
      timeline.to(".gallery-camera", { scale: 2.55, x: 5, y: 176, "--focus-softness": "2.4px", duration: 1.4, ease: "power1.out" }, 4.4);
      timeline.fromTo(".gallery-focus-shade", { opacity: 0 }, { opacity: 1, duration: .6 }, 5.2);
      timeline.fromTo(".gallery-focus-copy", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .45 }, 5.85);
      timeline.to(".gallery-focus-copy", { opacity: 0, duration: .35 }, 7.4);
      timeline.fromTo(".cinema-table", { opacity: 0 }, { opacity: 1, duration: .75 }, 7.65);
      timeline.to(".cinema-gallery", { opacity: 0, duration: .55 }, 7.85);
      timeline.fromTo(".table-camera", { scale: 1.45, x: -95, y: -75 }, { scale: 1.02, x: 0, y: 0, duration: 1.6, ease: "power1.inOut" }, 7.6);
      timeline.fromTo(".table-copy", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .4 }, 8.7);
      timeline.to(".table-copy", { opacity: 0, duration: .3 }, 10);
      timeline.to(".table-camera", { scale: 1.65, x: -140, y: -40, duration: 1, ease: "power1.inOut" }, 10.1);
      timeline.fromTo(".cinema-filmset", { opacity: 0 }, { opacity: 1, duration: .65 }, 10.95);
      timeline.to(".cinema-table", { opacity: 0, duration: .5 }, 11.1);
      timeline.fromTo(".studio-camera", { scale: 1.12 }, { scale: 1, duration: .8 }, 11.1);
      timeline.fromTo(".filmset-copy", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .35 }, 11.85);
      timeline.to(".filmset-copy", { opacity: 0, duration: .3 }, 13.5);
      timeline.to(".studio-camera", { scale: 3.5, y: 175, duration: 1.25, ease: "power1.inOut" }, 13.75);
      timeline.fromTo(".cinema-world", { opacity: 0 }, { opacity: 1, duration: .35 }, 14.65);
      timeline.to(".cinema-filmset", { opacity: 0, duration: .3 }, 14.9);
      timeline.fromTo(".world-copy", { opacity: 0 }, { opacity: 1, duration: .4 }, 15.4);
      timeline.to(".world-copy", { opacity: 0, duration: .35 }, 16.65);
      timeline.fromTo(".cinema-corridor", { opacity: 0 }, { opacity: 1, duration: .65 }, 16.9);
      timeline.to(".cinema-world", { opacity: 0, duration: .5 }, 17.05);
      timeline.fromTo(".corridor-camera", { scale: 1.13, y: -25 }, { scale: 1, y: 0, duration: 1.05 }, 17.05);
      timeline.fromTo(".corridor-copy", { opacity: 0 }, { opacity: 1, duration: .4 }, 17.8);
      timeline.to(".corridor-copy", { opacity: 0, duration: .3 }, 19.15);
      timeline.to(".corridor-camera", { scale: 1.12, y: 20, duration: 1 }, 19.25);
      timeline.fromTo(".cinema-final-shade", { opacity: 0 }, { opacity: .7, duration: .7 }, 19.4);
      timeline.fromTo(".cinema-finale-copy", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .55 }, 19.85);
      ScrollTrigger.create({ trigger: root.current, start: "top top", end: "bottom bottom", animation: timeline, scrub: true, onUpdate(self) {
        const time = self.progress * LENGTH;
        const next = time < 2.3 ? "opening" : time < 8.4 ? "gallery" : time < 11.2 ? "brand" : time < 14.8 ? "motion" : time < 17.3 ? "world" : time < 19.7 ? "ip" : "contact";
        if (next !== previous) { previous = next; setChapter(next); }
        const nextGalleryStage = time < 3.05 ? "wide" : time < 5.8 ? "approach" : time < 7.75 ? "focus" : "leaving";
        if (nextGalleryStage !== previousGalleryStage) { previousGalleryStage = nextGalleryStage; setGalleryStage(nextGalleryStage); }
        if (!warmed && time > .3) { warmed = true; setPrepared(true); }
        if (!warmedMedia && time > 9.7) { warmedMedia = true; setMediaPrepared(true); }
        if (percentage.current) percentage.current.textContent = `${Math.round(self.progress * 100)}%`;
        if (progress.current) progress.current.style.transform = `scaleX(${self.progress})`;
        mediaControls.current.screenMedia.seek(Math.min(1, Math.max(0, (time - 11.3) / 5.7)));
        mediaControls.current.worldMedia.seek(Math.min(1, Math.max(0, (time - 11.3) / 5.7)));
      } });
      contextCleanup.current = () => window.removeEventListener("resize", fit);
    }, root);
    return () => { contextCleanup.current?.(); context.revert(); };
  }, [reduced]);

  if (reduced) return <QuietExperience onOpen={onOpen} onPanel={onPanel} />;
  return <section ref={root} id="experience" className="cinematic-track" data-chapter={chapter} data-gallery-stage={galleryStage} aria-label="沉浸式作品集">
    <div className="cinematic-viewport">
      <div className="cinema-scene cinema-gallery" aria-hidden={chapter !== "gallery"} inert={chapter !== "gallery" ? true : undefined}><GalleryWall onOpen={onOpen} focused={galleryStage !== "wide"} /><div className="gallery-focus-shade" aria-hidden="true" /></div>
      <div className="cinema-scene cinema-table" aria-hidden={chapter !== "brand"} inert={chapter !== "brand" ? true : undefined}>
        <div className="scene-fit"><div className="scene-camera table-camera">{prepared && <Artwork className="scene-photo" src="/assets/cinematic/table.webp" original="/assets/cinematic/originals/table.png" alt="暖光下的设计师工作台" eager />}
          <button className="physical-book" style={{ transform: bookTransform }} onClick={() => onOpen("moxo")} aria-label="翻开画册，查看 MOXO 品牌项目"><img src={workById.moxo.cover} alt="MOXO 品牌作品画册" /><span>MOXO / SELECTED IDENTITY</span></button>
        </div></div>
      </div>
      <div className="cinema-scene cinema-filmset" aria-hidden={chapter !== "motion"} inert={chapter !== "motion" ? true : undefined}>
        <div className="scene-fit"><div className="scene-camera studio-camera">{prepared && <Artwork className="scene-photo" src="/assets/cinematic/filmset.webp" original="/assets/cinematic/originals/filmset.png" alt="摄影棚中的影像工作台" eager />}
          <button className="physical-monitor" onClick={() => onOpen("orbital")} aria-label="点击显示器，查看失重之间"><img src={film.cover} alt="失重之间影像静帧" />{mediaPrepared && !screenMedia.failed && <video ref={projectedVideo} src={film.media[0].src} muted playsInline preload="auto" aria-hidden="true" {...screenMedia.events} className={screenMedia.ready ? "is-ready" : ""} />}</button>
        </div></div>
      </div>
      <div className="cinema-scene cinema-world" aria-hidden={chapter !== "world"} inert={chapter !== "world" ? true : undefined}><img src={film.cover} className="world-poster" alt="失重之间的宇宙场景" />{mediaPrepared && !worldMedia.failed && <video ref={worldVideo} className={`world-film${worldMedia.ready ? " is-ready" : ""}`} src={film.media[0].src} preload="auto" muted playsInline aria-hidden="true" {...worldMedia.events} />}</div>
      <div className="cinema-scene cinema-corridor" aria-hidden={chapter !== "ip" && chapter !== "contact"} inert={chapter !== "ip" ? true : undefined}>
        <div className="scene-fit"><div className="scene-camera corridor-camera">{prepared && <Artwork className="scene-photo" src="/assets/cinematic/corridor.webp" original="/assets/cinematic/originals/corridor.png" alt="通向角色工作室与放映室的双门走廊" eager />}
          <button className="door-hit door-hit-left" onClick={() => onOpen("momo")} aria-label="进入左侧角色工作室，查看 MOMO"><span>角色与世界 <ArrowUpRight size={18} /></span></button>
          <button className="door-hit door-hit-right" onClick={() => onPanel("works")} aria-label="进入右侧放映室，浏览全部作品"><span>全部作品 <ArrowUpRight size={18} /></span></button>
        </div></div>
      </div>
      <div className="cinema-final-shade" aria-hidden="true" />
      <div className="curtain-half curtain-left" aria-hidden="true" /><div className="curtain-half curtain-right" aria-hidden="true" />
      <div className="cinema-opening-copy" aria-hidden={chapter !== "opening"}><p>IMAGINATION, GIVEN FORM.</p><h1 lang="en">LIU ZIEN</h1><span>刘梓恩 / AIGC Visual Designer</span><div>让想象，走进现实。</div></div>
      <div className="gallery-wide-copy" aria-hidden={chapter !== "gallery" || galleryStage !== "wide"}><p>SELECTED VISUALS / 刘梓恩</p><h2>走进我的视觉现场。</h2><span>沿着展墙，慢慢靠近。</span></div>
      <div className="gallery-focus-copy" aria-hidden={chapter !== "gallery" || galleryStage !== "focus"} inert={chapter !== "gallery" || galleryStage !== "focus" ? true : undefined}><p>{featured.categoryLabel} / SELECTED WORK</p><h2>{featured.title}</h2><span>有些想象，值得靠近。</span><button onClick={() => onOpen(featured.id)}>查看这张作品 <ArrowUpRight size={18} /></button></div>
      <div className="cinema-caption table-copy" aria-hidden={chapter !== "brand"} inert={chapter !== "brand" ? true : undefined}><p>灵感，落在纸上。</p><button onClick={() => onOpen("moxo")}>翻开画册，走进品牌视觉 <ArrowUpRight size={17} /></button></div>
      <div className="cinema-caption filmset-copy" aria-hidden={chapter !== "motion"} inert={chapter !== "motion" ? true : undefined}><p>每个画面背后，<br />都有一个正在成形的想法。</p><button onClick={() => onOpen("orbital")}>点击屏幕，走进影像 <ArrowUpRight size={17} /></button></div>
      <div className="cinema-caption world-copy" aria-hidden={chapter !== "world"} inert={chapter !== "world" ? true : undefined}><p>想象的边界，<br />由你重新定义。</p><button onClick={() => onOpen("orbital")}>查看完整影像 <ArrowUpRight size={17} /></button></div>
      <div className="cinema-caption corridor-copy" aria-hidden={chapter !== "ip"}><p>每一个想法，<br />都有它的入口。</p><span>推开一扇门，继续探索。</span></div>
      <div className="cinema-finale-copy" aria-hidden={chapter !== "contact"} inert={chapter !== "contact" ? true : undefined}><p>THE NEXT CHAPTER</p><h2>下一段创作，<br />一起发生。</h2><div><button onClick={() => onPanel("about")}>认识刘梓恩 <ArrowUpRight size={17} /></button><button onClick={() => onPanel("contact")}>聊聊新的可能 <ArrowUpRight size={17} /></button></div></div>
      <div className="cinema-scroll-hint" aria-hidden="true">继续向下滚动 <ArrowDown size={19} /></div>
      <div className="cinema-bottom"><nav aria-label="场景导航">{scenes.map((scene) => <button key={scene.id} aria-current={chapter === scene.id ? "step" : undefined} onClick={() => jumpToCinematicChapter(scene.id)}>{scene.label}</button>)}</nav><span ref={percentage} aria-hidden="true">0%</span></div>
      <div className="cinema-progress" aria-hidden="true"><span ref={progress} /></div>
    </div>
  </section>;
}
