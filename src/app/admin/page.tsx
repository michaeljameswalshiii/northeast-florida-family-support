import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { staffCookieName, verifyStaffSession } from "@/lib/staff-auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = (await cookies()).get(staffCookieName())?.value;
  redirect((await verifyStaffSession(session)) ? "/staff-feedback" : "/staff-login?next=/staff-feedback");
}
