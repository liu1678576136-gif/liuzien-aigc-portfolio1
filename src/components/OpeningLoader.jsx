import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useState } from "react";
import { curtainScenes } from "../data/curtainScenes.js";
import "../opening-loader.css";

export default function OpeningLoader({ onComplete }) {
  const { t, language } = useLocale();
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    let disposed = false, exitTimer, firstVideo, firstFrameReady;
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
    const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const videoReady = new Promise(resolve => {
      firstVideo = document.querySelector("video[data-opening-video='true']");
      if (!motion || !firstVideo || firstVideo.dataset.firstFrame === "true" || firstVideo.readyState >= 2) { resolve(); return; }
      firstFrameReady = () => resolve();
      firstVideo.addEventListener("scroll-video-frame", firstFrameReady, { once: true });
    });
    const prepared = Promise.all([preload(), document.fonts.ready, videoReady]);
    Promise.all([minimum, Promise.race([prepared, maximum])]).then(() => {
      if (disposed) return;
      clearTimeout(maximumTimer);
      setLeaving(true);
      exitTimer = setTimeout(onComplete, 600);
    });
    return () => {
      disposed = true;
      clearTimeout(minimumTimer); clearTimeout(maximumTimer); clearTimeout(exitTimer);
      firstVideo?.removeEventListener("scroll-video-frame", firstFrameReady);
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
