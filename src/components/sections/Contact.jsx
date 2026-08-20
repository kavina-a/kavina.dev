import { useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL, CONTACT_STEPS } from "../../data/site";
import { sendContactEmail } from "../../lib/sendContactEmail";
import "./sections.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentVia, setSentVia] = useState(null);
  const inputRef = useRef(null);
  const current = CONTACT_STEPS[step];

  useEffect(() => {
    if (current?.type === "text" || current?.type === "email" || current?.type === "textarea") {
      inputRef.current?.focus();
    }
  }, [step, current]);

  const validateStep = (value) => {
    const v = (value ?? answers[current.id] ?? "").trim();

    if (current.type === "textarea" && current.id === "message" && !v) {
      return "Write a short message before sending.";
    }
    if (current.type === "textarea") return true;
    if (!v) return "Please fill this in before continuing.";

    if (current.type === "email" && !EMAIL_RE.test(v)) {
      return "Enter a valid email address.";
    }

    return "";
  };

  const submitInquiry = async (finalAnswers) => {
    setSending(true);
    setError("");

    try {
      const result = await sendContactEmail(finalAnswers);
      setSentVia(result.method);
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const advance = (value) => {
    if (sending) return;

    const validationError = validateStep(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    const v = (value ?? answers[current.id] ?? "").trim();
    const nextAnswers = { ...answers, [current.id]: v };

    if (step < CONTACT_STEPS.length - 1) {
      setAnswers(nextAnswers);
      setStep(step + 1);
      return;
    }

    setAnswers(nextAnswers);
    submitInquiry(nextAnswers);
  };

  const onKey = (e) => {
    if (sending) return;

    if (e.key !== "Enter") return;

    if (current.type === "textarea") {
      if (e.shiftKey) return;
      e.preventDefault();
      advance();
      return;
    }

    e.preventDefault();
    advance();
  };

  return (
    <section className="section contact" id="contact">
      <div className="contact__header">
        <h2>Let's talk ideas</h2>
        <p>TO: KAVINA</p>
      </div>

      <div className="bot">
        <p className="bot__intro">
          Hey, I&apos;m probably not online right now.
          <br />
          Leave a message and I&apos;ll get back to you soon. <kbd>Hit Enter</kbd>
          {CONTACT_EMAIL && (
            <>
              <br />
              Or write{" "}
              <a className="bot__mail" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </>
          )}
        </p>

        {CONTACT_STEPS.slice(0, step).map((s) => (
          <p className="bot__history" key={s.id}>
            <span>{s.label}</span> <strong>{answers[s.id]}</strong>
          </p>
        ))}

        {!done && (
          <div className="bot__step" key={current.id}>
            <label>{current.label}</label>

            {(current.type === "text" || current.type === "email") && (
              <input
                ref={inputRef}
                type={current.type}
                placeholder={current.placeholder}
                value={answers[current.id] || ""}
                onChange={(e) => {
                  setError("");
                  setAnswers((a) => ({ ...a, [current.id]: e.target.value }));
                }}
                onKeyDown={onKey}
                disabled={sending}
              />
            )}

            {current.type === "textarea" && (
              <textarea
                ref={inputRef}
                placeholder={current.placeholder}
                value={answers[current.id] || ""}
                onChange={(e) => {
                  setError("");
                  setAnswers((a) => ({ ...a, [current.id]: e.target.value }));
                }}
                onKeyDown={onKey}
                disabled={sending}
              />
            )}

            {current.type === "chips" && (
              <div className="bot__chips">
                {current.options.map((o) => (
                  <button
                    key={o}
                    className={answers[current.id] === o ? "is-on" : ""}
                    onClick={() => advance(o)}
                    disabled={sending}
                    data-cursor
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="bot__error">{error}</p>}

            {current.type !== "chips" && (
              <button
                className="bot__next"
                onClick={() => advance()}
                disabled={sending}
                data-cursor
              >
                {sending
                  ? "Sending…"
                  : step === CONTACT_STEPS.length - 1
                    ? "Send to Kavina ↵"
                    : "Enter ↵"}
              </button>
            )}
          </div>
        )}

        {done && (
          <div className="bot__success">
            {sentVia === "mailto" ? (
              <>
                <p>Almost there.</p>
                <p>
                  Your email app should have opened with everything filled in — hit
                  send. Or write{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
                  directly.
                </p>
              </>
            ) : (
              <>
                <p>Sent.</p>
                <p>I&apos;ll read this and get back to you at {answers.email}.</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
