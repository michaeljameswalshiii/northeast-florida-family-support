"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle, Send, X } from "lucide-react";

type ImagePayload = { id: string; name: string; contentType: string; data: string };

async function prepareImage(file: File): Promise<ImagePayload> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPEG, PNG, or WebP).");
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL("image/jpeg", 0.62);
  source.close();
  if (data.length > 220_000) throw new Error("That image is still too large. Please crop it and try again.");
  return { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, "").slice(0, 80), contentType: "image/jpeg", data };
}

export function TechSupportForm({ compact = false, onSent }: { compact?: boolean; onSent?: () => void }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImagePayload[]>([]);

  async function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    try {
      const files = Array.from(event.target.files || []);
      const next = [...images];
      for (const file of files) {
        if (next.length >= 4) break;
        next.push(await prepareImage(file));
      }
      setImages(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to prepare that image.");
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
          images,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send this note.");
      setStatus("sent");
      form.reset();
      setImages([]);
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
        <p>Your tech support note was saved for review, and the team is notified by email.</p>
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
        <textarea name="details" required rows={compact ? 5 : 7} maxLength={4000} placeholder="Tell us what you were doing, what you expected, and what happened. You can attach screenshots below." />
      </label>
      <label className="field">Your email (optional)
        <input name="contact" type="email" maxLength={160} autoComplete="email" />
        <span className="field-hint">Only used if we need to follow up on this note.</span>
      </label>
      <label className="feedback-upload">
        <ImagePlus size={18} />
        <span>{images.length ? "Add another image" : "Add screenshots or photos"} (up to 4)</span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={chooseImages} />
      </label>
      {images.length ? (
        <ul className="feedback-previews">
          {images.map((image) => (
            <li key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.data} alt={image.name || "Attached screenshot"} />
              <button type="button" onClick={() => setImages(images.filter((item) => item.id !== image.id))} aria-label={`Remove ${image.name}`}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      <p className="privacy-note">Do not include names, diagnoses, dates of birth, records, or other private health information.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Send tech support note
      </button>
    </form>
  );
}
