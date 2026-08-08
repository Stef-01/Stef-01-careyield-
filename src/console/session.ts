// W11: console session tokens — an HMAC-signed staff identity carried in a cookie.
// Auth provider abstraction: the mock provider signs anyone in by email (synthetic
// phase — founder gate blocks production credentials). Supabase auth replaces the
// provider behind CAREYIELD_AUTH_PROVIDER without touching session handling.

import { createHmac, timingSafeEqual } from "node:crypto";
import { signingSecret } from "@/lib/secret";

export const SESSION_COOKIE = "cy_session";

function sig(payload: string): string {
  // Domain-separated from booking tokens: distinct HMAC key prevents a booking
  // token from ever validating as a session cookie or vice versa.
  return createHmac("sha256", `session:${signingSecret()}`).update(payload).digest("base64url");
}

export function signSession(email: string): string {
  const payload = Buffer.from(email, "utf8").toString("base64url");
  return `${payload}.${sig(payload)}`;
}

/** Returns the signed-in email for a valid session value; null otherwise. */
export function verifySession(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0 || dot === value.length - 1) return null;
  const payload = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1), "utf8");
  const expected = Buffer.from(sig(payload), "utf8");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const email = Buffer.from(payload, "base64url").toString("utf8");
  return email.includes("@") ? email : null;
}
