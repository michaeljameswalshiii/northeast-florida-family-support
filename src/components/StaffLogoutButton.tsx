"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function StaffLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch("/api/staff-auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/staff-login");
    router.refresh();
  }
  return <button className="button secondary" type="button" onClick={() => void logout()} disabled={busy}><LogOut size={16} /> {busy ? "Signing out…" : "Sign out"}</button>;
}
