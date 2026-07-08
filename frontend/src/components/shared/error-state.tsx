import { AlertTriangle, RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

export function ErrorState({
  error,
  onRetry,
  title = "Não foi possível carregar os dados",
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Tente novamente em instantes.";

  return (
    <Alert variant="destructive" className="my-6">
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onRetry}
          >
            <RotateCcw />
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
