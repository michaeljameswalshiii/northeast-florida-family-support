"use client";

import Image from "next/image";
import { FileText, Inbox, Mail, Monitor, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NOTE_STATUSES, feedbackFileUrl, isImageType, normalizeNoteStatus, noteStatusLabel, type FeedbackRecord } from "@/lib/feedback-view";

function kindLabel(type: string) {
  if (type === "tech-support" || type === "site") return "Tech support";
  return "Resource update";
}

export function FeedbackInbox({
  items,
  emptyTitle,
  emptyText,
  enableStatus = false,
}: {
  items: FeedbackRecord[];
  emptyTitle: string;
  emptyText: string;
  enableStatus?: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [localItems, setLocalItems] = useState(items);
  useEffect(() => { setLocalItems(items); }, [items]);

  const visible = useMemo(() => {
    if (filter === "all") return localItems;
    return localItems.filter((item) => normalizeNoteStatus(item.status) === filter);
  }, [filter, localItems]);

  async function remove(id: string) {
    if (!window.confirm("Delete this request? This cannot be undone.")) return;
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/resource-feedback/${id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to delete this note.");
      setLocalItems((current) => current.filter((item) => item.id !== id));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete this note.");
    } finally {
      setBusyId("");
    }
  }

  async function changeStatus(id: string, status: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/resource-feedback/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update status.");
      setLocalItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update status.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="feedback-inbox">
      {enableStatus ? (
        <div className="admin-filter-bar">
          <label>
            Filter by status
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {NOTE_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>{status.label}</option>
              ))}
            </select>
          </label>
          <p>{visible.length} shown</p>
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {!visible.length ? (
        <div className="empty-state">
          <Inbox size={30} />
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      ) : visible.map((item) => {
        const pictures = item.images.filter((file) => isImageType(file.contentType));
        const documents = item.images.filter((file) => !isImageType(file.contentType));
        const status = normalizeNoteStatus(item.status);
        return (
          <article className="feedback-record" key={item.id}>
            <header>
              <div>
                <span className={`feedback-kind status-${status}`}>{kindLabel(item.type)} · {noteStatusLabel(status)}</span>
                <h3>{item.issue}</h3>
              </div>
              <div className="feedback-record-meta">
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time>
                {enableStatus ? (
                  <label className="status-select">
                    Status
                    <select value={status} disabled={busyId === item.id} onChange={(event) => void changeStatus(item.id, event.target.value)}>
                      {NOTE_STATUSES.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button type="button" className="text-link" onClick={() => void remove(item.id)} disabled={busyId === item.id}>
                  <Trash2 size={15} /> {busyId === item.id ? "Saving…" : "Delete"}
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
