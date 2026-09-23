import { NextRequest, NextResponse } from "next/server";
import { clientIpFromHeaders, geoFromHeaders, lookupGeoFallback, recordSiteVisit } from "@/lib/admin/visits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const recent = new Map<string, number>();

export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);
  const body = await request.json().catch(() => ({}));
  const path = String(body.path || "/");
  if (path.startsWith("/admin") || path.startsWith("/api/")) return NextResponse.json({ ok: true, skipped: true });
  const key = `${ip}|${path}`;
  if (Date.now() - (recent.get(key) || 0) < 3000) return NextResponse.json({ ok: true, skipped: true });
  recent.set(key, Date.now());
  try {
    let geo = geoFromHeaders(request.headers);
    if (!geo.city && !geo.country) geo = { ...geo, ...(await lookupGeoFallback(ip)) };
    await recordSiteVisit({
      path,
      ip,
      geo,
      referrer: String(body.referrer || ""),
      userAgent: request.headers.get("user-agent") || "",
      event: "page_view",
    });
  } catch (error) {
    console.error("[site-pulse]", error);
  }
  return NextResponse.json({ ok: true });
}
