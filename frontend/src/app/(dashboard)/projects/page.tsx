"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import Link from "next/link";

import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjects } from "@/hooks/use-projects";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { getPotentialFromScore } from "@/lib/potential";
import { useAuthStore } from "@/stores/auth-store";
import type { ConstructionStatus } from "@/types/api";

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<ConstructionStatus | "all">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useProjects({
    city: city || undefined,
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const canCreate = role === "ADMIN" || role === "GESTOR";
  const projects = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div>
      <PageHeader
        title="Empreendimentos"
        description="Obras identificadas vinculadas às construtoras do radar."
        actions={canCreate ? <ProjectFormDialog /> : undefined}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Filtrar por cidade..."
          className="sm:max-w-56"
          value={city}
          onChange={(e) => {
            setPage(1);
            setCity(e.target.value);
          }}
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1);
            setStatus(value as ConstructionStatus | "all");
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Fase da obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            {Object.entries(CONSTRUCTION_STATUS_LABELS).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum empreendimento encontrado"
          description="Ajuste os filtros ou cadastre um novo empreendimento."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Construtora</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Fase da obra</TableHead>
                <TableHead>Potencial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const potential = getPotentialFromScore(project.aiScore);

                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {project.company ? (
                        <Link
                          href={`/builders/${project.company.id}`}
                          className="hover:underline"
                        >
                          {project.company.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {project.city
                        ? `${project.city}${project.state ? " - " + project.state : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CONSTRUCTION_STATUS_LABELS[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={potential.variant}>
                        {potential.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
