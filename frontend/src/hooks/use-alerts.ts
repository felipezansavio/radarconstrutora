import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api/alerts";

export function useRunAlertsScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => alertsApi.runScan(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
