"use client";

import { LoaderCircle, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ButtonHTMLAttributes } from "react";

/** Seconds since this component mounted, as "m:ss". Mounted only while an action runs, so it starts at 0:00 every time. */
function ElapsedTime() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    // Measured against the clock, not counted, so a throttled background tab still shows the true time when it wakes.
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span aria-hidden="true" className="tabular-nums">
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
    </span>
  );
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** True while the action runs: shows the spinner, the busy label and a running timer. */
  busy: boolean;
  icon: LucideIcon;
  idleLabel: string;
  /** What the button says while it works, e.g. "Searching...". Keep it short; the timer follows it. */
  busyLabel: string;
  /** Colour of the spinner, for buttons whose spinner is not the text colour. */
  spinnerClassName?: string;
};

/**
 * The button for the long AI actions (search, research, cover letter, resume). While busy it swaps its icon for a spinner,
 * switches to a busy label and counts up, so a 20 to 60 second wait still reads as "working". The idle and busy labels
 * are stacked in one grid cell, so the button keeps the width of the longer one and nothing beside it moves.
 * Callers pass `className` for the look and `disabled` for anything beyond `busy`; this sets `aria-busy` and the lock.
 */
export function AsyncActionButton({
  busy,
  icon: Icon,
  idleLabel,
  busyLabel,
  spinnerClassName = "",
  className = "",
  disabled,
  type = "button",
  ...rest
}: Props) {
  return (
    <button type={type} disabled={disabled ?? busy} aria-busy={busy} className={className} {...rest}>
      {busy ? (
        <LoaderCircle className={`size-4 shrink-0 animate-spin ${spinnerClassName}`} aria-hidden="true" />
      ) : (
        <Icon className="size-4 shrink-0" aria-hidden="true" />
      )}
      <span className="grid">
        <span className={`col-start-1 row-start-1 ${busy ? "invisible" : ""}`} aria-hidden={busy}>
          {idleLabel}
        </span>
        <span className={`col-start-1 row-start-1 whitespace-nowrap ${busy ? "" : "invisible"}`} aria-hidden={!busy}>
          {busyLabel} <ElapsedTimeSlot busy={busy} />
        </span>
      </span>
    </button>
  );
}

/** Renders the timer only while busy, but reserves its width otherwise so the stacked label sizes the button for "0:00". */
function ElapsedTimeSlot({ busy }: { busy: boolean }) {
  return busy ? <ElapsedTime /> : <span className="tabular-nums">0:00</span>;
}
