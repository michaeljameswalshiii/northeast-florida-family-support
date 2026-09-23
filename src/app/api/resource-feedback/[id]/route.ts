import { NextResponse } from "next/server";
import { deleteResourceFeedback } from "@/lib/resource-feedback";
import { requestHasStaffSession } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requestHasStaffSession(request))) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
  try {
    const { id } = await context.params;
    await deleteResourceFeedback(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete this note." }, { status: 400 });
  }
}
