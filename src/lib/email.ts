import 'server-only';

// Sends email through Resend (https://resend.com). Configured with RESEND_API_KEY and
// EMAIL_FROM (e.g. "Prague Spartans <noreply@praguespartanscc.com>").

export const emailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

type Mail = { to: string[]; subject: string; text: string; html?: string; bcc?: boolean };

export async function sendEmail({ to, subject, text, html, bcc }: Mail) {
  if (!emailConfigured()) throw new Error('Email is not set up yet');
  const from = process.env.EMAIL_FROM!;
  // Large lists go out as blind copies in chunks, so members don't see each other's addresses.
  const chunks = bcc ? Array.from({ length: Math.ceil(to.length / 45) }, (_, i) => to.slice(i * 45, i * 45 + 45)) : [to];
  for (const chunk of chunks) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bcc ? { from, to: [from.replace(/^.*<|>$/g, '')], bcc: chunk, subject, text, html } : { from, to: chunk, subject, text, html }),
    });
    if (!res.ok) throw new Error(`Email service error ${res.status}: ${await res.text()}`);
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
