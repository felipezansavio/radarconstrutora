import { useQuery } from "@tanstack/react-query";
import { ingestionApi } from "@/lib/api/ingestion";

export function useIngestionSources() {
  return useQuery({
    queryKey: ["ingestion", "sources"],
    queryFn: () => ingestionApi.sources(),
  });
}
