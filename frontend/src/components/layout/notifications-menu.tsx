"use client";

import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationsMenu() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="bg-destructive absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && (
          <div className="text-muted-foreground p-4 text-center text-sm">
            Carregando...
          </div>
        )}
        {!isLoading && (notifications?.length ?? 0) === 0 && (
          <div className="text-muted-foreground p-4 text-center text-sm">
            Nenhuma notificação por aqui.
          </div>
        )}
        {notifications?.slice(0, 8).map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex flex-col items-start gap-0.5 whitespace-normal"
            onClick={() => {
              if (!notification.read) markAsRead.mutate(notification.id);
            }}
          >
            <div className="flex w-full items-center gap-2">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  notification.read ? "bg-transparent" : "bg-primary",
                )}
              />
              <span className="text-sm font-medium">{notification.title}</span>
            </div>
            {notification.message && (
              <p className="text-muted-foreground pl-3.5 text-xs">
                {notification.message}
              </p>
            )}
            <span className="text-muted-foreground pl-3.5 text-[11px]">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
