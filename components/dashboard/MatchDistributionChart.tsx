"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, GRID_DASH, GRID_STROKE, TOOLTIP_CURSOR_FILL, TOOLTIP_STYLE } from "@/components/dashboard/chartStyles";
import type { ChartPoint } from "@/types";

type Props = {
  data: ChartPoint[];
  yTicks: number[];
};

export function MatchDistributionChart({ data, yTicks }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray={GRID_DASH} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} tickMargin={12} />
        <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} ticks={yTicks} domain={[0, yTicks[yTicks.length - 1]]} width={44} />
        <Tooltip cursor={{ fill: TOOLTIP_CURSOR_FILL }} contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="value" name="Jobs" fill="var(--color-success)" maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
