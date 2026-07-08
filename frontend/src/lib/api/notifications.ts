import { api } from "./client";
import type { AppNotification } from "@/types/api";

export const notificationsApi = {
  list: (onlyUnread = false) =>
    api.get<AppNotification[]>("/notifications", {
      query: { onlyUnread },
    }),
  markAsRead: (id: string) =>
    api.patch<AppNotification>(`/notifications/${id}/read`),
};
