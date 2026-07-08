"use client";

import { Building2, Flame, Handshake, Landmark, Wallet } from "lucide-react";

import { ConversionFunnelChart } from "@/components/dashboard/conversion-funnel-chart";
import { OpportunityGrowthChart } from "@/components/dashboard/opportunity-growth-chart";
import { ProjectsByCityChart } from "@/components/dashboard/projects-by-city-chart";
import { ProjectsByStatusChart } from "@/components/dashboard/projects-by-status-chart";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function DashboardPage() {
  const { stats, isLoading, isError, error } = useDashboardData();

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Acompanhe as oportunidades comerciais identificadas pelo radar."
      />

      {isError && <ErrorState error={error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Construtoras encontradas"
          value={formatNumber(stats.totalBuilders)}
          icon={Landmark}
          loading={isLoading}
        />
        <StatCard
          label="Novos empreendimentos"
          value={formatNumber(stats.newProjects)}
          icon={Building2}
          loading={isLoading}
          accent="sky"
        />
        <StatCard
          label="Leads quentes"
          value={formatNumber(stats.hotLeads)}
          icon={Flame}
          loading={isLoading}
          accent="amber"
        />
        <StatCard
          label="Negociações abertas"
          value={formatNumber(stats.openNegotiations)}
          icon={Handshake}
          loading={isLoading}
          accent="emerald"
        />
        <StatCard
          label="Valor estimado"
          value={formatCurrency(stats.estimatedValue)}
          icon={Wallet}
          loading={isLoading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProjectsByCityChart data={stats.projectsByCity} />
        <ProjectsByStatusChart data={stats.projectsByStatus} />
        <OpportunityGrowthChart data={stats.opportunityGrowth} />
        <ConversionFunnelChart data={stats.conversionFunnel} />
      </div>
    </div>
  );
}
