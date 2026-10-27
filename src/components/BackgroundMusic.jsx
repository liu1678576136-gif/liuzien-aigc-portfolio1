import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";

const tracks = [
  { title: "晚风漫游", subtitle: "EVENING WANDER", src: "/assets/audio/evening-breeze-v4-vocals.mp3" },
  { title: "霓虹余温", subtitle: "NEON AFTERGLOW", src: "/assets/audio/evening-breeze-v3-comparison.mp3" },
];

export default function BackgroundMusic() {
  const { t } = useLocale();
  const audio = useRef(null), panel = useRef(null), trigger = useRef(null);
  const request = useRef(0), volumeRef = useRef(20), adjustVolume = useRef(null);
  const stopAutomaticStart = useRef(null);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(20);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const music = audio.current;
    music.src = tracks[0].src;
    const adjust = () => {
      const audibleVideo = [...document.querySelectorAll("video")].some(video => !video.paused && !video.muted && video.volume > 0);
      const gain = volumeRef.current / 100 * (audibleVideo ? .24 : 1);
      if (music.volume !== gain) music.volume = gain;
    };
    adjustVolume.current = adjust;
    adjust();
    for (const event of ["play", "pause", "ended", "volumechange"]) document.addEventListener(event, adjust, true);
    return () => {
      for (const event of ["play", "pause", "ended", "volumechange"]) document.removeEventListener(event, adjust, true);
      request.current++;
      adjustVolume.current = null;
      music.pause();
    };
  }, []);
  useEffect(() => {
    volumeRef.current = volume;
    adjustVolume.current?.();
  }, [volume]);

  useEffect(() => {
    const music = audio.current;
    let attempting = false;
    const options = { capture: true, passive: true };
    const start = event => {
      if (!event.isTrusted || attempting || !music.paused) return;
      // Playback controls handle their own action so a first click cannot
      // start the music and immediately toggle it back off.
      if (event.target instanceof Element && event.target.closest(".music-playback-controls, .music-track-list")) return;
      attempting = true;
      play({ automatic: true }).finally(() => { attempting = false; });
    };
    const stop = () => {
      for (const event of ["pointerdown", "click", "wheel"]) window.removeEventListener(event, start, options);
      music.removeEventListener("play", stop);
    };
    stopAutomaticStart.current = stop;
    for (const event of ["pointerdown", "click", "wheel"]) window.addEventListener(event, start, options);
    music.addEventListener("play", stop);
    return () => { stop(); stopAutomaticStart.current = null; };
  }, []);

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

  async function play({ automatic = false } = {}) {
    if (!automatic) stopAutomaticStart.current?.();
    const operation = ++request.current;
    setPending(true); setFailed(false);
    try { await audio.current.play(); }
    catch (error) {
      // A wheel gesture is not playback authorization in every browser.
      // Keep listening for a click instead of showing a broken-audio error.
      if (operation === request.current && error.name !== "AbortError" && !(automatic && error.name === "NotAllowedError")) setFailed(true);
    }
    finally { if (operation === request.current) setPending(false); }
  }
  function pause() {
    stopAutomaticStart.current?.();
    request.current++;
    audio.current.pause();
    setPending(false);
  }
  function togglePlayback() {
    if (pending || !audio.current.paused) pause(); else play();
  }
  function select(index, start = true) {
    pause();
    setCurrent(index); setFailed(false);
    if (audio.current.getAttribute("src") !== tracks[index].src) {
      audio.current.src = tracks[index].src;
      audio.current.load();
    } else audio.current.currentTime = 0;
    if (start) play();
  }
  function skip(direction) {
    select((current + direction + tracks.length) % tracks.length, pending || !audio.current.paused);
  }
  return <div className="cinema-music">
    <audio ref={audio} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => select((current + 1) % tracks.length)} onError={() => { request.current++; setPending(false); setPlaying(false); setFailed(true); }} />
    <button ref={trigger} className="cinema-music-toggle cinema-round-control" popoverTarget="site-music" aria-expanded={open} aria-label={t("声音设置")}>
      <Music2 size={18} strokeWidth={1.4} /><span>{t("声音")}</span>
    </button>
    <div ref={panel} id="site-music" className="cinema-music-panel" popover="auto" aria-label={t("声音设置")}>
      <div className="music-panel-heading"><span>{t("声音")}</span><h2>{t(tracks[current].title)}</h2></div>
      <div className="music-playback-controls">
        <button className="music-play-button" onClick={togglePlayback} aria-label={t(playing || pending ? "暂停背景音乐" : "播放背景音乐")}>
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
