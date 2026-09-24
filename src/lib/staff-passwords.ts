import { createHmac, timingSafeEqual } from "node:crypto";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { adminDocumentClient, usageTableName, usageTenantId } from "@/lib/admin/usage";

type PasswordStore = {
  overrides: Record<string, { hash: string; updatedAt: string }>;
};

function secret() {
  return process.env.STAFF_SESSION_SECRET?.trim() || process.env.OFFICE_SESSION_SECRET?.trim() || "dev-only";
}

function pk() {
  return `TENANT#${usageTenantId()}`;
}

function hashPassword(password: string) {
  return createHmac("sha256", secret()).update(password).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function loadStore(): Promise<PasswordStore> {
  try {
    const result = await adminDocumentClient().send(new GetCommand({
      TableName: usageTableName(),
      Key: { PK: pk(), SK: "CONFIG#STAFF_PASSWORDS" },
    }));
    const overrides = result.Item?.overrides;
    return { overrides: overrides && typeof overrides === "object" ? overrides as PasswordStore["overrides"] : {} };
  } catch {
    return { overrides: {} };
  }
}

async function saveStore(store: PasswordStore) {
  await adminDocumentClient().send(new PutCommand({
    TableName: usageTableName(),
    Item: {
      PK: pk(),
      SK: "CONFIG#STAFF_PASSWORDS",
      type: "staff_passwords",
      overrides: store.overrides,
      updatedAt: new Date().toISOString(),
    },
  }));
}

export async function passwordMatchesOverride(username: string, password: string) {
  const key = String(username || "").trim().toLowerCase();
  const stored = (await loadStore()).overrides[key];
  if (!stored?.hash) return false;
  return safeEqual(stored.hash, hashPassword(password));
}

export async function saveStaffPassword(username: string, password: string) {
  const key = String(username || "").trim().toLowerCase();
  if (!key) throw new Error("Choose an account.");
  if (password.trim().length < 8) throw new Error("Use a password with at least 8 characters.");
  const store = await loadStore();
  store.overrides[key] = { hash: hashPassword(password), updatedAt: new Date().toISOString() };
  await saveStore(store);
}
