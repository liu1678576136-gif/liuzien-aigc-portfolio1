import { useLocale } from "../LocaleContext.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowUpRight, Check, Copy, Expand, Mail, Play, X } from "lucide-react";
import { usePortfolioData } from "../LocaleContext.jsx";
import LanguageMenu from "./LanguageMenu.jsx";
import { Artwork, DetailVideo } from "./StudioMedia.jsx";
import { useReducedMotion } from "./StudioExperience.jsx";
import CinematicExperience, { jumpToCinematicChapter } from "./VideoScrollExperience.jsx";
import "../cinematic.css";
import OpeningLoader from "./OpeningLoader.jsx";
import BackgroundMusic from "./BackgroundMusic.jsx";
import PortfolioAssistant from "./PortfolioAssistant.jsx";
import StudioCursor from "./StudioCursor.jsx";
import CharacterGallery from "./CharacterGallery.jsx";
import ProjectProcess from "./ProjectProcess.jsx";
import { motionCollections } from "../data/videoWorks.js";

function Header({ onPanel }) {
  const { t, language } = useLocale();
  return <header className="studio-header">
    <a className="studio-wordmark" href="#home" aria-label={t("刘梓恩作品集首页")} onClick={(event) => { event.preventDefault(); jumpToCinematicChapter("opening"); }}><span className="lz-monogram">LZ<span>·</span></span><span className="wordmark-caption">{t("刘梓恩")}<br /><small>VISUAL DESIGNER</small></span></a>
    <nav className="cinema-header-actions" aria-label={t("主导航")}><BackgroundMusic /><LanguageMenu /><button className="cinema-menu-trigger" onClick={() => onPanel("menu")} aria-label={t("打开菜单")}><span /><span /><span /></button></nav>
  </header>;
}

function WorkIndex({ onOpen, initialCategory = "all", categoryOnly = false }) {
  const { categories, works } = usePortfolioData();
  const { t, language } = useLocale();
  const [filter, setFilter] = useState(initialCategory);
  const selectedCategory = categoryOnly ? initialCategory : filter;
  const filtered = selectedCategory === "all" ? works : works.filter((work) => selectedCategory === "brand" && categoryOnly ? ["brand", "ip"].includes(work.category) : work.category === selectedCategory);
  const categoryPage = initialCategory === "brand"
    ? { index: "THE DESIGN INDEX", eyebrow: "VISUAL IDENTITY / IP DESIGN", title: "VI / IP 设计" }
    : initialCategory === "other"
    ? { index: "THE WORKBENCH INDEX", eyebrow: "LZE / CREATIVE WORKSPACE", title: "LZE工作台" }
    : initialCategory === "ip"
    ? { index: "THE IP INDEX", eyebrow: "IP / CHARACTER DESIGN", title: "IP 设计" }
    : initialCategory === "motion"
    ? { index: "THE MOTION INDEX", eyebrow: "AI / MOTION DESIGN", title: "AI 影像" }
    : { index: "THE POSTER INDEX", eyebrow: "E-COMMERCE / POSTERS", title: "电商海报" };
  const grouped = selectedCategory === "motion";
  const renderWorks = (items) => {
    const Title = grouped ? "h4" : "h3";
    return <div className="work-grid">{items.map((work) => <article className={`work-card work-card-${work.category}`} key={work.id}>
      <button className="work-card-button" onClick={() => onOpen(work.id)} aria-label={t(`查看${work.title}`)}>
        <div className="work-card-image"><Artwork src={work.cover} original={work.coverOriginal} alt={work.title} /><span className="card-type">{work.category === "motion" ? <><Play size={10} fill="currentColor" /> FILM</> : work.categoryLabel}</span><span className="card-open"><ArrowUpRight size={25} strokeWidth={1.2} /></span></div>
        <div className="work-card-caption"><span className="work-number">{work.number}</span><div><Title>{work.title}</Title><p>{work.subtitle}</p>{work.production && <span className="work-card-process">{t("查看制作过程")}<ArrowUpRight size={12} /></span>}</div><ArrowUpRight size={18} /></div>
      </button>
    </article>)}</div>;
  };
  return <section id="works" className={`work-index section-shell${categoryOnly ? " work-index-category" : ""}`} aria-labelledby="works-title">
    <div className="section-topline"><span><span className="tiny-square" /> {categoryOnly ? categoryPage.index : "THE WORK INDEX"}</span><span>{filtered.length || !categoryOnly ? "01" : "00"} — {String(categoryOnly ? filtered.length : works.length).padStart(2, "0")}</span></div>
    <div className="section-heading"><div><p className="eyebrow">{categoryOnly ? categoryPage.eyebrow : t("想象的不同切面")}</p><h2 id="works-title" lang={categoryOnly && language === "zh" ? "zh-CN" : "en"}>{categoryOnly ? t(categoryPage.title) : "Selected work"}<span> (2026)</span></h2></div>{!categoryOnly && <p>{t("影像、品牌与角色。")}<br />{t("每一次创作，都是一种新的可能。")}</p>}</div>
    <div className="work-filter-bar">{!categoryOnly && <nav className="work-filters" aria-label={t("筛选作品")}>{categories.map((category) => <button key={category.id} aria-pressed={filter === category.id} onClick={() => setFilter(category.id)}>{category.label}<sup>{category.id === "all" ? works.length : works.filter((work) => work.category === category.id).length}</sup></button>)}</nav>}<span role="status" aria-live="polite">{t("显示 ")}{filtered.length}{t(" 个项目")}</span></div>
    {filtered.length === 0 && selectedCategory === "other" ? <p className="work-index-empty">{t("更多作品正在整理中，敬请期待。")}</p> : grouped ? <div className="motion-collections">{motionCollections.map(collection => {
      const items = filtered.filter(work => work.collection === collection.id);
      return items.length > 0 && <section className="motion-collection" key={collection.id} aria-labelledby={`motion-collection-${collection.id}`}><header className="motion-collection-heading"><div><h3 id={`motion-collection-${collection.id}`}>{t(collection.title)}</h3><p lang="en">{collection.en}</p></div><span>{String(items.length).padStart(2, "0")} PROJECTS</span></header>{renderWorks(items)}</section>;
    })}</div> : renderWorks(filtered)}
  </section>;
}

function About() {
  const { creator, career } = usePortfolioData();
  const { t, language } = useLocale();
  return <section id="about" className="about-creator section-shell" aria-labelledby="about-title">
    <div className="section-topline"><span><span className="tiny-square" /> BEHIND THE WORK</span><span>{t("设计，也设计方法。")}</span></div>
    <div className="creator-grid"><div className="creator-portrait"><Artwork src={creator.portrait} original={creator.portraitOriginal} alt={t("刘梓恩个人肖像")} /><span>{t("LIU ZIEN / 刘梓恩")}</span></div>
      <div className="creator-copy"><p className="eyebrow">AIGC VISUAL DESIGNER</p><h2 id="about-title">{t("让创意有方法，")}<br />{t("也有完成度。")}</h2><p className="creator-intro">{creator.introduction}</p><p className="creator-description">{t("从商业视觉到生成式创作，我关注画面背后的结构：明确需求、建立方向、控制生成，再通过后期与设计完成表达。")}</p><div className="creator-skills"><span>{t("品牌视觉系统")}</span><span>{t("AIGC 视觉工作流")}</span><span>{t("电商营销视觉")}</span><span>{t("动态叙事")}</span></div><a href={`mailto:${creator.email}`} className="text-action">{t("联系刘梓恩 ")}<ArrowUpRight size={18} /></a></div>
    </div>
    <div className="career-heading"><h3>{t("走过的创作现场")}</h3><span>EXPERIENCE / 2018 — 2026</span></div>
    <div className="career-rows">{career.map((item) => <article className="career-row" key={item.period}><span className="career-date">{item.period}</span><div><h4>{item.company}</h4><span className="career-role">{item.role}</span></div><p>{item.description}</p></article>)}</div>
  </section>;
}

function Contact() {
  const { creator } = usePortfolioData();
  const { t, language } = useLocale();
  const [copyState, setCopyState] = useState("idle");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(creator.email);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState("idle"), 4000);
  }
  return <footer id="contact" className="contact-finale section-shell">
    <div className="section-topline"><span><span className="tiny-square" /> THE NEXT CHAPTER</span><a href="#home" aria-label={t("返回顶部")}>BACK TO TOP <ArrowUp size={13} /></a></div>
    <div className="contact-heading"><h2 lang="en">LET’S<br /><span>CREATE.</span></h2><div><p>{t("下一段创作，")}<br />{t("从一次交流开始。")}</p><a className="contact-circle" href={`mailto:${creator.email}`} aria-label={t("发送邮件给刘梓恩")}><ArrowUpRight size={62} strokeWidth={1} /></a></div></div>
    <div className="contact-email-row"><a href={`mailto:${creator.email}`}><Mail size={22} strokeWidth={1} />{creator.email}</a><button onClick={copyEmail} aria-label={t("复制邮箱")}>{copyState === "copied" ? <Check size={17} /> : <Copy size={17} />}<span>{t(copyState === "copied" ? "已复制" : "复制邮箱")}</span></button><span role="status" className="copy-status">{t(copyState === "failed" ? "未能复制，请选中邮箱地址手动复制。" : copyState === "copied" ? "邮箱地址已复制" : "")}</span></div>
    <div className="footer-colophon"><span>© 2026 LIU ZIEN</span><span>AIGC / VISUAL DESIGN / MOTION</span><span>{t("想象在继续。")}</span></div>
  </footer>;
}

function Lightbox({ media, onClose }) {
  const { t, language } = useLocale();
  const dialog = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => { dialog.current.showModal(); return () => dialog.current?.close(); }, []);
  return <dialog ref={dialog} className="image-lightbox" aria-label={t(`${media.alt}放大预览`)} onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <div className="lightbox-toolbar"><span>{media.alt}</span><div><button onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed}><Expand size={15} />{t(zoomed ? "适应窗口" : "放大查看")}</button><a href={media.original} target="_blank" rel="noreferrer">{t("原始图片 ")}<ArrowUpRight size={15} /></a><button className="icon-button" onClick={onClose} aria-label={t("关闭图片预览")}><X size={22} /></button></div></div>
    <div className={`lightbox-scroll${zoomed ? " is-zoomed" : ""}`}><Artwork src={media.src} original={media.original} alt={media.alt} eager /></div>
  </dialog>;
}

function ProjectBody({ work, onClose, onPreview, titleRef, titleId = "project-detail-title", returnToScene = false }) {
  const { t } = useLocale();
  const productionSteps = (work.production || []).filter(step => !step.output);
  return <>
    <div className="detail-intro"><p className="eyebrow">{work.categoryLabel} / {work.subtitle}</p><h2 ref={titleRef} tabIndex={-1} id={titleId}>{work.title}</h2><div className="detail-description"><p>{work.description}</p><div><span className="detail-meta-label">{t("作品内容 / DELIVERABLES")}</span>{work.deliverables.map((item) => <span key={item}>{item}</span>)}</div></div>{work.role && <p className="project-role">{t("个人职责：")}{work.role}</p>}{work.process && <p>{work.process}</p>}{work.document && <a className="text-action" href={work.document.href} target="_blank" rel="noreferrer">{work.document.label}<ArrowUpRight size={16} /></a>}</div>
    <div className="detail-media-list">{work.media.map((media, index) => <figure key={media.src} className={work.id === "lze-workbench" && media.type !== "video" ? "workbench-screenshot" : undefined}>
      {media.type === "video" ? <DetailVideo media={media} /> : <button className="detail-image-button" onClick={() => onPreview(media)} aria-label={t(`放大查看${media.alt}`)}><Artwork src={media.src} original={media.original} alt={media.alt} eager={index === 0} /><span><Expand size={16} />{t(" 放大查看")}</span></button>}
      <figcaption><span>{String(index + 1).padStart(2, "0")} / {media.alt}</span><a href={media.original || media.src} target="_blank" rel="noreferrer">{t("打开原文件 ")}<ArrowUpRight size={12} /></a></figcaption>
    </figure>)}</div>
    {productionSteps.length > 0 && <ProjectProcess steps={productionSteps} onPreview={onPreview} />}
    <div className="detail-end"><span>END OF PROJECT / {work.number}</span><button className="text-action" onClick={onClose}>{t(returnToScene ? "返回场景" : "返回继续探索 ")}<ArrowUpRight size={16} /></button></div>
  </>;
}

function ProjectDetail({ work, onClose }) {
  const { t, language } = useLocale();
  const dialog = useRef(null);
  const title = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const scrollY = window.scrollY;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    element.showModal();
    title.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.documentElement.style.overflow = previousOverflow;
      window.scrollTo({ top: scrollY, behavior: "instant" });
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="project-detail" aria-labelledby="project-detail-title" onCancel={(event) => { event.preventDefault(); if (!lightbox) onClose(); }}>
    <div className="detail-toolbar"><span>LIU ZIEN <i>/</i> SELECTED WORK {work.number}</span><button onClick={onClose} className="detail-close">{t("返回作品 ")}<X size={20} /></button></div>
    <div className="detail-scroll"><ProjectBody work={work} onClose={onClose} onPreview={setLightbox} titleRef={title} /></div>
    {lightbox && <Lightbox media={lightbox} onClose={() => setLightbox(null)} />}
  </dialog>;
}

function SitePanel({ kind, onClose, onPanel, onOpen, initialCategory = "all" }) {
  const { creator, works } = usePortfolioData();
  const { t, language } = useLocale();
  const dialog = useRef(null);
  const [preview, setPreview] = useState(null);
  const labels = { works: "全部作品", posters: "电商海报", vi: "VI / IP 设计", ip: "IP 设计", other: "LZE工作台", motion: "AI 影像", characters: "视觉叙事", about: "关于刘梓恩", contact: "联系", menu: "导航菜单" };
  const exclusiveCategory = { posters: "poster", vi: "brand", ip: "ip", other: "other", motion: "motion" }[kind];
  const panelWorks = ["ip", "other"].includes(kind) ? works.filter(work => work.category === exclusiveCategory) : [];
  const directWork = panelWorks.length === 1 ? panelWorks[0] : null;
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    element.showModal();
    if (directWork) element.querySelector("#panel-project-title")?.focus({ preventScroll: true });
    return () => { element.close(); document.documentElement.style.overflow = overflow; if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); else document.querySelector('.cinema-menu-trigger')?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className={`site-panel site-panel-${kind}`} aria-label={t(labels[kind])} onClick={(event) => { if (kind !== "menu" || event.target !== event.currentTarget) return; const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); }} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="site-panel-toolbar"><span>{t(kind === "menu" ? "刘梓恩" : `LIU ZIEN / ${t(labels[kind])}`)}</span><button className={kind === "menu" ? undefined : "site-panel-back"} onClick={onClose} aria-label={t(kind === "menu" ? "关闭导航菜单" : "返回沉浸场景")}>{kind === "menu" ? <X size={26} strokeWidth={1.5} /> : <><ArrowLeft size={18} strokeWidth={1.6} /><span>{t("返回场景")}</span></>}</button></div>
    <div className={`site-panel-scroll${directWork ? " detail-scroll single-project-scroll" : ""}`} onClick={(event) => { const anchor = event.target.closest('a[href="#home"]'); if (anchor) { event.preventDefault(); onClose(); requestAnimationFrame(() => jumpToCinematicChapter("opening")); } }}>
      {directWork ? <ProjectBody work={directWork} onClose={onClose} onPreview={setPreview} titleId="panel-project-title" returnToScene /> : (kind === "works" || exclusiveCategory) && <WorkIndex onOpen={onOpen} initialCategory={exclusiveCategory || initialCategory} categoryOnly={Boolean(exclusiveCategory)} />}
      {kind === "characters" && <CharacterGallery onPreview={setPreview} />}
      {kind === "about" && <About />}
      {kind === "contact" && <Contact />}
      {kind === "menu" && <><nav className="cinema-main-menu" aria-label={t("网站菜单")}>{[{ id: "home", label: "从头开始" }, { id: "works", label: "全部作品" }, { id: "about", label: "关于刘梓恩" }, { id: "contact", label: "联系" }].map((item) => <button key={item.id} onClick={() => { if (item.id === "home") { onClose(); requestAnimationFrame(() => jumpToCinematicChapter("opening")); } else onPanel(item.id); }}><strong>{t(item.label)}</strong></button>)}</nav><div className="cinema-menu-note"><span>AIGC / VISUAL DESIGN</span><p>{t("让想象，走进现实。")}</p><a href={`mailto:${creator.email}`}>{creator.email} <ArrowUpRight size={14} /></a></div></>}
    </div>
    {preview && <Lightbox media={preview} onClose={() => setPreview(null)} />}
  </dialog>;
}

export default function StudioPortfolio() {
  const { workById } = usePortfolioData();
  const { t, language } = useLocale();
  const [loading, setLoading] = useState(true);
  const finishLoading = useCallback(() => {
    // The browser may restore a scroll position while opening assets load.
    // Reset once more before exposing the scene and accepting navigation.
    jumpToCinematicChapter("opening");
    setLoading(false);
  }, []);
  const [activeWork, setActiveWork] = useState(null);
  const [panel, setPanel] = useState(null);
  const [browseCategory, setBrowseCategory] = useState("all");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const openPanel = (kind) => { setBrowseCategory("all"); setPanel(kind); };
  const browseWorks = (category) => { setBrowseCategory(category); setPanel(category === "ip" ? "ip" : category === "other" ? "other" : category === "motion" ? "motion" : "works"); };
  const reduced = useReducedMotion();
  const openWork = (id) => { if (workById[id]) setActiveWork(id); };
  useEffect(() => {
    document.body.classList.add("cinematic-mode");
    const id = window.location.hash.slice(1);
    if (!loading && ["works", "about", "contact"].includes(id)) setPanel(id);
    return () => document.body.classList.remove("cinematic-mode");
  }, [loading]);
  return <>
    {loading && <OpeningLoader onComplete={finishLoading} />}
    <div className="portfolio-content" inert={loading} aria-hidden={loading ? "true" : undefined}>
    <button className="skip-link" onClick={() => openPanel("works")}>{t("跳到全部作品")}</button>
    <Header onPanel={openPanel} />
    <main id="home"><CinematicExperience onOpen={openWork} onPanel={openPanel} onBrowse={browseWorks} paused={Boolean(activeWork || panel || loading || assistantOpen)} reduced={reduced} /></main>
    <PortfolioAssistant available={!loading && !panel && !activeWork} open={assistantOpen} onOpenChange={setAssistantOpen} onPanel={openPanel} onBrowse={browseWorks} onOpen={openWork} />
    {panel && <SitePanel key={`${panel}:${browseCategory}`} kind={panel} onClose={() => setPanel(null)} onPanel={openPanel} onOpen={openWork} initialCategory={browseCategory} />}
    {activeWork && <ProjectDetail key={activeWork} work={workById[activeWork]} onClose={() => setActiveWork(null)} />}
    </div>
    <StudioCursor enabled={!loading && !panel && !activeWork && !assistantOpen && !reduced} />
  </>;
}
