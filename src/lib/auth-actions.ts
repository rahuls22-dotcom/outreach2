"use client";

import { useRouter } from "next/navigation";
import { signOut } from "./auth";

/**
 * Shared log-out action. Confirms, clears local demo state, signs out, and
 * routes to /login. Used by the sidebar (member view) and Settings → Profile
 * so there is exactly one implementation of "log out".
 */
export function useLogout() {
  const router = useRouter();
  return async () => {
    if (typeof window === "undefined") return;
    const confirmed = window.confirm("Log out of Revspot?");
    if (!confirmed) return;
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("revspot:"))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    await signOut();
    router.push("/login");
  };
}
