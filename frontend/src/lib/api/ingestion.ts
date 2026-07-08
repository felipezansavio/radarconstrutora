import { api } from "./client";
import type { IngestionSourceStatus } from "@/types/api";

export const ingestionApi = {
  sources: () => api.get<IngestionSourceStatus[]>("/ingestion/sources"),
};
