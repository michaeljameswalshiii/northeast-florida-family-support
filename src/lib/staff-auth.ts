const COOKIE_NAME = "nefl_staff_session";
const SESSION_SECONDS = 60 * 60 * 8;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToText(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function secret() {
  return process.env.STAFF_SESSION_SECRET?.trim() || "";
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

export function staffAuthConfigured() {
  return Boolean(process.env.STAFF_ACCESS_PASSWORD?.trim() && secret().length >= 32);
}

export function staffCookieName() {
  return COOKIE_NAME;
}

export function staffCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export async function createStaffSession() {
  if (!staffAuthConfigured()) throw new Error("Staff access is not configured.");
  const payload = textToBase64Url(JSON.stringify({ exp: Date.now() + SESSION_SECONDS * 1000 }));
  return `${payload}.${await signature(payload)}`;
}

export async function verifyStaffSession(value?: string) {
  if (!staffAuthConfigured() || !value) return false;
  const [payload, suppliedSignature, extra] = value.split(".");
  if (!payload || !suppliedSignature || extra) return false;
  const expectedSignature = await signature(payload);
  if (suppliedSignature.length !== expectedSignature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < suppliedSignature.length; index += 1) {
    mismatch |= suppliedSignature.charCodeAt(index) ^ expectedSignature.charCodeAt(index);
  }
  if (mismatch !== 0) return false;
  try {
    const parsed = JSON.parse(base64UrlToText(payload)) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function requestHasStaffSession(request: Request) {
  const cookie = request.headers.get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  return verifyStaffSession(cookie);
}
