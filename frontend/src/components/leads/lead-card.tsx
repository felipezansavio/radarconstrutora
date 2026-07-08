"use client";

import {
  Building2,
  Calendar,
  Flame,
  Mail,
  MessageSquare,
  Phone,
  Snowflake,
  Sparkles,
  Thermometer,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getPotentialFromScore } from "@/lib/potential";
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

const TASK_TYPE_LABELS = {
  VISIT: "Visita",
  CALL: "Ligação",
  FOLLOW_UP: "Follow-up",
  OTHER: "Tarefa",
};

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
  const potential = lead.development
    ? getPotentialFromScore(lead.development.aiScore)
    : null;

  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer gap-2 py-3 transition-shadow hover:shadow-md"
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

        {lead.development?.aiScore !== undefined &&
          lead.development?.aiScore !== null &&
          potential && (
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-muted-foreground size-3" />
              <span className="text-muted-foreground text-xs">
                Score IA {lead.development.aiScore}
              </span>
              <Badge variant={potential.variant} className="h-4 px-1 text-[10px]">
                {potential.label}
              </Badge>
            </div>
          )}

        {(lead.company?.phone || lead.company?.email) && (
          <div className="text-muted-foreground space-y-0.5 text-xs">
            {lead.company.phone && (
              <div className="flex items-center gap-1">
                <Phone className="size-3 shrink-0" />
                <span className="truncate">{lead.company.phone}</span>
              </div>
            )}
            {lead.company.email && (
              <div className="flex items-center gap-1">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{lead.company.email}</span>
              </div>
            )}
          </div>
        )}

        {lead.lastInteraction && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <MessageSquare className="size-3 shrink-0" />
            <span className="truncate">
              Última interação:{" "}
              {formatDistanceToNow(new Date(lead.lastInteraction.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        )}

        {lead.nextTask && (
          <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-1 text-xs text-amber-700 dark:text-amber-400">
            <Calendar className="size-3 shrink-0" />
            <span className="truncate">
              Próxima ação: {TASK_TYPE_LABELS[lead.nextTask.type]} ·{" "}
              {formatDate(lead.nextTask.dueAt)}
            </span>
          </div>
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
