"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle, MessageSquare, Send, X } from "lucide-react";

type ImagePayload = { name: string; contentType: string; data: string };

async function prepareImage(file: File): Promise<ImagePayload> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL("image/jpeg", .68);
  source.close();
  if (data.length > 180_000) throw new Error("That image is still too large. Please crop it and try again.");
  return { name: file.name, contentType: "image/jpeg", data };
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImagePayload[]>([]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  async function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    try {
      const files = Array.from(event.target.files || []).slice(0, 2);
      setImages(await Promise.all(files.map(prepareImage)));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to prepare that image."); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending"); setError("");
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const response = await fetch("/api/resource-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, type: "site", resource: "Website feedback", page: window.location.href, images }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send feedback.");
      setStatus("sent"); form.reset(); setImages([]);
    } catch (caught) { setStatus("idle"); setError(caught instanceof Error ? caught.message : "Unable to send feedback."); }
  }

  return <>
    <button className="feedback-launcher" type="button" onClick={() => { setOpen(true); setStatus("idle"); }}><MessageSquare size={18} /> Feedback</button>
    {open ? <div className="feedback-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <button className="feedback-close" type="button" aria-label="Close feedback form" onClick={() => setOpen(false)}><X size={20} /></button>
        {status === "sent" ? <div className="feedback-success"><CheckCircle2 size={34} /><h2 id="feedback-title">Thank you for helping.</h2><p>Your feedback was recorded for review.</p><button className="button primary" type="button" onClick={() => setOpen(false)}>Done</button></div> : <>
          <p className="eyebrow"><MessageSquare size={15} /> Help improve this guide</p><h2 id="feedback-title">Tell us what happened.</h2>
          <p className="feedback-intro">Report a problem, suggest an improvement, or share something that was confusing.</p>
          <form className="feedback-form" onSubmit={submit}>
            <label className="field">Feedback type<select name="issue" required defaultValue=""><option value="" disabled>Select one</option><option>Something is not working</option><option>Information is confusing or incorrect</option><option>I have a suggestion</option><option>Accessibility problem</option><option>Other</option></select></label>
            <label className="field">What should we know?<textarea name="details" required rows={5} maxLength={2000} placeholder="Please describe what you expected and what happened." /></label>
            <label className="field">Your email (optional)<input name="contact" type="email" maxLength={160} autoComplete="email" /><span className="field-hint">Only used if we need to follow up.</span></label>
            <label className="feedback-upload"><ImagePlus size={18} /><span>Add up to 2 screenshots</span><input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={chooseImages} /></label>
            {images.length ? <p className="feedback-files">{images.length} screenshot{images.length === 1 ? "" : "s"} ready</p> : null}
            <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
            <p className="privacy-note">Do not include names, diagnoses, dates of birth, records, or other private health information.</p>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button primary" type="submit" disabled={status === "sending"}>{status === "sending" ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Send feedback</button>
          </form>
        </>}
      </section>
    </div> : null}
  </>;
}
