import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/guard";
import { saveStaffPassword } from "@/lib/staff-passwords";
import { configuredLoginIds } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const known = configuredLoginIds().some((item) => item.username.toLowerCase() === username);
  if (!known) return NextResponse.json({ error: "That account is not on this desk." }, { status: 400 });
  if (session.email !== username && session.role !== "admin") {
    return NextResponse.json({ error: "Only an admin can reset another user’s password." }, { status: 403 });
  }
  try {
    await saveStaffPassword(username, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save that password." }, { status: 400 });
  }
}
