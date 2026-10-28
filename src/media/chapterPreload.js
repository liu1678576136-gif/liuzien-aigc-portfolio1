const EPSILON = 1e-6;
export const chapterCacheBytes = 96 * 1024 * 1024;

// Plan downloaded bytes independently of the small MSE decoding window.
export function chapterPreloadPlan(segments, chapters, time, direction = 1, maxBytes = chapterCacheBytes) {
  const duration = segments.at(-1)?.end || 0;
  const found = chapters.findIndex(chapter => time < (chapter.end ?? duration) - EPSILON);
  const current = found < 0 ? chapters.length - 1 : found;
  const next = current + (direction < 0 ? -1 : 1);
  const indexes = chapter => chapter ? segments.flatMap((part, i) => part.end > chapter.start + EPSILON && part.start < (chapter.end ?? duration) - EPSILON ? [i] : []) : [];
  const currentIndexes = indexes(chapters[current]);
  const nextIndexes = indexes(chapters[next]);
  let focus = segments.findIndex(part => time < part.end - EPSILON);
  if (focus < 0) focus = segments.length - 1;
  const urgent = [focus, focus + 1, focus - 1].filter(i => i >= 0 && i < segments.length);
  const forward = direction >= 0;
  const remaining = currentIndexes.filter(i => forward ? i >= focus : i <= focus);
  const passed = currentIndexes.filter(i => forward ? i < focus : i > focus);
  const ordered = [...(forward ? remaining : remaining.reverse()), ...(forward ? nextIndexes : [...nextIndexes].reverse()), ...(forward ? passed.reverse() : passed)];
  const retained = new Set(urgent);
  const size = index => segments[index].bytes ?? 1024 * 1024;
  let bytes = urgent.reduce((sum, i) => sum + size(i), 0);
  for (const i of ordered) if (!retained.has(i) && bytes + size(i) <= maxBytes) { retained.add(i); bytes += size(i); }
  return { current: chapters[current]?.id || "", next: chapters[next]?.id || "", currentIndexes, nextIndexes, urgent, retained, background: ordered.filter(i => retained.has(i) && !urgent.includes(i)) };
}

// One speculative transfer across players; visible-frame work can preempt it.
export function createVideoDownloadCoordinator() {
  const urgent = new Set(), listeners = new Set();
  let background = null, queued = false;
  const wake = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (urgent.size) return;
      for (const listener of [...listeners]) listener();
    });
  };
  return {
    setUrgent(owner, busy) {
      if (urgent.has(owner) === busy) return;
      if (busy) { urgent.add(owner); background?.cancel(); }
      else { urgent.delete(owner); wake(); }
    },
    claim(cancel) {
      if (urgent.size || background) return null;
      const token = { cancel }; background = token; return token;
    },
    release(token) { if (token && token === background) { background = null; wake(); } },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
export const videoDownloads = createVideoDownloadCoordinator();
