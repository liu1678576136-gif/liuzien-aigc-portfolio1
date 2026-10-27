import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useId, useRef, useState } from "react";

const chapters = [
  { id: "opening", scene: "curtain", label: "幕布开场" },
  { id: "gallery", scene: "gallery", label: "海报展廊" },
  { id: "desk", scene: "desk", label: "创作工作台" },
  { id: "computer", scene: "computer", label: "影像工作站" },
  { id: "rooms", scene: "rooms", label: "创意空间" },
  { id: "contact", scene: "finale", label: "红幕谢幕" },
];
const number = index => String(index + 1).padStart(2, "0");

export default function ChapterNavigation({ joined, onNavigate }) {
  const { t, language } = useLocale();
  const items = joined ? chapters : chapters.slice(0, 4);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const navigation = useRef(null), panel = useRef(null), trigger = useRef(null);
  const panelId = useId();

  useEffect(() => {
    const track = navigation.current.closest(".video-scroll-track");
    const update = () => {
      const index = items.findIndex(item => item.scene === track.dataset.chapter);
      if (index >= 0) setCurrent(index);
    };
    const observer = new MutationObserver(update);
    observer.observe(track, { attributes: true, attributeFilter: ["data-chapter"] });
    update();
    return () => observer.disconnect();
  }, [joined]);

  useEffect(() => {
    const element = panel.current;
    const toggle = event => {
      const expanded = event.newState === "open";
      setOpen(expanded);
      if (expanded) element.querySelector('[aria-current="step"]')?.focus({ preventScroll: true });
    };
    element.addEventListener("toggle", toggle);
    return () => element.removeEventListener("toggle", toggle);
  }, []);

  const select = id => {
    panel.current.hidePopover();
    trigger.current.focus({ preventScroll: true });
    onNavigate(id);
  };

  return <nav ref={navigation} className="video-chapter-nav" aria-label={t("视频章节")}>
    <button ref={trigger} className="video-chapter-toggle" popoverTarget={panelId} aria-controls={panelId} aria-expanded={open} aria-label={language === "en" ? `${open ? "Collapse" : "Expand"} scene navigation, current ${number(current)} / ${String(items.length).padStart(2, "0")} · ${t(items[current].label)}` : `${open ? "收起" : "展开"}视频章节，当前 ${number(current)} / ${String(items.length).padStart(2, "0")} · ${items[current].label}`}>
      <span className="video-chapter-count">{number(current)} <span>/ {String(items.length).padStart(2, "0")}</span></span>
      <span className="video-chapter-separator" aria-hidden="true">·</span>
      <span>{t(items[current].label)}</span>
      <svg className="video-chapter-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="m3.5 8.5 3.5-3.5 3.5 3.5" stroke="currentColor" strokeWidth="1.2" /></svg>
    </button>
    <div ref={panel} id={panelId} className="video-chapter-popover" popover="auto" aria-label={t("选择章节")}>
      <p>{t("章节导航 ")}<span>{String(items.length).padStart(2, "0")} SCENES</span></p>
      {items.map((item, index) => <button key={item.id} className="video-chapter-item" aria-current={index === current ? "step" : undefined} onClick={() => select(item.id)}><span>{number(index)}</span><span>{t(item.label)}</span></button>)}
    </div>
  </nav>;
}
