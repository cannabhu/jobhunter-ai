import type { ReactNode } from "react";
import { labelClass } from "@/components/profile/fieldStyles";

type Props = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, children, className }: Props) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={`${labelClass} mb-2`}>
        {label}
      </label>
      {children}
    </div>
  );
}
