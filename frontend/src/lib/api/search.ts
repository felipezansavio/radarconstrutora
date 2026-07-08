import { api } from "./client";
import type {
  ConstructionStatus,
  DevelopmentStandard,
  PropertyType,
  RadiusSearchResult,
} from "@/types/api";

export interface RadiusSearchParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  type?: "builders" | "projects" | "all";
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  propertyType?: PropertyType;
  minFloors?: number;
}

export const searchApi = {
  byRadius: (params: RadiusSearchParams) =>
    api.get<RadiusSearchResult>("/search/radius", { query: params }),
};
