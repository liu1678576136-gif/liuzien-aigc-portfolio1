import { navItems, profile } from "../data/portfolio.js";

export function Hero() {
  return (
    <header className="hero-nav sequence-nav" id="hero">
      <a className="brand-wordmark" href="#hero" aria-label="返回顶部">
        <img className="brand-logo" src="/assets/logo-liuzien.png" alt="Liu Zien" />
      </a>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <a href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <a className="nav-cta" href={`mailto:${profile.email}`}>
        合作咨询
      </a>
    </header>
  );
}
