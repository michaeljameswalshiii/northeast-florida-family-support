"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ClipboardCheck, Flag, Inbox, LayoutDashboard, LogOut, MapPin, Settings, Share2 } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useState } from "react";

const NAV = [
  {
    label: "Desk",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/tech-support", label: "Tech support", icon: Inbox },
    ],
  },
  {
    label: "Insight",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/visitors", label: "Visitors", icon: MapPin },
    ],
  },
  {
    label: "Work",
    items: [
      { href: "/admin/directory", label: "Resource reports", icon: Flag },
      { href: "/admin/clinics", label: "Clinic ratings", icon: ClipboardCheck },
      { href: "/admin/social", label: "Social media", icon: Share2 },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
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
            <strong>Navigator</strong>
            <small>Admin desk</small>
          </span>
        </Link>
        {NAV.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <p>{group.label}</p>
            <nav aria-label={group.label}>
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={active ? "is-on" : ""}>
                    <Icon size={16} /> {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
        <div className="admin-nav-foot">
          <p>{email}</p>
          <button type="button" onClick={() => void logout()} disabled={busy}>
            <LogOut size={16} /> {busy ? "Signing out…" : "Sign out"}
          </button>
          <Link href="/">View public site</Link>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
