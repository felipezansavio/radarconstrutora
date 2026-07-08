"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import { MapPin } from "lucide-react";

const chartConfig = {
  total: { label: "Empreendimentos", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ProjectsByCityChart({
  data,
}: {
  data: { city: string; total: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Obras por cidade</CardTitle>
        <CardDescription>
          Distribuição dos empreendimentos cadastrados por cidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState icon={MapPin} title="Sem dados suficientes ainda" />
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="city"
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
