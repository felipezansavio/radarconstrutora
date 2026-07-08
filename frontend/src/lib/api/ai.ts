import { api } from "./client";
import type { Project } from "@/types/api";

export const aiApi = {
  scoreDevelopment: (developmentId: string) =>
    api.post<Project>(`/ai/developments/${developmentId}/score`),
};
