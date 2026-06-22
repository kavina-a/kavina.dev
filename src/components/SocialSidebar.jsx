import "./SocialSidebar.css";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/in/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "X", href: "https://x.com/" },
];

export default function SocialSidebar() {
  return (
    <aside className="social-sidebar" aria-label="Social links">
      <div className="social-sidebar__links">
        {SOCIALS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="social-sidebar__link"
          >
            {label}
          </a>
        ))}
      </div>
      <span className="social-sidebar__line" aria-hidden="true" />
    </aside>
  );
}
