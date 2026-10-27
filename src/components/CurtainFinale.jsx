import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useRef } from "react";
import { curtainScenes } from "../data/curtainScenes.js";
import { createScrollVideo } from "../media/createScrollVideo.js";

const base = curtainScenes.finaleBase;

export default function CurtainFinale({ onPanel }) {
  const { t, language } = useLocale();
  const root = useRef(null), film = useRef(null);
  useEffect(() => {
    const layer = root.current, video = film.current;
    const track = layer.closest(".video-scroll-track");
    let failed = false, decoded = false;
    const clamp = n => Math.max(0, Math.min(1, n));
    const controller = createScrollVideo(video);
    const sync = () => {
      const active = track.dataset.finaleActive === "true";
      if (track.dataset.effectsPaused === "true") return;
      const progress = active ? clamp(Number(track.dataset.finaleProgress || 0)) : 0;
      // This is a scroll timeline, not elapsed wall-clock time.
      const time = progress * 11;
      // Seeking may temporarily lower readyState; retain the decoded scene
      // instead of flashing the door background during rapid scrubbing.
      decoded ||= video.readyState >= 2;
      const ready = decoded || failed;
      const visibleTime = ready ? time : 0;
      video.pause();
      // Fit the supplied film to the existing scroll span, including reverse
      // scrolling, so a shorter replacement does not freeze before the end.
      controller.update(clamp((time - 1.8) / (11 - 1.8)), active || track.dataset.sceneNode === "rooms");
      layer.inert = !active;
      layer.setAttribute("aria-hidden", String(!active));
      layer.style.setProperty("--finale-black", visibleTime < .8 ? visibleTime / .8 : visibleTime < 1 ? 1 : Math.max(0, 1 - (visibleTime - 1) / .8));
      layer.dataset.stage = String(visibleTime >= .8);
      layer.dataset.fallback = String(failed);
      const smooth = value => { const n = clamp(value); return n * n * (3 - 2 * n); };
      const bridgeOpacity = ready && !failed ? smooth((time - 1.8) / .9) * (1 - smooth((time - 4.4) / 1.2)) : 0;
      layer.style.setProperty("--finale-bridge", bridgeOpacity);
      layer.querySelector(".curtain-finale-bridge").setAttribute("aria-hidden", String(bridgeOpacity < .01));
      const copyProgress = ready ? clamp((time - 9.8) / 1.2) : 0;
      layer.style.setProperty("--finale-copy", copyProgress);
      layer.dataset.complete = String(copyProgress > .01);
      const copy = layer.querySelector(".curtain-finale-copy");
      copy.inert = copyProgress < .95;
      copy.setAttribute("aria-hidden", String(copyProgress < .01));
    };
    const error = () => { failed = true; sync(); };
    const observer = new MutationObserver(sync);
    observer.observe(track, { attributes: true, attributeFilter: ["data-finale-active", "data-finale-progress", "data-scene-node", "data-effects-paused"] });
    video.addEventListener("error", error);
    video.addEventListener("loadeddata", sync);
    video.addEventListener("scroll-video-frame", sync);
    sync();
    return () => {
      observer.disconnect();
      video.removeEventListener("error", error);
      video.removeEventListener("loadeddata", sync);
      video.removeEventListener("scroll-video-frame", sync);
      controller.dispose();
    };
  }, []);
  return <div ref={root} className="curtain-finale" inert aria-hidden="true">
    <div className="curtain-finale-media">
      <video ref={film} data-stream-src={`${base}stream/stream.json`} poster={`${base}poster.webp`} preload="none" muted playsInline disablePictureInPicture aria-label={t("深红幕布缓缓合拢")} />
      <img className="curtain-finale-fallback" src={`${base}closed.webp`} alt={t("完全闭合的深红舞台幕布")} />
    </div>
    <div className="curtain-finale-black" />
    <div className="curtain-finale-bridge" aria-hidden="true" lang={language === "en" ? "en" : "zh-CN"}><p lang="en">THANK YOU FOR BEING HERE</p><h2><span><span className="finale-bridge-words">{t("谢谢你")}<span className="finale-bridge-punctuation">{language === "en" ? "" : "，"}</span></span></span><span><span className="finale-bridge-words">{t("走进我的想象")}<span className="finale-bridge-punctuation">{language === "en" ? "." : "。"}</span></span></span></h2></div>
    <div className="curtain-finale-copy" inert aria-hidden="true" lang={language === "en" ? "en" : "zh-CN"}>
      <p className="curtain-finale-name">{t("刘梓恩 ")}{language === "zh" && <span lang="en">/ LIU ZIEN</span>}</p>
      <h2>{t("这一幕，先到这里。")}<br />{t("下一幕，期待与你一起。")}</h2>
      <button onClick={() => onPanel("works")}>{t("查看全部作品")}<span aria-hidden="true">↗</span></button>
    </div>
  </div>;
}
