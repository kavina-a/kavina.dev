import { CONTACT_EMAIL } from "../data/site";

export function formatContactMessage(answers) {
  return [
    `Name: ${answers.name || "—"}`,
    `Reply-to: ${answers.email || "—"}`,
    "",
    "Message:",
    answers.message?.trim() || "—",
  ].join("\n");
}

/**
 * Sends the inquiry to hi@kavina.me via Web3Forms when VITE_WEB3FORMS_ACCESS_KEY
 * is set. Otherwise opens the visitor's mail app with a pre-filled draft.
 */
export async function sendContactEmail(answers) {
  const subject = `Message from ${answers.name || "kavina.me"}`;
  const message = formatContactMessage(answers);
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

  if (accessKey) {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject,
        from_name: answers.name,
        email: answers.email,
        replyto: answers.email,
        message,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Could not send your message. Try again.");
    }

    return { method: "email" };
  }

  const params = new URLSearchParams({
    subject,
    body: message,
  });

  window.location.href = `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  return { method: "mailto" };
}
