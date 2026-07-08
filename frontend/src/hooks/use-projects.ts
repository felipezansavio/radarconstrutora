import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectsApi,
  type CreateProjectPayload,
  type QueryProjectsParams,
} from "@/lib/api/projects";

export function useProjects(params: QueryProjectsParams = {}) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectsApi.list(params),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
