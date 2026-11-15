import { CircleAlert } from "lucide-react";

const RING_SIZE = 130;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Props = {
  percentage: number;
  missingFields: string[];
};

export function CompletionIndicator({ percentage, missingFields }: Props) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const filled = (clamped / 100) * RING_CIRCUMFERENCE;

  return (
    <section
      aria-labelledby="profile-status-heading"
      className="flex flex-col gap-6 rounded-xl border border-error-light bg-error-lightest p-8 shadow-card sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 id="profile-status-heading" className="flex items-center gap-2 text-xl font-semibold text-text-primary">
          <CircleAlert className="size-5 text-error" aria-hidden="true" />
          Profile needs attention
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-text-dark">
          Complete the missing fields to improve your chance of getting tailored matches and generating quality resumes.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {missingFields.map((field) => (
            <li key={field} className="rounded-md bg-error-light/50 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-error uppercase">
              {field}
            </li>
          ))}
        </ul>
      </div>
      <div
        role="img"
        aria-label={`Profile ${clamped}% complete`}
        className="relative shrink-0 self-start sm:self-auto"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="-rotate-90" aria-hidden="true">
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" strokeWidth={RING_STROKE} className="stroke-error-light" />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${RING_CIRCUMFERENCE}`}
            className="stroke-error"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-text-primary">
          {clamped}%
        </span>
      </div>
    </section>
  );
}
