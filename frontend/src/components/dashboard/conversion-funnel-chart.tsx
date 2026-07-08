"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Filter } from "lucide-react";

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
import type { LeadStatus } from "@/types/api";

// Etapas do funil = uma única série (contagem de leads), então um único hue
// (slot categórico 1) identifica a série; a ordem já vem do eixo X.
const chartConfig = {
  total: { label: "Leads", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function ConversionFunnelChart({
  data,
}: {
  data: { status: LeadStatus; label: string; total: number }[];
}) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversão comercial</CardTitle>
        <CardDescription>
          Distribuição dos leads pelas etapas do funil comercial
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState icon={Filter} title="Sem dados suficientes ainda" />
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={data} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
