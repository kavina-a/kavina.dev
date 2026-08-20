import { submitWeb3Form, openMailto } from "./submitWeb3Form";

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
 * is set. Falls back to a pre-filled mail draft if the API is blocked or unset.
 */
export async function sendContactEmail(answers) {
  const subject = `Message from ${answers.name || "kavina.me"}`;
  const message = formatContactMessage(answers);

  try {
    const result = await submitWeb3Form({
      subject,
      name: answers.name,
      from_name: answers.name || "kavina.me",
      email: answers.email,
      replyto: answers.email,
      message,
    });
    if (result.method === "email") return result;
  } catch {
    // fall through to mailto
  }

  return openMailto({ subject, body: message });
}
