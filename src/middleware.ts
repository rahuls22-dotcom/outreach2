import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Server-side auth boundary. Every app route requires a valid signed session
// cookie; unauthenticated requests are redirected to /login?next=... before any
// page HTML is sent — so the code never ships to the browser and the gate
// can't be bypassed by editing localStorage. The matcher excludes the public
// entry routes (/login, /signup, /get-started), the auth API, Next internals,
// and any static file.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  const next = req.nextUrl.pathname + req.nextUrl.search;
  url.pathname = "/login";
  url.search = `next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!login|signup|get-started|api/login|api/logout|_next/static|_next/image|favicon.ico|fonts|.*\\..*).*)",
  ],
};
