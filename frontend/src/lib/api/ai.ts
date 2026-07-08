import { api } from "./client";
import type {
  AiHistoryEntry,
  AiInteractionType,
  ApproachChannel,
  ApproachResult,
  ChatMessage,
  ChatResult,
  CompanyAnalysisResult,
  LeadClassificationResult,
  PaginatedResult,
  Project,
} from "@/types/api";

export interface ChatParams {
  message: string;
  companyId?: string;
  leadId?: string;
  history?: ChatMessage[];
}

export interface QueryAiHistoryParams {
  type?: AiInteractionType;
  companyId?: string;
  leadId?: string;
  page?: number;
  pageSize?: number;
}

export const aiApi = {
  scoreDevelopment: (developmentId: string) =>
    api.post<Project>(`/ai/developments/${developmentId}/score`),
  analyzeCompany: (companyId: string) =>
    api.post<CompanyAnalysisResult>(`/ai/companies/${companyId}/analyze`),
  classifyLead: (leadId: string) =>
    api.post<LeadClassificationResult>(`/ai/leads/${leadId}/classify`),
  generateApproach: (leadId: string, channel: ApproachChannel) =>
    api.post<ApproachResult>(`/ai/leads/${leadId}/approach`, { channel }),
  chat: (params: ChatParams) => api.post<ChatResult>("/ai/chat", params),
  history: (params: QueryAiHistoryParams = {}) =>
    api.get<PaginatedResult<AiHistoryEntry>>("/ai/history", {
      query: params,
    }),
};
