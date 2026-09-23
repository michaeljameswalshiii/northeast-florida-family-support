import { NextResponse } from "next/server";
import { staffCookieName, staffCookieOptions } from "@/lib/staff-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(staffCookieName(), "", { ...staffCookieOptions(), maxAge: 0 });
  return response;
}
