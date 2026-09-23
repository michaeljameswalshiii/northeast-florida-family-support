"use client";

import Image from "next/image";
import { FileText, Inbox, Mail, Monitor, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { feedbackFileUrl, isImageType, type FeedbackRecord } from "@/lib/resource-feedback";

function kindLabel(type: string) {
  if (type === "tech-support" || type === "site") return "Tech support";
  return "Resource update";
}

export function FeedbackInbox({
  items,
  emptyTitle,
  emptyText,
}: {
  items: FeedbackRecord[];
  emptyTitle: string;
  emptyText: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function remove(id: string) {
    if (!window.confirm("Delete this request? This cannot be undone.")) return;
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/resource-feedback/${id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to delete this note.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete this note.");
    } finally {
      setBusyId("");
    }
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <Inbox size={30} />
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="feedback-inbox">
      {error ? <p className="form-error">{error}</p> : null}
      {items.map((item) => {
        const pictures = item.images.filter((file) => isImageType(file.contentType));
        const documents = item.images.filter((file) => !isImageType(file.contentType));
        return (
          <article className="feedback-record" key={item.id}>
            <header>
              <div>
                <span className="feedback-kind">{kindLabel(item.type)}</span>
                <h3>{item.issue}</h3>
              </div>
              <div className="feedback-record-meta">
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time>
                <button type="button" className="text-link" onClick={() => void remove(item.id)} disabled={busyId === item.id}>
                  <Trash2 size={15} /> {busyId === item.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </header>
            <p>{item.details}</p>
            <dl>
              <div><dt><Monitor size={14} /> Page</dt><dd>{item.page || item.resource}</dd></div>
              <div><dt><Mail size={14} /> Contact</dt><dd>{item.contact || "Not provided"}</dd></div>
              <div><dt>Notify</dt><dd>{item.emailStatus || "Not recorded"}</dd></div>
            </dl>
            {pictures.length ? (
              <div className="feedback-images">
                {pictures.map((image, index) => (
                  <a href={feedbackFileUrl(item.id, image.id)} target="_blank" rel="noreferrer" key={image.id}>
                    {image.data ? (
                      <Image unoptimized width={900} height={560} src={image.data} alt={image.name || `Screenshot ${index + 1}`} />
                    ) : (
                      <span>{image.name}</span>
                    )}
                  </a>
                ))}
              </div>
            ) : null}
            {documents.length ? (
              <ul className="feedback-docs">
                {documents.map((file) => (
                  <li key={file.id}>
                    <a href={feedbackFileUrl(item.id, file.id)} target="_blank" rel="noreferrer">
                      <FileText size={16} /> {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
