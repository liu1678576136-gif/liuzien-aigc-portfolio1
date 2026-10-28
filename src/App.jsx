import { LocaleProvider } from "./LocaleContext.jsx";
import PortfolioRouter from "./components/PortfolioRouter.jsx";

export default function App() {
  return <LocaleProvider><PortfolioRouter /></LocaleProvider>;
}
