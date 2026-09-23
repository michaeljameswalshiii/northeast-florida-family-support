import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { bedrockConfigured } from "@/lib/bedrock";

const TABLE = process.env.DYNAMODB_BEDROCK_USAGE_TABLE || "turnkey-bedrock-usage";
const TENANT = process.env.AI_USAGE_TENANT_ID || "site-nefl-support";
const LOCAL_FILE = path.join(process.cwd(), ".data", "resource-feedback.json");
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }));

function text(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

export async function saveResourceFeedback(input: Record<string, unknown>) {
  const resource = text(input.resource, 180);
  const issue = text(input.issue, 80);
  const details = text(input.details, 2000);
  const contact = text(input.contact, 160);
  if (!resource || !issue || !details) throw new Error("Choose a resource and describe what needs updating.");
  const id = crypto.randomUUID();
  const images = Array.isArray(input.images) ? input.images.slice(0, 2).map((item) => {
    const image = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const data = text(image.data, 180_000);
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(data)) return null;
    return { name: text(image.name, 120), contentType: text(image.contentType, 40), data };
  }).filter(Boolean) : [];
  const record = { id, type: text(input.type, 40) || "resource", page: text(input.page, 300), resource, issue, details, contact, images, createdAt: new Date().toISOString(), status: "new" };
  if (bedrockConfigured()) {
    await client.send(new PutCommand({ TableName: TABLE, Item: { ...record, PK: `TENANT#${TENANT}`, SK: `RESOURCE_FEEDBACK#${record.createdAt}#${id}` } }));
    return record;
  }
  if (process.env.VERCEL === "1") throw new Error("Feedback storage is temporarily unavailable. Please try again later.");
  let existing: typeof record[] = [];
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, "utf8"));
    if (Array.isArray(parsed)) existing = parsed;
  } catch {}
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify([...existing, record], null, 2));
  return record;
}

export type FeedbackRecord = Awaited<ReturnType<typeof saveResourceFeedback>>;

export async function listResourceFeedback(): Promise<FeedbackRecord[]> {
  if (bedrockConfigured()) {
    const result = await client.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `TENANT#${TENANT}`, ":sk": "RESOURCE_FEEDBACK#" },
    }));
    return (result.Items || []).map((item) => {
      const record = { ...item } as unknown as FeedbackRecord & { PK?: string; SK?: string };
      delete record.PK; delete record.SK;
      return record;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) : [];
  } catch { return []; }
}
