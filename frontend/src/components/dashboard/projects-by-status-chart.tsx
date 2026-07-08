"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Layers } from "lucide-react";

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
import type { ConstructionStatus } from "@/types/api";

const STATUS_COLOR: Record<ConstructionStatus, string> = {
  LAUNCH: "var(--chart-1)",
  FOUNDATION: "var(--chart-3)",
  STRUCTURE: "var(--chart-5)",
  FINISHING: "var(--chart-8)",
  DELIVERED: "var(--chart-2)",
  ON_HOLD: "var(--chart-6)",
};

const chartConfig = {
  total: { label: "Empreendimentos" },
} satisfies ChartConfig;

export function ProjectsByStatusChart({
  data,
}: {
  data: { status: ConstructionStatus; label: string; total: number }[];
}) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Obras por estágio</CardTitle>
        <CardDescription>
          Empreendimentos agrupados pela fase atual da obra
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState icon={Layers} title="Sem dados suficientes ainda" />
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLOR[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
