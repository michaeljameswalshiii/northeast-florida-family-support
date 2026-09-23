const RECIPIENT = process.env.FEEDBACK_TO_EMAIL?.trim() || "michaeljameswalshiii@gmail.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://northeast-florida-family-support.vercel.app";

export async function sendFeedbackEmail(record: {
  issue: string;
  details: string;
  contact?: string;
  page?: string;
  resource?: string;
  images?: unknown[];
}) {
  const subject = `NEFL Navigator tech support: ${record.issue || "New note"}`;
  const imageCount = Array.isArray(record.images) ? record.images.length : 0;
  const text = [
    "A beta tech-support note was submitted on the Northeast Florida Support Navigator.",
    `Type: ${record.issue || ""}`,
    `Details: ${record.details || ""}`,
    `Contact: ${record.contact || "Not provided"}`,
    `Page: ${record.page || record.resource || "Not provided"}`,
    `Images: ${imageCount}`,
    `Review the saved note: ${SITE}/staff-feedback`,
  ].join("\n\n");

  const errors: string[] = [];
  if (process.env.RESEND_API_KEY) {
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
    if (response.ok) return;
    errors.push(`Resend ${response.status}`);
  }

  const formsubmit = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(RECIPIENT)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: subject,
      _template: "table",
      _captcha: "false",
      name: "NEFL Support Navigator",
      email: record.contact || "noreply@northeast-florida-family-support.vercel.app",
      message: text,
    }),
  });
  if (formsubmit.ok) return;
  errors.push(`FormSubmit ${formsubmit.status}`);
  throw new Error(errors.join("; ") || "Unable to send the tech-support email.");
}
