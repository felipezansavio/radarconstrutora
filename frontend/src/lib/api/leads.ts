import { api } from "./client";
import type {
  Interaction,
  InteractionType,
  Lead,
  LeadStatus,
  LeadTemperature,
  PaginatedResult,
} from "@/types/api";

export interface QueryLeadsParams {
  commercialStatus?: LeadStatus;
  temperature?: LeadTemperature;
  companyId?: string;
  developmentId?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateLeadPayload {
  companyId?: string;
  developmentId?: string;
  ownerId?: string;
  temperature?: LeadTemperature;
  notes?: string;
}

export interface UpdateLeadPayload {
  temperature?: LeadTemperature;
  commercialStatus?: LeadStatus;
  notes?: string;
  ownerId?: string;
}

export const leadsApi = {
  list: (params: QueryLeadsParams = {}) =>
    api.get<PaginatedResult<Lead>>("/leads", { query: params }),
  getById: (id: string) => api.get<Lead>(`/leads/${id}`),
  create: (payload: CreateLeadPayload) => api.post<Lead>("/leads", payload),
  update: (id: string, payload: UpdateLeadPayload) =>
    api.patch<Lead>(`/leads/${id}`, payload),
  listInteractions: (leadId: string) =>
    api.get<Interaction[]>(`/leads/${leadId}/interactions`),
  createInteraction: (
    leadId: string,
    payload: { type: InteractionType; message?: string },
  ) => api.post<Interaction>(`/leads/${leadId}/interactions`, payload),
};
