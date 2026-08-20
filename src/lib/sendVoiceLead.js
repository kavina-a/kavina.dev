import { CONTACT_EMAIL } from "../data/site";
import { submitWeb3Form, openMailto } from "./submitWeb3Form";

export function formatVoiceLeadMessage(lead) {
  return [
    `Source: Voice agent (kavina.me)`,
    `Name: ${lead.name?.trim() || "—"}`,
    `Contact (${lead.contact_type || "unknown"}): ${lead.contact?.trim() || "—"}`,
    "",
    "What it's regarding:",
    lead.topic?.trim() || "—",
    "",
    "How they'd like to proceed:",
    lead.how_to_proceed?.trim() || "—",
    "",
    "Conversation summary:",
    lead.conversation_summary?.trim() || "—",
  ].join("\n");
}

/**
 * Sends a voice-agent lead to hi@kavina.me via Web3Forms when
 * VITE_WEB3FORMS_ACCESS_KEY is set. Falls back to a pre-filled mail draft.
 */
export async function sendVoiceLead(lead) {
  const contact = lead.contact?.trim();
  if (!contact) {
    throw new Error("Contact email or phone is required.");
  }

  const subject = `Voice lead — ${lead.name?.trim() || contact}`;
  const message = formatVoiceLeadMessage(lead);
  const replyEmail = lead.contact_type === "email" ? contact : undefined;

  try {
    const result = await submitWeb3Form({
      subject,
      name: lead.name?.trim() || "Voice agent lead",
      from_name: lead.name?.trim() || "Voice agent lead",
      email: replyEmail || CONTACT_EMAIL,
      replyto: replyEmail,
      message,
    });
    if (result.method === "email") return result;
  } catch {
    // fall through to mailto
  }

  return openMailto({ subject, body: message });
}
