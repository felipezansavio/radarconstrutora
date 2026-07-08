import { api } from "./client";
import type { AuthResult } from "@/types/api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResult>("/auth/register", payload),
  login: (payload: LoginPayload) =>
    api.post<AuthResult>("/auth/login", payload),
  logout: (refreshToken: string) =>
    api.post<void>("/auth/logout", { refreshToken }),
};
