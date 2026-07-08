import type { TaskType } from "@/types/api";

// Categórico, 4 tipos fixos — hues atribuídos em sequência (slots 1-4 do
// tema categórico já validado em globals.css), nunca ciclados.
export const TASK_TYPE_COLOR: Record<TaskType, string> = {
  VISIT: "var(--color-chart-1)",
  CALL: "var(--color-chart-2)",
  FOLLOW_UP: "var(--color-chart-3)",
  OTHER: "var(--color-chart-4)",
};
