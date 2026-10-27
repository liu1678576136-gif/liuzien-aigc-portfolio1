import { useLocale } from "../LocaleContext.jsx";
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

export function Artwork(props) {
  // Remount only when the source changes. A mount effect resetting error state
  // can overwrite an immediate cached/network failure before fallback renders.
  return <ArtworkImage key={props.src} {...props} />;
}

function ArtworkImage({ src, original, alt, className = "", eager = false, ...props }) {
  const { t, language } = useLocale();
  const [failed, setFailed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  if (failed) return <span className={`media-unavailable ${className}`} role="img" aria-label={alt} {...props}><ImageOff size={24} /><span>{alt}</span><small>{t("图片暂不可用")}</small></span>;
  return <img {...props} className={className} src={useOriginal ? original : src} alt={alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async" onError={() => { if (original && !useOriginal) setUseOriginal(true); else setFailed(true); }} />;
}

export function FilmPreview({ media, enabled }) {
  const { t, language } = useLocale();
  const video = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = video.current;
    let current = true;
    if (enabled && !failed) {
      element.muted = true;
      element.play().catch(() => { if (current) setReady(false); });
    } else {
      element.pause();
      setReady(false);
    }
    return () => { current = false; element.pause(); };
  }, [enabled, failed]);
  return <div className="film-preview">
    <Artwork src={media.poster} original={media.posterOriginal} alt={media.alt} eager />
    <video ref={video} src={enabled && !failed ? media.preview : undefined} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} className={ready && enabled ? "is-playing" : ""} onPlaying={() => setReady(true)} onError={() => { setReady(false); setFailed(true); }} />
    {failed && <span className="preview-note">{t("静帧预览 · 点击查看完整作品")}</span>}
  </div>;
}

export function DetailVideo({ media }) {
  const { t, language } = useLocale();
  const [failed, setFailed] = useState(false);
  return <div className="detail-video-wrap">
    {failed ? <><Artwork src={media.poster} original={media.posterOriginal} alt={media.alt} /><p>{t("视频暂时无法播放。")}<a href={media.src} target="_blank" rel="noreferrer">{t("打开原视频 ↗")}</a></p></> : <video controls playsInline preload="metadata" poster={media.poster} src={media.src} onError={() => setFailed(true)} aria-label={media.alt} />}
  </div>;
}
