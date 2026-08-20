function appendFields(body, fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === "") continue;
    body.append(key, String(value));
  }
}

function isSuccess(data) {
  return data?.success === true || data?.success === "true";
}

/**
 * Delivers mail through FormSubmit from the browser.
 * Inbox comes from env — never rendered in the page.
 */
export async function submitInbox(fields) {
  const inbox = import.meta.env.VITE_CONTACT_EMAIL;
  if (!inbox) {
    throw new Error("Could not send your message. Please try again.");
  }

  const body = new FormData();
  appendFields(body, {
    name: fields.name || "kavina.me",
    email: fields.email || "noreply@kavina.me",
    message: fields.message || "",
    _subject: fields.subject || "Message from kavina.me",
    _captcha: "false",
    _template: "table",
  });

  const res = await fetch(`https://formsubmit.co/ajax/${inbox}`, {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => ({}));

  if (isSuccess(data)) return { method: "email" };

  // First-time FormSubmit holds the message until the inbox is activated.
  if (/activat/i.test(data.message || "")) {
    throw new Error("Inbox is still being set up. Please try again in a minute.");
  }

  throw new Error(data.message || "Could not send your message. Please try again.");
}

/** @deprecated use submitInbox */
export const submitWeb3Form = submitInbox;
