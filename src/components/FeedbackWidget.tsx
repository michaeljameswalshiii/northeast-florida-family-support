"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, X } from "lucide-react";
import { TechSupportForm } from "@/components/TechSupportForm";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <>
      <button className="feedback-launcher" type="button" onClick={() => setOpen(true)}>
        <LifeBuoy size={18} /> Beta tech support
      </button>
      {open ? (
        <div className="feedback-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <button className="feedback-close" type="button" aria-label="Close tech support form" onClick={() => setOpen(false)}><X size={20} /></button>
            <p className="eyebrow"><LifeBuoy size={15} /> This guide is in beta</p>
            <h2 id="feedback-title">Send a tech support note.</h2>
            <p className="feedback-intro">Tell us what broke, what was confusing, or what would help. You can attach screenshots. Notes are saved for review and emailed to the project team.</p>
            <TechSupportForm compact onSent={() => setOpen(false)} />
          </section>
        </div>
      ) : null}
    </>
  );
}
