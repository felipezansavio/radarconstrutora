import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { companiesApi, type UpdateCompanyPayload } from "@/lib/api/companies";
import { useAuthStore } from "@/stores/auth-store";

export function useMyCompany() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["companies", "me"],
    queryFn: () => companiesApi.me(),
    enabled: Boolean(accessToken),
  });
}

export function useUpdateMyCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCompanyPayload) =>
      companiesApi.updateMe(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["companies", "me"] });
    },
  });
}
