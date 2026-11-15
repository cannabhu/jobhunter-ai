"use client";

import { useId, type ReactNode } from "react";
import { FilledBadge } from "@/components/profile/FilledBadge";
import { useAnyFilled } from "@/components/profile/FilledFieldsContext";
import { sectionHeadingClass } from "@/components/profile/fieldStyles";

type Props = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  /** Form-name prefixes of this section's fields; a "From resume" tag shows in the header when any was filled. */
  fieldPrefixes?: readonly string[];
};

export function ProfileSection({ title, action, children, fieldPrefixes = [] }: Props) {
  const headingId = useId();
  const hasFilled = useAnyFilled(fieldPrefixes);

  return (
    <section aria-labelledby={headingId} className="border-t border-border py-12">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 id={headingId} className={sectionHeadingClass}>
          {title}
        </h3>
        <div className="flex items-center gap-4">
          {hasFilled ? <FilledBadge label="Filled from resume" /> : null}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}
