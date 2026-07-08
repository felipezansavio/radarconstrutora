import { useMemo } from "react";

import { useLeads } from "@/hooks/use-leads";
import { useUsers } from "@/hooks/use-users";
import type { LeadStatus } from "@/types/api";

/** Ticket médio estimado por unidade para esquadrias (heurística, não um valor real de negócio). */
const AVG_TICKET_PER_UNIT = 18_000;
const DEFAULT_UNITS_ESTIMATE = 60;

/** Probabilidade de fechamento por etapa do funil (heurística de forecast). */
const STAGE_PROBABILITY: Record<LeadStatus, number> = {
  NEW: 0.1,
  CONTACTED: 0.2,
  VISIT_SCHEDULED: 0.35,
  PROPOSAL_SENT: 0.55,
  NEGOTIATING: 0.75,
  WON: 1,
  LOST: 0,
};

export function useCrmDashboardData() {
  const leads = useLeads({ pageSize: 100 });
  const users = useUsers();

  const isLoading = leads.isLoading || users.isLoading;
  const isError = leads.isError || users.isError;
  const error = leads.error ?? users.error;

  const stats = useMemo(() => {
    const leadList = leads.data?.data ?? [];
    const userList = users.data ?? [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const leadsNovos = leadList.filter(
      (l) => new Date(l.createdAt) >= thirtyDaysAgo,
    ).length;

    const won = leadList.filter((l) => l.commercialStatus === "WON").length;
    const lost = leadList.filter((l) => l.commercialStatus === "LOST").length;
    const conversao = won + lost > 0 ? (won / (won + lost)) * 100 : 0;

    const openPipeline = leadList.filter(
      (l) => l.commercialStatus !== "WON" && l.commercialStatus !== "LOST",
    );
    const vendasPrevistas = openPipeline.reduce((sum, lead) => {
      const units = lead.development?.unitsCount ?? DEFAULT_UNITS_ESTIMATE;
      const probability = STAGE_PROBABILITY[lead.commercialStatus];
      return sum + units * AVG_TICKET_PER_UNIT * probability;
    }, 0);

    const performanceVendedores = userList
      .map((user) => {
        const ownLeads = leadList.filter((l) => l.ownerId === user.id);
        const ownWon = ownLeads.filter(
          (l) => l.commercialStatus === "WON",
        ).length;
        const ownLost = ownLeads.filter(
          (l) => l.commercialStatus === "LOST",
        ).length;
        const closed = ownWon + ownLost;
        return {
          userId: user.id,
          name: user.name,
          totalLeads: ownLeads.length,
          won: ownWon,
          conversionRate: closed > 0 ? (ownWon / closed) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalLeads - a.totalLeads);

    return {
      leadsNovos,
      conversao,
      vendasPrevistas,
      won,
      lost,
      totalLeads: leadList.length,
      performanceVendedores,
    };
  }, [leads.data, users.data]);

  return { stats, isLoading, isError, error };
}
