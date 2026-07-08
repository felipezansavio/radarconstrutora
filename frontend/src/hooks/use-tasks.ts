import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  tasksApi,
  type CreateTaskPayload,
  type QueryTasksParams,
  type UpdateTaskPayload,
} from "@/lib/api/tasks";

export function useTasks(
  params: QueryTasksParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksApi.list(params),
    enabled: options.enabled,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTaskPayload;
    }) => tasksApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
