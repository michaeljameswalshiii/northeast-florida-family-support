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
      <section className="directory-hero clinic-hero">
        <div className="directory-orb one" />
        <div className="directory-orb two" />
        <div className="shell clinic-hero-grid">
          <div>
            <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to navigator</Link>
            <p className="eyebrow"><ClipboardCheck size={15} /> Arc St. Johns clinic calls</p>
            <h1>Add a clinic, then rate care <em>while you are on the phone.</em></h1>
            <p>
              Start with the clinic name, address, photos, and access details. The nine-domain scale updates the same record after every outreach call.
            </p>
            <div className="staff-hero-actions"><StaffLogoutButton /></div>
          </div>
          <div className="clinic-hero-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/clinic-exterior.jpg" alt="Accessible clinic entrance with a ramp, bench, and palm" width={1280} height={720} />
            <span>Facility + access photos belong in the clinic record</span>
          </div>
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
