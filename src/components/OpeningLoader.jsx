import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useState } from "react";
import { curtainScenes } from "../data/curtainScenes.js";
import "../opening-loader.css";

export default function OpeningLoader({ onComplete }) {
  const { t, language } = useLocale();
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    let disposed = false, exitTimer;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const preventScroll = event => event.preventDefault();
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    const assets = [curtainScenes.openingVideoBase + "poster.webp"];
    let next = 0;
    const preload = async () => {
      while (!disposed && next < assets.length) {
        const src = assets[next++];
        const image = new Image();
        image.src = src;
        try { await image.decode(); } catch { /* The scene retains its poster fallback. */ }
      }
    };
    let minimumTimer, maximumTimer;
    const minimum = new Promise(resolve => { minimumTimer = setTimeout(resolve, 1800); });
    const maximum = new Promise(resolve => { maximumTimer = setTimeout(resolve, 8000); });
    const prepared = Promise.all([Promise.all(Array.from({ length: 4 }, preload)), document.fonts.ready]);
    Promise.all([minimum, Promise.race([prepared, maximum])]).then(() => {
      if (disposed) return;
      clearTimeout(maximumTimer);
      setLeaving(true);
      exitTimer = setTimeout(onComplete, 600);
    });
    return () => {
      disposed = true;
      clearTimeout(minimumTimer); clearTimeout(maximumTimer); clearTimeout(exitTimer);
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [onComplete]);
  return <div className={`opening-loader${leaving ? " is-leaving" : ""}`} role="status" aria-live="polite" aria-label={t("正在准备开场画面")} lang={language === "en" ? "en" : "zh-CN"}>
    <div className="opening-loader-content">
      <span className="lz-monogram opening-loader-mark" aria-hidden="true">LZ<span>·</span></span>
      <p>{t("灯光亮起，")}<span>{t("我们的故事就要开始。")}</span></p>
      <div className="opening-loader-bars" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ "--bar-index": i }} />)}</div>
    </div>
  </div>;
}
