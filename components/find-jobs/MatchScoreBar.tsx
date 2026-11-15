type Props = {
  score: number;
};

// Bands come from the Find Jobs design (91-96 green, 85-88 blue, 72 orange); ui-rules.md and ui-tokens.md disagree with each other and with it.
const STRONG_SCORE = 90;
const GOOD_SCORE = 80;

function fillClass(score: number): string {
  if (score >= STRONG_SCORE) return "fill-success-alt";
  if (score >= GOOD_SCORE) return "fill-info-medium";
  return "fill-warning";
}

export function MatchScoreBar({ score }: Props) {
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <div className="flex items-center justify-center gap-2">
      {/* SVG attributes carry the dynamic width, so no inline style is needed. */}
      <svg aria-hidden="true" className="h-1.5 w-24 shrink-0" viewBox="0 0 96 6" preserveAspectRatio="none">
        <rect width="100%" height="100%" rx="3" className="fill-border-light" />
        <rect width={`${clamped}%`} height="100%" rx="3" className={fillClass(clamped)} />
      </svg>
      <span className="w-9 text-sm font-semibold text-text-primary tabular-nums">{clamped}%</span>
    </div>
  );
}
