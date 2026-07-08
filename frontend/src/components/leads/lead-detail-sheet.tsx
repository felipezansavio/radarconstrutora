"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateInteraction,
  useLeadInteractions,
  useUpdateLead,
} from "@/hooks/use-leads";
import { ApiError } from "@/lib/api/client";
import {
  LEAD_STATUS_LABELS,
  LEAD_TEMPERATURE_LABELS,
} from "@/lib/labels";
import type { InteractionType, Lead, LeadStatus, LeadTemperature } from "@/types/api";

const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  CALL: "Ligação",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  MEETING: "Reunião",
  NOTE: "Nota",
  STATUS_CHANGE: "Mudança de status",
};

export function LeadDetailSheet({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [interactionType, setInteractionType] =
    useState<InteractionType>("NOTE");

  const { data: interactions, isLoading } = useLeadInteractions(lead?.id);
  const createInteraction = useCreateInteraction(lead?.id ?? "");
  const updateLead = useUpdateLead();

  if (!lead) return null;

  const title = lead.development?.name ?? lead.company?.name ?? "Lead";

  function handleAddInteraction() {
    if (!message.trim()) return;
    createInteraction.mutate(
      { type: interactionType, message },
      {
        onSuccess: () => setMessage(""),
        onError: (error) => {
          const msg =
            error instanceof ApiError
              ? error.message
              : "Não foi possível registrar a interação.";
          toast.error(msg);
        },
      },
    );
  }

  function handleStatusChange(value: string) {
    if (!lead) return;
    updateLead.mutate(
      { id: lead.id, payload: { commercialStatus: value as LeadStatus } },
      {
        onError: (error) => {
          const msg =
            error instanceof ApiError
              ? error.message
              : "Não foi possível atualizar o status.";
          toast.error(msg);
        },
      },
    );
  }

  function handleTemperatureChange(value: string) {
    if (!lead) return;
    updateLead.mutate({
      id: lead.id,
      payload: { temperature: value as LeadTemperature },
    });
  }

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {lead.company?.name}
            {lead.development ? ` · ${lead.development.name}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs">
                Status comercial
              </label>
              <Select
                value={lead.commercialStatus}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-muted-foreground text-xs">
                Temperatura
              </label>
              <Select
                value={lead.temperature}
                onValueChange={handleTemperatureChange}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_TEMPERATURE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {lead.notes && (
            <div className="bg-muted/50 rounded-lg border p-3 text-sm">
              {lead.notes}
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold">Histórico</h4>
            {isLoading && (
              <p className="text-muted-foreground text-xs">Carregando...</p>
            )}
            <div className="space-y-3">
              {interactions?.map((interaction) => (
                <div key={interaction.id} className="flex gap-2 text-sm">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {INTERACTION_TYPE_LABELS[interaction.type]}
                  </Badge>
                  <div>
                    {interaction.message && <p>{interaction.message}</p>}
                    <p className="text-muted-foreground text-xs">
                      {interaction.author?.name ?? "Sistema"} ·{" "}
                      {formatDistanceToNow(new Date(interaction.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {!isLoading && (interactions?.length ?? 0) === 0 && (
                <p className="text-muted-foreground text-xs">
                  Nenhuma interação registrada ainda.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <Select
              value={interactionType}
              onValueChange={(v) => setInteractionType(v as InteractionType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTERACTION_TYPE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Registrar uma nova interação..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleAddInteraction}
              disabled={createInteraction.isPending || !message.trim()}
            >
              {createInteraction.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
