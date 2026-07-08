export type PotentialVariant = "success" | "warning" | "destructive" | "secondary";

export function getPotentialFromScore(score: number | null | undefined): {
  label: string;
  variant: PotentialVariant;
} {
  if (score === null || score === undefined) {
    return { label: "Não avaliado", variant: "secondary" };
  }
  if (score >= 70) return { label: "Alto", variant: "success" };
  if (score >= 40) return { label: "Médio", variant: "warning" };
  return { label: "Baixo", variant: "destructive" };
}

export function averageScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => typeof s === "number");
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, s) => sum + s, 0) / valid.length);
}
