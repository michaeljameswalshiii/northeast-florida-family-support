import { NextRequest, NextResponse } from "next/server";
import { saveResourceFeedback } from "@/lib/resource-feedback";

async function sendNotification(record: Record<string, unknown>) {
  const recipient = process.env.FEEDBACK_TO_EMAIL || "michaeljameswalshiii@gmail.com";
  const subject = `Navigator feedback: ${String(record.issue || "New submission")}`;
  const text = [
    `Type: ${String(record.issue || "")}`,
    `Details: ${String(record.details || "")}`,
    `Contact: ${String(record.contact || "Not provided")}`,
    `Page: ${String(record.page || record.resource || "Not provided")}`,
    "Open the Navigator staff feedback area to review screenshots.",
  ].join("\n\n");
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.FEEDBACK_FROM_EMAIL || "Navigator Feedback <onboarding@resend.dev>", to: [recipient], subject, text }) });
  } else {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ _subject: subject, _template: "table", message: text }) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (String(body.company || "")) return NextResponse.json({ ok: true });
    const record = await saveResourceFeedback(body);
    await sendNotification(record as unknown as Record<string, unknown>).catch((error) => console.error("[feedback-email]", error));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit this report." }, { status: 400 });
  }
}
