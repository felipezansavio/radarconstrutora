"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { formatDate } from "@/lib/format";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/labels";

function getDevelopmentId(metadata: Record<string, unknown> | null): string | null {
  const id = metadata?.developmentId;
  return typeof id === "string" ? id : null;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading, isError, error, refetch } = useNotifications(
    filter === "unread",
  );
  const markAsRead = useMarkNotificationRead();

  const notifications = useMemo(() => data ?? [], [data]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Alertas de novas oportunidades e eventos do CRM identificados pelo radar."
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">
              Não lidas{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {isLoading && <TableSkeleton rows={6} />}

      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação por aqui"
          description="Quando o radar identificar novas oportunidades próximas da sua empresa, elas vão aparecer aqui."
        />
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Oportunidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => {
                const developmentId = getDevelopmentId(notification.metadata);
                return (
                  <TableRow key={notification.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{notification.title}</div>
                      {notification.message && (
                        <div className="text-muted-foreground text-sm">
                          {developmentId ? (
                            <Link
                              href={`/projects/${developmentId}`}
                              className="hover:text-foreground hover:underline"
                            >
                              {notification.message}
                            </Link>
                          ) : (
                            notification.message
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={notification.read ? "secondary" : "success"}>
                        {notification.read ? "Lida" : "Novo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead.mutate(notification.id)}
                        >
                          <CheckCheck />
                          Marcar como lida
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
