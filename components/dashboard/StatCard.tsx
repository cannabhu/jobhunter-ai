import type { StatCardData } from "@/types";

type Props = {
  stat: StatCardData;
};

export function StatCard({ stat }: Props) {
  const { footer } = stat;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
      <p className="mt-1 text-3xl font-semibold text-text-primary">{stat.value}</p>
      {footer.kind === "trend" ? (
        <p className="mt-2 flex items-center gap-3">
          <span className="rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium text-success-darker">{footer.change}</span>
          <span className="text-xs text-text-muted">{footer.label}</span>
        </p>
      ) : (
        <p className="mt-2 py-0.5 text-xs text-text-muted">{footer.text}</p>
      )}
    </div>
  );
}
