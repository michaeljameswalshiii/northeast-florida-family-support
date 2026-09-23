import { NextRequest, NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/feedback-email";
import { saveResourceFeedback } from "@/lib/resource-feedback";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (String(body.company || "")) return NextResponse.json({ ok: true });
    const record = await saveResourceFeedback(body);
    await sendFeedbackEmail(record).catch((error) => console.error("[feedback-email]", error));
    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit this report." }, { status: 400 });
  }
}
