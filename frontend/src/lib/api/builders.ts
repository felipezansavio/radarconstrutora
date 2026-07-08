import { api } from "./client";
import type { Builder, PaginatedResult } from "@/types/api";

export interface QueryBuildersParams {
  city?: string;
  state?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateBuilderPayload {
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export const buildersApi = {
  list: (params: QueryBuildersParams = {}) =>
    api.get<PaginatedResult<Builder>>("/builders", { query: params }),
  getById: (id: string) => api.get<Builder>(`/builders/${id}`),
  create: (payload: CreateBuilderPayload) =>
    api.post<Builder>("/builders", payload),
  update: (id: string, payload: Partial<CreateBuilderPayload>) =>
    api.patch<Builder>(`/builders/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/builders/${id}`),
};
