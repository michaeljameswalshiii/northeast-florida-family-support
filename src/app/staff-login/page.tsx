import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StaffLoginForm } from "@/components/StaffLoginForm";
import { staffCookieName, verifyStaffSession } from "@/lib/staff-auth";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/staff-feedback" } = await searchParams;
  const nextPath = next.startsWith("/") && !next.startsWith("//") ? next : "/staff-feedback";
  const session = (await cookies()).get(staffCookieName())?.value;
  if (await verifyStaffSession(session)) redirect(nextPath);
  return <main id="main-content" className="staff-login-page"><StaffLoginForm nextPath={nextPath} /></main>;
}
