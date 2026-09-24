import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FeedbackInbox } from "@/components/admin/FeedbackInbox";
import { listResourceFeedback } from "@/lib/resource-feedback";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export default async function AdminTechSupportPage() {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) redirect("/admin");
  const notes = (await listResourceFeedback()).filter((item) => item.type === "tech-support" || item.type === "site");
  return (
    <main id="main-content" className="admin-page">
      <p className="eyebrow">Visitor notes</p>
      <h1>Tech support requests</h1>
      <p className="admin-lede">{notes.length} saved {notes.length === 1 ? "note" : "notes"}. New submissions also email the project inbox.</p>
      <FeedbackInbox
        items={notes}
        enableStatus
        emptyTitle="No tech support notes yet"
        emptyText="When visitors send a beta note, it will appear here with screenshots and documents."
      />
    </main>
  );
}
