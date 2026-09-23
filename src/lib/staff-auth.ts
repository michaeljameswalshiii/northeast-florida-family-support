import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "nefl_staff_session";
const SESSION_SECONDS = 60 * 60 * 12;

type StaffAccount = { username: string; password: string; role: "admin" | "staff" };
type StaffSession = { email: string; role: "admin" | "staff"; exp: number };

function secret() {
  return process.env.STAFF_SESSION_SECRET?.trim() || process.env.OFFICE_SESSION_SECRET?.trim() || "";
}

function normalizeId(value: string) {
  return String(value || "").trim().toLowerCase();
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function staffAccounts(): StaffAccount[] {
  const accounts: StaffAccount[] = [];
  const adminUser = process.env.OFFICE_ADMIN_USERNAME?.trim() || "";
  const adminPass = process.env.OFFICE_ADMIN_PASSWORD?.trim() || "";
  if (adminUser && adminPass) accounts.push({ username: adminUser, password: adminPass, role: "admin" });

  const staffUser = process.env.OFFICE_USERNAME?.trim() || process.env.STAFF_EMAIL?.trim() || "navigator";
  const staffPass = process.env.OFFICE_PASSWORD?.trim() || process.env.STAFF_ACCESS_PASSWORD?.trim() || "";
  if (staffPass) accounts.push({ username: staffUser, password: staffPass, role: "staff" });
  return accounts;
}

export function staffAuthConfigured() {
  return secret().length >= 32 && staffAccounts().length > 0;
}

export function staffCookieName() {
  return COOKIE_NAME;
}

export function staffCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export async function verifyStaffLogin(username: string, password: string) {
  const id = normalizeId(username);
  if (!id || !password || !staffAuthConfigured()) return null;
  for (const account of staffAccounts()) {
    if (safeEqual(normalizeId(account.username), id) && safeEqual(account.password, password)) {
      return { email: normalizeId(account.username), role: account.role };
    }
  }
  return null;
}

export async function createStaffSession(email: string, role: "admin" | "staff" = "staff") {
  if (!staffAuthConfigured()) throw new Error("Staff access is not configured.");
  const payload = Buffer.from(JSON.stringify({ email: normalizeId(email), role, exp: Date.now() + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function readStaffSession(value?: string): Promise<StaffSession | null> {
  if (!staffAuthConfigured() || !value) return null;
  const [payload, suppliedSignature, extra] = value.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expected = sign(payload);
  if (!safeEqual(suppliedSignature, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StaffSession;
    if (!parsed.email || typeof parsed.exp !== "number" || parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function verifyStaffSession(value?: string) {
  return Boolean(await readStaffSession(value));
}

export async function requestHasStaffSession(request: Request) {
  const raw = request.headers.get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return false;
  try {
    return verifyStaffSession(decodeURIComponent(raw));
  } catch {
    return verifyStaffSession(raw);
  }
}

export function configuredLoginIds() {
  return staffAccounts().map((account) => ({ username: account.username, role: account.role }));
}
