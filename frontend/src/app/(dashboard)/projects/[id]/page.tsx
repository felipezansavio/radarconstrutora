"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/hooks/use-projects";
import { aiApi } from "@/lib/api/ai";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import {
  CONSTRUCTION_STATUS_LABELS,
  DEVELOPMENT_STANDARD_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/labels";
import { getPotentialFromScore } from "@/lib/potential";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading, isError, error } = useProject(id);
  const queryClient = useQueryClient();

  const scoreMutation = useMutation({
    mutationFn: () => aiApi.scoreDevelopment(id),
    onSuccess: () => {
      toast.success("Análise de IA concluída");
      void queryClient.invalidateQueries({ queryKey: ["projects", id] });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "Não foi possível analisar o empreendimento.";
      toast.error(message);
    },
  });

  if (isLoading) return <LoadingState label="Carregando empreendimento..." />;
  if (isError || !project) return <ErrorState error={error} />;

  const potential = getPotentialFromScore(project.aiScore);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/projects">
          <ArrowLeft />
          Voltar para empreendimentos
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{project.name}</CardTitle>
            {project.company && (
              <Link
                href={`/builders/${project.company.id}`}
                className="text-muted-foreground text-sm hover:underline"
              >
                {project.company.name}
              </Link>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isPending}
          >
            <Sparkles />
            {scoreMutation.isPending ? "Analisando..." : "Analisar com IA"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {CONSTRUCTION_STATUS_LABELS[project.status]}
            </Badge>
            <Badge variant="outline">
              {DEVELOPMENT_STANDARD_LABELS[project.standard]}
            </Badge>
            <Badge variant="outline">
              {PROPERTY_TYPE_LABELS[project.propertyType]}
            </Badge>
            <Badge variant={potential.variant}>
              Potencial: {potential.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <div className="text-muted-foreground">Localização</div>
              <div className="font-medium">
                {project.city ?? "—"} {project.state ? `- ${project.state}` : ""}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Unidades</div>
              <div className="font-medium">{project.unitsCount ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pavimentos</div>
              <div className="font-medium">{project.floorsCount ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Início da obra</div>
              <div className="font-medium">{formatDate(project.startDate)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Previsão de entrega</div>
              <div className="font-medium">
                {formatDate(project.deliveryForecast)}
              </div>
            </div>
          </div>

          {project.aiSummary && (
            <div className="bg-muted/50 rounded-lg border p-4 text-sm">
              <div className="mb-1 font-medium">Resumo da IA</div>
              <p className="text-muted-foreground">{project.aiSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
