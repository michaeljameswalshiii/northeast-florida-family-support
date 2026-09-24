import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

const RECIPIENT = process.env.FEEDBACK_TO_EMAIL?.trim() || "michaeljameswalshiii@gmail.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://northeast-florida-family-support.vercel.app";

function fromAddress() {
  const raw = process.env.FEEDBACK_FROM_EMAIL?.trim() || "";
  const bracket = raw.match(/<([^>]+)>/);
  if (bracket?.[1]) return bracket[1];
  if (raw.includes("@") && !raw.includes("resend.dev")) return raw;
  return RECIPIENT;
}

function emailBody(record: {
  issue: string;
  details: string;
  contact?: string;
  page?: string;
  resource?: string;
  images?: Array<{ name?: string; contentType?: string }>;
}) {
  const files = Array.isArray(record.images) ? record.images : [];
  return [
    "A new tech-support note was opened on the Northeast Florida Support Navigator.",
    "Status: Open",
    `Type: ${record.issue || ""}`,
    `Details: ${record.details || ""}`,
    `Contact: ${record.contact || "Not provided"}`,
    `Page: ${record.page || record.resource || "Not provided"}`,
    `Attachments: ${files.length ? files.map((file) => file.name || file.contentType || "file").join(", ") : "None"}`,
    `Open the note: ${SITE}/admin/tech-support`,
  ].join("\n\n");
}

async function sendWithResend(subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FEEDBACK_FROM_EMAIL || "Navigator Feedback <onboarding@resend.dev>",
      to: [RECIPIENT],
      subject,
      text,
    }),
  });
  return response.ok;
}

async function sendWithSes(subject: string, text: string) {
  if (!process.env.AWS_ACCESS_KEY_ID?.trim() || !process.env.AWS_SECRET_ACCESS_KEY?.trim()) return false;
  const region = process.env.AWS_REGION || "us-east-1";
  const hostname = `email.${region}.amazonaws.com`;
  const body = JSON.stringify({
    FromEmailAddress: fromAddress(),
    Destination: { ToAddresses: [RECIPIENT] },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Text: { Data: text, Charset: "UTF-8" } },
      },
    },
  });
  const signer = new SignatureV4({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
      sessionToken: process.env.AWS_SESSION_TOKEN?.trim() || undefined,
    },
    region,
    service: "ses",
    sha256: Sha256,
  });
  const signed = await signer.sign(new HttpRequest({
    method: "POST",
    protocol: "https:",
    hostname,
    path: "/v2/email/outbound-emails",
    headers: { host: hostname, "content-type": "application/json", accept: "application/json" },
    body,
  }));
  const response = await fetch(`https://${hostname}/v2/email/outbound-emails`, {
    method: "POST",
    headers: signed.headers as Record<string, string>,
    body,
  });
  return response.ok;
}

async function sendWithFormSubmit(subject: string, text: string, contact?: string) {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(RECIPIENT)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: subject,
      _template: "table",
      _captcha: "false",
      name: "NEFL Support Navigator",
      email: contact || "noreply@northeast-florida-family-support.vercel.app",
      message: text,
    }),
  });
  return response.ok;
}

export async function sendFeedbackEmail(record: {
  issue: string;
  details: string;
  contact?: string;
  page?: string;
  resource?: string;
  images?: Array<{ name?: string; contentType?: string }>;
}) {
  const subject = `NEFL Navigator tech support opened: ${record.issue || "New note"}`;
  const text = emailBody(record);
  if (await sendWithResend(subject, text)) return "resend";
  if (await sendWithSes(subject, text)) return "ses";
  if (await sendWithFormSubmit(subject, text, record.contact)) return "formsubmit";
  throw new Error("Unable to send the tech-support email.");
}
