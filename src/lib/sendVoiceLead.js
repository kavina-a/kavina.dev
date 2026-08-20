import { submitInbox } from "./submitWeb3Form";

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

export async function sendVoiceLead(lead) {
  const contact = lead.contact?.trim();
  if (!contact) {
    throw new Error("Contact email or phone is required.");
  }

  const result = await submitInbox({
    subject: `Voice lead — ${lead.name?.trim() || contact}`,
    name: lead.name?.trim() || "Voice agent lead",
    email: lead.contact_type === "email" ? contact : undefined,
    message: formatVoiceLeadMessage(lead),
  });
  if (result.method !== "email") {
    throw new Error("Could not send the lead. Try again.");
  }
  return result;
}
