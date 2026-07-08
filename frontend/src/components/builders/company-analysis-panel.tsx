"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAnalyzeCompany } from "@/hooks/use-ai";
import { ApiError } from "@/lib/api/client";
import type { CompanyAnalysisResult } from "@/types/api";

const POTENTIAL_LABELS: Record<CompanyAnalysisResult["potencialCompra"], string> = {
  ALTO: "Alto",
  MEDIO: "Médio",
  BAIXO: "Baixo",
};

const POTENTIAL_VARIANT: Record<
  CompanyAnalysisResult["potencialCompra"],
  "success" | "warning" | "destructive"
> = {
  ALTO: "success",
  MEDIO: "warning",
  BAIXO: "destructive",
};

export function CompanyAnalysisPanel({ companyId }: { companyId: string }) {
  const [result, setResult] = useState<CompanyAnalysisResult | null>(null);
  const analyzeCompany = useAnalyzeCompany();

  function handleAnalyze() {
    analyzeCompany.mutate(companyId, {
      onSuccess: (data) => {
        setResult(data);
        toast.success("Análise da construtora concluída");
      },
      onError: (error) => {
        const message =
          error instanceof ApiError
            ? error.message
            : "Não foi possível analisar a construtora.";
        toast.error(message);
      },
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">Análise com IA</CardTitle>
          <CardDescription>
            Resumo comercial, potencial de compra e estratégia de abordagem
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={analyzeCompany.isPending}
        >
          <Sparkles />
          {analyzeCompany.isPending ? "Analisando..." : "Analisar construtora"}
        </Button>
      </CardHeader>
      {result && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Potencial de compra:
            </span>
            <Badge variant={POTENTIAL_VARIANT[result.potencialCompra]}>
              {POTENTIAL_LABELS[result.potencialCompra]}
            </Badge>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium">Resumo comercial</div>
            <p className="text-muted-foreground text-sm">
              {result.resumoComercial}
            </p>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium">Perfil da construtora</div>
            <p className="text-muted-foreground text-sm">
              {result.perfilConstrutora}
            </p>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium">
              Estratégia de abordagem
            </div>
            <p className="text-muted-foreground text-sm">
              {result.estrategiaAbordagem}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
