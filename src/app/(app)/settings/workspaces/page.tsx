"use client";

/**
 * Settings → Workspaces (admin-only; guarded in the settings layout).
 *
 * Lists every workspace under the org. Each row drills into that
 * workspace's member roster. Member count is the live count from the
 * members store, so it stays honest after add/remove.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { WORKSPACES } from "@/lib/workspace-data";
import { useWorkspaceMembersStore } from "@/lib/workspace-members-store";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function WorkspacesSettingsPage() {
  const membersByWs = useWorkspaceMembersStore((s) => s.members);

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-[680px]">
      <div className="mb-5">
        <h2 className="text-[16px] font-semibold text-text-primary">Workspaces</h2>
        <p className="text-[12.5px] text-text-secondary mt-1 leading-[1.5]">
          Every workspace under your organization. Open one to manage its members and roles.
        </p>
      </div>

      <div className="bg-white border border-border rounded-card overflow-hidden">
        {WORKSPACES.map((w, i) => {
          const count = membersByWs[w.id]?.length ?? w.memberCount;
          return (
            <Link
              key={w.id}
              href={`/settings/workspaces/${w.id}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-page transition-colors ${
                i > 0 ? "border-t border-border-subtle" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-text-primary leading-tight">{w.name}</div>
                <div className="text-[11.5px] text-text-tertiary truncate">{w.region}</div>
              </div>
              <div className="text-[12px] text-text-secondary flex-shrink-0">
                {count} member{count === 1 ? "" : "s"}
              </div>
              <ChevronRight size={15} className="text-text-tertiary flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
