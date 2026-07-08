import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type CreateUserPayload } from "@/lib/api/users";
import { useAuthStore } from "@/stores/auth-store";

export function useUsers() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
    enabled: Boolean(accessToken),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
