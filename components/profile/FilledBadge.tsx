import { Sparkles } from "lucide-react";

type Props = {
  label?: string;
};

/** Small purple tag marking a value that was filled in from the uploaded resume. */
export function FilledBadge({ label = "From resume" }: Props) {
  return (
    <span className="flex items-center gap-1 text-xs font-medium normal-case tracking-normal text-accent">
      <Sparkles className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}
