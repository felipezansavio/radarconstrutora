"use client";

import Link from "next/link";
import { Building2, Globe, Mail, MapPin, Phone, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, formatDistance } from "@/lib/format";
import {
  CONSTRUCTION_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/labels";
import { getPotentialFromScore } from "@/lib/potential";
import type { NearbyDevelopmentResult } from "@/types/api";

export function MapMarkerDetailSheet({
  project,
  onOpenChange,
}: {
  project: NearbyDevelopmentResult | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!project) return null;

  const potential = getPotentialFromScore(project.aiScore);
  const addressParts = [
    project.addressLine,
    project.neighborhood,
    project.city && project.state
      ? `${project.city} - ${project.state}`
      : project.city,
    project.zipCode,
  ].filter(Boolean);

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{project.name}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <Building2 className="size-3.5" />
            {project.companyName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              {CONSTRUCTION_STATUS_LABELS[project.status]}
            </Badge>
            <Badge variant="outline">
              {PROPERTY_TYPE_LABELS[project.propertyType]}
            </Badge>
            <Badge variant={potential.variant}>
              Potencial {potential.label}
            </Badge>
            <Badge variant="outline">{formatDistance(project.distanceKm)}</Badge>
          </div>

          {project.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {project.photos.slice(0, 4).map((url) => (
                <div
                  key={url}
                  className="bg-muted aspect-4/3 overflow-hidden rounded-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={project.name}
                    loading="lazy"
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.parentElement?.classList.add("hidden");
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <span>
                {addressParts.length > 0 ? addressParts.join(", ") : "—"}
              </span>
            </div>
            <div className="text-muted-foreground pl-6 text-xs">
              Previsão de entrega: {formatDate(project.deliveryForecast)}
            </div>
          </div>

          {project.aiSummary && (
            <div className="bg-muted/50 rounded-lg border p-3 text-sm">
              <div className="mb-1 flex items-center gap-1.5 font-medium">
                <Sparkles className="size-3.5" />
                Nota da IA {project.aiScore !== null && `· ${project.aiScore}/100`}
              </div>
              <p className="text-muted-foreground">{project.aiSummary}</p>
            </div>
          )}

          <div className="space-y-1.5 border-t pt-3 text-sm">
            <div className="text-muted-foreground text-xs font-medium uppercase">
              Contatos
            </div>
            {project.companyPhone && (
              <a
                href={`tel:${project.companyPhone}`}
                className="hover:text-primary flex items-center gap-2"
              >
                <Phone className="size-4" />
                {project.companyPhone}
              </a>
            )}
            {project.companyEmail && (
              <a
                href={`mailto:${project.companyEmail}`}
                className="hover:text-primary flex items-center gap-2"
              >
                <Mail className="size-4" />
                {project.companyEmail}
              </a>
            )}
            {project.companyWebsite && (
              <a
                href={project.companyWebsite}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary flex items-center gap-2"
              >
                <Globe className="size-4" />
                {project.companyWebsite}
              </a>
            )}
            {!project.companyPhone &&
              !project.companyEmail &&
              !project.companyWebsite && (
                <p className="text-muted-foreground">
                  Nenhum contato cadastrado.
                </p>
              )}
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href={`/projects/${project.id}`}>Ver empreendimento</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
