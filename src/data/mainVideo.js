import { mainVideoCalibration as calibration } from "./mainVideoCalibration.js";

export const mainVideo = { id: "main-gallery-4k-v4", base: "/assets/scene/main-gallery-4k-v4/", fps: 30 };
const clamp = n => Math.max(0, Math.min(1, n));
const mix = (a, b, t) => a + (b - a) * t;

export function mainVideoTime(progress) {
  const frame = clamp(progress) * (calibration.times.length - 1);
  const lower = Math.floor(frame), upper = Math.min(lower + 1, calibration.times.length - 1);
  return mix(calibration.times[lower], calibration.times[upper], frame - lower);
}

export function mainSourceFrame(time) {
  const times = calibration.times;
  let lower = 0, upper = times.length - 1;
  while (lower < upper) {
    const middle = Math.ceil((lower + upper) / 2);
    if (times[middle] <= time) lower = middle; else upper = middle - 1;
  }
  const next = Math.min(lower + 1, times.length - 1);
  return lower + (times[next] > times[lower] ? clamp((time - times[lower]) / (times[next] - times[lower])) : 0);
}

export function mainScreenCorners(time) {
  const samples = calibration.screenTrack;
  if (time < samples[0].time || time > samples.at(-1).time + 1 / mainVideo.fps) return null;
  let index = 0;
  while (index + 1 < samples.length && samples[index + 1].time <= time) index++;
  const a = samples[index], b = samples[Math.min(index + 1, samples.length - 1)];
  const progress = b.time > a.time ? clamp((time - a.time) / (b.time - a.time)) : 0;
  return a.corners.map((point, i) => point.map((value, axis) => mix(value, b.corners[i][axis], progress)));
}
