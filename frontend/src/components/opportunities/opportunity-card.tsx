"use client";

import Link from "next/link";
import { Building2, CheckCircle2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateLead } from "@/hooks/use-leads";
import { ApiError } from "@/lib/api/client";
import { formatDistance } from "@/lib/format";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { OPPORTUNITY_TIER_VARIANT } from "@/lib/opportunity";
import type { LeadTemperature, Opportunity } from "@/types/api";

const TIER_TEMPERATURE: Record<Opportunity["tier"], LeadTemperature> = {
  EXCELLENT: "HOT",
  HIGH: "HOT",
  MEDIUM: "WARM",
  LOW: "COLD",
};

export function OpportunityCard({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const createLead = useCreateLead();

  function handleSaveAsLead() {
    createLead.mutate(
      {
        companyId: opportunity.companyId,
        developmentId: opportunity.developmentId,
        temperature: TIER_TEMPERATURE[opportunity.tier],
        notes: `Lead gerado pelo motor de busca · score ${opportunity.score}/100 (${opportunity.tierLabel}).`,
      },
      {
        onSuccess: () => toast.success("Lead salvo no CRM"),
        onError: (error) => {
          const message =
            error instanceof ApiError
              ? error.message
              : "Não foi possível salvar o lead.";
          toast.error(message);
        },
      },
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/projects/${opportunity.developmentId}`}
              className="font-medium hover:underline"
            >
              {opportunity.name}
            </Link>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Building2 className="size-3" />
              {opportunity.companyName}
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPin className="size-3" />
              {opportunity.city ?? "—"}
              {opportunity.state ? ` - ${opportunity.state}` : ""} ·{" "}
              {formatDistance(opportunity.distanceKm)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {opportunity.score}
            </div>
            <Badge variant={OPPORTUNITY_TIER_VARIANT[opportunity.tier]}>
              {opportunity.tierLabel}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">
            {CONSTRUCTION_STATUS_LABELS[opportunity.status]}
          </Badge>
          {opportunity.reasons.map((reason) => (
            <Badge key={reason.label} variant="secondary">
              {reason.label} +{reason.points}
            </Badge>
          ))}
        </div>

        <Button
          size="sm"
          variant={createLead.isSuccess ? "outline" : "default"}
          className="w-full"
          disabled={createLead.isPending || createLead.isSuccess}
          onClick={handleSaveAsLead}
        >
          {createLead.isSuccess ? (
            <>
              <CheckCircle2 />
              Lead salvo
            </>
          ) : (
            <>
              <Plus />
              {createLead.isPending ? "Salvando..." : "Salvar como lead"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
