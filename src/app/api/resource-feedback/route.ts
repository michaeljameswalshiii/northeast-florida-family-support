import { NextRequest, NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/feedback-email";
import { markFeedbackEmailStatus, saveResourceFeedback } from "@/lib/resource-feedback";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (String(body.company || "")) return NextResponse.json({ ok: true });
    const record = await saveResourceFeedback(body);
    try {
      const emailStatus = await sendFeedbackEmail(record);
      await markFeedbackEmailStatus(record, emailStatus);
    } catch (error) {
      console.error("[feedback-email]", error);
      await markFeedbackEmailStatus(record, "failed");
    }
    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit this report." }, { status: 400 });
  }
}
