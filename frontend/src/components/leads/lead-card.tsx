"use client";

import { Building2, Flame, Snowflake, Thermometer } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Lead } from "@/types/api";

const TEMPERATURE_ICON = {
  HOT: Flame,
  WARM: Thermometer,
  COLD: Snowflake,
};

const TEMPERATURE_VARIANT = {
  HOT: "destructive",
  WARM: "warning",
  COLD: "secondary",
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function LeadCard({
  lead,
  onClick,
  draggable,
  onDragStart,
}: {
  lead: Lead;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const TemperatureIcon = TEMPERATURE_ICON[lead.temperature];
  const title = lead.development?.name ?? lead.company?.name ?? "Lead";

  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer gap-3 py-3 transition-shadow hover:shadow-md"
    >
      <CardContent className="space-y-2 px-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-tight font-medium">{title}</p>
          <Badge
            variant={TEMPERATURE_VARIANT[lead.temperature]}
            className="shrink-0"
          >
            <TemperatureIcon className="size-3" />
          </Badge>
        </div>

        {lead.company && lead.development && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Building2 className="size-3" />
            {lead.company.name}
          </div>
        )}

        {lead.notes && (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {lead.notes}
          </p>
        )}

        {lead.owner && (
          <div className="flex items-center gap-1.5 pt-1">
            <Avatar className="size-5">
              <AvatarFallback className="text-[9px]">
                {getInitials(lead.owner.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-xs">
              {lead.owner.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
