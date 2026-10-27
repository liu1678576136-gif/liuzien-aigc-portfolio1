import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { english } from "./data/translations.js";
import { creator, categories, works, career } from "./data/studio.js";

const LocaleContext = createContext(null);
const key = "liu-zien-language";
function initialLanguage() {
  const query = new URLSearchParams(window.location.search).get("lang");
  if (query === "en" || query === "zh") return query;
  try { return localStorage.getItem(key) === "en" ? "en" : "zh"; } catch { return "zh"; }
}
const phrases = Object.keys(english).sort((a, b) => b.length - a.length);
export function translate(value, language) {
  if (language !== "en" || typeof value !== "string") return value;
  if (english[value] !== undefined) return english[value];
  // Composite accessibility labels contain translated names and scene numbers.
  if (!/[\u3400-\u9fff]/.test(value)) return value;
  let result = value;
  for (const phrase of phrases) if (result.includes(phrase)) result = result.split(phrase).join(english[phrase]);
  return result;
}
export function LocaleProvider({ children }) {
  const [language, updateLanguage] = useState(initialLanguage);
  const setLanguage = useCallback(next => {
    updateLanguage(next);
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", next);
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);
  const t = useCallback(value => translate(value, language), [language]);
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.language = language;
    document.title = language === "en" ? "Liu Zien — AIGC Visual Designer" : "刘梓恩 Liu Zien — AIGC Visual Designer";
    try { localStorage.setItem(key, language); } catch { /* Language still works without storage. */ }
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export const useLocale = () => useContext(LocaleContext);
export function usePortfolioData() {
  const { t } = useLocale();
  return useMemo(() => {
    const localize = value => Array.isArray(value) ? value.map(localize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v)])) : t(value);
    const localizedWorks = localize(works);
    return { creator: localize(creator), categories: localize(categories), career: localize(career), works: localizedWorks, workById: Object.fromEntries(localizedWorks.map(work => [work.id, work])) };
  }, [t]);
}
