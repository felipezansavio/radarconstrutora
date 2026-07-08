import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aiApi,
  type ChatParams,
  type QueryAiHistoryParams,
} from "@/lib/api/ai";
import type { ApproachChannel } from "@/types/api";

export function useScoreDevelopment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (developmentId: string) => aiApi.scoreDevelopment(developmentId),
    onSuccess: (_data, developmentId) => {
      void queryClient.invalidateQueries({
        queryKey: ["projects", developmentId],
      });
    },
  });
}

export function useAnalyzeCompany() {
  return useMutation({
    mutationFn: (companyId: string) => aiApi.analyzeCompany(companyId),
  });
}

export function useClassifyLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => aiApi.classifyLead(leadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useGenerateApproach() {
  return useMutation({
    mutationFn: ({
      leadId,
      channel,
    }: {
      leadId: string;
      channel: ApproachChannel;
    }) => aiApi.generateApproach(leadId, channel),
  });
}

export function useAiChat() {
  return useMutation({
    mutationFn: (params: ChatParams) => aiApi.chat(params),
  });
}

export function useAiHistory(params: QueryAiHistoryParams = {}) {
  return useQuery({
    queryKey: ["ai", "history", params],
    queryFn: () => aiApi.history(params),
  });
}
