import Reveal from "../ui/Reveal";
import { SERVICES } from "../../data/site";
import "./sections.css";

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="about__eyebrow">
        <span>(HUMAN) THINKERS</span>
        <span>DIGITAL MAKERS</span>
      </div>

      <Reveal as="words" className="about__lead">
        We push the limits of digital innovation, exploring emerging technologies
        to craft visually striking, futuristic, and immersive experiences.
      </Reveal>

      <div className="about__body">
        <Reveal>
          <h3>
            A forward-thinking creative practice blending design and technology.
          </h3>
        </Reveal>
        <Reveal delay={0.1}>
          <p>
            Innovators, designers, and developers collaborating with global brands
            to create unforgettable digital experiences — from immersive websites
            to interactive installations — challenging the status quo to deliver
            work that is as functional as it is beautiful.
          </p>
        </Reveal>
      </div>

      <div className="services">
        {SERVICES.map((g) => (
          <div className="services__group" key={g.title}>
            <h5>{g.title}</h5>
            <ul>
              {g.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
