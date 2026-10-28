import { LocaleProvider } from "./LocaleContext.jsx";
import PortfolioRouter from "./components/PortfolioRouter.jsx";
import { BackgroundMusicProvider } from "./components/BackgroundMusicProvider.jsx";

export default function App() {
  return <LocaleProvider><BackgroundMusicProvider><PortfolioRouter /></BackgroundMusicProvider></LocaleProvider>;
}
