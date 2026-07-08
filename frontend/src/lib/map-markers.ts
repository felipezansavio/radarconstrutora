import type { ConstructionStatus } from "@/types/api";

/** Nota mínima da IA para um empreendimento ser destacado como alta oportunidade. */
export const HIGH_OPPORTUNITY_SCORE = 70;

const STATUS_MARKER_COLOR: Record<ConstructionStatus, string> = {
  LAUNCH: "#0ca30c",
  FOUNDATION: "#fab219",
  STRUCTURE: "#ec835a",
  FINISHING: "#2a78d6",
  DELIVERED: "#6b7280",
  ON_HOLD: "#6b7280",
};

const HIGH_OPPORTUNITY_COLOR = "#d03b3b";

/**
 * Alta oportunidade (nota da IA) sempre tem prioridade sobre a cor do
 * estágio da obra — sinaliza que o lead merece atenção independente da fase.
 */
export function getMarkerColor(
  status: ConstructionStatus,
  aiScore: number | null,
): string {
  if (aiScore !== null && aiScore >= HIGH_OPPORTUNITY_SCORE) {
    return HIGH_OPPORTUNITY_COLOR;
  }
  return STATUS_MARKER_COLOR[status];
}

export const MAP_LEGEND_ITEMS: { color: string; label: string }[] = [
  { color: HIGH_OPPORTUNITY_COLOR, label: "Alta oportunidade" },
  { color: STATUS_MARKER_COLOR.LAUNCH, label: "Pré-lançamento" },
  { color: STATUS_MARKER_COLOR.FOUNDATION, label: "Fundação" },
  { color: STATUS_MARKER_COLOR.STRUCTURE, label: "Estrutura" },
  { color: STATUS_MARKER_COLOR.FINISHING, label: "Acabamento" },
];
