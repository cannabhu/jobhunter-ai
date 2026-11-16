const TARGET_INTERVALS = 4;
const STEP_MULTIPLIERS = [1, 2, 5, 10];

/**
 * Whole-number Y-axis ticks from 0 up to a round number at or above `max`, with about four gaps between them.
 * Counts are whole, so the step is never below 1 and the axis always has at least two ticks.
 */
export function niceTicks(max: number): number[] {
  const safeMax = Number.isFinite(max) && max > 0 ? Math.ceil(max) : 1;
  const rawStep = Math.max(1, safeMax / TARGET_INTERVALS);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = (STEP_MULTIPLIERS.find((multiplier) => multiplier * magnitude >= rawStep) ?? 10) * magnitude;
  const top = step * Math.ceil(safeMax / step);

  const ticks: number[] = [];
  for (let tick = 0; tick <= top; tick += step) ticks.push(tick);
  return ticks;
}
