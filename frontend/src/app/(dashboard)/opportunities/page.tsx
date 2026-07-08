"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { OpportunityCard } from "@/components/opportunities/opportunity-card";
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
import { useOpportunitiesSearch } from "@/hooks/use-opportunities";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import type { ConstructionStatus, OpportunityTier, PropertyType } from "@/types/api";

type PropertyFilter = "all" | PropertyType;
type TierFilter = "all" | OpportunityTier;

export default function OpportunitiesPage() {
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
  const [minFloors, setMinFloors] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  const opportunitiesSearch = useOpportunitiesSearch();

  async function handleSearch() {
    const location = await resolveCoordinates();
    if (!location) return;

    opportunitiesSearch.mutate({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm,
      status: status === "all" ? undefined : status,
      propertyType: propertyFilter === "all" ? undefined : propertyFilter,
      minFloors: minFloors ? Number(minFloors) : undefined,
    });
  }

  const opportunities = useMemo(
    () => opportunitiesSearch.data?.opportunities ?? [],
    [opportunitiesSearch.data],
  );

  const filteredOpportunities = useMemo(
    () =>
      tierFilter === "all"
        ? opportunities
        : opportunities.filter((o) => o.tier === tierFilter),
    [opportunities, tierFilter],
  );

  return (
    <div>
      <PageHeader
        title="Novas oportunidades encontradas"
        description="Motor de busca: construtoras e obras próximas classificadas por potencial de venda de esquadrias."
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
                Nº mínimo de pavimentos
              </Label>
              <Input
                type="number"
                placeholder="Ex: 10"
                value={minFloors}
                onChange={(e) => setMinFloors(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSearch}
              disabled={geocoding || opportunitiesSearch.isPending}
            >
              <Sparkles />
              {geocoding || opportunitiesSearch.isPending
                ? "Buscando..."
                : "Buscar oportunidades"}
            </Button>
          </CardContent>
        </Card>

        <div>
          {opportunitiesSearch.isPending && (
            <LoadingState label="Buscando e classificando oportunidades..." />
          )}

          {opportunitiesSearch.isError && (
            <ErrorState error={opportunitiesSearch.error} />
          )}

          {!opportunitiesSearch.isPending && !opportunitiesSearch.data && (
            <EmptyState
              icon={Sparkles}
              title="Defina uma localização e clique em buscar"
              description="O motor de busca vai encontrar e classificar automaticamente as oportunidades próximas."
            />
          )}

          {opportunitiesSearch.data && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  {filteredOpportunities.length} de{" "}
                  {opportunities.length} oportunidade(s) encontrada(s)
                </p>
                <Select
                  value={tierFilter}
                  onValueChange={(value) => setTierFilter(value as TierFilter)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as classificações</SelectItem>
                    <SelectItem value="EXCELLENT">
                      Oportunidade excelente
                    </SelectItem>
                    <SelectItem value="HIGH">Alta oportunidade</SelectItem>
                    <SelectItem value="MEDIUM">Média oportunidade</SelectItem>
                    <SelectItem value="LOW">Baixa prioridade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredOpportunities.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Nenhuma oportunidade nessa classificação"
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.developmentId}
                      opportunity={opportunity}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
