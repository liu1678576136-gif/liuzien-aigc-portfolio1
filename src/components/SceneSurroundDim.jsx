// A cutout follows the filmed surface while the rest of the scene darkens.
export default function SceneSurroundDim({ points, className = "", height = 740, width = 1280 }) {
  return <svg className={`scene-surround-dim ${className}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <path fillRule="evenodd" d={`M-10000,-10000 H10000 V10000 H-10000 Z M${points} Z`} />
  </svg>;
}
