import type { OpportunityTier } from "@/types/api";

export type OpportunityTierVariant =
  | "success"
  | "warning"
  | "destructive"
  | "secondary";

export const OPPORTUNITY_TIER_VARIANT: Record<
  OpportunityTier,
  OpportunityTierVariant
> = {
  EXCELLENT: "success",
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "secondary",
};
