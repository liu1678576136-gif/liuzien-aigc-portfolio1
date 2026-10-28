import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";

import { musicTracks as tracks, useBackgroundMusic } from "./BackgroundMusicProvider.jsx";

export default function BackgroundMusic() {
  const { t } = useLocale();
  const { playerId, current, volume, setVolume, playing, pending, failed, togglePlayback, select, skip } = useBackgroundMusic();
  const panel = useRef(null), trigger = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const element = panel.current;
    const position = () => {
      const box = trigger.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const width = Math.min(294, viewportWidth - 36);
      element.style.top = `${box.bottom + 12}px`;
      element.style.right = `${Math.max(18, Math.min(viewportWidth - box.right, viewportWidth - width - 18))}px`;
    };
    const beforeToggle = event => { if (event.newState === "open") position(); };
    const toggle = event => setOpen(event.newState === "open");
    const resize = () => { if (element.matches(":popover-open")) position(); };
    element.addEventListener("beforetoggle", beforeToggle);
    element.addEventListener("toggle", toggle);
    window.addEventListener("resize", resize);
    const observer = new ResizeObserver(resize);
    observer.observe(trigger.current);
    observer.observe(trigger.current.closest("nav"));
    return () => {
      observer.disconnect();
      element.removeEventListener("beforetoggle", beforeToggle);
      element.removeEventListener("toggle", toggle);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <div className="cinema-music">
    <button ref={trigger} className="cinema-music-toggle cinema-round-control" popoverTarget="site-music" aria-expanded={open} aria-label={t("声音设置")}>
      <Music2 size={18} strokeWidth={1.4} /><span>{t("声音")}</span>
    </button>
    <div ref={panel} id="site-music" className="cinema-music-panel" popover="auto" aria-label={t("声音设置")}>
      <div className="music-panel-heading"><span>{t("声音")}</span><h2>{t(tracks[current].title)}</h2></div>
      <div className="music-playback-controls">
        <button className="music-play-button" aria-controls={playerId} onClick={togglePlayback} aria-label={t(playing || pending ? "暂停背景音乐" : "播放背景音乐")}>
          {playing || pending ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}<span>{t(pending ? "加载中" : failed ? "重试" : playing ? "暂停" : "播放")}</span>
        </button>
        <button className="music-skip-button" onClick={() => skip(-1)} aria-label={t("上一首")}><ArrowLeft size={15} /></button>
        <button className="music-skip-button" onClick={() => skip(1)} aria-label={t("下一首")}><ArrowRight size={15} /></button>
      </div>
      <label className="music-volume"><span>{volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}{t("音量")}</span><input type="range" min="0" max="100" step="1" value={volume} onChange={event => setVolume(Number(event.target.value))} style={{ "--music-volume": `${volume}%` }} aria-label={t("音量")} /><output>{volume}</output></label>
      <div className="music-track-list" role="group" aria-label={t("背景音乐播放列表")}>
        {tracks.map((track, index) => <button className="music-track" key={track.src} onClick={() => index === current ? togglePlayback() : select(index)} aria-pressed={current === index} aria-label={`${t("播放")} ${t(track.title)}`}>
          <span className="music-track-number">{String(index + 1).padStart(2, "0")}</span><span className="music-track-title"><strong>{t(track.title)}</strong><small lang="en">{track.subtitle}</small></span>
          {index === current && playing ? <span className="music-playing-bars" aria-hidden="true"><i /><i /><i /></span> : <span className="music-track-dot" aria-hidden="true" />}
        </button>)}
      </div>
      <p className="music-feedback" role="status">{t(failed ? "音乐暂时无法播放，请点击重试。" : "")}</p>
    </div>
  </div>;
}
