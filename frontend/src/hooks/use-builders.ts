import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildersApi,
  type CreateBuilderPayload,
  type QueryBuildersParams,
} from "@/lib/api/builders";

export function useBuilders(params: QueryBuildersParams = {}) {
  return useQuery({
    queryKey: ["builders", params],
    queryFn: () => buildersApi.list(params),
  });
}

export function useBuilder(id: string | undefined) {
  return useQuery({
    queryKey: ["builders", id],
    queryFn: () => buildersApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBuilder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBuilderPayload) => buildersApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["builders"] });
    },
  });
}
