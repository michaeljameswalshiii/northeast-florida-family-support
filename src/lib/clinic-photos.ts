import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { CLINIC_PHOTO_KINDS, type ClinicPhotoKind } from "@/data/idd-care-scale";
import { bedrockConfigured } from "@/lib/bedrock";
import type { ClinicPhoto } from "@/lib/clinic-rating-types";

const TABLE = process.env.DYNAMODB_BEDROCK_USAGE_TABLE || "turnkey-bedrock-usage";
const TENANT = process.env.AI_USAGE_TENANT_ID || "site-nefl-support";
const LOCAL_DIR = path.join(process.cwd(), ".data", "clinic-photos");
const MAX_PHOTOS = 12;
const MAX_BYTES = 280_000;

type StoredPhoto = ClinicPhoto & {
  PK: string;
  SK: string;
  type: "clinic_photo";
  clinicId: string;
  data: string;
};

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

function pk() {
  return `TENANT#${TENANT}`;
}

function sk(clinicId: string, photoId: string) {
  return `CLINICPHOTO#${clinicId}#${photoId}`;
}

function dynamoEnabled() {
  return bedrockConfigured();
}

function localFileEnabled() {
  return process.env.VERCEL !== "1" && !dynamoEnabled();
}

function sanitizeText(value: unknown, max = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function photoMeta(record: StoredPhoto | (ClinicPhoto & { clinicId?: string; data?: string })): ClinicPhoto {
  return {
    id: record.id,
    kind: record.kind,
    caption: record.caption || "",
    contentType: record.contentType || "image/jpeg",
    createdAt: record.createdAt,
  };
}

export function clinicPhotoUrl(clinicId: string, photoId: string) {
  return `/api/clinic-ratings/${encodeURIComponent(clinicId)}/photos/${encodeURIComponent(photoId)}`;
}

export function sanitizePhotoKind(value: unknown): ClinicPhotoKind {
  const kind = String(value || "");
  return CLINIC_PHOTO_KINDS.some((item) => item.id === kind) ? kind as ClinicPhotoKind : "facility";
}

export function sanitizePhotoMeta(value: unknown): ClinicPhoto[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const photos: ClinicPhoto[] = [];
  for (const item of value.slice(0, MAX_PHOTOS)) {
    const id = sanitizeText((item as ClinicPhoto)?.id, 80);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    photos.push({
      id,
      kind: sanitizePhotoKind((item as ClinicPhoto)?.kind),
      caption: sanitizeText((item as ClinicPhoto)?.caption, 160),
      contentType: sanitizeText((item as ClinicPhoto)?.contentType, 80) || "image/jpeg",
      createdAt: sanitizeText((item as ClinicPhoto)?.createdAt, 40) || new Date().toISOString(),
    });
  }
  return photos;
}

function decodeImageData(raw: unknown) {
  const text = String(raw || "").trim();
  const match = text.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  const base64 = (match ? match[1] : text).replace(/\s+/g, "");
  if (!base64 || !/^[A-Za-z0-9+/]+=*$/.test(base64)) throw new Error("That photo could not be read.");
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length) throw new Error("That photo is empty.");
  if (bytes.length > MAX_BYTES) throw new Error("Each photo must be under 280 KB after compression.");
  return { data: base64, bytes };
}

function contentTypeFrom(value: unknown) {
  const type = sanitizeText(value, 80).toLowerCase();
  if (type === "image/png" || type === "image/webp" || type === "image/gif") return type;
  return "image/jpeg";
}

async function localPath(clinicId: string, photoId: string) {
  const dir = path.join(LOCAL_DIR, clinicId);
  await mkdir(dir, { recursive: true });
  return path.join(dir, `${photoId}.json`);
}

export async function listClinicPhotos(clinicId: string): Promise<ClinicPhoto[]> {
  const id = sanitizeText(clinicId, 80);
  if (!id) return [];
  if (dynamoEnabled()) {
    const result = await client.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": pk(), ":sk": `CLINICPHOTO#${id}#` },
    }));
    return (result.Items || [])
      .map((item) => photoMeta(item as StoredPhoto))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  if (localFileEnabled()) {
    try {
      const dir = path.join(LOCAL_DIR, id);
      const { readdir } = await import("node:fs/promises");
      const files = await readdir(dir);
      const photos: ClinicPhoto[] = [];
      for (const file of files.filter((name) => name.endsWith(".json"))) {
        const raw = JSON.parse(await readFile(path.join(dir, file), "utf8")) as StoredPhoto;
        photos.push(photoMeta(raw));
      }
      return photos.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } catch {
      return [];
    }
  }
  throw new Error("Clinic ratings storage is not configured.");
}

export async function getClinicPhoto(clinicId: string, photoId: string) {
  const clinic = sanitizeText(clinicId, 80);
  const id = sanitizeText(photoId, 80);
  if (!clinic || !id) return null;
  if (dynamoEnabled()) {
    const result = await client.send(new GetCommand({ TableName: TABLE, Key: { PK: pk(), SK: sk(clinic, id) } }));
    return result.Item ? result.Item as StoredPhoto : null;
  }
  if (localFileEnabled()) {
    try {
      const raw = JSON.parse(await readFile(await localPath(clinic, id), "utf8")) as StoredPhoto;
      return raw;
    } catch {
      return null;
    }
  }
  throw new Error("Clinic ratings storage is not configured.");
}

export async function saveClinicPhoto(input: {
  clinicId: string;
  kind?: unknown;
  caption?: unknown;
  contentType?: unknown;
  data?: unknown;
}) {
  const clinicId = sanitizeText(input.clinicId, 80);
  if (!clinicId) throw new Error("Save the clinic before adding photos.");
  const existing = await listClinicPhotos(clinicId);
  if (existing.length >= MAX_PHOTOS) throw new Error(`You can attach up to ${MAX_PHOTOS} photos per clinic.`);
  const { data } = decodeImageData(input.data);
  const id = crypto.randomUUID();
  const photo: StoredPhoto = {
    PK: pk(),
    SK: sk(clinicId, id),
    type: "clinic_photo",
    id,
    clinicId,
    kind: sanitizePhotoKind(input.kind),
    caption: sanitizeText(input.caption, 160),
    contentType: contentTypeFrom(input.contentType),
    data,
    createdAt: new Date().toISOString(),
  };
  if (dynamoEnabled()) {
    await client.send(new PutCommand({ TableName: TABLE, Item: photo }));
    return photoMeta(photo);
  }
  if (localFileEnabled()) {
    await writeFile(await localPath(clinicId, photo.id), JSON.stringify(photo));
    return photoMeta(photo);
  }
  throw new Error("Clinic ratings storage is not configured.");
}

export async function deleteClinicPhoto(clinicId: string, photoId: string) {
  const clinic = sanitizeText(clinicId, 80);
  const id = sanitizeText(photoId, 80);
  if (!clinic || !id) return;
  if (dynamoEnabled()) {
    await client.send(new DeleteCommand({ TableName: TABLE, Key: { PK: pk(), SK: sk(clinic, id) } }));
    return;
  }
  if (localFileEnabled()) {
    await unlink(await localPath(clinic, id)).catch(() => undefined);
  }
}

export async function deletePhotosForClinic(clinicId: string) {
  const photos = await listClinicPhotos(clinicId).catch(() => []);
  await Promise.all(photos.map((photo) => deleteClinicPhoto(clinicId, photo.id)));
  if (localFileEnabled()) {
    await rm(path.join(LOCAL_DIR, sanitizeText(clinicId, 80)), { recursive: true, force: true }).catch(() => undefined);
  }
}

export function photoBytes(record: { data?: string; contentType?: string }) {
  const buffer = Buffer.from(String(record.data || ""), "base64");
  return {
    buffer,
    contentType: record.contentType || "image/jpeg",
  };
}
