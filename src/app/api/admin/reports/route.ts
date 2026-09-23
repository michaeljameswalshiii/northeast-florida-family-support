import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { buildSiteReport } from "@/lib/admin/visits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = request.nextUrl.searchParams.get("days") === "30" ? 30 : 7;
  try {
    return NextResponse.json(await buildSiteReport(days));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load report" }, { status: 500 });
  }
}
