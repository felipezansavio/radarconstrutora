"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapPinned } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { isMapboxConfigured, MapboxMap } from "@/components/map/mapbox-map";
import { useBuilders } from "@/hooks/use-builders";
import { useProjects } from "@/hooks/use-projects";

export default function MapPage() {
  const { data: buildersData, isLoading: loadingBuilders } = useBuilders({
    pageSize: 100,
  });
  const { data: projectsData, isLoading: loadingProjects } = useProjects({
    pageSize: 100,
  });

  const markers = useMemo(() => {
    const builderMarkers = (buildersData?.data ?? [])
      .filter((b) => b.latitude && b.longitude)
      .map((b) => ({
        id: `builder-${b.id}`,
        latitude: b.latitude!,
        longitude: b.longitude!,
        label: b.name,
        color: "#2a78d6",
        href: `/builders/${b.id}`,
      }));

    const projectMarkers = (projectsData?.data ?? [])
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        id: `project-${p.id}`,
        latitude: p.latitude!,
        longitude: p.longitude!,
        label: p.name,
        color: "#1baf7a",
        href: `/projects/${p.id}`,
      }));

    return [...builderMarkers, ...projectMarkers];
  }, [buildersData, projectsData]);

  const isLoading = loadingBuilders || loadingProjects;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Mapa"
        description="Visualize construtoras e empreendimentos no mapa."
      />

      {!isMapboxConfigured ? (
        <EmptyState
          icon={MapPinned}
          title="Mapa não configurado"
          description="Defina NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN nas variáveis de ambiente do frontend para habilitar o mapa interativo."
          action={
            <Button variant="outline" asChild>
              <Link href="/settings/integrations">Ver integrações</Link>
            </Button>
          }
        />
      ) : isLoading ? (
        <LoadingState label="Carregando localizações..." />
      ) : (
        <div className="flex-1 overflow-hidden rounded-xl border">
          <MapboxMap markers={markers} />
        </div>
      )}
    </div>
  );
}
