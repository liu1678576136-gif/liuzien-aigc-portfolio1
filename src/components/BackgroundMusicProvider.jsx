import { createContext, useContext, useEffect, useId, useRef, useState } from "react";

export const musicTracks = [
  { title: "晚风漫游", subtitle: "EVENING WANDER", src: "/assets/audio/evening-breeze-v4-vocals.mp3" },
  { title: "霓虹余温", subtitle: "NEON AFTERGLOW", src: "/assets/audio/evening-breeze-v3-comparison.mp3" },
];
const MusicContext = createContext(null);
export const useBackgroundMusic = () => useContext(MusicContext);

// The transport lives above the router. Page headers only mount its controls.
export function BackgroundMusicProvider({ children }) {
  const audio = useRef(null), playerId = useId();
  const request = useRef(0), volumeRef = useRef(20), adjustVolume = useRef(null);
  const stopAutomaticStart = useRef(null);
  const [current, setCurrent] = useState(0), [volume, setVolume] = useState(20);
  const [playing, setPlaying] = useState(false), [pending, setPending] = useState(false), [failed, setFailed] = useState(false);

  useEffect(() => {
    const music = audio.current;
    music.src = musicTracks[0].src;
    const adjust = () => {
      const audibleVideo = [...document.querySelectorAll("video")].some(video => !video.paused && !video.muted && video.volume > 0);
      const gain = volumeRef.current / 100 * (audibleVideo ? .24 : 1);
      if (music.volume !== gain) music.volume = gain;
    };
    adjustVolume.current = adjust; adjust();
    const events = ["play", "pause", "ended", "volumechange"];
    for (const event of events) document.addEventListener(event, adjust, true);
    // Removing a playing project video does not always emit a bubbling pause.
    const observer = new MutationObserver(records => {
      const hasVideo = node => node.nodeType === 1 && (node.nodeName === "VIDEO" || node.querySelector("video"));
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(hasVideo))) adjust();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      for (const event of events) document.removeEventListener(event, adjust, true);
      request.current++; adjustVolume.current = null; music.pause();
    };
  }, []);
  useEffect(() => { volumeRef.current = volume; adjustVolume.current?.(); }, [volume]);

  useEffect(() => {
    const music = audio.current;
    let attempting = false;
    const options = { capture: true, passive: true };
    const start = event => {
      if (!event.isTrusted || attempting || !music.paused) return;
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

  async function play({ automatic = false } = {}) {
    if (!automatic) stopAutomaticStart.current?.();
    const operation = ++request.current;
    setPending(true); setFailed(false);
    try { await audio.current.play(); }
    catch (error) {
      if (operation === request.current && error.name !== "AbortError" && !(automatic && error.name === "NotAllowedError")) setFailed(true);
    } finally { if (operation === request.current) setPending(false); }
  }
  function pause() {
    stopAutomaticStart.current?.(); request.current++;
    audio.current.pause(); setPending(false);
  }
  function togglePlayback() { if (pending || !audio.current.paused) pause(); else play(); }
  function select(index, start = true) {
    pause(); setCurrent(index); setFailed(false);
    if (audio.current.getAttribute("src") !== musicTracks[index].src) { audio.current.src = musicTracks[index].src; audio.current.load(); }
    else audio.current.currentTime = 0;
    if (start) play();
  }
  function skip(direction) { select((current + direction + musicTracks.length) % musicTracks.length, pending || !audio.current.paused); }
  const value = { playerId, current, volume, setVolume, playing, pending, failed, togglePlayback, select, skip };
  return <MusicContext.Provider value={value}>
    <audio ref={audio} id={playerId} data-background-music preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => select((current + 1) % musicTracks.length)} onError={() => { request.current++; setPending(false); setPlaying(false); setFailed(true); }} />
    {children}
  </MusicContext.Provider>;
}
