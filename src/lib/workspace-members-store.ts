"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WORKSPACE_MEMBERS, type WorkspaceMember, type UserRole } from "./workspace-data";

// Live workspace rosters. Seeded from WORKSPACE_MEMBERS, then mutated by the
// Settings → Workspaces panel (change role / remove). Persisted so demo edits
// survive navigation and reloads.

type MembersState = {
  members: Record<string, WorkspaceMember[]>;
  changeRole: (wsId: string, memberId: string, role: UserRole) => void;
  removeMember: (wsId: string, memberId: string) => void;
};

const seed = (): Record<string, WorkspaceMember[]> =>
  Object.fromEntries(
    Object.entries(WORKSPACE_MEMBERS).map(([wsId, roster]) => [
      wsId,
      roster.map((m) => ({ ...m })),
    ]),
  );

export const useWorkspaceMembersStore = create<MembersState>()(
  persist(
    (set) => ({
      members: seed(),
      changeRole: (wsId, memberId, role) =>
        set((s) => ({
          members: {
            ...s.members,
            [wsId]: (s.members[wsId] || []).map((m) =>
              m.id === memberId ? { ...m, role } : m,
            ),
          },
        })),
      removeMember: (wsId, memberId) =>
        set((s) => ({
          members: {
            ...s.members,
            [wsId]: (s.members[wsId] || []).filter((m) => m.id !== memberId),
          },
        })),
    }),
    { name: "revspot-workspace-members", version: 1 },
  ),
);

/** Roster for one workspace (live). */
export function useWorkspaceMembers(wsId: string): WorkspaceMember[] {
  return useWorkspaceMembersStore((s) => s.members[wsId] || []);
}

/** Live member count for one workspace. */
export function useWorkspaceMemberCount(wsId: string): number {
  return useWorkspaceMembersStore((s) => (s.members[wsId] || []).length);
}
