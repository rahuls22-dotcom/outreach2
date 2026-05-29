export function PacePill({
  pace,
  delta,
}: {
  pace: "ahead" | "on-pace" | "behind";
  delta: string;
}) {
  const map = {
    ahead: { bg: "var(--ok-bg)", fg: "var(--ok-fg)" },
    "on-pace": { bg: "var(--info-bg)", fg: "var(--info-fg)" },
    behind: { bg: "var(--err-bg)", fg: "var(--err-fg)" },
  };
  const c = map[pace];
  return (
    <span
      style={{
        padding: "1.5px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {pace.replace("-", " ")} · {delta}
    </span>
  );
}

export function HealthPill({
  health,
}: {
  health: "on-track" | "needs-attention" | "underperforming";
}) {
  const map = {
    "on-track": { label: "On track", cls: "pill-ok" },
    "needs-attention": { label: "Attention", cls: "pill-warn" },
    underperforming: { label: "Low", cls: "pill-err" },
  } as const;
  const c = map[health];
  return <span className={`pill ${c.cls}`}>{c.label}</span>;
}

export function StatusPill({
  status,
}: {
  status: "live" | "paused" | "proposed" | "draft" | "active" | "completed";
}) {
  const map: Record<string, { label: string; cls: string }> = {
    live: { label: "Live", cls: "pill-ok" },
    active: { label: "Active", cls: "pill-ok" },
    paused: { label: "Paused", cls: "pill" },
    proposed: { label: "Proposed", cls: "pill-info" },
    draft: { label: "Draft", cls: "pill-warn" },
    completed: { label: "Completed", cls: "pill" },
  };
  const c = map[status] || map.paused;
  return <span className={`pill ${c.cls}`}>{c.label}</span>;
}
