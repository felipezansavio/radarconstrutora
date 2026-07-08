"use client";

import { Percent, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatCard } from "@/components/shared/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCrmDashboardData } from "@/hooks/use-crm-dashboard-data";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function CrmDashboardPage() {
  const { stats, isLoading, isError, error } = useCrmDashboardData();

  if (isError) return <ErrorState error={error} />;

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Leads novos (30 dias)"
          value={formatNumber(stats.leadsNovos)}
          icon={UserPlus}
          loading={isLoading}
          accent="sky"
        />
        <StatCard
          label="Conversão"
          value={`${stats.conversao.toFixed(0)}%`}
          icon={Percent}
          loading={isLoading}
          accent="emerald"
          trend={{
            value: `${stats.won} ganhos · ${stats.lost} perdidos`,
            positive: stats.won >= stats.lost,
          }}
        />
        <StatCard
          label="Vendas previstas"
          value={formatCurrency(stats.vendasPrevistas)}
          icon={Wallet}
          loading={isLoading}
          accent="amber"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" />
            Performance por vendedor
          </CardTitle>
          <CardDescription>
            Leads atribuídos, negócios fechados e taxa de conversão por
            responsável
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && stats.performanceVendedores.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum vendedor cadastrado" />
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Leads atribuídos</TableHead>
                    <TableHead>Fechados</TableHead>
                    <TableHead>Conversão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.performanceVendedores.map((vendor) => (
                    <TableRow key={vendor.userId}>
                      <TableCell className="font-medium">
                        {vendor.name}
                      </TableCell>
                      <TableCell>{vendor.totalLeads}</TableCell>
                      <TableCell>{vendor.won}</TableCell>
                      <TableCell>{vendor.conversionRate.toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
