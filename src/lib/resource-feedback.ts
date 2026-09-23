import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { bedrockConfigured } from "@/lib/bedrock";

const TABLE = process.env.DYNAMODB_BEDROCK_USAGE_TABLE || "turnkey-bedrock-usage";
const TENANT = process.env.AI_USAGE_TENANT_ID || "site-nefl-support";
const LOCAL_FILE = path.join(process.cwd(), ".data", "resource-feedback.json");
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

export type FeedbackImage = { id: string; name: string; contentType: string; data: string; createdAt: string };
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
};

function text(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function pk() {
  return `TENANT#${TENANT}`;
}

function sanitizeImages(value: unknown): FeedbackImage[] {
  if (!Array.isArray(value)) return [];
  const images: FeedbackImage[] = [];
  for (const item of value.slice(0, 4)) {
    const image = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const data = text(image.data, 220_000);
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(data)) continue;
    images.push({
      id: text(image.id, 80) || crypto.randomUUID(),
      name: text(image.name, 120) || "screenshot.jpg",
      contentType: text(image.contentType, 40) || "image/jpeg",
      data,
      createdAt: text(image.createdAt, 40) || new Date().toISOString(),
    });
  }
  return images;
}

export async function saveResourceFeedback(input: Record<string, unknown>) {
  const resource = text(input.resource, 180) || "Beta tech support";
  const issue = text(input.issue, 80);
  const details = text(input.details, 4000);
  const contact = text(input.contact, 160);
  if (!issue || !details) throw new Error("Choose a topic and describe what we should know.");
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const images = sanitizeImages(input.images);
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
    const { images: photos, ...note } = record;
    await client.send(new PutCommand({
      TableName: TABLE,
      Item: { ...note, imageCount: photos.length, PK: pk(), SK: `RESOURCE_FEEDBACK#${createdAt}#${id}` },
    }));
    for (const photo of photos) {
      await client.send(new PutCommand({
        TableName: TABLE,
        Item: { ...photo, feedbackId: id, type: "feedback_photo", PK: pk(), SK: `FEEDBACKPHOTO#${id}#${photo.id}` },
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

export async function listResourceFeedback(): Promise<FeedbackRecord[]> {
  if (bedrockConfigured()) {
    const [notes, photos] = await Promise.all([
      client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "RESOURCE_FEEDBACK#" },
      })),
      client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "FEEDBACKPHOTO#" },
      })),
    ]);
    const imagesByNote = new Map<string, FeedbackImage[]>();
    for (const item of photos.Items || []) {
      const feedbackId = String(item.feedbackId || "");
      if (!feedbackId) continue;
      const list = imagesByNote.get(feedbackId) || [];
      list.push({
        id: String(item.id || ""),
        name: String(item.name || "screenshot.jpg"),
        contentType: String(item.contentType || "image/jpeg"),
        data: String(item.data || ""),
        createdAt: String(item.createdAt || ""),
      });
      imagesByNote.set(feedbackId, list);
    }
    return (notes.Items || []).map((item) => {
      const record = { ...item } as unknown as FeedbackRecord & { PK?: string; SK?: string; imageCount?: number };
      delete record.PK;
      delete record.SK;
      delete record.imageCount;
      record.images = imagesByNote.get(record.id) || record.images || [];
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
