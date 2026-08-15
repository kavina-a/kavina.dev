import { useEffect, useRef, useState } from "react";
import "./Navbar.css";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#techstack", label: "Tech Stack" },
  { href: "#lore", label: "Lore" },
  { href: "#contact", label: "Start a Project", cta: true },
];

const SOCIALS = [
  ["GitHub", "https://github.com/kavina-a"],
  ["LinkedIn", "https://www.linkedin.com/"],
  ["Contact", "#contact"],
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const podRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e) => {
      if (podRef.current && !podRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="nav">
        <a href="#top" className="nav__logo" onClick={closeMenu}>
          KAVINA<span>.me</span>
        </a>
      </header>

      {/*
        One white shell. Closed = the Menu pill. Open = the same shell
        grows into the card, with Close sitting inside at the top.
      */}
      <div className={`menu-pod ${menuOpen ? "is-open" : ""}`} ref={podRef}>
        <button
          type="button"
          className="menu-pod__trigger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="menu-pod-body"
        >
          <span className="menu-pod__icon" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="menu-pod__label" aria-hidden="true">
            <span className="menu-pod__label-word">Menu</span>
            <span className="menu-pod__label-word">Close</span>
          </span>
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
        </button>

        <div
          className="menu-pod__body"
          id="menu-pod-body"
          aria-hidden={!menuOpen}
        >
          <div className="menu-pod__body-inner">
            <p className="menu-pod__eyebrow">Menu</p>
            <nav className="menu-pod__links" aria-label="Primary">
              {NAV_LINKS.map(({ href, label, cta }) => (
                <a
                  key={href}
                  href={href}
                  className={cta ? "is-cta" : undefined}
                  onClick={closeMenu}
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="menu-pod__divider" aria-hidden="true" />

            <p className="menu-pod__eyebrow">Social media</p>
            <div className="menu-pod__socials">
              {SOCIALS.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("#") ? undefined : "_blank"}
                  rel={href.startsWith("#") ? undefined : "noopener noreferrer"}
                  onClick={closeMenu}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
