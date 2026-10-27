import { useEffect, useRef, useState } from "react";
import { Expand } from "lucide-react";
import { useLocale } from "../LocaleContext.jsx";
import { characterImages, characterVideos, characterWebShowcase } from "../data/characterGallery.js";
import { Artwork, DetailVideo } from "./StudioMedia.jsx";
import "../character-gallery.css";

export default function CharacterGallery({ onPreview }) {
  const { t } = useLocale();
  const root = useRef(null), tabButtons = useRef([]);
  const [active, setActive] = useState("videos");
  const tabs = [
    { id: "videos", label: "动态影像", count: characterVideos.length },
    { id: "images", label: "人物图片", count: characterImages.length },
  ];
  useEffect(() => {
    const videos = [...root.current.querySelectorAll("video")];
    return () => videos.forEach(video => video.pause());
  }, [active]);
  function navigateTabs(event, index) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    tabButtons.current[next].focus();
  }
  function preview(image) {
    root.current.querySelectorAll("video").forEach(video => video.pause());
    onPreview({ src: image.full, original: image.full, alt: t(image.title) });
  }
  return <section ref={root} className="character-gallery section-shell" aria-labelledby="character-gallery-title">
    <header className="character-gallery-heading"><p lang="en">VISUAL STORYTELLING</p><h2 id="character-gallery-title">{t("视觉叙事")}</h2><p>{t("锦衣卫 · 人物、设定与动态影像")}</p></header>
    <div className="character-gallery-tabs" role="tablist" aria-label={t("作品媒体类型")}>
      {tabs.map((tab, index) => <button type="button" key={tab.id} ref={element => { tabButtons.current[index] = element; }} role="tab" id={`character-tab-${tab.id}`} aria-controls={`character-panel-${tab.id}`} aria-selected={active === tab.id} tabIndex={active === tab.id ? 0 : -1} onClick={() => setActive(tab.id)} onKeyDown={event => navigateTabs(event, index)}>{t(tab.label)}<span>{String(tab.count).padStart(2, "0")}</span></button>)}
    </div>
    <div id="character-panel-images" role="tabpanel" aria-labelledby="character-tab-images" hidden={active !== "images"}>
      <div className="character-gallery-grid">{characterImages.map((image, index) => <article className="character-gallery-card" key={image.id}>
        <button type="button" className="character-gallery-image" onClick={() => preview(image)} aria-label={`${t("放大查看")} ${t(image.title)}`}>
          <Artwork src={image.src} original={image.full} alt={t(image.title)} eager={index < 3} /><span aria-hidden="true"><Expand size={20} strokeWidth={1.5} /></span>
        </button>
        <div className="character-gallery-caption"><span>{String(index + 1).padStart(2, "0")}</span><h3>{t(image.title)}</h3><small>{t(image.kind)}</small></div>
      </article>)}</div>
    </div>
    <div id="character-panel-videos" role="tabpanel" aria-labelledby="character-tab-videos" hidden={active !== "videos"}>
      {active === "videos" && <div className="character-gallery-videos">
        {characterVideos.map(video => <article key={video.id}><DetailVideo media={{ ...video, alt: t(video.alt) }} /><h3>{t(video.title)}</h3></article>)}
        <section className="character-web-showcase" aria-label={t(characterWebShowcase.title)}>
          <h3>{t(characterWebShowcase.title)}</h3>
          <button type="button" onClick={() => preview(characterWebShowcase)} aria-label={`${t("放大查看")} ${t(characterWebShowcase.title)}`}>
            <Artwork src={characterWebShowcase.full} original={characterWebShowcase.full} alt={t(characterWebShowcase.title)} width={characterWebShowcase.width} height={characterWebShowcase.height} />
          </button>
        </section>
      </div>}
    </div>
  </section>;
}
