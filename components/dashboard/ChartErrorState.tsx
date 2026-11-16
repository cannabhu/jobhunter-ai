/** Shown inside a ChartCard when the analytics query failed. The real reason is logged on the server. */
export function ChartErrorState() {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-error">Couldn&apos;t load this chart</p>
      <p className="mt-1 max-w-xs text-sm text-text-muted">Your analytics are unavailable right now. Refresh the page to try again.</p>
    </div>
  );
}
