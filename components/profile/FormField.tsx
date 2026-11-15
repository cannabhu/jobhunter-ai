"use client";

import type { ReactNode } from "react";
import { FilledBadge } from "@/components/profile/FilledBadge";
import { useIsFilled } from "@/components/profile/FilledFieldsContext";
import { labelClass } from "@/components/profile/fieldStyles";

type Props = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
  /** The input's form name. When the resume filled it, the label gets a "From resume" tag. */
  name?: string;
  /** Set false when the field wraps controls that should not be tinted (the tag inputs). */
  tint?: boolean;
};

export function FormField({ label, htmlFor, children, className, name, tint = true }: Props) {
  const filled = useIsFilled(name);

  return (
    // `group/field` + data-filled let the input styles in fieldStyles.ts react without prop drilling.
    <div className={["group/field", className].filter(Boolean).join(" ")} data-filled={filled && tint ? "true" : undefined}>
      <div className="mb-2 flex items-center gap-2">
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
        {filled ? <FilledBadge /> : null}
      </div>
      {children}
    </div>
  );
}
