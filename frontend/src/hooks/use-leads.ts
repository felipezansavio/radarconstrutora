import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  leadsApi,
  type CreateLeadPayload,
  type QueryLeadsParams,
  type UpdateLeadPayload,
} from "@/lib/api/leads";
import type { InteractionType } from "@/types/api";

export function useLeads(params: QueryLeadsParams = {}) {
  return useQuery({
    queryKey: ["leads", params],
    queryFn: () => leadsApi.list(params),
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: () => leadsApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) =>
      leadsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useLeadInteractions(leadId: string | undefined) {
  return useQuery({
    queryKey: ["leads", leadId, "interactions"],
    queryFn: () => leadsApi.listInteractions(leadId!),
    enabled: Boolean(leadId),
  });
}

export function useCreateInteraction(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: InteractionType; message?: string }) =>
      leadsApi.createInteraction(leadId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["leads", leadId, "interactions"],
      });
    },
  });
}
