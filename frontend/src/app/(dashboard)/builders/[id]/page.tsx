"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { CompanyAnalysisPanel } from "@/components/builders/company-analysis-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBuilder } from "@/hooks/use-builders";
import { useProjects } from "@/hooks/use-projects";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";

export default function BuilderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: builder, isLoading, isError, error } = useBuilder(id);
  const { data: projects } = useProjects({ companyId: id, pageSize: 50 });

  if (isLoading) return <LoadingState label="Carregando construtora..." />;
  if (isError || !builder) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/builders">
          <ArrowLeft />
          Voltar para construtoras
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{builder.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {builder.city && (
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground size-4" />
              {builder.city} - {builder.state}
            </div>
          )}
          {builder.phone && (
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground size-4" />
              {builder.phone}
            </div>
          )}
          {builder.email && (
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground size-4" />
              {builder.email}
            </div>
          )}
          {builder.website && (
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground size-4" />
              <a
                href={builder.website}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {builder.website}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyAnalysisPanel companyId={id} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Empreendimentos</h2>
        {(projects?.data.length ?? 0) === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum empreendimento cadastrado para esta construtora"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projects?.data.map((project) => (
              <Card key={project.id}>
                <CardContent className="space-y-1 pt-6">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {project.city ?? "—"}
                  </div>
                  <Badge variant="outline">
                    {CONSTRUCTION_STATUS_LABELS[project.status]}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
