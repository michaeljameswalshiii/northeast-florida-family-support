import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VisitorsDesk } from "@/components/admin/VisitorsDesk";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export default async function AdminVisitorsPage() {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) redirect("/admin");
  return (
    <main id="main-content" className="admin-page">
      <VisitorsDesk />
    </main>
  );
}
