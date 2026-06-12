// Client-side auth helper. The real boundary is the signed httpOnly session
// cookie set by /api/login and enforced in middleware.ts; this module only
// exposes a sign-out that clears that cookie via /api/logout.

/** Clear the server session cookie. Resolves once the cookie is expired. */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch {
    // Ignore — the subsequent redirect to /login still bounces the user out,
    // and middleware re-challenges on the next request.
  }
}
