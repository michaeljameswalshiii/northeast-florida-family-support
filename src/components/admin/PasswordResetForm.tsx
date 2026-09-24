"use client";

import { FormEvent, useState } from "react";

export function PasswordResetForm({
  accounts,
  currentEmail,
  isAdmin,
}: {
  accounts: Array<{ username: string; role: string }>;
  currentEmail: string;
  isAdmin: boolean;
}) {
  const [username, setUsername] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/passwords", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to save that password.");
      setPassword("");
      setConfirm("");
      setMessage(`Password updated for ${username}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save that password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>Reset password</h2>
      <p className="admin-lede">{isAdmin ? "Choose an account and set a new password." : "Change the password for your signed-in account."}</p>
      <label className="field">
        Account
        <select value={username} onChange={(event) => setUsername(event.target.value)} disabled={!isAdmin}>
          {accounts.map((account) => (
            <option key={account.username} value={account.username.toLowerCase()}>
              {account.username} ({account.role})
            </option>
          ))}
        </select>
      </label>
      <label className="field">New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></label>
      <label className="field">Confirm password<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={8} required autoComplete="new-password" /></label>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="rating-status is-ok">{message}</p> : null}
      <button className="button primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
    </form>
  );
}
