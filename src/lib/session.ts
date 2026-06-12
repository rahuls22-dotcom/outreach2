// Edge-safe session helpers. Both the /api/login route (Node runtime) and
// middleware.ts (Edge runtime) sign/verify the session cookie with the same
// HMAC, so a client can't forge it. Uses Web Crypto, which is present in both
// runtimes — keep this module free of Node-only APIs.

export const SESSION_COOKIE = "revspot_session";

// 30 days. The signed cookie is the single source of truth for "signed in".
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

// Signing secret. Server-only (never NEXT_PUBLIC_). Set AUTH_SECRET in the host
// env; the fallback only exists so local dev runs without configuration.
const SECRET = process.env.AUTH_SECRET || "revspot-dev-secret-change-in-prod";
const PAYLOAD = "revspot-authed-v1";

function base64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** HMAC-SHA256(secret, PAYLOAD) → the opaque session token stored in the cookie. */
export async function makeSessionToken(): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(PAYLOAD));
  return base64url(sig);
}

/** Constant-time compare of a presented cookie value against the expected token. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await makeSessionToken();
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
