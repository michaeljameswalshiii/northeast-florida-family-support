"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminLogin({ nextPath = "/admin" }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      router.push(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="staff-login-page">
      <form className="staff-login-card" onSubmit={submit}>
        <span className="staff-login-icon"><LockKeyhole size={24} /></span>
        <h1>Admin desk</h1>
        <p>Sign in with email and password to review tech support notes, clinic records, and resource reports.</p>
        <label className="field">
          Email or staff ID
          <input type="text" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required autoFocus />
        </label>
        <label className="field">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        <button className="button primary" type="submit" disabled={busy || !email || !password}>
          {busy ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={17} />} Sign in
        </button>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <Link href="/" className="text-link">Back to the public site</Link>
      </form>
    </main>
  );
}
