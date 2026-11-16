type Props = {
  title: string;
  text: string;
};

/** Shown inside a ChartCard when the query worked but there are no events in the window yet. */
export function ChartEmptyState({ title, text }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-text-muted">{text}</p>
    </div>
  );
}
