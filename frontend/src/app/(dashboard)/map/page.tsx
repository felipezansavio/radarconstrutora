"use client";

import { useMemo, useState } from "react";
import { Building2, LocateFixed, SearchIcon } from "lucide-react";

import { MapLegend } from "@/components/map/map-legend";
import { MapMarkerDetailSheet } from "@/components/map/map-marker-detail-sheet";
import { MapView, type MapMarker } from "@/components/map/map-view";
import { RadiusSelector } from "@/components/search/radius-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocationSearch } from "@/hooks/use-location-search";
import { useRadiusSearch } from "@/hooks/use-search";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { getMarkerColor } from "@/lib/map-markers";
import type { ConstructionStatus, PropertyType } from "@/types/api";

type PropertyFilter = "all" | PropertyType;
type PotentialFilter = "all" | "high" | "medium" | "low";

const POTENTIAL_RANGES: Record<
  PotentialFilter,
  { minScore?: number; maxScore?: number }
> = {
  all: {},
  high: { minScore: 70 },
  medium: { minScore: 40, maxScore: 69 },
  low: { maxScore: 39 },
};

export default function MapPage() {
  const {
    city,
    setCity,
    state,
    setState,
    zipCode,
    setZipCode,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    locationLabel,
    geocoding,
    useBrowserLocation,
    resolveCoordinates,
  } = useLocationSearch();
  const [radiusKm, setRadiusKm] = useState(10);
  const [status, setStatus] = useState<ConstructionStatus | "all">("all");
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>("all");
  const [potentialFilter, setPotentialFilter] = useState<PotentialFilter>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const radiusSearch = useRadiusSearch();

  async function handleSearch() {
    const location = await resolveCoordinates();
    if (!location) return;

    radiusSearch.mutate({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm,
      type: "projects",
      status: status === "all" ? undefined : status,
      propertyType: propertyFilter === "all" ? undefined : propertyFilter,
      ...POTENTIAL_RANGES[potentialFilter],
    });
  }

  const projects = useMemo(
    () => radiusSearch.data?.projects ?? [],
    [radiusSearch.data],
  );

  const markers: MapMarker[] = useMemo(
    () =>
      projects
        .filter((p) => p.latitude !== null && p.longitude !== null)
        .map((p) => ({
          id: p.id,
          latitude: p.latitude!,
          longitude: p.longitude!,
          label: p.name,
          color: getMarkerColor(p.status, p.aiScore),
        })),
    [projects],
  );

  const origin =
    radiusSearch.data && latitude && longitude
      ? { latitude: Number(latitude), longitude: Number(longitude), radiusKm }
      : null;

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Mapa inteligente"
        description="Busque empreendimentos dentro de um raio a partir de uma localização."
      />

      <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row">
        <Card className="overflow-y-auto lg:h-full lg:w-80 lg:shrink-0">
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>Localização e critérios de busca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs uppercase">
                Localização
              </Label>
              <Input
                placeholder="Endereço ou cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Estado (UF)"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                />
                <Input
                  placeholder="CEP"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                <Input
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={useBrowserLocation}
              >
                <LocateFixed />
                Usar minha localização
              </Button>
              {locationLabel && (
                <p className="text-muted-foreground text-xs">
                  📍 {locationLabel}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase">
                Raio de busca
              </Label>
              <RadiusSelector value={radiusKm} onChange={setRadiusKm} />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase">
                Estágio da obra
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as ConstructionStatus | "all")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase">
                Tipo de empreendimento
              </Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "all", label: "Todos" },
                    { value: "RESIDENTIAL", label: "Residencial" },
                    { value: "COMMERCIAL", label: "Comercial" },
                  ] as const
                ).map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={
                      propertyFilter === option.value ? "default" : "outline"
                    }
                    onClick={() => setPropertyFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase">
                Potencial comercial
              </Label>
              <Select
                value={potentialFilter}
                onValueChange={(value) =>
                  setPotentialFilter(value as PotentialFilter)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleSearch}
              disabled={geocoding || radiusSearch.isPending}
            >
              <SearchIcon />
              {geocoding || radiusSearch.isPending
                ? "Buscando..."
                : "Buscar no mapa"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          {radiusSearch.isPending ? (
            <LoadingState label="Buscando oportunidades..." />
          ) : radiusSearch.isError ? (
            <ErrorState error={radiusSearch.error} />
          ) : !radiusSearch.data ? (
            <EmptyState
              icon={SearchIcon}
              title="Defina uma localização e o raio de busca"
              description="Os empreendimentos encontrados dentro da área aparecerão no mapa."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Building2 className="size-4" />
                  {projects.length} empreendimento(s) encontrado(s) no raio de{" "}
                  {radiusKm} km
                </p>
                <MapLegend />
              </div>
              <div className="flex-1 overflow-hidden rounded-xl border">
                <MapView
                  markers={markers}
                  origin={origin}
                  onMarkerClick={setSelectedProjectId}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <MapMarkerDetailSheet
        project={selectedProject}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectId(null);
        }}
      />
    </div>
  );
}
