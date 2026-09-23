"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

export function ResourceFeedbackForm({ initialResource }: { initialResource: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/resource-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(values.entries())),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to submit this report.");
      setStatus("sent");
      form.reset();
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Unable to submit this report.");
    }
  }

  if (status === "sent") return <div className="feedback-success" role="status"><CheckCircle2 size={28} /><h2>Thank you.</h2><p>Your report was saved for review.</p></div>;
  return (
    <form className="feedback-form rating-card" onSubmit={submit}>
      <label className="field">Resource or organization name<input name="resource" defaultValue={initialResource} required maxLength={180} /></label>
      <label className="field">What needs attention?
        <select name="issue" required defaultValue="">
          <option value="" disabled>Select one</option>
          <option>Broken link</option><option>Incorrect phone or contact information</option><option>Eligibility or service information changed</option><option>Organization closed or no longer offers this service</option><option>Missing resource</option><option>Other</option>
        </select>
      </label>
      <label className="field">What should we know?<textarea name="details" required rows={5} maxLength={2000} placeholder="Describe the correction and, if possible, include the source where it can be verified." /></label>
      <label className="field">Your email (optional)<input name="contact" type="email" maxLength={160} autoComplete="email" /><span className="field-hint">Only used if we need to clarify this report.</span></label>
      <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      <p className="privacy-note">Do not include a patient’s name, diagnosis, date of birth, or other private health information.</p>
      <button className="button primary" type="submit" disabled={status === "sending"}>{status === "sending" ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Submit report</button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  );
}
