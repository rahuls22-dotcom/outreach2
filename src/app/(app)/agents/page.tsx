"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Plus, Phone, MessageCircle, Play, Pause, Copy, Pencil, Target, Variable, FlaskConical } from "lucide-react";
import { newAgentsList } from "@/lib/voice-agent-data";
import type { AgentListItem } from "@/lib/types/agent";
import { EmptyState } from "@/components/layout/empty-state";
import { IllustrationAgents } from "@/components/illustrations/empty-states";
import { useDemoMode } from "@/lib/demo-mode";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

function StatusBadge({ status }: { status: AgentListItem["status"] }) {
  const cfg = {
    active: { label: "Active", cls: "bg-[#F0FDF4] text-[#15803D]" },
    draft: { label: "Draft", cls: "bg-surface-secondary text-text-secondary" },
    paused: { label: "Paused", cls: "bg-[#FEF3C7] text-[#92400E]" },
  };
  const { label, cls } = cfg[status];
  return <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${cls}`}>{label}</span>;
}

function ChannelBadges({ channels }: { channels: ("voice" | "whatsapp")[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {channels.includes("voice") && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-[#EFF6FF] text-[#1D4ED8]">
          <Phone size={10} strokeWidth={2} />
          Voice
        </span>
      )}
      {channels.includes("whatsapp") && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-[#F0FDF4] text-[#15803D]">
          <MessageCircle size={10} strokeWidth={2} />
          WhatsApp
        </span>
      )}
    </div>
  );
}

function TemplateBadge({ template }: { template: AgentListItem["template"] }) {
  const labels: Record<string, string> = {
    qualifying: "Qualifying",
    follow_up: "Follow-up",
    survey: "Survey",
    onboarding: "Onboarding",
    blank: "Custom",
  };
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge bg-surface-secondary text-text-secondary capitalize">
      {labels[template] || template}
    </span>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const { isEmpty } = useDemoMode();
  const agents = isEmpty ? [] : newAgentsList;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <div className="text-meta text-text-secondary mb-1">Tools</div>
          <h1 className="text-page-title text-text-primary">Agents</h1>
        </div>
        <button
          onClick={() => router.push("/agents/create")}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
        >
          <Plus size={15} strokeWidth={2} /> Create Agent
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4">
        {agents.length === 0 ? (
          <EmptyState
            illustration={<IllustrationAgents />}
            title="No agents created"
            description="Create a voice or WhatsApp agent to start qualifying your leads automatically."
            action={
              <button onClick={() => router.push("/agents/create")}
                className="h-9 px-4 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150">
                Create Agent
              </button>
            }
          />
        ) : agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => router.push(`/agents/${agent.id}`)}
            className="bg-white border border-border rounded-card p-5 hover:shadow-card-hover hover:-translate-y-px transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Row 1: name + badges */}
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-[14px] font-semibold text-text-primary">{agent.name}</h3>
                  <ChannelBadges channels={agent.supported_channels} />
                  <TemplateBadge template={agent.template} />
                  <StatusBadge status={agent.status} />
                </div>

                {/* Row 2: description */}
                <div className="text-[12px] text-text-secondary mb-3">
                  {agent.description}
                </div>

                {/* Row 3: objectives + variables + languages */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="inline-flex items-center gap-1 text-[12px] text-text-secondary">
                    <Target size={12} strokeWidth={1.5} className="text-text-tertiary" />
                    <span className="text-text-primary font-medium">{agent.objectives_count}</span> objectives
                  </span>
                  {agent.variables_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-[12px] text-text-secondary">
                      <Variable size={12} strokeWidth={1.5} className="text-text-tertiary" />
                      <span className="text-text-primary font-medium">{agent.variables_count}</span> variables
                    </span>
                  )}
                  <span className="text-[12px] text-text-secondary">
                    {agent.languages.join(", ")}
                  </span>
                </div>

                {/* Row 4: stats + workflows */}
                <div className="flex items-center gap-5">
                  {agent.status === "active" && agent.total_calls > 0 && (
                    <span className="text-[12px] text-text-secondary">
                      <span className="text-text-primary font-medium tabular-nums">{agent.total_calls.toLocaleString()}</span> calls
                      <span className="mx-1.5 text-border">·</span>
                      <span className="text-text-primary font-medium tabular-nums">{agent.qualification_rate}%</span> qualified
                      <span className="mx-1.5 text-border">·</span>
                      <span className="text-text-primary font-medium tabular-nums">{agent.avg_duration}</span> min avg
                    </span>
                  )}
                  <span className="text-[11px] text-text-tertiary">{agent.post_call_summary}</span>
                </div>
              </div>

              {/* Right: last used + actions */}
              <div className="flex flex-col items-end gap-2 ml-4">
                <span className="text-[11px] text-text-tertiary">{agent.last_used}</span>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="p-1.5 rounded-button text-text-tertiary hover:text-accent hover:bg-[#EFF6FF] transition-colors" title="Test Agent">
                    <FlaskConical size={13} strokeWidth={1.5} />
                  </button>
                  <button className="p-1.5 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors" title="Edit">
                    <Pencil size={13} strokeWidth={1.5} />
                  </button>
                  <button className="p-1.5 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors" title="Duplicate">
                    <Copy size={13} strokeWidth={1.5} />
                  </button>
                  {agent.status === "active" ? (
                    <button className="p-1.5 rounded-button text-text-tertiary hover:text-[#92400E] hover:bg-[#FEF3C7] transition-colors" title="Pause">
                      <Pause size={13} strokeWidth={1.5} />
                    </button>
                  ) : (
                    <button className="p-1.5 rounded-button text-text-tertiary hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors" title="Resume">
                      <Play size={13} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
