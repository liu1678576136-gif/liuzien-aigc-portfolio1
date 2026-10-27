import { useRef } from "react";
import { ArrowUpRight, Expand } from "lucide-react";
import { useLocale } from "../LocaleContext.jsx";
import { Artwork, DetailVideo } from "./StudioMedia.jsx";
import "../project-process.css";

export default function ProjectProcess({ steps, onPreview }) {
  const { t } = useLocale();
  const root = useRef(null);
  const comparisonCount = steps.filter(step => !step.wide).length;
  const layout = comparisonCount === 1 ? " project-process-single" : comparisonCount === 2 ? " project-process-pair" : "";
  function preview(media) {
    root.current.querySelectorAll("video").forEach(video => video.pause());
    onPreview(media);
  }
  return <section ref={root} className="project-process" aria-label={t("制作过程")}>
    <div className="project-process-topline"><h3>{t("制作过程")}</h3><span lang="en">THE PROCESS / {String(steps.length).padStart(2, "0")} STEPS</span></div>
    <ol className={`project-process-steps${layout}`}>
      {steps.map((step, index) => <li key={step.id} className={`production-step${step.wide ? " production-step-wide" : ""}${step.kind === "reference" ? " production-step-reference" : ""}${step.output ? " production-step-output" : ""}`}>
        <header className="production-step-heading"><span className="production-step-number">{String(index + 1).padStart(2, "0")}</span><div><h4>{t(step.title)}</h4><p>{t(step.description)}</p></div></header>
        <div className={`production-step-media${step.media.length > 1 ? " production-step-references" : ""}`}>{step.media.map(media => <figure key={media.src}>
          {media.type === "video" ? <DetailVideo media={media} /> : <button className="production-reference-button" onClick={() => preview(media)} aria-label={`${t("放大查看")} ${t(media.alt)}`}><Artwork src={media.src} original={media.original} alt={t(media.alt)} /><span><Expand size={14} />{t("放大查看")}</span></button>}
          <figcaption><span>{t(media.alt)}</span><a href={media.original || media.src} target="_blank" rel="noreferrer" aria-label={`${t("打开原文件 ")}${t(media.alt)}`}><ArrowUpRight size={15} /></a></figcaption>
        </figure>)}</div>
      </li>)}
    </ol>
  </section>;
}
