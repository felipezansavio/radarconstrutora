export type UserRole = "ADMIN" | "GESTOR" | "VENDEDOR";

export type ConstructionStatus =
  | "LAUNCH"
  | "FOUNDATION"
  | "STRUCTURE"
  | "FINISHING"
  | "DELIVERED"
  | "ON_HOLD";

export type DevelopmentStandard = "ECONOMIC" | "STANDARD" | "HIGH_END" | "LUXURY";

export type PropertyType = "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE";

export type LeadTemperature = "COLD" | "WARM" | "HOT";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "VISIT_SCHEDULED"
  | "PROPOSAL_SENT"
  | "NEGOTIATING"
  | "WON"
  | "LOST";

export type InteractionType =
  | "CALL"
  | "EMAIL"
  | "WHATSAPP"
  | "MEETING"
  | "NOTE"
  | "STATUS_CHANGE";

export type TaskType = "VISIT" | "CALL" | "FOLLOW_UP" | "OTHER";

export type NotificationType =
  | "LEAD_ASSIGNED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_CREATED"
  | "INTERACTION_CREATED"
  | "OPPORTUNITY_NEARBY"
  | "SYSTEM";

export type AiInteractionType =
  | "DEVELOPMENT_SCORE"
  | "COMPANY_ANALYSIS"
  | "LEAD_CLASSIFICATION"
  | "APPROACH_WHATSAPP"
  | "APPROACH_EMAIL"
  | "APPROACH_CALL"
  | "CHAT";

export type ApproachChannel = "WHATSAPP" | "EMAIL" | "CALL";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Company {
  id: string;
  name: string;
  segment: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  alertsEnabled: boolean;
  monitoringLatitude: number | null;
  monitoringLongitude: number | null;
  monitoringRadiusKm: number;
  whatsappNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Builder {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  addressLine: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { developments: number };
  developments?: { aiScore: number | null }[];
}

export interface ProjectCompanyRef {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  company?: ProjectCompanyRef;
  status: ConstructionStatus;
  standard: DevelopmentStandard;
  propertyType: PropertyType;
  floorsCount: number | null;
  unitsCount: number | null;
  startDate: string | null;
  deliveryForecast: string | null;
  addressLine: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  aiScore: number | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadRef {
  id: string;
  name: string;
}

export interface LeadCompanyRef extends LeadRef {
  phone: string | null;
  email: string | null;
}

export interface LeadDevelopmentRef extends LeadRef {
  aiScore: number | null;
  unitsCount: number | null;
}

export interface LeadLastInteraction {
  id: string;
  type: InteractionType;
  message: string | null;
  createdAt: string;
}

export interface LeadNextTask {
  id: string;
  type: TaskType;
  title: string;
  dueAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  companyId: string | null;
  company: LeadCompanyRef | null;
  developmentId: string | null;
  development: LeadDevelopmentRef | null;
  ownerId: string | null;
  owner: { id: string; name: string; email: string } | null;
  temperature: LeadTemperature;
  commercialStatus: LeadStatus;
  notes: string | null;
  lastInteraction: LeadLastInteraction | null;
  nextTask: LeadNextTask | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  tenantId: string;
  leadId: string | null;
  lead: {
    id: string;
    company: LeadRef | null;
    development: LeadRef | null;
  } | null;
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  type: TaskType;
  title: string;
  notes: string | null;
  dueAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  authorId: string | null;
  author: { id: string; name: string } | null;
  type: InteractionType;
  message: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  tenantId: string;
  userId: string;
  createdAt: string;
}

export interface NearbyCompanyResult {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
}

export interface NearbyDevelopmentResult {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  status: ConstructionStatus;
  standard: DevelopmentStandard;
  propertyType: PropertyType;
  floorsCount: number | null;
  unitsCount: number | null;
  aiScore: number | null;
  aiSummary: string | null;
  addressLine: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryForecast: string | null;
  photos: string[];
  distanceKm: number;
}

export interface RadiusSearchResult {
  builders?: NearbyCompanyResult[];
  projects?: NearbyDevelopmentResult[];
  resultsCount: number;
}

export type OpportunityTier = "EXCELLENT" | "HIGH" | "MEDIUM" | "LOW";

export interface OpportunityReason {
  label: string;
  points: number;
}

export interface Opportunity {
  developmentId: string;
  name: string;
  companyId: string;
  companyName: string;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  status: ConstructionStatus;
  standard: DevelopmentStandard;
  propertyType: PropertyType;
  floorsCount: number | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
  score: number;
  tier: OpportunityTier;
  tierLabel: string;
  reasons: OpportunityReason[];
}

export interface OpportunitiesResult {
  opportunities: Opportunity[];
  resultsCount: number;
}

export interface IngestionSourceStatus {
  key: string;
  name: string;
  configured: boolean;
  description: string;
}

export interface ImportDiscoveredResult {
  discovered: number;
  imported: number;
  skipped: number;
}

export interface CompanyAnalysisResult {
  resumoComercial: string;
  potencialCompra: "ALTO" | "MEDIO" | "BAIXO";
  perfilConstrutora: string;
  estrategiaAbordagem: string;
}

export interface LeadClassificationResult {
  lead: Lead;
  reasoning: string;
}

export interface ApproachResult {
  subject: string | null;
  content: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
}

export interface AiHistoryEntry {
  id: string;
  type: AiInteractionType;
  tenantId: string;
  userId: string | null;
  companyId: string | null;
  developmentId: string | null;
  leadId: string | null;
  prompt: string | null;
  response: Record<string, unknown>;
  createdAt: string;
  company: { id: string; name: string } | null;
  development: { id: string; name: string } | null;
  lead: { id: string } | null;
  user: { id: string; name: string } | null;
}
