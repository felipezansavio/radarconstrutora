import type {
  ConstructionStatus,
  DevelopmentStandard,
  LeadStatus,
  LeadTemperature,
  PropertyType,
  UserRole,
} from "@/types/api";

export const CONSTRUCTION_STATUS_LABELS: Record<ConstructionStatus, string> = {
  LAUNCH: "Lançamento",
  FOUNDATION: "Fundação",
  STRUCTURE: "Estrutura",
  FINISHING: "Acabamento",
  DELIVERED: "Entregue",
  ON_HOLD: "Paralisada",
};

export const DEVELOPMENT_STANDARD_LABELS: Record<DevelopmentStandard, string> = {
  ECONOMIC: "Econômico",
  STANDARD: "Padrão",
  HIGH_END: "Alto padrão",
  LUXURY: "Luxo",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  RESIDENTIAL: "Residencial",
  COMMERCIAL: "Comercial",
  MIXED_USE: "Uso misto",
};

export const LEAD_TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  COLD: "Frio",
  WARM: "Morno",
  HOT: "Quente",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  NEGOTIATING: "Negociando",
  PROPOSAL_SENT: "Proposta enviada",
  WON: "Ganho",
  LOST: "Perdido",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "NEGOTIATING",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  VENDEDOR: "Vendedor",
};
