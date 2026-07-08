import { ConstructionStatus, DevelopmentStandard } from '@prisma/client';

export type OpportunityTier = 'EXCELLENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScoreReason {
  label: string;
  points: number;
}

export interface ScoringInput {
  status: ConstructionStatus;
  standard: DevelopmentStandard;
  floorsCount: number | null;
  startDate: Date | null;
  companyDevelopmentsCount: number;
  distanceKm: number;
  radiusKm: number;
}

export interface ScoringResult {
  score: number;
  tier: OpportunityTier;
  reasons: ScoreReason[];
}

const RECENT_LAUNCH_MONTHS = 6;
const RECURRING_BUILDER_THRESHOLD = 2;
const EARLY_STAGE_STATUSES: ConstructionStatus[] = ['LAUNCH', 'FOUNDATION'];
const PREMIUM_STANDARDS: DevelopmentStandard[] = ['HIGH_END', 'LUXURY'];

export const OPPORTUNITY_TIER_LABELS: Record<OpportunityTier, string> = {
  EXCELLENT: 'Oportunidade excelente',
  HIGH: 'Alta oportunidade',
  MEDIUM: 'Média oportunidade',
  LOW: 'Baixa prioridade',
};

export function classifyTier(score: number): OpportunityTier {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Algoritmo inicial de classificação de oportunidades (0-100), pensado
 * para venda de esquadrias. Critérios e pesos vêm da especificação do
 * motor de busca (Parte 8) — cada critério some no máximo 100 pontos.
 */
export function scoreOpportunity(input: ScoringInput): ScoringResult {
  const reasons: ScoreReason[] = [];

  if (EARLY_STAGE_STATUSES.includes(input.status)) {
    reasons.push({ label: 'Obra iniciando', points: 20 });
  }

  if (PREMIUM_STANDARDS.includes(input.standard)) {
    reasons.push({ label: 'Empreendimento de alto padrão', points: 20 });
  }

  if (input.floorsCount !== null && input.floorsCount > 10) {
    reasons.push({ label: 'Mais de 10 pavimentos', points: 20 });
  }

  if (input.companyDevelopmentsCount >= RECURRING_BUILDER_THRESHOLD) {
    reasons.push({
      label: 'Construtora recorrente na plataforma',
      points: 15,
    });
  }

  if (input.startDate) {
    const monthsSinceStart =
      (Date.now() - input.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceStart >= 0 && monthsSinceStart <= RECENT_LAUNCH_MONTHS) {
      reasons.push({ label: 'Lançamento recente', points: 15 });
    }
  }

  const proximityRatio =
    input.radiusKm > 0 ? Math.max(0, 1 - input.distanceKm / input.radiusKm) : 0;
  const proximityPoints = Math.round(proximityRatio * 10);
  if (proximityPoints > 0) {
    reasons.push({
      label: `Proximidade (${input.distanceKm.toFixed(1)} km do ponto de busca)`,
      points: proximityPoints,
    });
  }

  const score = Math.min(
    100,
    reasons.reduce((sum, reason) => sum + reason.points, 0),
  );

  return { score, tier: classifyTier(score), reasons };
}
