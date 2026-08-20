import { CONTACT_EMAIL } from "../data/site";

/**
 * Web3Forms free-tier rejects JSON POSTs (CORS preflight / Cloudflare).
 * FormData is a "simple" request — no OPTIONS — so the browser can actually
 * deliver the email.
 */
export async function submitWeb3Form(fields) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) return { method: "mailto" };

  const body = new FormData();
  body.append("access_key", accessKey);
  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === "") continue;
    body.append(key, String(value));
  }

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Could not send. Try again.");
  }

  return { method: "email" };
}

export function openMailto({ subject, body }) {
  const params = new URLSearchParams({ subject, body });
  window.location.href = `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  return { method: "mailto" };
}
