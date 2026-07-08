import { useMutation } from "@tanstack/react-query";
import { searchApi, type RadiusSearchParams } from "@/lib/api/search";

export function useRadiusSearch() {
  return useMutation({
    mutationFn: (params: RadiusSearchParams) => searchApi.byRadius(params),
  });
}
