"use client";

import { Users } from "lucide-react";

import { InviteUserDialog } from "@/components/settings/invite-user-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers } from "@/hooks/use-users";
import { USER_ROLE_LABELS } from "@/lib/labels";
import { useAuthStore } from "@/stores/auth-store";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function TeamSettingsPage() {
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "ADMIN";

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {isAdmin && <InviteUserDialog />}
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={3} />
      ) : (users?.length ?? 0) === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {USER_ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
