const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const n = clamp(value); return n * n * (3 - 2 * n); };
// Start the screen's own title only after the centered transition copy clears.
const approachStartFrame = 265 + ((.72 * 28.5 - 3.5) / 11 - 1.44) / (1.79 - 1.44) * (479 - 265);

export function screenPresentation(sourceFrame) {
  const phase = (sourceFrame - approachStartFrame) / (391 - approachStartFrame);
  const progress = clamp((phase - .60) / .40);
  return { progress, opacity: phase >= .60 && phase <= 1.00001 ? smooth(progress / .25) : 0 };
}

export function screenProjection(points, width = 514, height = 280) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const divisor = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(divisor) < 1e-8) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / divisor;
  const h = (dx1 * dy3 - dx3 * dy1) / divisor;
  return [(x1 - x0 + g * x1) / width, (y1 - y0 + g * y1) / width, 0, g / width,
    (x3 - x0 + h * x3) / height, (y3 - y0 + h * y3) / height, 0, h / height,
    0, 0, 1, 0, x0, y0, 0, 1];
}
