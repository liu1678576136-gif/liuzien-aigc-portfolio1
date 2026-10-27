export function mergeSequenceFrames(manifest, details = []) {
  const last = manifest.frames.length - 1;
  let frames = manifest.frames.map((frame, index) => ({ ...frame, progress: index / Math.max(1, last), sourceFrame: index }));
  for (const detail of details.filter(Boolean)) {
    const start = detail.startFrame / last, end = detail.endFrame / last;
    frames = frames.filter(frame => frame.progress < start || frame.progress > end);
    const count = detail.manifest.frames.length;
    frames.push(...detail.manifest.frames.map((frame, index) => {
      const sourceFrame = detail.startFrame + (detail.endFrame - detail.startFrame) * index / Math.max(1, count - 1);
      return { ...frame, src: detail.base + frame.src, progress: sourceFrame / last, sourceFrame };
    }));
  }
  return frames.sort((a, b) => a.progress - b.progress);
}

// Local increases in frame density must not shift approved still-shot cues.
export function nearestSequenceFrame(frames, progress) {
  if (!frames.length) return 0;
  let low = 0, high = frames.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (frames[middle].progress < progress) low = middle + 1;
    else high = middle;
  }
  return low > 0 && progress - frames[low - 1].progress < frames[low].progress - progress ? low - 1 : low;
}
