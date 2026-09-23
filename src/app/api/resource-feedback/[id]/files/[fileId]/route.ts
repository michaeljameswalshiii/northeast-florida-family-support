import { NextResponse } from "next/server";
import { getFeedbackFile } from "@/lib/resource-feedback";
import { requestHasStaffSession } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string; fileId: string }> }) {
  if (!(await requestHasStaffSession(request))) {
    return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
  }
  try {
    const { id, fileId } = await context.params;
    const file = await getFeedbackFile(id, fileId);
    if (!file?.data) return NextResponse.json({ error: "File not found." }, { status: 404 });
    const base64 = file.data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${file.name.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load that file." }, { status: 500 });
  }
}
