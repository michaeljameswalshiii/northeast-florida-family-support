import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { adminDocumentClient, usageTableName, usageTenantId } from "./usage";

export type AdminIp = { ip: string; label?: string; createdAt: string; source: "desk" | "env" };

function pk() {
  return `TENANT#${usageTenantId()}`;
}

function normalizeIp(raw?: string | null) {
  return String(raw || "").split(",")[0].trim().toLowerCase();
}

async function loadStored(): Promise<AdminIp[]> {
  try {
    const result = await adminDocumentClient().send(new GetCommand({
      TableName: usageTableName(),
      Key: { PK: pk(), SK: "CONFIG#ADMIN_IPS" },
    }));
    return Array.isArray(result.Item?.items) ? result.Item.items as AdminIp[] : [];
  } catch {
    return [];
  }
}

export async function listAdminIps() {
  const stored = await loadStored();
  const env = String(process.env.SITE_HEALTH_ADMIN_IPS || "").split(/[\s,;]+/).filter(Boolean).map((ip) => ({
    ip, source: "env" as const, createdAt: "", label: "From server settings",
  }));
  const seen = new Set(stored.map((item) => item.ip));
  return [...stored, ...env.filter((item) => !seen.has(item.ip))];
}

export async function adminIpChecker() {
  const items = await listAdminIps();
  const set = new Set(items.map((item) => item.ip));
  return (raw?: string | null) => set.has(normalizeIp(raw));
}

export async function addAdminIp(raw: string, label?: string) {
  const ip = normalizeIp(raw);
  if (!ip) throw new Error("That does not look like an IP address.");
  const items = await loadStored();
  if (items.some((item) => item.ip === ip)) return items;
  const next = [{ ip, label: label?.trim().slice(0, 80), createdAt: new Date().toISOString(), source: "desk" as const }, ...items].slice(0, 50);
  await adminDocumentClient().send(new PutCommand({
    TableName: usageTableName(),
    Item: { PK: pk(), SK: "CONFIG#ADMIN_IPS", type: "admin_ips", items: next, updatedAt: new Date().toISOString() },
  }));
  return next;
}
