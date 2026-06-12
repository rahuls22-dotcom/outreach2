import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, makeSessionToken } from "@/lib/session";

// The sign-in code lives server-side only (NOT NEXT_PUBLIC_) so it never ships
// in the client bundle. Set LOGIN_CODE in the host env; the fallback only keeps
// local dev working without configuration.
const LOGIN_CODE = process.env.LOGIN_CODE || "150397";

export async function POST(req: Request) {
  let code = "";
  try {
    const body = await req.json();
    code = typeof body?.code === "string" ? body.code : "";
  } catch {
    // Malformed body → falls through as a wrong code.
  }

  if (code !== LOGIN_CODE) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await makeSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
