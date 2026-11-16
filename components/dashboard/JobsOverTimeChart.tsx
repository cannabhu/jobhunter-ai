"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, GRID_DASH, GRID_STROKE, TOOLTIP_STYLE } from "@/components/dashboard/chartStyles";
import type { ChartPoint } from "@/types";

type Props = {
  data: ChartPoint[];
  yTicks: number[];
};

const FILL_ID = "jobs-over-time-fill";

export function JobsOverTimeChart({ data, yTicks }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={FILL_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray={GRID_DASH} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} tickMargin={12} interval="preserveStartEnd" minTickGap={24} />
        <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} ticks={yTicks} domain={[0, yTicks[yTicks.length - 1]]} width={44} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey="value"
          name="Jobs found"
          stroke="var(--color-accent)"
          strokeWidth={3}
          fill={`url(#${FILL_ID})`}
          dot={false}
          activeDot={{ r: 5, fill: "var(--color-accent)", stroke: "var(--color-surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
