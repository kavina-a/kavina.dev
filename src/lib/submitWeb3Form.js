import { CONTACT_EMAIL } from "../data/site";

function appendFields(body, fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === "") continue;
    body.append(key, String(value));
  }
}

function isSuccess(data) {
  return data?.success === true || data?.success === "true";
}

async function postForm(url, fields) {
  const body = new FormData();
  appendFields(body, fields);
  const res = await fetch(url, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/**
 * Free inbox delivery from the browser (no server, no paid plan).
 *
 * FormSubmit.co first — it works from this network with no API key.
 * Web3Forms next, if a key is set. Mailto last.
 */
export async function submitWeb3Form(fields) {
  const subject = fields.subject || "Message from kavina.me";
  const name = fields.name || fields.from_name || "kavina.me";
  const email = fields.email || fields.replyto || CONTACT_EMAIL;
  const message = fields.message || "";

  try {
    if (!CONTACT_EMAIL) throw new Error("No inbox configured");
    const { data } = await postForm(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      name,
      email,
      message,
      _subject: subject,
      _captcha: "false",
      _template: "table",
    });
    if (isSuccess(data)) return { method: "email" };
  } catch {
    /* next provider */
  }

  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (accessKey) {
    try {
      const { res, data } = await postForm("https://api.web3forms.com/submit", {
        access_key: accessKey,
        subject,
        name,
        from_name: name,
        email,
        replyto: fields.replyto || email,
        message,
      });
      if (res.ok && isSuccess(data)) return { method: "email" };
    } catch {
      /* mailto */
    }
  }

  return { method: "mailto" };
}

export function openMailto({ subject, body }) {
  const params = new URLSearchParams({ subject, body });
  window.location.href = `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  return { method: "mailto" };
}
