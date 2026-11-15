import type { CSSProperties } from "react";

// Recharts takes SVG props instead of class names, so these point at the design tokens through CSS variables.
export const AXIS_TICK = { fill: "var(--color-chart-axis)", fontSize: 12 } as const;

export const GRID_STROKE = "var(--color-border)";

export const GRID_DASH = "4 4";

export const TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-card)",
  fontSize: 12,
  color: "var(--color-text-primary)",
};

export const TOOLTIP_CURSOR_FILL = "var(--color-surface-secondary)";
