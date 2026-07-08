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
  | "NEGOTIATING"
  | "PROPOSAL_SENT"
  | "WON"
  | "LOST";

export type InteractionType =
  | "CALL"
  | "EMAIL"
  | "WHATSAPP"
  | "MEETING"
  | "NOTE"
  | "STATUS_CHANGE";

export type NotificationType =
  | "LEAD_ASSIGNED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_CREATED"
  | "INTERACTION_CREATED"
  | "SYSTEM";

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

export interface Lead {
  id: string;
  tenantId: string;
  companyId: string | null;
  company: LeadRef | null;
  developmentId: string | null;
  development: LeadRef | null;
  ownerId: string | null;
  owner: { id: string; name: string; email: string } | null;
  temperature: LeadTemperature;
  commercialStatus: LeadStatus;
  notes: string | null;
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
  status: ConstructionStatus;
  standard: DevelopmentStandard;
  propertyType: PropertyType;
  floorsCount: number | null;
  unitsCount: number | null;
  aiScore: number | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
}

export interface RadiusSearchResult {
  builders?: NearbyCompanyResult[];
  projects?: NearbyDevelopmentResult[];
  resultsCount: number;
}
