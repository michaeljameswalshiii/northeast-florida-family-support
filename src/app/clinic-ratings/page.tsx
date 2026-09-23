import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { ClinicRatingDesk } from "@/components/ClinicRatingDesk";
import { StaffLogoutButton } from "@/components/StaffLogoutButton";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { staffCookieName, verifyStaffSession } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "IDD Integrated Care Ratings",
  description: "Electronic rating scale for integrated medical, dental, and vision care used when calling specialty clinics that serve people with IDD.",
  robots: { index: false, follow: false },
};

export default async function ClinicRatingsPage() {
  const session = (await cookies()).get(staffCookieName())?.value;
  if (!(await verifyStaffSession(session))) redirect("/staff-login");
  return (
    <main id="main-content">
      <section className="directory-hero">
        <div className="directory-orb one" />
        <div className="directory-orb two" />
        <div className="shell">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to navigator</Link>
          <p className="eyebrow"><ClipboardCheck size={15} /> Arc St. Johns clinic calls</p>
          <h1>Rate integrated care <em>while you are on the phone.</em></h1>
          <p>
            Use this scale after or during a call with a potential medical, dental, or vision clinic.
            Open an existing clinic to update the same record the next time you call.
          </p>
          <div className="staff-hero-actions"><StaffLogoutButton /></div>
        </div>
      </section>
      <section className="section directory-section">
        <div className="shell">
          <ClinicRatingDesk />
        </div>
      </section>
    </main>
  );
}
