import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { bedrockConfigured } from "@/lib/bedrock";

const TABLE = process.env.DYNAMODB_BEDROCK_USAGE_TABLE || "turnkey-bedrock-usage";
const TENANT = process.env.AI_USAGE_TENANT_ID || "site-nefl-support";
const LOCAL_FILE = path.join(process.cwd(), ".data", "resource-feedback.json");
const MAX_FILES = 4;
const MAX_DATA_CHARS = 280_000;
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

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

function text(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function pk() {
  return `TENANT#${TENANT}`;
}

export function isImageType(contentType: string) {
  return contentType.startsWith("image/");
}

export function feedbackFileUrl(noteId: string, fileId: string) {
  return `/api/resource-feedback/${encodeURIComponent(noteId)}/files/${encodeURIComponent(fileId)}`;
}

function sanitizeFiles(value: unknown): FeedbackImage[] {
  if (!Array.isArray(value)) return [];
  const files: FeedbackImage[] = [];
  for (const item of value.slice(0, MAX_FILES)) {
    const file = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const data = text(file.data, MAX_DATA_CHARS);
    const match = data.match(/^data:([^;]+);base64,/);
    if (!match) continue;
    const contentType = text(file.contentType, 80) || match[1];
    if (!ALLOWED_TYPES.has(contentType) && !contentType.startsWith("image/")) continue;
    files.push({
      id: text(file.id, 80) || crypto.randomUUID(),
      name: text(file.name, 120) || "attachment",
      contentType,
      data,
      createdAt: text(file.createdAt, 40) || new Date().toISOString(),
    });
  }
  return files;
}

export async function saveResourceFeedback(input: Record<string, unknown>) {
  const resource = text(input.resource, 180) || "Beta tech support";
  const issue = text(input.issue, 80);
  const details = text(input.details, 4000);
  const contact = text(input.contact, 160);
  if (!issue || !details) throw new Error("Choose a topic and describe what we should know.");
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const images = sanitizeFiles(input.images);
  const record: FeedbackRecord = {
    id,
    type: text(input.type, 40) || "tech-support",
    page: text(input.page, 300),
    resource,
    issue,
    details,
    contact,
    images,
    createdAt,
    status: "new",
  };

  if (bedrockConfigured()) {
    const { images: files, ...note } = record;
    await client.send(new PutCommand({
      TableName: TABLE,
      Item: { ...note, imageCount: files.length, PK: pk(), SK: `RESOURCE_FEEDBACK#${createdAt}#${id}` },
    }));
    for (const file of files) {
      await client.send(new PutCommand({
        TableName: TABLE,
        Item: { ...file, feedbackId: id, type: "feedback_file", PK: pk(), SK: `FEEDBACKFILE#${id}#${file.id}` },
      }));
    }
    return record;
  }

  if (process.env.VERCEL === "1") throw new Error("Feedback storage is temporarily unavailable. Please try again later.");
  let existing: FeedbackRecord[] = [];
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, "utf8"));
    if (Array.isArray(parsed)) existing = parsed;
  } catch {}
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify([record, ...existing], null, 2));
  return record;
}

export async function markFeedbackEmailStatus(record: FeedbackRecord, emailStatus: string) {
  record.emailStatus = emailStatus;
  if (bedrockConfigured()) {
    await client.send(new PutCommand({
      TableName: TABLE,
      Item: {
        id: record.id,
        type: record.type,
        page: record.page,
        resource: record.resource,
        issue: record.issue,
        details: record.details,
        contact: record.contact,
        createdAt: record.createdAt,
        status: record.status,
        emailStatus,
        imageCount: record.images.length,
        PK: pk(),
        SK: `RESOURCE_FEEDBACK#${record.createdAt}#${record.id}`,
      },
    }));
    return;
  }
  if (process.env.VERCEL === "1") return;
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, "utf8"));
    if (!Array.isArray(parsed)) return;
    const next = parsed.map((item: FeedbackRecord) => item.id === record.id ? { ...item, emailStatus } : item);
    await writeFile(LOCAL_FILE, JSON.stringify(next, null, 2));
  } catch {}
}

function fileFromItem(item: Record<string, unknown>): FeedbackImage {
  return {
    id: String(item.id || ""),
    name: String(item.name || "attachment"),
    contentType: String(item.contentType || "application/octet-stream"),
    data: String(item.data || ""),
    createdAt: String(item.createdAt || ""),
  };
}

export async function getFeedbackFile(noteId: string, fileId: string) {
  if (bedrockConfigured()) {
    const result = await client.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: `FEEDBACKFILE#${noteId}#${fileId}` },
    }));
    if (result.Item?.data) return fileFromItem(result.Item);
    const legacy = await client.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: `FEEDBACKPHOTO#${noteId}#${fileId}` },
    }));
    return legacy.Item?.data ? fileFromItem(legacy.Item) : null;
  }
  const notes = await listResourceFeedback();
  const note = notes.find((item) => item.id === noteId);
  return note?.images.find((file) => file.id === fileId) || null;
}

export async function listResourceFeedback(): Promise<FeedbackRecord[]> {
  if (bedrockConfigured()) {
    const [notes, files, photos] = await Promise.all([
      client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "RESOURCE_FEEDBACK#" },
      })),
      client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "FEEDBACKFILE#" },
      })),
      client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "FEEDBACKPHOTO#" },
      })),
    ]);
    const filesByNote = new Map<string, FeedbackImage[]>();
    for (const item of [...(files.Items || []), ...(photos.Items || [])]) {
      const feedbackId = String(item.feedbackId || "");
      if (!feedbackId) continue;
      const list = filesByNote.get(feedbackId) || [];
      list.push(fileFromItem(item));
      filesByNote.set(feedbackId, list);
    }
    return (notes.Items || []).map((item) => {
      const record = { ...item } as unknown as FeedbackRecord & { PK?: string; SK?: string; imageCount?: number };
      delete record.PK;
      delete record.SK;
      delete record.imageCount;
      record.images = filesByNote.get(record.id) || record.images || [];
      return record;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) : [];
  } catch {
    return [];
  }
}
