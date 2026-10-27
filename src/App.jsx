import { LocaleProvider } from "./LocaleContext.jsx";
import StudioPortfolio from "./components/StudioPortfolio.jsx";

export default function App() {
  return <LocaleProvider><StudioPortfolio /></LocaleProvider>;
}
