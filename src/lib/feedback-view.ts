export type FeedbackImage = {
  id: string;
  name: string;
  contentType: string;
  data: string;
  createdAt: string;
};

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

export function isImageType(contentType: string) {
  return contentType.startsWith("image/");
}

export function feedbackFileUrl(noteId: string, fileId: string) {
  return `/api/resource-feedback/${encodeURIComponent(noteId)}/files/${encodeURIComponent(fileId)}`;
}
