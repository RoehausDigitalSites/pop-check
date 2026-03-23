"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
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
import type { StatsRow, StatsSeries } from "@/lib/checkin-stats-types";

const PALETTE = [
  "hsl(221 83% 53%)",
  "hsl(142 71% 45%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
  "hsl(199 89% 48%)",
  "hsl(330 81% 60%)",
];

type Props = {
  rows: StatsRow[];
  series: StatsSeries[];
  scaleMin: number;
  scaleMax: number;
  minLabel?: string;
  maxLabel?: string;
  /** Card title (default: participant-facing copy). */
  title?: string;
  /** Subtitle when there is data. */
  description?: string;
  /** Message when there are no check-ins yet. */
  emptyDescription?: string;
};

type Direction = "toward-lower" | "toward-upper" | "steady";

const POSITIVE_WORDS = [
  "better",
  "good",
  "great",
  "calm",
  "easier",
  "easy",
  "peaceful",
  "lighter",
  "strong",
  "stronger",
  "happy",
];

const NEGATIVE_WORDS = [
  "worse",
  "hard",
  "harder",
  "anxious",
  "stress",
  "stressed",
  "sad",
  "heavy",
  "down",
  "rough",
  "bad",
];

function scoreLabelSentiment(label: string | undefined): number {
  if (!label) return 0;
  const normalized = label.toLowerCase();
  let score = 0;
  for (const w of POSITIVE_WORDS) {
    if (normalized.includes(w)) score += 1;
  }
  for (const w of NEGATIVE_WORDS) {
    if (normalized.includes(w)) score -= 1;
  }
  return score;
}

function getDirectionFromDelta(delta: number): Direction {
  if (Math.abs(delta) < 0.2) return "steady";
  return delta < 0 ? "toward-lower" : "toward-upper";
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

type TrendTone = "positive" | "negative" | "neutral";

type SeriesTrend = {
  key: string;
  label: string;
  delta: number;
  direction: Direction;
  tone: TrendTone;
};

export function CheckinStatsChart({
  rows,
  series,
  scaleMin,
  scaleMax,
  minLabel = "Better",
  maxLabel = "Harder",
  title = "Responses over time",
  description = "This helps spot whether things are easing up or feeling tougher lately.",
  emptyDescription = "Complete a check-in to see trends here.",
}: Props) {
  const config = React.useMemo(() => {
    const c: ChartConfig = {};
    series.forEach((s, i) => {
      c[s.key] = {
        label: s.label,
        color: PALETTE[i % PALETTE.length],
      };
    });
    c.overallAvg = {
      label: "Overall average",
      color: "hsl(215 16% 47%)",
    };
    return c;
  }, [series]);

  const trend = React.useMemo(() => {
    if (rows.length < 2 || series.length === 0) {
      return null;
    }

    const rowAverages = rows
      .map((row) => {
        const values = series
          .map((s) => row[s.key])
          .filter((v): v is number => typeof v === "number");
        if (values.length === 0) return null;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      })
      .filter((v): v is number => v !== null);

    if (rowAverages.length < 2) return null;

    const windowSize = Math.min(3, Math.floor(rowAverages.length / 2));
    if (windowSize < 1) return null;

    const recent = rowAverages.slice(-windowSize);
    const previous = rowAverages.slice(-windowSize * 2, -windowSize);
    if (previous.length === 0) return null;

    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const previousAvg = previous.reduce((sum, v) => sum + v, 0) / previous.length;
    const delta = recentAvg - previousAvg;
    const direction = getDirectionFromDelta(delta);

    const lowSentiment = scoreLabelSentiment(minLabel);
    const highSentiment = scoreLabelSentiment(maxLabel);
    const lowerIsBetter = lowSentiment > highSentiment;
    const higherIsBetter = highSentiment > lowSentiment;

    let tone: "positive" | "negative" | "neutral" = "neutral";
    if (direction !== "steady") {
      if (
        (direction === "toward-lower" && lowerIsBetter) ||
        (direction === "toward-upper" && higherIsBetter)
      ) {
        tone = "positive";
      } else if (
        (direction === "toward-lower" && higherIsBetter) ||
        (direction === "toward-upper" && lowerIsBetter)
      ) {
        tone = "negative";
      }
    }

    const towardLabel = direction === "toward-lower" ? minLabel : maxLabel;
    const message =
      direction === "steady"
        ? "Steady trend lately."
        : `Lately moving toward "${towardLabel}".`;

    return { direction, tone, message };
  }, [rows, series, minLabel, maxLabel]);

  const periodAverages = React.useMemo(() => {
    const latestTs = rows.reduce<number | null>((max, row) => {
      const ts = typeof row.timestampMs === "number" ? row.timestampMs : null;
      if (ts === null) return max;
      if (max === null) return ts;
      return ts > max ? ts : max;
    }, null);
    if (latestTs === null) {
      return { week: null, month: null, weekCount: 0, monthCount: 0 };
    }

    const weekCutoff = latestTs - 7 * 24 * 60 * 60 * 1000;
    const monthCutoff = latestTs - 30 * 24 * 60 * 60 * 1000;

    const weekValues: number[] = [];
    const monthValues: number[] = [];

    for (const row of rows) {
      const ts = typeof row.timestampMs === "number" ? row.timestampMs : null;
      if (!ts) continue;

      for (const s of series) {
        const value = row[s.key];
        if (typeof value !== "number") continue;
        if (ts >= weekCutoff) weekValues.push(value);
        if (ts >= monthCutoff) monthValues.push(value);
      }
    }

    return {
      week: average(weekValues),
      month: average(monthValues),
      weekCount: weekValues.length,
      monthCount: monthValues.length,
    };
  }, [rows, series]);

  const overallDelta = React.useMemo(() => {
    if (periodAverages.week === null || periodAverages.month === null) return null;
    return periodAverages.week - periodAverages.month;
  }, [periodAverages.week, periodAverages.month]);

  const seriesTrends = React.useMemo<SeriesTrend[]>(() => {
    const lowSentiment = scoreLabelSentiment(minLabel);
    const highSentiment = scoreLabelSentiment(maxLabel);
    const lowerIsBetter = lowSentiment > highSentiment;
    const higherIsBetter = highSentiment > lowSentiment;

    return series
      .map((s) => {
        const points = rows
          .map((row) => {
            const value = row[s.key];
            const ts = row.timestampMs;
            if (typeof value !== "number" || typeof ts !== "number") return null;
            return { value, ts };
          })
          .filter((p): p is { value: number; ts: number } => p !== null);

        if (points.length < 2) return null;

        const latestTs = points[points.length - 1].ts;
        const weekCutoff = latestTs - 7 * 24 * 60 * 60 * 1000;
        const monthCutoff = latestTs - 30 * 24 * 60 * 60 * 1000;

        const weekValues = points.filter((p) => p.ts >= weekCutoff).map((p) => p.value);
        const monthValues = points.filter((p) => p.ts >= monthCutoff).map((p) => p.value);
        const weekAvg = average(weekValues);
        const monthAvg = average(monthValues);
        const delta =
          weekAvg !== null && monthAvg !== null
            ? weekAvg - monthAvg
            : points[points.length - 1].value - points[0].value;
        const direction = getDirectionFromDelta(delta);

        let tone: TrendTone = "neutral";
        if (direction !== "steady") {
          if (
            (direction === "toward-lower" && lowerIsBetter) ||
            (direction === "toward-upper" && higherIsBetter)
          ) {
            tone = "positive";
          } else if (
            (direction === "toward-lower" && higherIsBetter) ||
            (direction === "toward-upper" && lowerIsBetter)
          ) {
            tone = "negative";
          }
        }

        return {
          key: s.key,
          label: s.label,
          delta,
          direction,
          tone,
        };
      })
      .filter((v): v is SeriesTrend => v !== null)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [rows, series, minLabel, maxLabel]);

  const chartRows = React.useMemo(() => {
    return rows.map((row) => {
      const values = series
        .map((s) => row[s.key])
        .filter((v): v is number => typeof v === "number");
      return {
        ...row,
        overallAvg: values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null,
      };
    });
  }, [rows, series]);

  if (rows.length === 0) {
    return (
      <Card className="rounded-3xl border border-white/80 bg-linear-to-b from-white/80 via-sky-50/45 to-white/75 shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-zinc-800">{title}</CardTitle>
          <CardDescription className="font-normal leading-relaxed text-zinc-500">
            {emptyDescription}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-white/80 bg-linear-to-b from-white/80 via-sky-50/45 to-white/75 shadow-lg shadow-zinc-300/30 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-zinc-100/90">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-zinc-800">{title}</CardTitle>
        <CardDescription className="font-normal leading-relaxed text-zinc-500">
          {description}
        </CardDescription>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            Lower end: {scaleMin} = {minLabel}
          </span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
            Upper end: {scaleMax} = {maxLabel}
          </span>
          {trend && (
            <span
              className={
                trend.tone === "positive"
                  ? "rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"
                  : trend.tone === "negative"
                    ? "rounded-full bg-amber-50 px-2.5 py-1 text-amber-700"
                    : "rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700"
              }
            >
              {trend.tone === "positive"
                ? "Good direction"
                : trend.tone === "negative"
                  ? "Watch trend"
                  : "Stable"}{" "}
              · {trend.message}
            </span>
          )}
          {periodAverages.week !== null && (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
              7-day avg: {periodAverages.week.toFixed(1)}
            </span>
          )}
          {periodAverages.month !== null && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
              30-day avg: {periodAverages.month.toFixed(1)}
            </span>
          )}
          {overallDelta !== null && (
            <span
              className={
                overallDelta < -0.15
                  ? "rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"
                  : overallDelta > 0.15
                    ? "rounded-full bg-amber-50 px-2.5 py-1 text-amber-700"
                    : "rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700"
              }
            >
              {overallDelta < -0.15
                ? "Overall improving"
                : overallDelta > 0.15
                  ? "Overall getting tougher"
                  : "Overall steady"}{" "}
              · {overallDelta > 0 ? "+" : ""}
              {overallDelta.toFixed(1)} vs 30-day
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-inner shadow-zinc-200/30 sm:p-4">
          <ChartContainer config={config} className="aspect-4/3 w-full min-h-[260px] sm:aspect-video sm:min-h-[280px]">
          <LineChart
            data={chartRows}
            margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-200/80" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              className="text-[10px] sm:text-xs"
              interval="preserveStartEnd"
              height={30}
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
            {periodAverages.week !== null && (
              <ReferenceLine
                y={periodAverages.week}
                stroke="hsl(199 89% 48%)"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{
                  value: "7-day avg",
                  position: "insideTopRight",
                  fill: "hsl(199 89% 38%)",
                  fontSize: 10,
                }}
              />
            )}
            {periodAverages.month !== null && (
              <ReferenceLine
                y={periodAverages.month}
                stroke="hsl(262 83% 58%)"
                strokeDasharray="2 5"
                ifOverflow="extendDomain"
                label={{
                  value: "30-day avg",
                  position: "insideBottomRight",
                  fill: "hsl(262 70% 45%)",
                  fontSize: 10,
                }}
              />
            )}
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
                dot={{
                  r: 2.5,
                  stroke: `var(--color-${s.key})`,
                  fill: `var(--color-${s.key})`,
                  strokeWidth: 0,
                }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
            <Line
              name="Overall average"
              type="monotone"
              dataKey="overallAvg"
              stroke="hsl(215 16% 47%)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
            <ChartLegend
              content={
                <ChartLegendContent className="flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs" />
              }
            />
          </LineChart>
          </ChartContainer>
        </div>
        {seriesTrends.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/70 bg-white/65 p-3 sm:p-4">
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Question trends (7-day vs 30-day)
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {seriesTrends.map((t) => (
                <div
                  key={t.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-white/80 px-3 py-2"
                >
                  <p className="min-w-0 text-sm text-zinc-700 truncate">{t.label}</p>
                  <span
                    className={
                      t.tone === "positive"
                        ? "shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                        : t.tone === "negative"
                          ? "shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                          : "shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                    }
                  >
                    {t.direction === "toward-lower" ? "↘" : t.direction === "toward-upper" ? "↗" : "→"}{" "}
                    {t.delta > 0 ? "+" : ""}
                    {t.delta.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
