"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Landmark, LocateFixed, Search } from "lucide-react";
import { toast } from "sonner";

import { BuilderFormDialog } from "@/components/builders/builder-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBuilders } from "@/hooks/use-builders";
import { searchApi } from "@/lib/api/search";
import { formatDistance } from "@/lib/format";
import { averageScore, getPotentialFromScore } from "@/lib/potential";
import { useAuthStore } from "@/stores/auth-store";

const PAGE_SIZE = 10;

export default function BuildersPage() {
  const role = useAuthStore((state) => state.user?.role);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { data, isLoading, isError, error, refetch } = useBuilders({
    name: name || undefined,
    city: city || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const nearbyQuery = useQuery({
    queryKey: ["builders-nearby", coords],
    queryFn: () =>
      searchApi.byRadius({ ...coords!, radiusKm: 100, type: "builders" }),
    enabled: Boolean(coords),
  });

  const distanceById = useMemo(() => {
    const map = new Map<string, number>();
    nearbyQuery.data?.builders?.forEach((b) => map.set(b.id, b.distanceKm));
    return map;
  }, [nearbyQuery.data]);

  function handleUseLocation() {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => toast.error("Não foi possível obter sua localização."),
    );
  }

  const canCreate = role === "ADMIN" || role === "GESTOR";
  const builders = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div>
      <PageHeader
        title="Construtoras"
        description="Construtoras identificadas pelo radar de oportunidades."
        actions={canCreate ? <BuilderFormDialog /> : undefined}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-8"
            value={name}
            onChange={(e) => {
              setPage(1);
              setName(e.target.value);
            }}
          />
        </div>
        <Input
          placeholder="Cidade"
          className="sm:max-w-40"
          value={city}
          onChange={(e) => {
            setPage(1);
            setCity(e.target.value);
          }}
        />
        <Button variant="outline" onClick={handleUseLocation}>
          <LocateFixed />
          Ordenar por distância
        </Button>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : builders.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma construtora encontrada"
          description="Ajuste os filtros ou cadastre uma nova construtora."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Distância</TableHead>
                <TableHead>Nº de obras</TableHead>
                <TableHead>Potencial comercial</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {builders.map((builder) => {
                const distance = distanceById.get(builder.id);
                const potential = getPotentialFromScore(
                  averageScore(
                    builder.developments?.map((d) => d.aiScore) ?? [],
                  ),
                );
                const developmentsCount = builder._count?.developments ?? 0;

                return (
                  <TableRow key={builder.id}>
                    <TableCell>
                      <div className="font-medium">{builder.name}</div>
                      {builder.cnpj && (
                        <div className="text-muted-foreground text-xs">
                          {builder.cnpj}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {builder.city
                        ? `${builder.city}${builder.state ? " - " + builder.state : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell>{formatDistance(distance)}</TableCell>
                    <TableCell>{developmentsCount}</TableCell>
                    <TableCell>
                      <Badge variant={potential.variant}>
                        {potential.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={developmentsCount > 0 ? "success" : "secondary"}>
                        {developmentsCount > 0 ? "Ativa" : "Sem obras"}
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
