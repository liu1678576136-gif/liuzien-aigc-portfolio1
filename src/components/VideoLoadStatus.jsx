import { useEffect, useRef, useState } from "react";
import { useLocale } from "../LocaleContext.jsx";

export default function VideoLoadStatus() {
  const marker = useRef(null);
  const [status, setStatus] = useState("");
  const { language } = useLocale();
  useEffect(() => {
    const root = marker.current.closest(".video-scroll-track");
    const sync = () => {
      const videos = [...root.querySelectorAll("video[data-stream-enabled='true']")];
      setStatus(videos.some(v => v.dataset.streamError === "true") ? "error" : videos.some(v => v.dataset.buffering === "true") ? "loading" : "");
    };
    const reload = () => window.location.reload();
    root.addEventListener("video-buffering", sync);
    root.addEventListener("video-reload-required", reload);
    sync();
    return () => { root.removeEventListener("video-buffering", sync); root.removeEventListener("video-reload-required", reload); };
  }, []);
  const retry = () => marker.current.closest(".video-scroll-track").querySelectorAll("video[data-stream-error='true']").forEach(video => video.dispatchEvent(new Event("stream-retry")));
  const en = language === "en";
  return <div ref={marker} className="video-load-status" data-visible={Boolean(status)} role="status" aria-live="polite">
    {status === "error" ? <>{en ? "This scene could not load." : "当前画面载入失败。"}<button onClick={retry}>{en ? "Try again" : "重试"}</button></> : status === "loading" ? (en ? "Loading this scene…" : "正在载入当前画面…") : ""}
  </div>;
}
