"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/empty-state";

const chartConfig = {
  total: { label: "Novos leads", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function OpportunityGrowthChart({
  data,
}: {
  data: { month: string; total: number }[];
}) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento de oportunidades</CardTitle>
        <CardDescription>Novos leads criados por mês</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState icon={TrendingUp} title="Sem dados suficientes ainda" />
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <AreaChart data={data} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="total"
                type="monotone"
                stroke="var(--color-total)"
                fill="url(#fillTotal)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
