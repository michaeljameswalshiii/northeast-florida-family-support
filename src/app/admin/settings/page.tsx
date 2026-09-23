import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { configuredLoginIds, readStaffSession, staffCookieName } from "@/lib/staff-auth";

export default async function AdminSettingsPage() {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) redirect("/admin");
  const logins = configuredLoginIds();
  return (
    <main id="main-content" className="admin-page">
      <p className="eyebrow">Account</p>
      <h1>Settings</h1>
      <p className="admin-lede">Staff sign in with email and password. Passwords are stored only in Vercel environment variables.</p>
      <div className="admin-card">
        <h2>Signed in as</h2>
        <p>{session.email} ({session.role})</p>
      </div>
      <div className="admin-card">
        <h2>Configured logins</h2>
        <ul>
          {logins.map((login) => (
            <li key={`${login.role}-${login.username}`}><strong>{login.username}</strong> · {login.role}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
