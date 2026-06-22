import { useEffect, useState } from "react";
import "./Navbar.css";

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
          kavina<span>.me</span>
        </a>
        <nav className="nav__links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#techstack">Tech Stack</a>
          <a href="#contact" className="nav__cta">
            Start a Project
          </a>
        </nav>
        <a href="mailto:hi@kavina.me" className="nav__email">
          HI@KAVINA.ME
        </a>
      </div>
    </header>
  );
}
