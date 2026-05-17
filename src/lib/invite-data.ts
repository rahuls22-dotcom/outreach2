"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "./workspace-data";

export type Invite = {
  id: string;
  email: string;
  role: UserRole;
  workspaceIds: string[]; // workspace(s) the invitee will join
  invitedByUserId: string;
  invitedAt: number;
  message?: string;
  status: "pending" | "accepted" | "expired";
};

type InviteState = {
  invites: Invite[];
  addInvite: (i: Omit<Invite, "id" | "invitedAt" | "status">) => Invite;
  resendInvite: (id: string) => void;
  revokeInvite: (id: string) => void;
};

export const useInviteStore = create<InviteState>()(
  persist(
    (set) => ({
      invites: [],
      addInvite: (i) => {
        const invite: Invite = {
          ...i,
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          invitedAt: Date.now(),
          status: "pending",
        };
        set((s) => ({ invites: [invite, ...s.invites] }));
        return invite;
      },
      resendInvite: (id) =>
        set((s) => ({
          invites: s.invites.map((x) =>
            x.id === id ? { ...x, invitedAt: Date.now() } : x,
          ),
        })),
      revokeInvite: (id) =>
        set((s) => ({ invites: s.invites.filter((x) => x.id !== id) })),
    }),
    { name: "revspot-invites" },
  ),
);

/** UI helper: parse a textarea of emails. Accepts commas, newlines, spaces. */
export function parseEmails(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
}
