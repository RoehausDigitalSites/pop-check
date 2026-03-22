"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PALETTE = [
  "hsl(221 83% 53%)",
  "hsl(142 71% 45%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
  "hsl(199 89% 48%)",
  "hsl(330 81% 60%)",
];

export type StatsSeries = {
  key: string;
  label: string;
};

export type StatsRow = {
  label: string;
  fullDate: string;
  [key: string]: string | number | null | undefined;
};

type Props = {
  rows: StatsRow[];
  series: StatsSeries[];
  scaleMin: number;
  scaleMax: number;
};

export function CheckinStatsChart({ rows, series, scaleMin, scaleMax }: Props) {
  const config = React.useMemo(() => {
    const c: ChartConfig = {};
    series.forEach((s, i) => {
      c[s.key] = {
        label: s.label,
        color: PALETTE[i % PALETTE.length],
      };
    });
    return c;
  }, [series]);

  if (rows.length === 0) {
    return (
      <Card className="border-zinc-100/90 bg-white/70 shadow-md shadow-zinc-200/30 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-zinc-800">
            Your responses over time
          </CardTitle>
          <CardDescription className="font-normal">
            Complete a check-in to see your trends here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-100/90 bg-white/70 shadow-md shadow-zinc-200/30 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-zinc-800">
          Your responses over time
        </CardTitle>
        <CardDescription className="font-normal">
          One line per question. Higher values are toward the top of your scale.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={config} className="aspect-4/3 w-full min-h-[260px] sm:aspect-video sm:min-h-[280px]">
          <LineChart
            data={rows}
            margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-200/80" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              className="text-[9px] sm:text-xs"
              interval="preserveStartEnd"
              angle={-30}
              textAnchor="end"
              height={52}
            />
            <YAxis
              domain={[scaleMin, scaleMax]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={36}
              allowDecimals={false}
              className="text-[10px] sm:text-xs"
            />
            <ChartTooltip
              cursor={{ className: "stroke-zinc-300" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_label, payload) => {
                    const p = payload?.[0]?.payload as StatsRow | undefined;
                    return p?.fullDate ?? "";
                  }}
                />
              }
            />
            {series.map((s) => (
              <Line
                key={s.key}
                name={s.label}
                type="monotone"
                dataKey={s.key}
                stroke={`var(--color-${s.key})`}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
            <ChartLegend
              content={
                <ChartLegendContent className="flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs" />
              }
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
