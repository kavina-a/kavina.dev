import { CLIENTS } from "../../data/site";
import "./sections.css";

export default function Clients() {
  const row = [...CLIENTS, ...CLIENTS];
  return (
    <section className="clients">
      <div className="marquee">
        <div className="marquee__track">
          {row.map((c, i) => (
            <span className="marquee__item" key={i}>
              {c}
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
