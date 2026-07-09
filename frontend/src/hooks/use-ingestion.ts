import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { ingestionApi, type DiscoveryParams } from "@/lib/api/ingestion";

export function useIngestionSources() {
  return useQuery({
    queryKey: ["ingestion", "sources"],
    queryFn: () => ingestionApi.sources(),
  });
}

export function useImportOpportunities() {
  return useMutation({
    mutationFn: (params: DiscoveryParams) => ingestionApi.import(params),
  });
}
