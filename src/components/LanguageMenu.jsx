import { Check, Globe } from "lucide-react";
import { useRef } from "react";
import { useLocale } from "../LocaleContext.jsx";

export default function LanguageMenu() {
  const { language, setLanguage, t } = useLocale();
  const panel = useRef(null);
  const choose = next => { setLanguage(next); panel.current.hidePopover(); };
  return <div className="cinema-language">
    <button className="cinema-language-toggle cinema-round-control" popoverTarget="site-language" aria-label={t("语言设置")}><Globe size={19} strokeWidth={1.3} /><span>{t("语言")}</span></button>
    <div ref={panel} id="site-language" className="cinema-language-panel" popover="auto" aria-label={t("语言设置")}>
      <span>{language === "en" ? "SELECT LANGUAGE" : "选择语言"}</span>
      <h2>{t("语言")}</h2>
      <div className="cinema-language-options" role="group" aria-label={t("语言设置")}>
        {[{ id: "zh", name: "简体中文", code: "ZH" }, { id: "en", name: "English", code: "EN" }].map(option => <button key={option.id} lang={option.id === "zh" ? "zh-CN" : "en"} aria-pressed={language === option.id} onClick={() => choose(option.id)}><span>{option.name}</span>{language === option.id ? <Check size={15} /> : <small>{option.code}</small>}</button>)}
      </div>
    </div>
  </div>;
}
