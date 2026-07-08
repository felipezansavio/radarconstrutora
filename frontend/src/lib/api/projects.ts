import { api } from "./client";
import type {
  ConstructionStatus,
  DevelopmentStandard,
  PaginatedResult,
  Project,
  PropertyType,
} from "@/types/api";

export interface QueryProjectsParams {
  companyId?: string;
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  propertyType?: PropertyType;
  city?: string;
  state?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProjectPayload {
  name: string;
  companyId: string;
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  propertyType?: PropertyType;
  unitsCount?: number;
  floorsCount?: number;
  startDate?: string;
  deliveryForecast?: string;
  addressLine?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export const projectsApi = {
  list: (params: QueryProjectsParams = {}) =>
    api.get<PaginatedResult<Project>>("/projects", { query: params }),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (payload: CreateProjectPayload) =>
    api.post<Project>("/projects", payload),
  update: (id: string, payload: Partial<CreateProjectPayload>) =>
    api.patch<Project>(`/projects/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/projects/${id}`),
};
