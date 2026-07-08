import { useMemo } from "react";

import { useBuilders } from "@/hooks/use-builders";
import { useLeads } from "@/hooks/use-leads";
import { useProjects } from "@/hooks/use-projects";
import {
  CONSTRUCTION_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
} from "@/lib/labels";
import type { ConstructionStatus, LeadStatus } from "@/types/api";

/** Ticket médio estimado por unidade para esquadrias (heurística, não um valor real de negócio). */
const AVG_TICKET_PER_UNIT = 18_000;
const DEFAULT_UNITS_ESTIMATE = 60;

export function useDashboardData() {
  const builders = useBuilders({ pageSize: 100 });
  const projects = useProjects({ pageSize: 100 });
  const leads = useLeads({ pageSize: 100 });

  const isLoading =
    builders.isLoading || projects.isLoading || leads.isLoading;
  const isError = builders.isError || projects.isError || leads.isError;
  const error = builders.error ?? projects.error ?? leads.error;

  const stats = useMemo(() => {
    const projectList = projects.data?.data ?? [];
    const leadList = leads.data?.data ?? [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newProjects = projectList.filter(
      (p) => new Date(p.createdAt) >= thirtyDaysAgo,
    ).length;

    const hotLeads = leadList.filter((l) => l.temperature === "HOT").length;
    const openNegotiations = leadList.filter(
      (l) => l.commercialStatus === "NEGOTIATING",
    ).length;

    const openPipeline = leadList.filter(
      (l) => l.commercialStatus !== "WON" && l.commercialStatus !== "LOST",
    );
    const estimatedValue = openPipeline.reduce((sum, lead) => {
      const project = projectList.find((p) => p.id === lead.developmentId);
      const units = project?.unitsCount ?? DEFAULT_UNITS_ESTIMATE;
      return sum + units * AVG_TICKET_PER_UNIT;
    }, 0);

    const byCity = new Map<string, number>();
    for (const project of projectList) {
      const city = project.city ?? "Não informado";
      byCity.set(city, (byCity.get(city) ?? 0) + 1);
    }
    const projectsByCity = [...byCity.entries()]
      .map(([city, total]) => ({ city, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const byStatus = new Map<ConstructionStatus, number>();
    for (const project of projectList) {
      byStatus.set(project.status, (byStatus.get(project.status) ?? 0) + 1);
    }
    const projectsByStatus = [...byStatus.entries()].map(
      ([status, total]) => ({
        status,
        label: CONSTRUCTION_STATUS_LABELS[status],
        total,
      }),
    );

    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, date: d };
    });
    const opportunityGrowth = months.map(({ key, date }) => {
      const count = leadList.filter((lead) => {
        const created = new Date(lead.createdAt);
        return (
          created.getFullYear() === date.getFullYear() &&
          created.getMonth() === date.getMonth()
        );
      }).length;
      return {
        month: date.toLocaleDateString("pt-BR", { month: "short" }),
        key,
        total: count,
      };
    });

    const byCommercialStatus = new Map<LeadStatus, number>();
    for (const lead of leadList) {
      byCommercialStatus.set(
        lead.commercialStatus,
        (byCommercialStatus.get(lead.commercialStatus) ?? 0) + 1,
      );
    }
    const conversionFunnel = LEAD_STATUS_ORDER.map((status) => ({
      status,
      label: LEAD_STATUS_LABELS[status],
      total: byCommercialStatus.get(status) ?? 0,
    }));

    return {
      totalBuilders: builders.data?.meta.total ?? 0,
      newProjects,
      hotLeads,
      openNegotiations,
      estimatedValue,
      projectsByCity,
      projectsByStatus,
      opportunityGrowth,
      conversionFunnel,
    };
  }, [builders.data, projects.data, leads.data]);

  return { stats, isLoading, isError, error };
}
