"use client";

import { Users, Plus, Sparkles } from "lucide-react";
import { ProjectDetail, Persona } from "@/lib/project-data";
import { SectionHeader } from "./shared/section-header";
import { PersonaCard } from "./persona-card";
import { useSpotStore } from "@/lib/spot/store";

export function PersonasSection({
  project,
  onAsk,
}: {
  project: ProjectDetail;
  onAsk: (q: string) => void;
}) {
  const openGuided = useSpotStore((s) => s.openGuided);

  return (
    <div>
      <SectionHeader
        icon={Users}
        title="Personas & creatives"
        subtitle="Who we're selling to · what we're saying"
        onAsk={() => onAsk("Audit personas — who's converting, who isn't?")}
        actions={
          <button
            type="button"
            onClick={() => openGuided({ kind: "new-persona", projectId: project.id })}
            className="apply-btn"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)" }}
          >
            <Sparkles size={11} /> New persona with Spot
          </button>
        }
      />
      <div className="space-y-3">
        {project.personas.map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            projectId={project.id}
            onAsk={onAsk}
            onGuidedFlow={(kind: "new-angle", persona: Persona) =>
              openGuided({ kind, projectId: project.id, personaId: persona.id })
            }
          />
        ))}
      </div>
    </div>
  );
}
