import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ANCHORS, DOMAINS, type AnchorId, type CoverageGapId, type LocationTypeId, type PaymentTypeId, type ServiceLineId } from "@/data/idd-care-scale";
import type { ClinicCallLog, ClinicRating, ClinicRatingInput, DomainScores, PaymentMatrix, PaymentNotes } from "@/lib/clinic-rating-types";
import { bedrockConfigured } from "@/lib/bedrock";

export type { ClinicCallLog, ClinicRating, ClinicRatingInput, DomainScores, PaymentMatrix, PaymentNotes } from "@/lib/clinic-rating-types";

const TABLE = process.env.DYNAMODB_BEDROCK_USAGE_TABLE || "turnkey-bedrock-usage";
const TENANT = process.env.AI_USAGE_TENANT_ID || "site-nefl-support";
const LOCAL_FILE = path.join(process.cwd(), ".data", "clinic-ratings.json");

type StoredRecord = ClinicRating & { PK: string; SK: string };

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

function pk() {
  return `TENANT#${TENANT}`;
}

function sk(id: string) {
  return `CLINIC#${id}`;
}

function dynamoEnabled() {
  return bedrockConfigured();
}

function localFileEnabled() {
  return process.env.VERCEL !== "1" && !dynamoEnabled();
}

export function clinicRatingsPersistLabel() {
  if (dynamoEnabled()) return "Saved to the shared clinic directory. Each later call can update the same clinic.";
  if (localFileEnabled()) return "Saved on this development machine. Production uses the shared clinic directory.";
  return "Ratings cannot be stored until AWS credentials are available.";
}

function sanitizeText(value: unknown, max = 400) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function sanitizeMultiline(value: unknown, max = 4000) {
  return String(value || "").trim().slice(0, max);
}

const ANCHOR_IDS = new Set(ANCHORS.map((anchor) => anchor.id));
const DOMAIN_IDS = new Set(DOMAINS.map((domain) => domain.id));

function sanitizeScores(value: unknown): DomainScores {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const scores: DomainScores = {};
  for (const domain of DOMAINS) {
    const selected = String(input[domain.id] || "");
    if (ANCHOR_IDS.has(selected as AnchorId) && DOMAIN_IDS.has(domain.id)) scores[domain.id] = selected as AnchorId;
  }
  return scores;
}

function sanitizePayment(value: unknown): PaymentMatrix {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const payment: PaymentMatrix = {};
  for (const [type, lines] of Object.entries(input)) {
    if (!lines || typeof lines !== "object") continue;
    const row: Partial<Record<ServiceLineId, boolean>> = {};
    for (const line of ["medical", "dental", "vision"] as ServiceLineId[]) {
      if ((lines as Record<string, unknown>)[line]) row[line] = true;
    }
    if (Object.keys(row).length) payment[type as PaymentTypeId] = row;
  }
  return payment;
}

function sanitizePaymentNotes(value: unknown): PaymentNotes {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const notes: PaymentNotes = {};
  for (const [type, note] of Object.entries(input)) {
    const text = sanitizeText(note, 240);
    if (text) notes[type as PaymentTypeId] = text;
  }
  return notes;
}

function sanitizeLocationTypes(value: unknown): LocationTypeId[] {
  const input = Array.isArray(value) ? value.map(String) : [];
  return (["physical", "mobile", "virtual"] as LocationTypeId[]).filter((item) => input.includes(item));
}

function sanitizeCoverageGaps(value: unknown): CoverageGapId[] {
  const input = Array.isArray(value) ? value.map(String) : [];
  return (["refers_out", "offers_self_pay", "helps_enrollment", "coordinates_case_manager", "other"] as CoverageGapId[])
    .filter((item) => input.includes(item));
}

function sanitizeCallLog(value: unknown): ClinicCallLog[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-40).map((entry) => ({
    id: sanitizeText((entry as ClinicCallLog)?.id, 80) || crypto.randomUUID(),
    date: sanitizeText((entry as ClinicCallLog)?.date, 40),
    raterName: sanitizeText((entry as ClinicCallLog)?.raterName, 120),
    clinicContact: sanitizeText((entry as ClinicCallLog)?.clinicContact, 120),
    clinicPhone: sanitizeText((entry as ClinicCallLog)?.clinicPhone, 40),
    notes: sanitizeMultiline((entry as ClinicCallLog)?.notes, 2000),
    savedAt: sanitizeText((entry as ClinicCallLog)?.savedAt, 40),
  }));
}

function publicClinic(record: ClinicRating): ClinicRating {
  const clinic = { ...(record as StoredRecord) };
  delete (clinic as Partial<StoredRecord>).PK;
  delete (clinic as Partial<StoredRecord>).SK;
  return clinic;
}

function normalizeInput(input: ClinicRatingInput, previous?: ClinicRating): ClinicRating {
  const now = new Date().toISOString();
  const callLog = sanitizeCallLog(input.callLog || previous?.callLog || []);
  const call = input.call;
  const hasCall = call && (call.date || call.raterName || call.clinicContact || call.clinicPhone || call.notes);
  if (hasCall && call) {
    callLog.push({
      id: crypto.randomUUID(),
      date: sanitizeText(call.date, 40) || now.slice(0, 10),
      raterName: sanitizeText(call.raterName, 120),
      clinicContact: sanitizeText(call.clinicContact, 120),
      clinicPhone: sanitizeText(call.clinicPhone, 40),
      notes: sanitizeMultiline(call.notes, 2000),
      savedAt: now,
    });
  }
  return {
    id: sanitizeText(input.id, 80) || previous?.id || crypto.randomUUID(),
    clinicName: sanitizeText(input.clinicName, 160),
    address: sanitizeText(input.address, 240),
    locationTypes: sanitizeLocationTypes(input.locationTypes),
    scores: sanitizeScores(input.scores),
    payment: sanitizePayment(input.payment),
    paymentNotes: sanitizePaymentNotes(input.paymentNotes),
    coverageGaps: sanitizeCoverageGaps(input.coverageGaps),
    coverageGapOther: sanitizeText(input.coverageGapOther, 240),
    callLog,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
}

async function readLocal(): Promise<ClinicRating[]> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(clinics: ClinicRating[]) {
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(clinics, null, 2));
}

export async function listClinicRatings() {
  if (dynamoEnabled()) {
    const result = await client.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": pk(), ":sk": "CLINIC#" },
    }));
    return (result.Items || []).map((item) => publicClinic(item as ClinicRating)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  if (localFileEnabled()) {
    const clinics = await readLocal();
    return clinics.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  throw new Error("Clinic ratings storage is not configured.");
}

export async function getClinicRating(id: string) {
  if (dynamoEnabled()) {
    const result = await client.send(new GetCommand({ TableName: TABLE, Key: { PK: pk(), SK: sk(id) } }));
    return result.Item ? publicClinic(result.Item as ClinicRating) : null;
  }
  if (localFileEnabled()) {
    const clinics = await readLocal();
    return clinics.find((clinic) => clinic.id === id) || null;
  }
  throw new Error("Clinic ratings storage is not configured.");
}

export async function saveClinicRating(input: ClinicRatingInput) {
  const previous = input.id ? await getClinicRating(input.id).catch(() => null) : null;
  const clinic = normalizeInput(input, previous || undefined);
  if (!clinic.clinicName) throw new Error("Enter a clinic name.");
  if (dynamoEnabled()) {
    await client.send(new PutCommand({
      TableName: TABLE,
      Item: { ...clinic, PK: pk(), SK: sk(clinic.id) },
    }));
    return clinic;
  }
  if (localFileEnabled()) {
    const clinics = await readLocal();
    const next = clinics.filter((item) => item.id !== clinic.id);
    next.push(clinic);
    await writeLocal(next);
    return clinic;
  }
  throw new Error("Clinic ratings storage is not configured.");
}

export async function deleteClinicRating(id: string) {
  if (dynamoEnabled()) {
    await client.send(new DeleteCommand({ TableName: TABLE, Key: { PK: pk(), SK: sk(id) } }));
    return;
  }
  if (localFileEnabled()) {
    const clinics = await readLocal();
    await writeLocal(clinics.filter((clinic) => clinic.id !== id));
    return;
  }
  throw new Error("Clinic ratings storage is not configured.");
}
