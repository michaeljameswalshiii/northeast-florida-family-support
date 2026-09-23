import Link from "next/link";
import { cookies } from "next/headers";
import { BarChart3, ClipboardCheck, Inbox, MapPin } from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { listClinicRatings } from "@/lib/clinic-ratings";
import { listResourceFeedback } from "@/lib/resource-feedback";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export default async function AdminHomePage() {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) return <AdminLogin nextPath="/admin" />;

  const [notes, clinics] = await Promise.all([listResourceFeedback(), listClinicRatings()]);
  const tech = notes.filter((item) => item.type === "tech-support" || item.type === "site");
  const reports = notes.filter((item) => item.type !== "tech-support" && item.type !== "site");

  return (
    <main id="main-content" className="admin-page">
      <p className="eyebrow">Overview</p>
      <h1>Admin desk</h1>
      <p className="admin-lede">Review visitor notes, clinic ratings, and resource corrections in one place.</p>
      <div className="admin-stat-grid admin-stat-grid-wide">
        <Link href="/admin/tech-support" className="admin-stat">
          <Inbox size={22} />
          <strong>{tech.length}</strong>
          <span>Tech support notes</span>
        </Link>
        <Link href="/admin/directory" className="admin-stat">
          <Inbox size={22} />
          <strong>{reports.length}</strong>
          <span>Resource reports</span>
        </Link>
        <Link href="/admin/clinics" className="admin-stat">
          <ClipboardCheck size={22} />
          <strong>{clinics.length}</strong>
          <span>Clinic ratings</span>
        </Link>
        <Link href="/admin/reports" className="admin-stat">
          <BarChart3 size={22} />
          <strong>7 / 30</strong>
          <span>Traffic reports</span>
        </Link>
        <Link href="/admin/visitors" className="admin-stat">
          <MapPin size={22} />
          <strong>IPs</strong>
          <span>Visitor addresses</span>
        </Link>
      </div>
    </main>
  );
}
