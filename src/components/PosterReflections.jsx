import { useId } from "react";

// Polygons follow the printed surfaces in held gallery frame 137 (1280×720).
const papers = [
  "484,155 797,156 800,568 484,568",
  "114,105 307,105 307,354 114,354",
  "68,455 357,455 358,584 68,584",
  "895,119 1048,120 1047,316 895,316",
  "1104,121 1247,122 1246,316 1104,316",
  "925,406 1217,406 1217,592 924,592",
];
export default function PosterReflections({ mainConnection = false }) {
  const surfaces = mainConnection ? ["484,159 797,159 800,583 484,583", "114,108 307,108 307,364 114,364", "68,467 357,467 358,600 68,600", "895,122 1048,123 1047,325 895,325", "1104,124 1247,125 1246,325 1104,325", "925,417 1217,417 1217,608 924,608"] : papers;
  const id = `reflection-${useId().replaceAll(":", "")}`;
  return <svg className="poster-reflections" viewBox={`0 0 1280 ${mainConnection ? 740 : 720}`} aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2=".3">
      <stop offset="0" stopColor="#fff5db" stopOpacity="0" />
      <stop offset=".44" stopColor="#fff5db" stopOpacity="0" />
      <stop offset=".52" stopColor="#fff9eb" stopOpacity=".22" />
      <stop offset=".60" stopColor="#fff5db" stopOpacity="0" />
      <stop offset="1" stopColor="#fff5db" stopOpacity="0" />
    </linearGradient>{surfaces.map((points, index) => <clipPath id={`${id}-${index}`} key={index}><polygon points={points} /></clipPath>)}</defs>
    {surfaces.map((_, index) => <g clipPath={`url(#${id}-${index})`} key={index}><rect className="paper-reflection-band" x="-1280" y="0" width="3840" height={mainConnection ? 740 : 720} fill={`url(#${id})`} style={{ animationDelay: `${-index * 1.9}s` }} /></g>)}
  </svg>;
}
