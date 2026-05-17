"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { USERS, type AppUser, type UserRole, WORKSPACES, getWorkspace } from "./workspace-data";

// Active scope can be a specific workspace, or "all" (admin-only — admin
// dashboard view across every workspace).
export type WorkspaceScope = string; // workspace id, or the literal "all"

type WorkspaceState = {
  currentUserId: string;
  scope: WorkspaceScope;

  setUser: (userId: string) => void;
  setScope: (scope: WorkspaceScope) => void;
  // Demo helper: flip role between admin and member to preview both views.
  setDemoRole: (role: UserRole) => void;
};

const ADMIN_ID = "u-head-marketing";
const MEMBER_ID = "u-south-lead";

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentUserId: ADMIN_ID,
      scope: "ws-south",
      setUser: (userId) => {
        const u = USERS.find((x) => x.id === userId);
        if (!u) return;
        set({ currentUserId: userId, scope: u.defaultWorkspaceId });
      },
      setScope: (scope) => set({ scope }),
      setDemoRole: (role) => {
        const u = USERS.find((x) => x.id === (role === "admin" ? ADMIN_ID : MEMBER_ID));
        if (!u) return;
        set({ currentUserId: u.id, scope: role === "admin" ? "all" : u.defaultWorkspaceId });
      },
    }),
    { name: "revspot-workspace" },
  ),
);

/** Convenience selectors. */
export function useCurrentUser(): AppUser {
  const id = useWorkspaceStore((s) => s.currentUserId);
  return USERS.find((u) => u.id === id) || USERS[0];
}

export function useAccessibleWorkspaces() {
  const user = useCurrentUser();
  return WORKSPACES.filter((w) => user.workspaceIds.includes(w.id));
}

export function useCurrentScope() {
  const scope = useWorkspaceStore((s) => s.scope);
  const user = useCurrentUser();
  // Members can never scope to "all"; force back to their default.
  if (scope === "all" && user.role !== "admin") {
    return { kind: "workspace" as const, id: user.defaultWorkspaceId };
  }
  if (scope === "all") return { kind: "all" as const };
  return { kind: "workspace" as const, id: scope };
}

export function useCurrentWorkspaceLabel() {
  const scope = useCurrentScope();
  if (scope.kind === "all") return "All workspaces";
  const w = getWorkspace(scope.id);
  return w?.name || "Workspace";
}
