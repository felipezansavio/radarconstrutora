"use client";

import { useState } from "react";
import { Building2, Landmark, LocateFixed, SearchIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { RadiusSelector } from "@/components/search/radius-selector";
import {
  BuilderResultCard,
  ProjectResultCard,
} from "@/components/search/result-cards";
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
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useImportOpportunities } from "@/hooks/use-ingestion";
import { useLocationSearch } from "@/hooks/use-location-search";
import { useRadiusSearch } from "@/hooks/use-search";
import { ApiError } from "@/lib/api/client";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { useAuthStore } from "@/stores/auth-store";
import type { ConstructionStatus } from "@/types/api";

type PropertyFilter = "all" | "RESIDENTIAL" | "COMMERCIAL";
type ResultType = "all" | "builders" | "projects";

export default function SearchPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canImport = role === "ADMIN" || role === "GESTOR";

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
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>("all");
  const [highEndOnly, setHighEndOnly] = useState(false);
  const [minFloors, setMinFloors] = useState("");
  const [status, setStatus] = useState<ConstructionStatus | "all">("all");
  const [resultType, setResultType] = useState<ResultType>("all");
  const [lastLocation, setLastLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const radiusSearch = useRadiusSearch();
  const importOpportunities = useImportOpportunities();

  async function runSearch(location: { latitude: number; longitude: number }) {
    radiusSearch.mutate({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm,
      type: resultType,
      status: status === "all" ? undefined : status,
      propertyType: propertyFilter === "all" ? undefined : propertyFilter,
      standard: highEndOnly ? "HIGH_END" : undefined,
      minFloors: minFloors ? Number(minFloors) : undefined,
    });
  }

  async function handleSearch() {
    const location = await resolveCoordinates();
    if (!location) return;

    setLastLocation(location);
    await runSearch(location);
  }

  function handleImportNearby() {
    if (!lastLocation) return;

    importOpportunities.mutate(
      { ...lastLocation, radiusKm },
      {
        onSuccess: (result) => {
          if (result.imported === 0) {
            toast.info(
              `Busca concluída: ${result.discovered} candidato(s) encontrado(s), nenhuma construtora nova pra cadastrar.`,
            );
          } else {
            toast.success(
              `${result.imported} nova(s) construtora(s) cadastrada(s)! Atualizando resultados...`,
            );
          }
          if (lastLocation) void runSearch(lastLocation);
        },
        onError: (err) => {
          const message =
            err instanceof ApiError
              ? err.message
              : "Não foi possível buscar construtoras reais agora.";
          toast.error(message);
        },
      },
    );
  }

  const results = radiusSearch.data;

  return (
    <div>
      <PageHeader
        title="Buscar oportunidades"
        description="Encontre construtoras e empreendimentos próximos a uma localização."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
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
                placeholder="Cidade"
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
                Tipo de imóvel
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

            <div className="flex items-center justify-between">
              <Label htmlFor="high-end" className="text-sm font-normal">
                Somente alto padrão
              </Label>
              <Switch
                id="high-end"
                checked={highEndOnly}
                onCheckedChange={setHighEndOnly}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase">
                Nº mínimo de pavimentos
              </Label>
              <Input
                type="number"
                placeholder="Ex: 10"
                value={minFloors}
                onChange={(e) => setMinFloors(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase">
                Fase da obra
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

            <Button
              className="w-full"
              onClick={handleSearch}
              disabled={geocoding || radiusSearch.isPending}
            >
              <SearchIcon />
              {geocoding || radiusSearch.isPending ? "Buscando..." : "Buscar"}
            </Button>
          </CardContent>
        </Card>

        <div>
          <Tabs
            value={resultType}
            onValueChange={(value) => setResultType(value as ResultType)}
            className="mb-4"
          >
            <TabsList>
              <TabsTrigger value="all">Tudo</TabsTrigger>
              <TabsTrigger value="builders">Construtoras</TabsTrigger>
              <TabsTrigger value="projects">Empreendimentos</TabsTrigger>
            </TabsList>
          </Tabs>

          {radiusSearch.isPending && (
            <LoadingState label="Buscando oportunidades próximas..." />
          )}

          {radiusSearch.isError && <ErrorState error={radiusSearch.error} />}

          {!radiusSearch.isPending && !results && (
            <EmptyState
              icon={SearchIcon}
              title="Defina uma localização e clique em buscar"
              description="Os resultados de construtoras e empreendimentos próximos aparecerão aqui."
            />
          )}

          {results && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">
                  {results.resultsCount} resultado(s) encontrado(s)
                </p>
                {canImport && lastLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportNearby}
                    disabled={importOpportunities.isPending}
                  >
                    <Sparkles />
                    {importOpportunities.isPending
                      ? "Buscando construtoras reais..."
                      : "Buscar construtoras reais (Google Places)"}
                  </Button>
                )}
              </div>

              {resultType !== "projects" && results.builders && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Landmark className="size-4" />
                    Construtoras ({results.builders.length})
                  </h3>
                  {results.builders.length === 0 ? (
                    <EmptyState
                      icon={Landmark}
                      title="Nenhuma construtora encontrada nesse raio"
                      description={
                        canImport
                          ? 'Clique em "Buscar construtoras reais" acima para consultar o Google Places e cadastrar novas construtoras encontradas perto daqui.'
                          : undefined
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {results.builders.map((result) => (
                        <BuilderResultCard key={result.id} result={result} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {resultType !== "builders" && results.projects && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="size-4" />
                    Empreendimentos ({results.projects.length})
                  </h3>
                  {results.projects.length === 0 ? (
                    <EmptyState
                      icon={Building2}
                      title="Nenhum empreendimento encontrado nesse raio"
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {results.projects.map((result) => (
                        <ProjectResultCard key={result.id} result={result} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
