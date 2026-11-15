import type { ReactNode } from "react";

type Props = {
  tone: "success" | "neutral" | "accent";
  children: ReactNode;
};

const toneClass: Record<Props["tone"], string> = {
  success: "bg-success-lightest text-success-alt",
  neutral: "bg-surface-tertiary text-text-secondary",
  accent: "bg-accent-muted text-accent",
};

/** The small round icon that leads a section heading on the job details page. */
export function SectionIcon({ tone, children }: Props) {
  return (
    <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full [&>svg]:size-4 ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
