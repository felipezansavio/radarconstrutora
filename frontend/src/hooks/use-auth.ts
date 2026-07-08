import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type LoginPayload, type RegisterPayload } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setSession(data);
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setSession(data);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const { refreshToken, clearSession } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
        }
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      router.push("/login");
    },
  });
}
