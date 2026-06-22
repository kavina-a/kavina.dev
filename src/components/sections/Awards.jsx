import Reveal from "../ui/Reveal";
import { AWARDS } from "../../data/site";
import "./sections.css";

export default function Awards() {
  return (
    <section className="section awards" id="awards">
      <p className="section__label">Awards &amp; Recognition</p>
      <Reveal as="words" className="section__heading">
        To truly stand out, you have to break away from the ordinary.
      </Reveal>

      <ul className="awards__list">
        {AWARDS.map((a) => (
          <Reveal key={a.name}>
            <li className="awards__item">
              <h3>{a.name}</h3>
              <div className="awards__counts">
                {a.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
