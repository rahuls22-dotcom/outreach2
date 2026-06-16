"use client";

/**
 * Settings → Workspaces → [workspace] (admin-only; guarded in the layout).
 * Thin route shell: back link + the member-management section.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { WorkspaceMembers } from "@/components/workspaces/workspace-members";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function WorkspaceDetailSettingsPage() {
  const params = useParams();
  const id = String(params.id);

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-[760px]">
      <Link
        href="/settings/workspaces"
        className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-text-secondary mb-4 transition-colors"
      >
        <ArrowLeft size={13} /> Workspaces
      </Link>
      <WorkspaceMembers wsId={id} />
    </motion.div>
  );
}
