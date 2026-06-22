import { CONTACT_EMAIL } from "../data/site";

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
 * VITE_WEB3FORMS_ACCESS_KEY is set. Otherwise opens a pre-filled mail draft.
 */
export async function sendVoiceLead(lead) {
  const contact = lead.contact?.trim();
  if (!contact) {
    throw new Error("Contact email or phone is required.");
  }

  const subject = `Voice lead — ${lead.name?.trim() || contact}`;
  const message = formatVoiceLeadMessage(lead);
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  const replyEmail = lead.contact_type === "email" ? contact : undefined;

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
        from_name: lead.name?.trim() || "Voice agent lead",
        email: replyEmail || CONTACT_EMAIL,
        replyto: replyEmail,
        message,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Could not send the lead. Try again.");
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
