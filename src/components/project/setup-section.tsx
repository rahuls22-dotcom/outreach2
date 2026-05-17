"use client";

import { FileText, Palette, ImageIcon, Plus, Sparkles, Upload } from "lucide-react";
import { ProjectDetail } from "@/lib/project-data";
import { SectionHeader } from "./shared/section-header";
import { RichText } from "@/components/spot/rich-text";

function BulletBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const dot = tone === "positive" ? "#15803D" : "#DC2626";
  return (
    <div>
      <div className="uplabel mb-2" style={{ fontSize: 10 }}>
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.45]">
            <span
              className="inline-block flex-shrink-0 mt-1.5"
              style={{ width: 6, height: 6, borderRadius: "50%", background: dot }}
            />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaletteSwatch({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 6,
        background: color,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
      }}
      title={color}
    />
  );
}

export function SetupSection({
  project,
  onAsk,
}: {
  project: ProjectDetail;
  onAsk: (q: string) => void;
}) {
  return (
    <>
      {/* BRIEF */}
      <SectionHeader
        icon={FileText}
        title="Brief"
        subtitle={`Updated ${project.brief.updated}`}
        onAsk={() => onAsk("Rewrite the brief — sharpen the positioning")}
      />
      <div className="grid gap-3" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="card-base p-5">
          <div className="text-[13.5px] leading-[1.55] mb-5">
            <RichText text={project.brief.summary} />
          </div>
          <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <BulletBlock title="What sells" items={project.brief.usp} tone="positive" />
            <BulletBlock title="What to avoid" items={project.brief.avoid} tone="negative" />
          </div>
        </div>
        <div className="card-base p-5">
          <div className="uplabel mb-3" style={{ fontSize: 10 }}>
            Attached collateral
          </div>
          <ul className="space-y-2">
            {project.brief.attachments.map((a) => (
              <li
                key={a.name}
                className="hover-row flex items-center gap-3 px-2 py-2 rounded-[6px] cursor-pointer"
              >
                <div className="w-9 h-11 rounded-[4px] bg-surface-secondary flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium truncate">{a.name}</div>
                  <div className="text-[10.5px] text-text-tertiary uppercase tracking-wide">
                    {a.kind} · {a.size}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button border border-border bg-white hover:border-border-hover text-[11.5px]"
          >
            <Plus size={11} /> Attach more
          </button>
        </div>
      </div>

      {/* STRATEGY */}
      <SectionHeader
        icon={Palette}
        title="Voice & proof"
        subtitle={`Updated ${project.strategy.updated} · Inherits from Godrej Properties brand`}
        onAsk={() =>
          onAsk("Audit voice & proof — is anything drifting from the brand?")
        }
      />
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card-base p-5">
          <div className="uplabel mb-3" style={{ fontSize: 10 }}>
            Tone — project sharpened
          </div>
          <div className="mb-3">
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-text-tertiary mb-1.5">We are</div>
            <div className="flex flex-wrap gap-1.5">
              {project.strategy.tone.is.map((t) => (
                <span key={t} className="pill pill-ok" style={{ fontSize: 11 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-text-tertiary mb-1.5">We're not</div>
            <div className="flex flex-wrap gap-1.5">
              {project.strategy.tone.isNot.map((t) => (
                <span key={t} className="pill pill-err" style={{ fontSize: 11 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="uplabel mb-3" style={{ fontSize: 10 }}>
            Visual system
          </div>
          <div className="flex gap-2 mb-4">
            {project.strategy.visualSystem.palette.map((c) => (
              <PaletteSwatch key={c} color={c} />
            ))}
          </div>
          <ul className="space-y-1.5">
            {project.strategy.visualSystem.principles.map((p) => (
              <li key={p} className="text-[12px] text-text-secondary leading-[1.5]">
                · {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card-base p-5 mb-4">
        <div className="uplabel mb-3" style={{ fontSize: 10 }}>
          Proof points · use when relevant
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.strategy.proofPoints.map((p) => (
            <span key={p} className="pill pill-ok" style={{ fontSize: 11 }}>
              ✓ {p}
            </span>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-1 h-6 px-2 rounded text-[10.5px] border border-dashed border-border bg-white text-text-secondary"
          >
            <Plus size={10} /> Add proof point
          </button>
        </div>
      </div>

      {/* IMAGES */}
      <SectionHeader
        icon={ImageIcon}
        title="Project images"
        subtitle={`${project.images.length} uploaded · creative generator pulls from here`}
        onAsk={() => onAsk("Audit my image gallery — what's missing?")}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px]"
          >
            <Upload size={11} /> Upload
          </button>
        }
      />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {project.images.map((img) => (
          <div key={img.id} className="card-base overflow-hidden hover-row">
            <div
              style={{
                aspectRatio: "4 / 3",
                background: `repeating-linear-gradient(135deg, oklch(0.9 0.05 ${img.hue}) 0 6px, oklch(0.82 0.06 ${(img.hue + 30) % 360}) 6px 12px)`,
                position: "relative",
              }}
            >
              <span
                className="pill"
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(4px)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {img.kind}
              </span>
              {img.usedIn > 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    background: "#111",
                    color: "#FAFAF8",
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Sparkles size={9} /> {img.usedIn} ads
                </span>
              )}
            </div>
            <div className="px-2.5 py-2">
              <div className="text-[11.5px] font-medium truncate">{img.name}</div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onAsk("Upload more project images")}
          className="card-base flex flex-col items-center justify-center p-6 text-text-secondary hover:border-border-hover hover:bg-surface-page"
          style={{ borderStyle: "dashed" }}
        >
          <Upload size={18} />
          <span className="text-[11.5px] mt-1">Upload more</span>
        </button>
      </div>
    </>
  );
}
