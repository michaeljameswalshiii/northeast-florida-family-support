import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SocialHubClient } from "@/components/admin/SocialHubClient";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export default async function AdminSocialPage() {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) redirect("/admin");
  return (
    <main id="main-content" className="admin-page">
      <SocialHubClient />
    </main>
  );
}
