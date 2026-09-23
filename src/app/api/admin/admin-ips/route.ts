import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { addAdminIp } from "@/lib/admin/visits";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    const items = await addAdminIp(String(body.ip || ""), String(body.label || "Staff / admin"));
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not mark that IP" }, { status: 400 });
  }
}
