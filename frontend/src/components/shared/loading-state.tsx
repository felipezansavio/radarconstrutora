import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-sm">
      <Loader2 className="size-6 animate-spin" />
      {label}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
