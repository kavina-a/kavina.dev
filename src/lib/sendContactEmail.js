import { submitInbox } from "./submitWeb3Form";

export function formatContactMessage(answers) {
  return [
    `Name: ${answers.name || "—"}`,
    `Reply-to: ${answers.email || "—"}`,
    "",
    "Message:",
    answers.message?.trim() || "—",
  ].join("\n");
}

export async function sendContactEmail(answers) {
  const result = await submitInbox({
    subject: `Message from ${answers.name || "kavina.me"}`,
    name: answers.name,
    email: answers.email,
    message: formatContactMessage(answers),
  });
  if (result.method !== "email") {
    throw new Error("Could not send your message. Please try again.");
  }
  return result;
}
