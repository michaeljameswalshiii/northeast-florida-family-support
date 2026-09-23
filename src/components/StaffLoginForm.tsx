"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

export function StaffLoginForm({ nextPath = "/staff-feedback" }: { nextPath?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/staff-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      router.push(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="staff-login-card" onSubmit={submit}>
      <span className="staff-login-icon"><LockKeyhole size={24} /></span>
      <h1>Staff workspace access</h1>
      <p>Sign in to review clinic ratings, call notes, and visitor feedback.</p>
      <label className="field">
        Staff password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required autoFocus />
      </label>
      <button className="button primary" type="submit" disabled={busy || !password}>
        {busy ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={17} />} Sign in
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  );
}
