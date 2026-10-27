import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useRef } from "react";

import SceneSurroundDim from "./SceneSurroundDim.jsx";

export default function SceneNodeControls({ onBrowse, onCharacters, surroundDim = false }) {
  const { t, language } = useLocale();
  const screenVideo = useRef(null);
  useEffect(() => {
    const video = screenVideo.current;
    const track = video.closest(".video-scroll-track");
    let wasInStudio = false, warmed = false;
    const syncPlayback = () => {
      const inStudio = track.dataset.sceneNode === "studio";
      if (!warmed && (track.dataset.screenApproaching === "true" || inStudio)) {
        warmed = true;
        video.preload = "auto";
        video.load();
      }
      if (inStudio && !wasInStudio) {
        track.dataset.screenState = "preparing";
        video.currentTime = 0;
      }
      if (!inStudio) track.dataset.screenState = "preparing";
      wasInStudio = inStudio;
      const visible = inStudio && track.dataset.effectsPaused !== "true" && !document.hidden;
      if (visible) {
        video.muted = true;
        if (video.paused) video.play().catch(() => { /* Keep the poster when autoplay is unavailable. */ });
      } else video.pause();
    };
    const revealPlayback = () => {
      if (track.dataset.sceneNode === "studio" && track.dataset.effectsPaused !== "true" && !document.hidden) track.dataset.screenState = "playing";
    };
    const observer = new MutationObserver(syncPlayback);
    observer.observe(track, { attributes: true, attributeFilter: ["data-scene-node", "data-effects-paused", "data-screen-approaching"] });
    document.addEventListener("visibilitychange", syncPlayback);
    video.addEventListener("canplay", syncPlayback);
    video.addEventListener("playing", revealPlayback);
    syncPlayback();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      video.removeEventListener("canplay", syncPlayback);
      video.removeEventListener("playing", revealPlayback);
      video.pause();
    };
  }, []);
  return <>
    <div className="video-monitor-scene-plane">
    <div className="video-monitor-prelude" aria-hidden="true" lang={language === "en" ? "en" : "zh-CN"}>
      <div className="video-screen-prelude-page">
        <span className="video-screen-brand" lang="en">LIU ZIEN / VISUAL ARCHIVE</span>
        <div className="video-screen-prelude-title"><span lang="en">THE NEXT SCENE</span><strong>{t("即将放映")}</strong></div>
        <div className="video-screen-prelude-footer"><span className="video-screen-progress-track"><i /></span><span className="video-screen-progress-label"><span lang="en">SCROLL TO REVEAL</span><output className="video-screen-progress">0%</output></span></div>
      </div>
    </div>
    </div>
    <div className="video-scene-node video-studio-node" inert aria-hidden="true" lang={language === "en" ? "en" : "zh-CN"}>
      <div className="video-monitor-scene-plane">
        {surroundDim && <SceneSurroundDim className="scene-monitor-dim" width={514} height={280} points="0,0 L514,0 L514,280 L0,280" />}
        <button className="video-monitor-hotspot" onClick={onCharacters} aria-label={t("点击电脑屏幕，浏览人物图片和视频")}>
          <video ref={screenVideo} className="video-monitor-film" src="/assets/scene/studio-screen-loop.mp4?v=20261026-2" poster="/assets/scene/studio-screen-poster.webp?v=20261026-2" muted loop playsInline preload="none" disablePictureInPicture tabIndex={-1} aria-hidden="true" />
        </button>
      </div>
      <div className="video-studio-invitation">
        <p id="studio-invitation-copy">{t("镜头背后，一起写下的故事。")}</p>
        <div><button className="video-scene-cta video-scene-cta-compact video-studio-cta" onClick={onCharacters} aria-describedby="studio-invitation-copy"><span>{t("点开屏幕，走进故事")}</span><span className="video-scene-arrow" aria-hidden="true">↗</span></button></div>
      </div>
      <div className="video-node-continue" aria-hidden="true">{t("继续向下滚动")}<span>↓</span></div>
    </div>
    <div className="video-scene-node video-rooms-node" inert aria-hidden="true" lang={language === "en" ? "en" : "zh-CN"}>
      <div className="video-scene-node-plane">
        {surroundDim && <><SceneSurroundDim className="scene-surround-dim-ip" points="362,79 L596,79 L596,416 L362,416" /><SceneSurroundDim className="scene-surround-dim-motion" points="714,79 L952,79 L952,416 L714,416" /></>}
        <button className="video-door-hotspot video-door-ip" onClick={() => onBrowse("other")} aria-label={t("进入LZE工作台")}><span><small lang="en">LZE WORKBENCH</small><strong>{t("LZE工作台")}<span aria-hidden="true">↗</span></strong></span></button>
        <button className="video-door-hotspot video-door-motion" onClick={() => onBrowse("motion")} aria-label={t("进入右侧放映室，浏览影像作品")}><span><small lang="en">SCREENING ROOM</small><strong>{t("影像放映 ")}<span aria-hidden="true">↗</span></strong></span></button>
      </div>
      <div className="video-rooms-copy">
        <h2 id="rooms-title"><span>{t("让想象有形，")}</span><span>{t("让故事发生。")}</span></h2>
        <p>{t("选择一扇门，走进我的创意世界。")}</p>
        <div className="video-rooms-actions" role="group" aria-labelledby="rooms-title">
          <button className="video-scene-cta video-room-cta video-room-cta-ip" onClick={() => onBrowse("other")}><span>{t("进入LZE工作台")}</span><span className="video-scene-arrow" aria-hidden="true">↗</span></button>
          <button className="video-scene-cta video-room-cta video-room-cta-motion" onClick={() => onBrowse("motion")}><span>{t("进入影像放映室")}</span><span className="video-scene-arrow" aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div className="video-node-continue" aria-hidden="true">{t("继续向下滚动")}<span>↓</span></div>
    </div>
  </>;
}
