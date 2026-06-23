import { useEffect, useState } from "react";
import "./Navbar.css";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#techstack", label: "Tech Stack" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Start a Project", cta: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__logo">
          KAVINA<span>.me</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          {NAV_LINKS.map(({ href, label, cta }) => (
            <a key={href} href={href} className={cta ? "nav__cta" : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <a href="mailto:hi@kavina.me" className="nav__email">
          HI@KAVINA.ME
        </a>
      </div>
    </header>
  );
}
