import 'server-only';
import nodemailer from 'nodemailer';

// Sends the website's own emails (admin alerts, notices to members) through one of:
// - Resend (https://resend.com): RESEND_API_KEY + EMAIL_FROM, once the club domain is verified there.
// - The club Gmail: GMAIL_USER + GMAIL_APP_PASSWORD (a Google app password). Gmail only sends
//   as the signed-in account, so the From address is always GMAIL_USER.
// Resend is used when both are set.

const resendReady = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
const gmailReady = () => !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD;

export const emailConfigured = () => resendReady() || gmailReady();

type Mail = { to: string[]; subject: string; text: string; html?: string; bcc?: boolean };

const SENDER_NAME = 'Prague Spartans Cricket Club';
// Gmail allows 100 recipients per message; stay well under it.
const BATCH = 45;

export async function sendEmail({ to, subject, text, html, bcc }: Mail) {
  if (!emailConfigured()) throw new Error('Email is not set up yet');
  // Large lists go out as blind copies in batches, so members don't see each other's addresses.
  const batches = bcc ? Array.from({ length: Math.ceil(to.length / BATCH) }, (_, i) => to.slice(i * BATCH, i * BATCH + BATCH)) : [to];
  if (resendReady()) return sendWithResend(batches, { subject, text, html, bcc });
  return sendWithGmail(batches, { subject, text, html, bcc });
}

type Content = Pick<Mail, 'subject' | 'text' | 'html' | 'bcc'>;

async function sendWithResend(batches: string[][], { subject, text, html, bcc }: Content) {
  const from = process.env.EMAIL_FROM!;
  for (const batch of batches) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bcc ? { from, to: [from.replace(/^.*<|>$/g, '')], bcc: batch, subject, text, html } : { from, to: batch, subject, text, html }),
    });
    if (!res.ok) throw new Error(`Email service error ${res.status}: ${await res.text()}`);
  }
}

async function sendWithGmail(batches: string[][], { subject, text, html, bcc }: Content) {
  const user = process.env.GMAIL_USER!.trim();
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    // App passwords are shown with spaces; Google accepts them either way.
    auth: { user, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, '') },
  });
  const from = { name: SENDER_NAME, address: user };
  try {
    for (const batch of batches) {
      await transport.sendMail(bcc ? { from, to: from, bcc: batch, subject, text, html } : { from, to: batch, subject, text, html });
    }
  } finally {
    transport.close();
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
