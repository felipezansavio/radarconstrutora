"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
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

// Ramp ordinal (um único hue, do mais claro ao mais escuro) para representar
// o progresso das etapas do funil comercial.
const FUNNEL_RAMP: Record<LeadStatus, string> = {
  NEW: "#86b6ef",
  CONTACTED: "#6da7ec",
  NEGOTIATING: "#5598e7",
  PROPOSAL_SENT: "#3987e5",
  WON: "#256abf",
  LOST: "#184f95",
};

const chartConfig = {
  total: { label: "Leads" },
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
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={FUNNEL_RAMP[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
