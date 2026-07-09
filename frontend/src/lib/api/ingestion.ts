import { api } from "./client";
import type { ImportDiscoveredResult, IngestionSourceStatus } from "@/types/api";

export interface DiscoveryParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export const ingestionApi = {
  sources: () => api.get<IngestionSourceStatus[]>("/ingestion/sources"),
  import: (params: DiscoveryParams) =>
    api.post<ImportDiscoveredResult>("/ingestion/import", params),
};
