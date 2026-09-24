export type FeedbackImage = {
  id: string;
  name: string;
  contentType: string;
  data: string;
  createdAt: string;
};

export const NOTE_STATUSES = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "ready", label: "Ready to Accept" },
  { id: "closed", label: "Closed" },
] as const;

export type NoteStatus = (typeof NOTE_STATUSES)[number]["id"];

export type FeedbackRecord = {
  id: string;
  type: string;
  page: string;
  resource: string;
  issue: string;
  details: string;
  contact: string;
  images: FeedbackImage[];
  createdAt: string;
  status: string;
  emailStatus?: string;
};

export function normalizeNoteStatus(value?: string): NoteStatus {
  const raw = String(value || "").toLowerCase().replace(/\s+/g, "_");
  if (raw === "in_progress" || raw === "ready" || raw === "closed") return raw;
  return "open";
}

export function noteStatusLabel(value?: string) {
  const id = normalizeNoteStatus(value);
  return NOTE_STATUSES.find((item) => item.id === id)?.label || "Open";
}

export function isImageType(contentType: string) {
  return contentType.startsWith("image/");
}

export function feedbackFileUrl(noteId: string, fileId: string) {
  return `/api/resource-feedback/${encodeURIComponent(noteId)}/files/${encodeURIComponent(fileId)}`;
}
