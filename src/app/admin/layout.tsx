import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) return children;
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
