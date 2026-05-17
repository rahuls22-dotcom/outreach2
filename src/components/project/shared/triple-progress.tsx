/**
 * Triple-tracked progress bar used in GoalPanel.
 * - hatch  = expected-by-now (where pace would have you by today)
 * - solid  = achieved
 * - dashed = forecast end-of-window (past achieved)
 */
export function TripleProgress({
  pct,
  expectedPct,
  forecastPct,
  height = 10,
}: {
  pct: number;
  expectedPct: number;
  forecastPct: number;
  height?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        height,
        borderRadius: height / 2,
        background: "var(--bg-secondary)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: `${expectedPct}%`,
          background:
            "repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,0.05) 4px 8px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: `${pct}%`,
          background: "#0A0A0A",
          borderRadius: height / 2,
        }}
      />
      {forecastPct > pct && (
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            top: 0,
            bottom: 0,
            width: `${forecastPct - pct}%`,
            background:
              "repeating-linear-gradient(90deg, rgba(10,10,10,0.35) 0 4px, transparent 4px 7px)",
          }}
        />
      )}
    </div>
  );
}
