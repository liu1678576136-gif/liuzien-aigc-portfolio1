import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Copy, MessageCircle, RotateCcw, X } from "lucide-react";
import { useLocale, usePortfolioData } from "../LocaleContext.jsx";
import { assistantCopy } from "../data/portfolioAssistant.js";
import "../portfolio-assistant.css";

const welcomeKey = "liu-zien-assistant-welcomed";

function GuideMark({ small = false }) {
  return <span className={`assistant-mark${small ? " assistant-mark-small" : ""}`} aria-hidden="true">LZ<span>·</span></span>;
}

export default function PortfolioAssistant({ available, open, onOpenChange, onPanel, onBrowse, onOpen }) {
  const { language } = useLocale();
  const { creator, workById } = usePortfolioData();
  const copy = assistantCopy[language === "en" ? "en" : "zh"];
  const [history, setHistory] = useState([]);
  const [welcome, setWelcome] = useState(false);
  const [copyState, setCopyState] = useState("idle");
  const panel = useRef(null);
  const launcher = useRef(null);
  const closeButton = useRef(null);
  const transcript = useRef(null);
  const lastExchange = useRef(null);
  const welcomed = useRef(false);
  const copyTimer = useRef(null);

  useEffect(() => {
    if (!available) {
      panel.current?.hidePopover();
      setWelcome(false);
      return;
    }
    let seen = welcomed.current;
    try { seen ||= sessionStorage.getItem(welcomeKey) === "1"; } catch { /* The in-memory flag still prevents repeats. */ }
    if (seen || open) return;
    let hideTimer;
    const showTimer = setTimeout(() => {
      setWelcome(true);
      welcomed.current = true;
      try { sessionStorage.setItem(welcomeKey, "1"); } catch { /* Storage is optional. */ }
      hideTimer = setTimeout(() => setWelcome(false), 12000);
    }, 2600);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [available, open]);

  useEffect(() => {
    if (!open) return;
    setWelcome(false);
    welcomed.current = true;
    try { sessionStorage.setItem(welcomeKey, "1"); } catch { /* Storage is optional. */ }
    closeButton.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open || !transcript.current) return;
    // Scroll only this conversation, preserving the visitor’s scene position.
    transcript.current.scrollTo({ top: lastExchange.current?.offsetTop || 0, behavior: "instant" });
  }, [history, open, language]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  useEffect(() => {
    const handleEscape = event => {
      if (event.key !== "Escape" || !panel.current?.matches(":popover-open")) return;
      event.preventDefault();
      event.stopPropagation();
      panel.current.hidePopover();
      launcher.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  function close() {
    panel.current?.hidePopover();
    launcher.current?.focus({ preventScroll: true });
  }

  function navigate(action) {
    panel.current?.hidePopover();
    if (action.work) onOpen(action.work);
    else if (action.category) onBrowse(action.category);
    else onPanel(action.panel);
  }

  async function copyEmail() {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(creator.email);
      setCopyState("copied");
    } catch { setCopyState("failed"); }
    copyTimer.current = setTimeout(() => setCopyState("idle"), 4000);
  }

  return <div className="portfolio-assistant" hidden={!available} lang={language === "en" ? "en" : "zh-CN"}>
    {welcome && !open && <div className="assistant-welcome">
      <button className="assistant-welcome-open" onClick={() => panel.current?.showPopover()}>
        <GuideMark /><span><small>{copy.title}</small><strong>{copy.invitation}</strong></span>
      </button>
      <button className="assistant-welcome-dismiss" onClick={() => setWelcome(false)} aria-label={copy.dismiss}><X size={17} strokeWidth={1.5} /></button>
    </div>}

    <section ref={panel} id="portfolio-assistant-panel" className="assistant-panel" popover="auto" role="dialog" aria-modal="false" aria-labelledby="assistant-title" onToggle={event => onOpenChange(event.newState === "open")} onWheel={event => event.stopPropagation()}>
      <header className="assistant-header">
        <GuideMark />
        <div className="assistant-heading"><h2 id="assistant-title">{copy.title}</h2><p>{copy.subtitle}</p></div>
        <div className="assistant-header-actions">
          <button onClick={() => { setHistory([]); setCopyState("idle"); }} aria-label={copy.reset} title={copy.reset}><RotateCcw size={16} strokeWidth={1.5} /></button>
          <button ref={closeButton} onClick={close} aria-label={copy.close}><X size={20} strokeWidth={1.5} /></button>
        </div>
      </header>

      <div ref={transcript} className="assistant-transcript" role="log" aria-label={copy.conversation} aria-live="polite" aria-relevant="additions" tabIndex={0}>
        <div className="assistant-introduction"><span lang="en">A LITTLE CURIOSITY GOES A LONG WAY.</span><p>{copy.greeting}</p></div>
        {history.map((id, index) => {
          const topic = copy.topics.find(item => item.id === id);
          return <div className="assistant-exchange" key={`${index}-${id}`} ref={index === history.length - 1 ? lastExchange : undefined}>
            <div className="assistant-question"><span>{copy.you}</span><p>{topic.question}</p></div>
            <div className="assistant-answer">
              <div className="assistant-answer-label"><GuideMark small /><span>{copy.guide}</span></div>
              {id === "skills" && <p>{creator.introduction}</p>}
              {topic.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {topic.workIds && <div className="assistant-work-list">{topic.workIds.map(workId => {
                const work = workById[workId];
                return work && <button key={work.id} className="assistant-work" onClick={() => navigate({ work: work.id })}>
                  <img src={work.cover} alt="" loading="lazy" width="48" height="54" />
                  <span><small>{work.categoryLabel}</small><strong>{work.title}</strong></span><ArrowUpRight size={17} strokeWidth={1.4} />
                </button>;
              })}</div>}
              {topic.email && <div className="assistant-email"><a href={`mailto:${creator.email}`}>{creator.email}</a><button onClick={copyEmail} aria-label={copyState === "copied" ? copy.copied : copy.copy} title={copyState === "copied" ? copy.copied : copy.copy}>{copyState === "copied" ? <Check size={16} /> : <Copy size={16} />}</button></div>}
              {topic.email && <span className="assistant-copy-status" role="status">{copyState === "copied" ? copy.copied : copyState === "failed" ? copy.copyFailed : ""}</span>}
              {topic.actions && <div className="assistant-answer-actions">{topic.actions.map(action => <button key={action.label} onClick={() => navigate(action)}>{action.label}<ArrowUpRight size={14} /></button>)}</div>}
            </div>
          </div>;
        })}
      </div>

      <div className="assistant-prompts"><p id="assistant-questions-label">{copy.questions}</p><div role="group" aria-labelledby="assistant-questions-label">{copy.topics.map(topic => <button key={topic.id} disabled={history.at(-1) === topic.id} onClick={() => setHistory(previous => [...previous, topic.id])}><span>{topic.question}</span>{history.at(-1) === topic.id ? <Check size={14} /> : <ArrowRight size={14} strokeWidth={1.5} />}</button>)}</div></div>
      <footer className="assistant-footer"><span lang="en">LIU ZIEN / PORTFOLIO</span><a href={`mailto:${creator.email}`}>{copy.contact}<ArrowUpRight size={12} /></a></footer>
    </section>

    <button ref={launcher} className={`assistant-launcher${open ? " is-open" : ""}`} popoverTarget="portfolio-assistant-panel" aria-label={open ? copy.close : copy.launcher} aria-expanded={open} aria-controls="portfolio-assistant-panel"><MessageCircle size={24} strokeWidth={1.5} /><span className="assistant-launcher-dots" aria-hidden="true"><i /><i /><i /></span></button>
  </div>;
}
