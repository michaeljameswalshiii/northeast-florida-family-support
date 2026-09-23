"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Flag, Inbox, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useState } from "react";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/tech-support", label: "Tech support", icon: Inbox },
  { href: "/admin/reports", label: "Resource reports", icon: Flag },
  { href: "/admin/clinics", label: "Clinic ratings", icon: ClipboardCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/staff-auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <Link href="/admin" className="admin-brand">
          <BrandMark compact />
          <span>
            <strong>Navigator admin</strong>
            <small>Northeast Florida</small>
          </span>
        </Link>
        <nav aria-label="Admin">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={active ? "is-on" : ""}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-nav-foot">
          <p>{email}</p>
          <button type="button" onClick={() => void logout()} disabled={busy}>
            <LogOut size={16} /> {busy ? "Signing out…" : "Sign out"}
          </button>
          <Link href="/">Public site</Link>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
