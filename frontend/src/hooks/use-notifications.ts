import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuthStore } from "@/stores/auth-store";

export function useNotifications(onlyUnread = false) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["notifications", onlyUnread],
    queryFn: () => notificationsApi.list(onlyUnread),
    enabled: Boolean(accessToken),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
