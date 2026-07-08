import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  loading,
  accent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
  accent?: "default" | "emerald" | "amber" | "sky";
}) {
  const accentClasses: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-muted-foreground text-sm font-medium">
          {label}
        </span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            accentClasses[accent ?? "default"],
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
        )}
        {trend && !loading && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              trend.positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive",
            )}
          >
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
