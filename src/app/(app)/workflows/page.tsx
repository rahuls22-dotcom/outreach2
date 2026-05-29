"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Plus } from "lucide-react";
import { workflowsList } from "@/lib/workflow-data";
import type { WorkflowStatus } from "@/lib/types/workflow";
import { EmptyState } from "@/components/layout/empty-state";
import { IllustrationSequences } from "@/components/illustrations/empty-states";
import { useDemoMode } from "@/lib/demo-mode";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

function StatusBadge({ status, progress }: { status: WorkflowStatus; progress: number }) {
  const config: Record<WorkflowStatus, { label: string; cls: string }> = {
    active: {
      label: `Active (${Math.round(progress)}%)`,
      cls: "bg-[#EFF6FF] text-[#1D4ED8]",
    },
    completed: { label: "Completed", cls: "bg-[#F0FDF4] text-[#15803D]" },
    paused: { label: "Paused", cls: "bg-surface-secondary text-text-secondary" },
    scheduled: { label: "Scheduled", cls: "bg-[#FDF4FF] text-[#7C3AED]" },
    draft: { label: "Draft", cls: "bg-surface-secondary text-text-tertiary" },
  };
  const { label, cls } = config[status];
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${cls}`}>
      {label}
    </span>
  );
}

function TriggerBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    csv_upload: "CSV Upload",
    crm_webhook: "CRM Webhook",
    campaign_lead: "Campaign Lead",
    manual: "Manual",
    workflow_trigger: "Workflow",
  };
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge bg-surface-secondary text-text-secondary">
      {labels[type] || type}
    </span>
  );
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { isEmpty } = useDemoMode();
  const workflows = isEmpty ? [] : workflowsList;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <div className="text-meta text-text-secondary mb-1">Tools</div>
          <h1 className="text-page-title text-text-primary">Sequences</h1>
        </div>
        <button
          onClick={() => router.push("/workflows/create")}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
        >
          <Plus size={15} strokeWidth={2} />
          Create Sequence
        </button>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} className="bg-white border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {[
                  { label: "Name", align: "left" },
                  { label: "Trigger", align: "left" },
                  { label: "Agent(s)", align: "left" },
                  { label: "Status", align: "left" },
                  { label: "Progress", align: "left" },
                  { label: "Created", align: "left" },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={`px-4 py-3 text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-${h.align}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workflows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      illustration={<IllustrationSequences />}
                      title="No sequences created"
                      description="Build automated multi-step sequences to nurture leads across channels."
                      action={
                        <button onClick={() => router.push("/workflows/create")}
                          className="h-9 px-4 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150">
                          Create Sequence
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : workflows.map((w, i) => (
                <tr
                  key={w.id}
                  onClick={() => router.push(`/workflows/${w.id}`)}
                  className={`hover:bg-surface-page transition-colors duration-150 cursor-pointer border-b border-border-subtle last:border-b-0 ${
                    i % 2 === 0 ? "bg-white" : "bg-surface-page/40"
                  }`}
                >
                  <td className="px-4 py-3 text-[13px] text-text-primary font-medium max-w-[260px] truncate">
                    {w.name}
                  </td>
                  <td className="px-4 py-3">
                    <TriggerBadge type={w.trigger_type} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary max-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      {w.agent_names.map((a) => (
                        <span key={a} className="truncate">{a}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={w.status} progress={w.progress} />
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-secondary rounded-full h-1.5">
                        <div
                          className="bg-accent rounded-full h-1.5 transition-all duration-300"
                          style={{ width: `${w.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-text-tertiary tabular-nums whitespace-nowrap">
                        {Math.round(w.progress)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary whitespace-nowrap">
                    {new Date(w.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
