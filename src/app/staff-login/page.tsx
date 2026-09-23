import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/admin" } = await searchParams;
  const nextPath = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (session) redirect(nextPath.startsWith("/admin") || nextPath.startsWith("/staff-feedback") ? nextPath.replace("/staff-feedback", "/admin/tech-support") : "/admin");
  return <AdminLogin nextPath={nextPath.replace("/staff-feedback", "/admin/tech-support")} />;
}
