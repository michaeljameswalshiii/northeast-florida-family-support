import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getVisitSnapshot, listVisits } from "@/lib/admin/visits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = request.nextUrl.searchParams.get("days") === "30" ? 30 : 7;
  try {
    const [items, snapshot] = await Promise.all([listVisits({ days, limit: 120 }), getVisitSnapshot(days)]);
    return NextResponse.json({
      days,
      items,
      uniqueVisitors: snapshot.uniqueVisitors,
      uniqueLocations: snapshot.uniqueLocations,
      topCities: snapshot.topCities,
      topCountries: snapshot.topCountries,
      series: snapshot.series,
      adminVisits: snapshot.adminVisits,
      uniqueAdmin: snapshot.uniqueAdmin,
      note: "City-level location from the visitor IP. Street addresses are not available. Staff / admin IPs stay in this list in gold and are left out of report totals.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load visitors" }, { status: 500 });
  }
}
