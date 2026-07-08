import { api } from "./client";
import type {
  ConstructionStatus,
  DevelopmentStandard,
  OpportunitiesResult,
  PropertyType,
} from "@/types/api";

export interface OpportunitiesQueryParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  status?: ConstructionStatus;
  standard?: DevelopmentStandard;
  propertyType?: PropertyType;
  minFloors?: number;
}

export const opportunitiesApi = {
  search: (params: OpportunitiesQueryParams) =>
    api.get<OpportunitiesResult>("/opportunities", { query: params }),
};
