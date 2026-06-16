"use client";

import { useState } from "react";
import { UserPlus, Trash2, ShieldCheck, Clock } from "lucide-react";
import { getWorkspace, type UserRole, type WorkspaceMember } from "@/lib/workspace-data";
import { useWorkspaceMembers, useWorkspaceMembersStore } from "@/lib/workspace-members-store";
import { useInviteStore } from "@/lib/invite-data";
import { useSpotStore } from "@/lib/spot/store";
import { InviteUserModal } from "@/components/invite/invite-user-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RoleSelect } from "@/components/workspaces/role-select";

/**
 * Settings → Workspaces → [workspace]. The member roster for one workspace:
 * who's in it, their role, change-role and remove actions, plus any invites
 * still pending. Invites are scoped to this workspace (the picker is hidden —
 * the target is fixed by where you opened the modal from).
 */
export function WorkspaceMembers({ wsId }: { wsId: string }) {
  const ws = getWorkspace(wsId);
  const members = useWorkspaceMembers(wsId);
  const changeRole = useWorkspaceMembersStore((s) => s.changeRole);
  const removeMember = useWorkspaceMembersStore((s) => s.removeMember);
  const invites = useInviteStore((s) => s.invites);
  const resendInvite = useInviteStore((s) => s.resendInvite);
  const revokeInvite = useInviteStore((s) => s.revokeInvite);
  const showToast = useSpotStore((s) => s.showToast);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<WorkspaceMember | null>(null);
  const [pendingRole, setPendingRole] = useState<{ member: WorkspaceMember; next: UserRole } | null>(null);

  if (!ws) {
    return <div className="text-[13px] text-text-tertiary">Workspace not found.</div>;
  }

  // A workspace must keep at least one admin — the last admin can't be
  // demoted or removed, or no one could manage the workspace afterward.
  const adminCount = members.filter((m) => m.role === "admin").length;
  const pending = invites.filter(
    (i) => i.status === "pending" && i.workspaceIds.includes(wsId),
  );

  const confirmRemove = () => {
    if (!pendingRemove) return;
    removeMember(wsId, pendingRemove.id);
    showToast(`${pendingRemove.name} removed from ${ws.name}`);
    setPendingRemove(null);
  };

  const confirmRoleChange = () => {
    if (!pendingRole) return;
    changeRole(wsId, pendingRole.member.id, pendingRole.next);
    showToast(
      `${pendingRole.member.name} is now ${pendingRole.next === "admin" ? "an admin" : "a member"} in ${ws.name}`,
    );
    setPendingRole(null);
  };

  return (
    <div>
      {/* Header: identity on the left, the one primary action on the right. */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-text-primary leading-tight">{ws.name}</h2>
          <div className="text-[12px] text-text-tertiary mt-0.5">{ws.region}</div>
        </div>
        <button type="button" onClick={() => setInviteOpen(true)} className="apply-btn flex-shrink-0">
          <UserPlus size={12} /> Invite to workspace
        </button>
      </div>

      {/* Members */}
      <div className="text-[11px] uppercase tracking-[0.4px] text-text-tertiary mb-2 font-semibold">
        Members · {members.length}
      </div>
      <div className="bg-white border border-border rounded-card overflow-hidden">
        {members.map((m, i) => {
          const isLastAdmin = m.role === "admin" && adminCount === 1;
          const initials = m.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2);
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border-subtle" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-medium text-text-secondary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-text-primary leading-tight truncate">
                  {m.name}
                </div>
                <div className="text-[11.5px] text-text-tertiary truncate">{m.email}</div>
              </div>
              <RoleSelect
                value={m.role}
                onChange={(role) => {
                  if (role !== m.role) setPendingRole({ member: m, next: role });
                }}
                disabled={isLastAdmin}
                disabledHint="A workspace needs at least one admin."
              />
              <button
                type="button"
                onClick={() => setPendingRemove(m)}
                disabled={isLastAdmin}
                title={isLastAdmin ? "A workspace needs at least one admin." : "Remove from workspace"}
                aria-label={`Remove ${m.name}`}
                className="inline-flex items-center justify-center h-7 w-7 rounded-[6px] text-text-tertiary hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-tertiary disabled:cursor-not-allowed"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Pending invites — only shown when there are any, so the section
          earns its place rather than sitting empty. */}
      {pending.length > 0 && (
        <>
          <div className="text-[11px] uppercase tracking-[0.4px] text-text-tertiary mb-2 font-semibold mt-6 flex items-center gap-1.5">
            <Clock size={11} /> Pending invites · {pending.length}
          </div>
          <div className="bg-white border border-border rounded-card overflow-hidden">
            {pending.map((inv, i) => (
              <div
                key={inv.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border-subtle" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-text-primary leading-tight truncate">{inv.email}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1.5">
                    {inv.role === "admin" && <ShieldCheck size={11} />}
                    Invited as {inv.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resendInvite(inv.id);
                    showToast(`Invite resent to ${inv.email}`);
                  }}
                  className="text-[12px] text-text-secondary hover:text-text-primary px-2 h-7 rounded-[6px] hover:bg-surface-page transition-colors"
                >
                  Resend
                </button>
                <button
                  type="button"
                  onClick={() => {
                    revokeInvite(inv.id);
                    showToast(`Invite to ${inv.email} revoked`);
                  }}
                  className="text-[12px] text-text-tertiary hover:text-[#DC2626] px-2 h-7 rounded-[6px] hover:bg-[#FEF2F2] transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} lockWorkspaceId={wsId} />

      <ConfirmDialog
        open={!!pendingRemove}
        destructive
        title={pendingRemove ? `Remove ${pendingRemove.name}?` : "Remove member?"}
        body={
          pendingRemove ? (
            <>
              They&apos;ll lose access to <strong>{ws.name}</strong> and its projects. You can invite
              them again later.
            </>
          ) : undefined
        }
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />

      <ConfirmDialog
        open={!!pendingRole}
        title={
          pendingRole
            ? `Make ${pendingRole.member.name} ${pendingRole.next === "admin" ? "an admin" : "a member"}?`
            : "Change role?"
        }
        body={
          pendingRole ? (
            pendingRole.next === "admin" ? (
              <>
                They&apos;ll be able to manage members and settings for <strong>{ws.name}</strong>.
              </>
            ) : (
              <>
                They&apos;ll lose member and settings management for <strong>{ws.name}</strong>, keeping
                project-level access.
              </>
            )
          ) : undefined
        }
        confirmLabel={pendingRole?.next === "admin" ? "Make admin" : "Make member"}
        onConfirm={confirmRoleChange}
        onCancel={() => setPendingRole(null)}
      />
    </div>
  );
}
