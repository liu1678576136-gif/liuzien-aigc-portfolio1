const originalScreens = 11;
const baseScreens = 20;
export const holdWheelSteps = 12;
// Match the user's studio reference at frame 391 of the joined sequence.
export const studioNodeProgress = 1.44 + (391 - 265) / (479 - 265) * (1.79 - 1.44);
export const roomNodeProgress = 1.79;
// The user's 72% marker in the approved 28.5-screen cut, before this retiming.
// The earlier poster and book holds add 3.5 screens ahead of this shot.
export const studioApproachStart = (.72 * 28.5 - 3.5) / originalScreens;

// Effect cues stay attached to the approved original cut.
export function originalScrollFraction(progress) {
  return progress * originalScreens / baseScreens;
}

export function createVideoTimeline(joined = true) {
  const viewingHolds = [
    { id: "poster", start: .79, end: .89, extraScreens: 1.5 },
    { id: "book", start: 1.33, end: 1.44, extraScreens: 2 },
    ...(joined ? [
      { id: "studio", start: studioNodeProgress, end: studioNodeProgress, extraScreens: 2.5 },
      { id: "rooms", start: roomNodeProgress, end: baseScreens / originalScreens, extraScreens: 2.5 },
    ] : []),
  ];
  const motionStretches = joined ? [{
    id: "studio-approach", start: studioApproachStart, end: studioNodeProgress,
    wheelSteps: 24,
    extraScreens: (studioNodeProgress - studioApproachStart) * originalScreens,
  }] : [];
  // Moving shots gain scroll distance without becoming a stopped-frame hold.
  const segments = [...viewingHolds, ...motionStretches].sort((a, b) => a.start - b.start);
  const totalScreens = baseScreens + segments.reduce((sum, segment) => sum + segment.extraScreens, 0);

  function holdBounds(hold) {
    const added = segments.slice(0, segments.indexOf(hold)).reduce((sum, previous) => sum + previous.extraScreens, 0);
    return { start: hold.start * originalScreens + added, end: hold.end * originalScreens + added + hold.extraScreens };
  }

  function storyProgress(overall) {
    const distance = Math.max(0, Math.min(1, overall)) * totalScreens;
    let added = 0;
    for (const hold of segments) {
      const start = hold.start * originalScreens + added;
      const end = hold.end * originalScreens + added + hold.extraScreens;
      if (distance < start) return (distance - added) / originalScreens;
      if (distance <= end) return hold.start + (distance - start) / (end - start) * (hold.end - hold.start);
      added += hold.extraScreens;
    }
    return (distance - added) / originalScreens;
  }

  // At a point hold, chapter links land at its beginning. Its entire added
  // distance maps to the same filmed frame, in either scrolling direction.
  function scrollFraction(progress) {
    const added = segments.reduce((sum, hold) => {
      const amount = hold.start === hold.end ? (progress > hold.start ? 1 : 0)
        : Math.max(0, Math.min(1, (progress - hold.start) / (hold.end - hold.start)));
      return sum + hold.extraScreens * amount;
    }, 0);
    return (progress * originalScreens + added) / totalScreens;
  }

  function holdScrollTarget(position, deltaPixels, viewportHeight, trackTop = 0, units = Math.sign(deltaPixels) * Math.min(1, Math.abs(deltaPixels) / 100)) {
    if (!deltaPixels || !units) return null;
    // Normalize wheel packets in the moving transition as well as the still
    // shots, so a fast mouse cannot jump across dozens of source frames.
    for (const hold of segments) {
      const bounds = holdBounds(hold);
      const start = trackTop + bounds.start * viewportHeight;
      const end = trackTop + bounds.end * viewportHeight;
      const inside = deltaPixels > 0 ? position >= start && position < end : position > start && position <= end;
      if (inside) {
        const next = position + units * (end - start) / (hold.wheelSteps || holdWheelSteps);
        if (deltaPixels > 0) return next >= end - 1 ? end + 1 : next;
        return next <= start + 1 ? start - 1 : next;
      }
    }
    // Respect the active segment first. When crossing a gap, catch the
    // nearest boundary in the travel direction, including on fast reversal.
    for (const segment of deltaPixels > 0 ? segments : [...segments].reverse()) {
      const bounds = holdBounds(segment);
      const start = trackTop + bounds.start * viewportHeight;
      const end = trackTop + bounds.end * viewportHeight;
      if (deltaPixels > 0 && position < start && position + deltaPixels >= start) return Math.ceil(start);
      if (deltaPixels < 0 && position > end && position + deltaPixels <= end) return Math.floor(end);
    }
    return null;
  }

  return { viewingHolds, motionStretches, totalScreens, holdBounds, storyProgress, scrollFraction, holdScrollTarget };
}

export const { viewingHolds, totalScreens, holdBounds, storyProgress, scrollFraction, holdScrollTarget } = createVideoTimeline();
