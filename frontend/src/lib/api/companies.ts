import { api } from "./client";
import type { Company } from "@/types/api";

export interface UpdateCompanyPayload {
  name?: string;
  segment?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export const companiesApi = {
  me: () => api.get<Company>("/companies/me"),
  updateMe: (payload: UpdateCompanyPayload) =>
    api.patch<Company>("/companies/me", payload),
};
