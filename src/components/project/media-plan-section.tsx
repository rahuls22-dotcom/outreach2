"use client";

import { useState } from "react";
import { ChevronRight, Monitor, Sparkles } from "lucide-react";
import { ProjectDetail, MediaRow, MediaAdSet, MediaAd } from "@/lib/project-data";
import { SectionHeader } from "./shared/section-header";
import { SpotInlineCallout } from "./shared/spot-callout";
import { useSpotStore } from "@/lib/spot/store";

const MP_COLS = "24px 1fr 70px 90px 90px 90px 90px 100px 36px";

function ChannelChip({ channel }: { channel: "Meta" | "Google" }) {
  return (
    <span
      style={{
        background: channel === "Meta" ? "#EAF1FF" : "#FEF6E7",
        color: channel === "Meta" ? "#1E5BFF" : "#9C6D00",
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      {channel}
    </span>
  );
}

function MediaStatus({ status }: { status: MediaRow["status"] }) {
  const map = {
    live: { label: "Live", bg: "var(--ok-bg)", fg: "var(--ok-fg)" },
    paused: { label: "Paused", bg: "var(--bg-secondary)", fg: "var(--text-2)" },
    proposed: { label: "Proposed", bg: "var(--info-bg)", fg: "var(--info-fg)" },
    draft: { label: "Draft", bg: "var(--warn-bg)", fg: "var(--warn-fg)" },
  } as const;
  const m = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 pill"
      style={{ background: m.bg, color: m.fg, fontSize: 10.5 }}
    >
      {status === "live" && (
        <span
          className="spot-pulse"
          style={{ width: 5, height: 5, borderRadius: "50%", background: m.fg, display: "inline-block" }}
        />
      )}
      {m.label}
    </span>
  );
}

function SpotChangeCell({ change, onClick, small }: { change: string | null; onClick: () => void; small?: boolean }) {
  if (!change) return <span />;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={change}
      style={{
        background: "#FFF8E1",
        color: "#7A5A00",
        border: "1px solid #E8C97A",
        padding: small ? "1px 5px" : "2px 6px",
        borderRadius: 4,
        fontSize: small ? 9.5 : 10.5,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      <Sparkles size={9} /> {change.length > 18 ? change.slice(0, 18) + "…" : change}
    </button>
  );
}

function AdRow({ ad }: { ad: MediaAd }) {
  const tagPill =
    ad.tag === "winner"
      ? "pill-ok"
      : ad.tag === "loser"
      ? "pill-err"
      : ad.status === "draft"
      ? "pill-warn"
      : "";
  return (
    <div
      className="grid items-center text-[11px] hover-row"
      style={{ gridTemplateColumns: MP_COLS, padding: "7px 14px 7px 62px" }}
    >
      <span />
      <div className="min-w-0 truncate text-text-secondary">{ad.name}</div>
      <span />
      <span className="text-right tabular-nums">{ad.spend ? `₹${(ad.spend / 1000).toFixed(0)}K` : "—"}</span>
      <span className="text-right tabular-nums">{ad.leads || "—"}</span>
      <span />
      <span className="text-right tabular-nums">{ad.cpl ? `₹${ad.cpl}` : "—"}</span>
      <div>
        {ad.tag && (
          <span className={`pill ${tagPill}`} style={{ fontSize: 9.5 }}>
            {ad.tag === "winner" ? "★ Winner" : ad.tag === "loser" ? "Loser" : ""}
          </span>
        )}
        {ad.status === "draft" && (
          <span className="pill pill-warn" style={{ fontSize: 9.5 }}>Draft</span>
        )}
      </div>
      <span />
    </div>
  );
}

function AdSetRow({
  adSet,
  onAsk,
  campaignName,
}: {
  adSet: MediaAdSet;
  onAsk: (q: string) => void;
  campaignName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid items-center w-full text-left hover-row"
        style={{ gridTemplateColumns: MP_COLS, padding: "8px 14px 8px 38px" }}
      >
        <ChevronRight
          size={12}
          style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform 120ms" }}
          className="text-text-tertiary"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="pill" style={{ fontSize: 9.5 }}>Ad set</span>
            <span className="text-[11.5px] font-medium truncate">{adSet.name}</span>
          </div>
          <div className="text-[10.5px] text-text-tertiary truncate">
            {adSet.audience} · {adSet.optimization}
          </div>
        </div>
        <span />
        <span className="text-right text-[11.5px] tabular-nums">₹{(adSet.budgetDaily / 1000).toFixed(0)}K/d</span>
        <span className="text-right text-[11.5px] tabular-nums">{adSet.expLeads}</span>
        <span className="text-right text-[11.5px] tabular-nums">{adSet.expVerified.toFixed(1)}</span>
        <span className="text-right text-[11.5px] tabular-nums">{adSet.cpvl ? `₹${adSet.cpvl}` : "—"}</span>
        <div>
          <MediaStatus status={adSet.status} />
        </div>
        <SpotChangeCell
          change={adSet.spotChange}
          onClick={() => onAsk(`Explain: ${adSet.spotChange} on ${adSet.name}`)}
          small
        />
      </button>
      {open && adSet.ads.map((a) => <AdRow key={a.id} ad={a} />)}
    </>
  );
}

function CampaignRow({
  row,
  personaName,
  onAsk,
  onNewAdSet,
}: {
  row: MediaRow;
  personaName: string;
  onAsk: (q: string) => void;
  onNewAdSet: () => void;
}) {
  const [open, setOpen] = useState(false);
  const adsCount = row.adSets.reduce((s, a) => s + a.ads.length, 0);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid items-center w-full text-left"
        style={{
          gridTemplateColumns: MP_COLS,
          padding: "12px 14px",
          background: row.status === "proposed" ? "var(--spot-tint)" : "#FFF",
          borderTop: "1px solid var(--border-subtle)",
          transition: "background 120ms",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = row.status === "proposed" ? "#FAF4E8" : "var(--bg-page)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = row.status === "proposed" ? "var(--spot-tint)" : "#FFF")
        }
      >
        <ChevronRight
          size={14}
          style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform 120ms" }}
          className="text-text-tertiary"
        />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">{row.campaign}</div>
          <div className="text-[11px] text-text-tertiary truncate">
            {personaName} · {row.adSets.length} ad sets · {adsCount} ads
          </div>
        </div>
        <ChannelChip channel={row.channel} />
        <span className="text-right text-[12.5px] tabular-nums">₹{(row.budgetDaily / 1000).toFixed(0)}K/d</span>
        <span className="text-right text-[12.5px] tabular-nums">{row.expLeads}</span>
        <span className="text-right text-[12.5px] tabular-nums">{row.expVerified}</span>
        <span className="text-right text-[12.5px] tabular-nums">{row.cpvl ? `₹${row.cpvl}` : "—"}</span>
        <div>
          <MediaStatus status={row.status} />
        </div>
        <SpotChangeCell
          change={row.spotChange}
          onClick={() => onAsk(`Explain: ${row.spotChange} on ${row.campaign}`)}
        />
      </button>
      {open && (
        <>
          {row.adSets.map((a) => (
            <AdSetRow key={a.id} adSet={a} onAsk={onAsk} campaignName={row.campaign} />
          ))}
          <div
            className="grid items-center"
            style={{ gridTemplateColumns: MP_COLS, padding: "8px 14px 12px 38px" }}
          >
            <span />
            <button
              type="button"
              onClick={onNewAdSet}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button bg-white border border-border hover:border-border-hover text-[11.5px]"
              style={{ width: "fit-content" }}
            >
              <Sparkles size={11} style={{ color: "#7C3AED" }} /> New ad set with Spot
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function MediaPlanSection({
  project,
  onAsk,
}: {
  project: ProjectDetail;
  onAsk: (q: string) => void;
}) {
  const openGuided = useSpotStore((s) => s.openGuided);
  const mp = project.mediaPlan;
  const proposedChanges = mp.rows.filter((r) => r.spotChange).length;

  return (
    <div>
      <SectionHeader
        icon={Monitor}
        title={`Media plan · ${mp.window}`}
        subtitle={`${mp.version} · ${mp.proposedDelta}`}
        onAsk={() => onAsk("Optimize the media plan for next week — bias toward verified leads")}
        actions={
          <button
            type="button"
            onClick={() => openGuided({ kind: "new-campaign", projectId: project.id })}
            className="apply-btn"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)" }}
          >
            <Sparkles size={11} /> New campaign with Spot
          </button>
        }
      />

      {proposedChanges > 0 && (
        <div className="mb-3">
          <SpotInlineCallout
            label={`Spot proposes ${proposedChanges} changes`}
            body={`Net delta ${mp.proposedDelta}. ${mp.summary.gapToGoal}.`}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => onAsk("Explain every proposed change in the media plan")}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px]"
                >
                  Explain each change
                </button>
              </>
            }
          />
        </div>
      )}

      <div className="card-base overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center px-3.5 py-2 bg-surface-page text-[10px] uppercase tracking-[0.04em] font-semibold text-text-tertiary border-b border-border"
          style={{ gridTemplateColumns: MP_COLS }}
        >
          <span />
          <span>Campaign / Ad set / Ad</span>
          <span />
          <span className="text-right">Budget</span>
          <span className="text-right">Exp leads</span>
          <span className="text-right">Exp verif</span>
          <span className="text-right">CPVL</span>
          <span>Status</span>
          <span />
        </div>

        {mp.rows.map((row) => {
          const personaName =
            project.personas.find((p) => p.id === row.personaId)?.name || "—";
          return (
            <CampaignRow
              key={row.id}
              row={row}
              personaName={personaName}
              onAsk={onAsk}
              onNewAdSet={() =>
                openGuided({
                  kind: "new-adset",
                  projectId: project.id,
                  personaId: row.personaId,
                })
              }
            />
          );
        })}

        {/* Totals footer */}
        <div
          className="grid items-center px-3.5 py-2.5 bg-surface-page text-[11.5px] border-t border-border"
          style={{ gridTemplateColumns: MP_COLS }}
        >
          <span />
          <span className="font-medium">Weekly forecast · based on this plan</span>
          <span />
          <span className="text-right tabular-nums">₹{(mp.summary.proposedDaily / 1000).toFixed(0)}K/d</span>
          <span className="text-right tabular-nums">{mp.summary.weeklyExpected.leads}</span>
          <span className="text-right tabular-nums">{mp.summary.weeklyExpected.verified}</span>
          <span />
          <span className="text-[10.5px] text-text-tertiary">{mp.summary.gapToGoal}</span>
          <span />
        </div>
      </div>
    </div>
  );
}
