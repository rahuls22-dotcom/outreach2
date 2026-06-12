import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { AppShell } from "./app-shell";

// Server-side auth gate for every (app) route. Reading the cookie via
// next/headers forces these routes to render dynamically (never statically
// prerendered), so the check runs on every request through the compute layer
// — middleware alone isn't enough on AWS Amplify, where statically generated
// pages are served from the CDN and bypass middleware. middleware.ts still
// handles the nicer /login?next=... redirect for routes that do hit it.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    redirect("/login");
  }
  return <AppShell>{children}</AppShell>;
}
