import { randomUUID } from "node:crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { addAdminIp, adminIpChecker, listAdminIps } from "./admin-ips";
import { adminDocumentClient, usageTableName, usageTenantId } from "./usage";

export type SiteVisit = {
  id: string;
  createdAt: string;
  path: string;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryName?: string;
  referrerHost?: string;
  source?: string;
  campaign?: string;
  event?: string;
  device?: string;
  browser?: string;
  admin?: boolean;
};

function pk() {
  return `TENANT#${usageTenantId()}`;
}

function clip(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

export function isPrivateIp(ip: string) {
  const value = String(ip || "").trim().toLowerCase();
  return !value || value === "unknown" || value === "::1" || value === "127.0.0.1" || value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("127.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(value);
}

export function clientIpFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "";
  return clip(forwarded.split(",")[0], 80) || "unknown";
}

export function geoFromHeaders(headers: Headers) {
  const country = clip(headers.get("x-vercel-ip-country"), 2).toUpperCase();
  return {
    country: /^[A-Z]{2}$/.test(country) ? country : undefined,
    region: clip(headers.get("x-vercel-ip-country-region") || headers.get("x-vercel-ip-region"), 80) || undefined,
    city: clip(headers.get("x-vercel-ip-city"), 80) || undefined,
  };
}

export async function lookupGeoFallback(ip: string) {
  if (isPrivateIp(ip)) return {};
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,region,city`, { cache: "no-store", signal: AbortSignal.timeout(1600) });
    if (!res.ok) return {};
    const data = await res.json() as { success?: boolean; country?: string; country_code?: string; region?: string; city?: string };
    if (!data.success) return {};
    return { country: clip(data.country_code, 2).toUpperCase() || undefined, countryName: clip(data.country, 80) || undefined, region: clip(data.region, 80) || undefined, city: clip(data.city, 80) || undefined };
  } catch {
    return {};
  }
}

export function parseUserAgent(ua?: string) {
  const s = String(ua || "").toLowerCase();
  const device = /ipad|tablet/.test(s) ? "tablet" : /mobi|iphone|android/.test(s) ? "mobile" : "desktop";
  let browser = "Other";
  if (s.includes("edg/")) browser = "Edge";
  else if (s.includes("chrome/")) browser = "Chrome";
  else if (s.includes("firefox/")) browser = "Firefox";
  else if (s.includes("safari/") && !s.includes("chrome")) browser = "Safari";
  return { device, browser };
}

export function referrerHost(raw?: string) {
  const value = String(raw || "").trim();
  if (!value) return "Direct / bookmark";
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    if (!host || host.includes("northeast-florida-family-support") || host.includes("vercel.app")) return "Direct / bookmark";
    return host;
  } catch {
    return "Direct / bookmark";
  }
}

export async function recordSiteVisit(input: { path?: string; ip?: string; geo?: { city?: string; region?: string; country?: string; countryName?: string }; referrer?: string; userAgent?: string; event?: string }) {
  const path = (clip(input.path, 500).split("?")[0] || "/").slice(0, 80) || "/";
  if (path.startsWith("/admin") || path.startsWith("/api/") || path.startsWith("/staff-")) return;
  const createdAt = new Date().toISOString();
  const id = randomUUID();
  const ip = clip(input.ip, 80) || "unknown";
  const ua = parseUserAgent(input.userAgent);
  const geo = input.geo || {};
  const host = referrerHost(input.referrer);
  await adminDocumentClient().send(new PutCommand({
    TableName: usageTableName(),
    Item: {
      PK: pk(),
      SK: `VISIT#${createdAt}#${id}`,
      type: "site_visit",
      id,
      createdAt,
      path,
      ip,
      city: isPrivateIp(ip) && !geo.city ? "Local network" : geo.city,
      region: geo.region,
      country: geo.country,
      countryName: geo.countryName,
      referrerHost: host,
      source: host,
      device: ua.device,
      browser: ua.browser,
      event: input.event || "page_view",
      ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
    },
  }));
}

function toVisit(item: Record<string, unknown>): SiteVisit {
  return {
    id: String(item.id || ""),
    createdAt: String(item.createdAt || ""),
    path: String(item.path || "/"),
    ip: String(item.ip || "unknown"),
    city: item.city ? String(item.city) : undefined,
    region: item.region ? String(item.region) : undefined,
    country: item.country ? String(item.country) : undefined,
    countryName: item.countryName ? String(item.countryName) : undefined,
    referrerHost: item.referrerHost ? String(item.referrerHost) : undefined,
    source: item.source ? String(item.source) : undefined,
    campaign: item.campaign ? String(item.campaign) : undefined,
    event: String(item.event || "page_view"),
    device: item.device ? String(item.device) : undefined,
    browser: item.browser ? String(item.browser) : undefined,
  };
}

export function locationLabel(visit: Pick<SiteVisit, "city" | "region" | "country" | "countryName">) {
  const parts = [visit.city, visit.region].filter(Boolean);
  const country = visit.countryName || visit.country;
  if (parts.length && country) return `${parts.join(", ")}, ${country}`;
  return parts.join(", ") || country || "Unknown";
}

export async function listVisits(options?: { days?: number; limit?: number }) {
  const days = Math.min(90, Math.max(1, options?.days || 7));
  const limit = Math.min(400, options?.limit || 120);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const isAdmin = await adminIpChecker();
  const items: SiteVisit[] = [];
  const result = await adminDocumentClient().send(new QueryCommand({
    TableName: usageTableName(),
    KeyConditionExpression: "PK = :pk AND SK BETWEEN :from AND :to",
    ExpressionAttributeValues: { ":pk": pk(), ":from": `VISIT#${since}`, ":to": "VISIT#9999" },
    ScanIndexForward: false,
    Limit: limit,
  }));
  for (const item of result.Items || []) {
    if (item.type && item.type !== "site_visit") continue;
    const visit = toVisit(item as Record<string, unknown>);
    items.push({ ...visit, admin: isAdmin(visit.ip) });
  }
  return items;
}

function ranked(map: Map<string, number>, limit = 8) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([key, count]) => ({ key, count }));
}

export async function getVisitSnapshot(days = 7) {
  const recent = await listVisits({ days, limit: 300 });
  const publicVisits = recent.filter((visit) => !visit.admin);
  const adminVisits = recent.filter((visit) => visit.admin);
  const ips = new Set(publicVisits.map((visit) => visit.ip).filter((ip) => ip && ip !== "unknown"));
  const cities = new Map<string, number>();
  const countries = new Map<string, number>();
  const dayViews = new Map<string, number>();
  const adminDay = new Map<string, number>();
  const pages = new Map<string, number>();
  for (const visit of publicVisits) {
    const label = locationLabel(visit);
    cities.set(label, (cities.get(label) || 0) + 1);
    if (visit.country) countries.set(visit.country, (countries.get(visit.country) || 0) + 1);
    const day = visit.createdAt.slice(0, 10);
    dayViews.set(day, (dayViews.get(day) || 0) + 1);
    pages.set(visit.path, (pages.get(visit.path) || 0) + 1);
  }
  for (const visit of adminVisits) {
    const day = visit.createdAt.slice(0, 10);
    adminDay.set(day, (adminDay.get(day) || 0) + 1);
  }
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    series.push({
      label: new Intl.DateTimeFormat("en-US", days <= 7 ? { weekday: "short" } : { month: "numeric", day: "numeric" }).format(date),
      value: dayViews.get(key) || 0,
      adminValue: adminDay.get(key) || 0,
    });
  }
  return {
    days,
    items: recent.slice(0, 120),
    uniqueVisitors: ips.size,
    uniqueLocations: cities.size,
    topCities: ranked(cities, 6).map((row) => ({ label: row.key, count: row.count })),
    topCountries: ranked(countries, 6).map((row) => ({ code: row.key, name: row.key, count: row.count })),
    series,
    adminVisits: adminVisits.length,
    uniqueAdmin: new Set(adminVisits.map((visit) => visit.ip)).size,
    topPages: ranked(pages, 8).map((row) => ({ path: row.key, views: row.count })),
  };
}

export async function buildSiteReport(days = 7) {
  const snapshot = await getVisitSnapshot(days);
  const visits = snapshot.items.filter((visit) => !visit.admin);
  const sources = new Map<string, number>();
  const devices = new Map<string, number>();
  const browsers = new Map<string, number>();
  const dayViews = new Map<string, number>();
  const dayIps = new Map<string, Set<string>>();
  for (const visit of visits) {
    sources.set(visit.source || visit.referrerHost || "Direct / bookmark", (sources.get(visit.source || visit.referrerHost || "Direct / bookmark") || 0) + 1);
    devices.set(visit.device || "desktop", (devices.get(visit.device || "desktop") || 0) + 1);
    browsers.set(visit.browser || "Other", (browsers.get(visit.browser || "Other") || 0) + 1);
    const day = visit.createdAt.slice(0, 10);
    dayViews.set(day, (dayViews.get(day) || 0) + 1);
    if (!dayIps.has(day)) dayIps.set(day, new Set());
    if (visit.ip && visit.ip !== "unknown") dayIps.get(day)!.add(visit.ip);
  }
  const daily = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    daily.push({
      date: key,
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
      views: dayViews.get(key) || 0,
      uniqueVisitors: dayIps.get(key)?.size || 0,
      inquiries: 0,
    });
  }
  return {
    days,
    generatedAt: new Date().toISOString(),
    views: visits.length,
    visitors: snapshot.uniqueVisitors,
    uniqueVisitors: snapshot.uniqueVisitors,
    uniqueLocations: snapshot.uniqueLocations,
    inquiries: 0,
    unreadInquiries: 0,
    series: snapshot.series,
    adminVisits: snapshot.adminVisits,
    uniqueAdmin: snapshot.uniqueAdmin,
    excludedIps: (await listAdminIps()).map((item) => ({ ip: item.ip, label: item.label, source: item.source })),
    topPages: snapshot.topPages,
    topCities: snapshot.topCities,
    topCountries: snapshot.topCountries,
    sources: ranked(sources).map((row) => ({ host: row.key, count: row.count })),
    campaigns: [],
    conversions: [],
    inquirySources: [],
    conversionCount: 0,
    devices: ranked(devices).map((row) => ({ device: row.key, count: row.count })),
    browsers: ranked(browsers).map((row) => ({ browser: row.key, count: row.count })),
    daily,
    pagesPerVisitor: snapshot.uniqueVisitors ? Number((visits.length / snapshot.uniqueVisitors).toFixed(1)) : 0,
  };
}

export { addAdminIp };
