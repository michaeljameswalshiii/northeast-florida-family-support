import { NextRequest, NextResponse } from "next/server";
import { createStaffSession, staffAuthConfigured, staffCookieName, staffCookieOptions, verifyStaffLogin } from "@/lib/staff-auth";

export async function POST(request: NextRequest) {
  if (!staffAuthConfigured()) {
    return NextResponse.json({ error: "Staff access has not been configured by the site administrator." }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  const username = typeof body.email === "string" ? body.email : typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const account = await verifyStaffLogin(username, password);
  if (!account) {
    return NextResponse.json({ error: "That email or password is not correct." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, email: account.email });
  response.cookies.set(staffCookieName(), await createStaffSession(account.email, account.role), staffCookieOptions());
  return response;
}
