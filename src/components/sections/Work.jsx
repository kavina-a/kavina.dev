import { useRef, useEffect } from "react";
import Reveal from "../ui/Reveal";
import { FEATURED, SECONDARY } from "../../data/site";
import { gsap } from "../../lib/gsap";
import "./sections.css";

const LOGO_MAP = {
  "ARIMAC":   "/company-logo/arimac.png",
  "AA JAPAN": "/company-logo/aaj.png",
  "TUTOPIYA": "/company-logo/tutopiya.png",
};

function parseDateRange(raw) {
  const parts = raw.split(/\s*[—–-]\s*/);
  if (parts.length >= 2) {
    return { start: parts[0].trim(), end: parts.slice(1).join(" — ").trim() };
  }
  return { start: raw.trim(), end: null };
}

// ─── Text colour palettes ──────────────────────────────────────────────────────
const LIGHT = {
  name:  "#0a0a0a",
  blurb: "rgba(0,0,0,0.58)",
  tags:  "rgba(0,0,0,0.38)",
};
const DARK = {
  name:  "#ffffff",
  blurb: "rgba(255,255,255,0.7)",
  tags:  "#6a6a6a",
};

// ─── HoverList ────────────────────────────────────────────────────────────────
// Manages two independent effects on the Featured Work rows:
//
//   1. SCROLL TRACKER  — GSAP ticker runs every rAF.  Finds the one row whose
//      vertical centre is closest to the viewport centre and makes only that
//      row white.  As you scroll, the spotlight smoothly moves to the next row.
//
//   2. HOVER TV-ON  — CRT scan-line expand from centre on mouseenter.  Respects
//      the scroll-active state so there's no colour-conflict on hand-off.
//
// The hover thumbnail image has been removed.
function HoverList({ items }) {
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const rows    = Array.from(list.querySelectorAll(".work-list__item"));
    const cleanup = [];
    let   active  = null; // the currently white row (scroll)

    // Helper: DOM references for a row.
    // name is a NodeList so GSAP animates both the company label and the role
    // title with a single call — they share the same colour states.
    const els = (row) => ({
      fillS: row.querySelector(".work-list__fill-scroll"),
      fillH: row.querySelector(".work-list__fill-hover"),
      link:  row.querySelector("a"),
      name:  row.querySelectorAll(".work-list__name"),
      blurb: row.querySelector(".work-list__blurb"),
      tags:  row.querySelector(".work-list__tags"),
    });

    // Init all fills
    rows.forEach((row) => {
      const { fillS, fillH } = els(row);
      gsap.set(fillS, { scaleY: 0, transformOrigin: "top" });
      gsap.set(fillH, { scaleY: 0, transformOrigin: "center" });
    });

    // ── Instant-clear helper ──────────────────────────────────────
    // Used for rows that were never the active row (no fill to animate away).
    function snapDark(row) {
      if (!row) return;
      const { fillS, fillH, name, blurb, tags } = els(row);
      gsap.killTweensOf([fillS, fillH, name, blurb, tags]);
      gsap.set(fillS, { scaleY: 0 });
      gsap.set(fillH, { scaleY: 0 });
      row.dataset.scrollActive = "false";
      if (row.dataset.hovered !== "true") {
        gsap.set(name,  { clearProps: "color" });
        gsap.set(blurb, { clearProps: "color" });
        gsap.set(tags,  { clearProps: "color" });
      }
    }

    // ── Directional pass ──────────────────────────────────────────
    // The white "travels" from `fromRow` into `toRow`.
    //
    // Going DOWN: fromRow's fill drains toward its BOTTOM border
    //             (transformOrigin:"bottom", scaleY 1→0 = top edge falls down).
    //             toRow's fill grows from its TOP border downward
    //             (transformOrigin:"top", scaleY 0→1).
    //   At the shared border both fills are present simultaneously —
    //   creating one continuous white band that slides from row to row.
    //
    // Going UP:   mirrors the same logic in reverse.
    function passToRow(fromRow, toRow, dir) {
      const fromOrigin = dir === "down" ? "bottom" : "top";
      const toOrigin   = dir === "down" ? "top"    : "bottom";

      // Instantly dark every unrelated row
      rows.forEach((r) => {
        if (r !== fromRow && r !== toRow) snapDark(r);
      });

      // Smooth outgoing wipe on the leaving row
      if (fromRow) {
        const { fillS, fillH, name, blurb, tags } = els(fromRow);
        gsap.killTweensOf([fillS, fillH, name, blurb, tags]);
        fromRow.dataset.scrollActive = "false";
        gsap.set(fillH, { scaleY: 0 });
        gsap.to(fillS, {
          scaleY: 0,
          transformOrigin: fromOrigin,
          duration: 0.50,
          ease: "power2.in",
          overwrite: true,
        });
        if (fromRow.dataset.hovered !== "true") {
          gsap.to(name,  { color: DARK.name,  duration: 0.35, ease: "power2.out", overwrite: true });
          gsap.to(blurb, { color: DARK.blurb, duration: 0.35, ease: "power2.out", overwrite: true });
          gsap.to(tags,  { color: DARK.tags,  duration: 0.35, ease: "power2.out", overwrite: true });
        }
      }

      // Smooth incoming wipe on the entering row
      toRow.dataset.scrollActive = "true";
      const { fillS: tFS, name: tN, blurb: tB, tags: tT } = els(toRow);
      gsap.killTweensOf(tFS);
      gsap.to(tFS, {
        scaleY: 1,
        transformOrigin: toOrigin,
        duration: 0.55,
        ease: "power3.out",
        overwrite: true,
      });
      if (toRow.dataset.hovered !== "true") {
        gsap.to(tN, { color: LIGHT.name,  duration: 0.38, ease: "power2.out", overwrite: true });
        gsap.to(tB, { color: LIGHT.blurb, duration: 0.38, ease: "power2.out", overwrite: true });
        gsap.to(tT, { color: LIGHT.tags,  duration: 0.38, ease: "power2.out", overwrite: true });
      }
    }

    // ── GSAP ticker — runs every rAF frame, synced with Lenis ─────
    const trackScroll = () => {
      // Hover takes full priority — scroll tracker stands down
      if (rows.some((r) => r.dataset.hovered === "true")) return;

      const center = window.innerHeight / 2;
      const box    = list.getBoundingClientRect();

      // List not overlapping viewport centre → clear everything
      if (box.top > center || box.bottom < center) {
        if (active) { snapDark(active); active = null; }
        return;
      }

      // Find row closest to viewport centre
      let closest = null;
      let minDist  = Infinity;
      rows.forEach((row) => {
        const r    = row.getBoundingClientRect();
        const dist = Math.abs((r.top + r.height / 2) - center);
        if (dist < minDist) { minDist = dist; closest = row; }
      });

      if (closest !== active) {
        const prevIdx = active  ? rows.indexOf(active)  : -1;
        const nextIdx = closest ? rows.indexOf(closest) : -1;
        const dir     = nextIdx >= prevIdx ? "down" : "up";

        const prev = active;
        active = closest;

        if (closest) passToRow(prev, closest, dir);
        else          snapDark(prev);
      }
    };

    gsap.ticker.add(trackScroll);
    cleanup.push(() => gsap.ticker.remove(trackScroll));

    // ── Hover: TV switching on ────────────────────────────────────
    rows.forEach((row, i) => {
      const { fillH, link, name, blurb, tags } = els(row);

      const onEnter = () => {
        row.dataset.hovered = "true";
        const scrollOn = row.dataset.scrollActive === "true";

        if (!scrollOn) {
          // Instantly clear every other fill before the TV wipe
          rows.forEach((r) => { if (r !== row) snapDark(r); });

          // CRT scan-line snap → window expand
          gsap.killTweensOf(fillH);
          gsap.timeline()
            .set(fillH, { scaleY: 0, transformOrigin: "center" })
            .to(fillH, { scaleY: 0.014, duration: 0.06, ease: "power4.out" })
            .to(fillH, { scaleY: 1,     duration: 0.46, ease: "expo.out"   })
            .to(name,  { color: LIGHT.name,  duration: 0.30, ease: "power2.out" }, "<0.14")
            .to(blurb, { color: LIGHT.blurb, duration: 0.30, ease: "power2.out" }, "<")
            .to(tags,  { color: LIGHT.tags,  duration: 0.30, ease: "power2.out" }, "<")
            .to(link,  { paddingLeft: "24px", duration: 0.44, ease: "power3.out" }, 0);
        } else {
          // Row already white from scroll — just indent
          gsap.to(link, { paddingLeft: "24px", duration: 0.44, ease: "power3.out" });
        }

        // Dim every other row
        rows.forEach((sib, j) => {
          if (j !== i) gsap.to(sib.querySelector("a"), { opacity: 0.30, duration: 0.28 });
        });
      };

      const onLeave = () => {
        row.dataset.hovered = "false";
        const scrollOn = row.dataset.scrollActive === "true";

        if (!scrollOn) {
          // Collapse hover fill + restore dark palette
          gsap.timeline()
            .to(fillH, { scaleY: 0,    duration: 0.36, ease: "power3.in"  })
            .to(link,  { paddingLeft: "8px",      duration: 0.38, ease: "power3.out" }, "<")
            .to(name,  { color: DARK.name,  duration: 0.26, ease: "power2.out" }, "<0.06")
            .to(blurb, { color: DARK.blurb, duration: 0.26, ease: "power2.out" }, "<")
            .to(tags,  { color: DARK.tags,  duration: 0.26, ease: "power2.out" }, "<");
        } else {
          // Row stays white from scroll — just silently remove hover fill and ease indent back
          gsap.set(fillH, { scaleY: 0 });
          gsap.to(link, { paddingLeft: "8px", duration: 0.38, ease: "power3.out" });
        }

        // Restore sibling opacity
        rows.forEach((sib, j) => {
          if (j !== i) gsap.to(sib.querySelector("a"), { opacity: 1, duration: 0.28 });
        });
        // Scroll tracker resumes on next tick (anyHovered check will pass)
      };

      row.addEventListener("mouseenter", onEnter);
      row.addEventListener("mouseleave", onLeave);
      cleanup.push(() => {
        row.removeEventListener("mouseenter", onEnter);
        row.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, []);

  return (
    <div className="work-list" ref={listRef}>
      <ul>
        {items.map((p) => {
          const company = p.tags[0];
          const date    = p.tags[1];
          const logo    = LOGO_MAP[company.toUpperCase()] ?? LOGO_MAP[company];
          const { start, end } = parseDateRange(date);

          return (
            <li
              key={p.id}
              className="work-list__item"
              data-scroll-active="false"
              data-hovered="false"
              data-cursor
            >
              <span className="work-list__fill-scroll" aria-hidden="true" />
              <span className="work-list__fill-hover"  aria-hidden="true" />
              <a href="#contact">

                {/* ── Col 1: Company identity ── */}
                <div className="work-list__company">
                  {logo ? (
                    <img src={logo} alt={company} className="work-list__logo" />
                  ) : (
                    <span className="work-list__name work-list__company-label">{company}</span>
                  )}
                </div>

                {/* ── Col 2: Timeline + role ── */}
                <div className="work-list__role-block">
                  <time className="work-list__when" dateTime={date.replace(/\s*—\s*/g, "/")}>
                    <span className="work-list__when-start">{start}</span>
                    {end && (
                      <>
                        <span className="work-list__when-tick" aria-hidden="true" />
                        <span className="work-list__when-end">{end}</span>
                      </>
                    )}
                  </time>
                  <span className="work-list__name work-list__role">{p.title}</span>
                </div>

                {/* ── Col 3: Blurb ── */}
                <span className="work-list__blurb">{p.blurb}</span>

              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Work section ─────────────────────────────────────────────────────────────
export default function Work() {
  return (
    <section className="section work" id="work">
      <p className="section__label">Experience</p>
      <Reveal as="words" className="section__heading">
      Good people. Interesting problems. Lots of learning.
      </Reveal>

      <HoverList items={FEATURED} />

      {/* <div className="work-grid">
        {SECONDARY.map((p) => (
          <Reveal key={p.title} className="work-card" data-cursor>
            <div className="work-card__media">
              <img src={p.img} alt={p.title} loading="lazy" />
            </div>
            <div className="work-card__head">
              <h3>{p.title}</h3>
              <span className="work-card__year">{p.year}</span>
            </div>
            <div className="work-card__tags">{p.tags.join(" / ")}</div>
            <p className="work-card__desc">{p.desc}</p>
            <a href="#contact" className="work-card__link">
              Launch Project →
            </a>
          </Reveal>
        ))}
      </div> */}
    </section>
  );
}
