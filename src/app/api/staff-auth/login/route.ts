import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createStaffSession, staffAuthConfigured, staffCookieName, staffCookieOptions } from "@/lib/staff-auth";

function matchesPassword(value: string, expected: string) {
  const supplied = Buffer.from(value);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export async function POST(request: NextRequest) {
  if (!staffAuthConfigured()) {
    return NextResponse.json({ error: "Staff access has not been configured by the site administrator." }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  if (!matchesPassword(password, process.env.STAFF_ACCESS_PASSWORD?.trim() || "")) {
    return NextResponse.json({ error: "That staff password is not correct." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(staffCookieName(), await createStaffSession(), staffCookieOptions());
  return response;
}
