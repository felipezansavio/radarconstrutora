import { useMutation } from "@tanstack/react-query";
import {
  opportunitiesApi,
  type OpportunitiesQueryParams,
} from "@/lib/api/opportunities";

export function useOpportunitiesSearch() {
  return useMutation({
    mutationFn: (params: OpportunitiesQueryParams) =>
      opportunitiesApi.search(params),
  });
}
