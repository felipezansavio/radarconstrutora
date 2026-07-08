"use client";

import { CheckCircle2, MapPin, Sparkles, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIngestionSources } from "@/hooks/use-ingestion";

const mapboxConfigured = Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);
const googleMapsConfigured = Boolean(
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
);
const mapsConfigured = mapboxConfigured || googleMapsConfigured;

export default function IntegrationsSettingsPage() {
  const { data: sources, isLoading } = useIngestionSources();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <CardTitle className="text-base">Mapas</CardTitle>
          </div>
          <CardDescription>
            Usado para exibir construtoras e empreendimentos no mapa
            interativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mapsConfigured ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              {mapboxConfigured ? "Mapbox" : "Google Maps"} configurado
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <XCircle className="size-4" />
              Não configurado — defina NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ou
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <CardTitle className="text-base">Inteligência Artificial</CardTitle>
          </div>
          <CardDescription>
            Usada para analisar o potencial comercial dos empreendimentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            A chave da OpenAI é configurada no backend (variável
            OPENAI_API_KEY) e não fica exposta ao navegador.
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            Fontes do motor de busca de construtoras
          </CardTitle>
          <CardDescription>
            Fontes externas usadas para descobrir novas construtoras e
            empreendimentos. Sem chave configurada, o motor de busca
            continua funcionando normalmente só com os dados já
            cadastrados na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {sources?.map((source) => (
                <div
                  key={source.key}
                  className="flex items-center justify-between gap-4 p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{source.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {source.description}
                    </div>
                  </div>
                  {source.configured ? (
                    <div className="flex shrink-0 items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" />
                      Configurada
                    </div>
                  ) : (
                    <div className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-sm">
                      <XCircle className="size-4" />
                      Não configurada
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
