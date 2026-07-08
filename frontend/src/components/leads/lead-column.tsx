"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/api";
import { LeadCard } from "./lead-card";

export function LeadColumn({
  status,
  label,
  leads,
  onSelectLead,
  onDropLead,
}: {
  status: LeadStatus;
  label: string;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onDropLead: (leadId: string, status: LeadStatus) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={cn(
        "bg-muted/30 flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors",
        isOver && "border-primary bg-primary/5",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const leadId = e.dataTransfer.getData("text/lead-id");
        if (leadId) onDropLead(leadId, status);
      }}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/lead-id", lead.id);
            }}
            onClick={() => onSelectLead(lead)}
          />
        ))}
        {leads.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-xs">
            Nenhum lead
          </p>
        )}
      </div>
    </div>
  );
}
