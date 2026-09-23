"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { CheckCircle2, FileUp, LoaderCircle, Send, X } from "lucide-react";

type FilePayload = { id: string; name: string; contentType: string; data: string };

const MAX_FILES = 4;
const MAX_BYTES = 180_000;

function bytesToDataUrl(type: string, buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:${type};base64,${btoa(binary)}`;
}

async function prepareFile(file: File): Promise<FilePayload> {
  if (file.type.startsWith("image/")) {
    const source = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(source.width, source.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.62);
    source.close();
    if (data.length > 280_000) throw new Error(`${file.name} is still too large. Please crop it and try again.`);
    return { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, "").slice(0, 80), contentType: "image/jpeg", data };
  }
  const allowed = /pdf|msword|officedocument|text\/plain|text\/csv|excel|spreadsheetml/i.test(file.type) || /\.(pdf|doc|docx|txt|csv|xls|xlsx)$/i.test(file.name);
  if (!allowed) throw new Error("Upload a screenshot or a PDF, Word, Excel, or text document.");
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is over 180 KB. Please attach a smaller document or a screenshot.`);
  const contentType = file.type || "application/pdf";
  const data = bytesToDataUrl(contentType, await file.arrayBuffer());
  return { id: crypto.randomUUID(), name: file.name.slice(0, 120), contentType, data };
}

export function TechSupportForm({ compact = false, onSent }: { compact?: boolean; onSent?: () => void }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FilePayload[]>([]);

  async function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    try {
      const chosen = Array.from(event.target.files || []);
      const next = [...files];
      for (const file of chosen) {
        if (next.length >= MAX_FILES) break;
        next.push(await prepareFile(file));
      }
      setFiles(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to prepare that file.");
    }
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    setError("");
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const response = await fetch("/api/resource-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          type: "tech-support",
          resource: "Beta tech support",
          page: typeof window !== "undefined" ? window.location.href : "/support",
          images: files,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send this note.");
      setStatus("sent");
      form.reset();
      setFiles([]);
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Unable to send this note.");
    }
  }

  if (status === "sent") {
    return (
      <div className="feedback-success" role="status">
        <CheckCircle2 size={34} />
        <h2>Note received.</h2>
        <p>Your tech support note and attachments were saved for review, and the team is notified by email.</p>
        {onSent ? <button className="button primary" type="button" onClick={onSent}>Done</button> : null}
      </div>
    );
  }

  return (
    <form className={`feedback-form${compact ? "" : " rating-card"}`} onSubmit={submit}>
      <label className="field">What is this about?
        <select name="issue" required defaultValue="">
          <option value="" disabled>Select one</option>
          <option>Something is not working</option>
          <option>I cannot add or update a clinic</option>
          <option>A page looks wrong on my phone or computer</option>
          <option>Information is confusing or incorrect</option>
          <option>I have a suggestion</option>
          <option>Other</option>
        </select>
      </label>
      <label className="field">Your note
        <textarea name="details" required rows={compact ? 5 : 7} maxLength={4000} placeholder="Tell us what you were doing, what you expected, and what happened. You can attach screenshots or documents below." />
      </label>
      <label className="field">Your email (optional)
        <input name="contact" type="email" maxLength={160} autoComplete="email" />
        <span className="field-hint">Only used if we need to follow up on this note.</span>
      </label>
      <label className="feedback-upload">
        <FileUp size={18} />
        <span>{files.length ? "Add another file" : "Add screenshots or documents"} (up to 4)</span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx" multiple onChange={chooseFiles} />
      </label>
      {files.length ? (
        <ul className="feedback-previews">
          {files.map((file) => (
            <li key={file.id} className={file.contentType.startsWith("image/") ? "" : "is-doc"}>
              {file.contentType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.data} alt={file.name || "Attached screenshot"} />
              ) : (
                <span className="feedback-doc">{file.name}</span>
              )}
              <button type="button" onClick={() => setFiles(files.filter((item) => item.id !== file.id))} aria-label={`Remove ${file.name}`}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="field-hint">PDF, Word, Excel, text, or image files up to 180 KB each.</p>
      )}
      <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      <p className="privacy-note">Do not include names, diagnoses, dates of birth, records, or other private health information.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Send tech support note
      </button>
    </form>
  );
}
