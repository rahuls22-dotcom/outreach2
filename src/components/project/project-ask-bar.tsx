import { SpotMark } from "@/components/spot/spot-mark";

export function ProjectAskBar({
  projectName,
  onAsk,
}: {
  projectName: string;
  onAsk: (q: string) => void;
}) {
  const prompts = [
    "Why are we behind on the goal?",
    "Optimize my media plan for next week",
    "Generate creatives for the top persona",
    "Propose 2 experiments worth running",
  ];

  return (
    <div className="spot-reply mt-6 p-4">
      <div className="flex items-center gap-2 mb-2">
        <SpotMark size={16} />
        <span className="text-[13px] font-semibold">
          Move <em className="not-italic font-semibold">{projectName.split(" · ")[0]}</em> forward
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onAsk(q)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-button border border-border bg-white text-[12px] hover:border-border-hover hover:bg-surface-page"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
