import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FeedbackInbox } from "@/components/admin/FeedbackInbox";
import { listResourceFeedback } from "@/lib/resource-feedback";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export default async function AdminReportsPage() {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) redirect("/admin");
  const notes = (await listResourceFeedback()).filter((item) => item.type !== "tech-support" && item.type !== "site");
  return (
    <main id="main-content" className="admin-page">
      <p className="eyebrow">Directory</p>
      <h1>Resource reports</h1>
      <p className="admin-lede">Corrections visitors submitted about organizations in the public directory.</p>
      <FeedbackInbox
        items={notes}
        emptyTitle="No resource reports yet"
        emptyText="Directory correction forms will land here."
      />
    </main>
  );
}
