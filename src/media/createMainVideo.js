import { createScrollVideo } from "./createScrollVideo.js";
import { mainVideo, mainVideoTime, mainSourceFrame, mainScreenCorners } from "../data/mainVideo.js";
import { screenPresentation, screenProjection } from "../data/screenPresentation.js";

export function createMainVideo(video) {
  const track = video.closest(".video-scroll-track");
  return createScrollVideo(video, {
    fps: mainVideo.fps,
    timeAtProgress: mainVideoTime,
    onFrame(media) {
      // Project onto the decoded frame, including reverse seeks and viewport changes.
      const frame = mainSourceFrame(media.currentTime);
      const corners = mainScreenCorners(media.currentTime);
      const presentation = screenPresentation(frame);
      media.dataset.frame = frame.toFixed(3);
      if (corners) {
        const scale = Math.max(media.clientWidth / 1280, media.clientHeight / 740);
        const points = corners.map(([x, y]) => [x * scale + (media.clientWidth - 1280 * scale) / 2, y * scale + (media.clientHeight - 740 * scale) / 2]);
        const matrix = screenProjection(points);
        if (matrix) track.style.setProperty("--screen-projection", `matrix3d(${matrix.join(",")})`);
        track.style.setProperty("--studio-screen-bottom", `${Math.max(points[2][1], points[3][1])}px`);
      }
      track.style.setProperty("--screen-prelude-opacity", corners ? presentation.opacity : 0);
      track.style.setProperty("--screen-load-progress", presentation.progress);
      track.dataset.screenApproaching = String(Boolean(corners && presentation.opacity > .001));
      const percent = track.querySelector(".video-screen-progress");
      if (percent) percent.textContent = `${Math.round(presentation.progress * 100)}%`;
    },
  });
}
