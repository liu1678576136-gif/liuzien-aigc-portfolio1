import { createFragmentedVideo } from "./createFragmentedVideo.js";
// Decode filmed scenes at video resolution instead of downsampling through canvas.
export function createScrollVideo(video, { fps = 25, timeAtProgress = (progress, duration) => progress * duration, onFrame = () => {} } = {}) {
  if (video.dataset.streamSrc) return createFragmentedVideo(video, { fps, timeAtProgress, onFrame });
  let wanted = 0, enabled = false, disposed = false;
  let warmed = video.preload !== "none";
  const seek = () => {
    if (disposed || !enabled) return;
    if (wanted === 0 && video.currentTime > 1 / fps) video.classList.remove("has-frame");
    if (video.seeking || !video.readyState || !Number.isFinite(video.duration)) return;
    const target = Math.max(0, Math.min(timeAtProgress(wanted, video.duration), Math.max(0, video.duration - 1 / fps)));
    if (Math.abs(video.currentTime - target) > 1 / 100) video.currentTime = target;
    else if (video.readyState >= 2) { video.classList.add("has-frame"); onFrame(video); }
  };
  const decoded = () => {
    if (disposed) return;
    if (video.readyState >= 2) { video.classList.add("has-frame"); onFrame(video); }
    seek();
  };
  const failed = () => video.classList.remove("has-frame");
  video.pause();
  video.addEventListener("loadedmetadata", seek);
  video.addEventListener("loadeddata", decoded);
  video.addEventListener("seeked", decoded);
  video.addEventListener("error", failed);
  return {
    update(progress, shouldLoad) {
      wanted = Math.max(0, Math.min(1, progress));
      enabled = shouldLoad;
      video.dataset.progress = wanted;
      if (enabled && !warmed) { warmed = true; video.preload = "auto"; video.load(); }
      seek();
    },
    resize() { if (!disposed && video.readyState >= 2 && !video.seeking) onFrame(video); },
    dispose() {
      disposed = true;
      video.removeEventListener("loadedmetadata", seek);
      video.removeEventListener("loadeddata", decoded);
      video.removeEventListener("seeked", decoded);
      video.removeEventListener("error", failed);
      video.pause();
    },
  };
}
