"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LeadColumn } from "@/components/leads/lead-column";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { useLeads, useUpdateLead } from "@/hooks/use-leads";
import { ApiError } from "@/lib/api/client";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/labels";
import type { Lead, LeadStatus } from "@/types/api";

export default function LeadsPage() {
  const { data, isLoading, isError, error, refetch } = useLeads({
    pageSize: 100,
  });
  const updateLead = useUpdateLead();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const leads = useMemo(() => data?.data ?? [], [data]);
  const selectedLead =
    leads.find((lead) => lead.id === selectedLeadId) ?? null;

  const leadsByStatus = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    for (const status of LEAD_STATUS_ORDER) map.set(status, []);
    for (const lead of leads) {
      map.get(lead.commercialStatus)?.push(lead);
    }
    return map;
  }, [leads]);

  function handleDrop(leadId: string, status: LeadStatus) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.commercialStatus === status) return;

    updateLead.mutate(
      { id: leadId, payload: { commercialStatus: status } },
      {
        onError: (err) => {
          const message =
            err instanceof ApiError
              ? err.message
              : "Não foi possível atualizar o lead.";
          toast.error(message);
        },
      },
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="CRM"
        description="Acompanhe o funil comercial de leads em andamento."
        actions={<LeadFormDialog />}
      />

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {isLoading && <LoadingState label="Carregando leads..." />}

      {!isLoading && !isError && (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {LEAD_STATUS_ORDER.map((status) => (
            <LeadColumn
              key={status}
              status={status}
              label={LEAD_STATUS_LABELS[status]}
              leads={leadsByStatus.get(status) ?? []}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
              onDropLead={handleDrop}
            />
          ))}
        </div>
      )}

      <LeadDetailSheet
        lead={selectedLead}
        onOpenChange={(open) => {
          if (!open) setSelectedLeadId(null);
        }}
      />
    </div>
  );
}
