import { cookies } from "next/headers";
import { readStaffSession, requestHasStaffSession, staffCookieName, verifyStaffSession } from "@/lib/staff-auth";

export async function requireAdmin(request?: Request) {
  if (request) return requestHasStaffSession(request);
  const value = (await cookies()).get(staffCookieName())?.value;
  return verifyStaffSession(value);
}

export async function getAdminSession() {
  const value = (await cookies()).get(staffCookieName())?.value;
  const session = await readStaffSession(value);
  if (!session) return { ok: false as const };
  return { ok: true as const, email: session.email };
}
