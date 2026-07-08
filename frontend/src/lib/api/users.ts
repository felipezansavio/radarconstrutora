import { api } from "./client";
import type { User, UserRole } from "@/types/api";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export const usersApi = {
  list: () => api.get<User[]>("/users"),
  me: () => api.get<User>("/users/me"),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (payload: CreateUserPayload) => api.post<User>("/users", payload),
  update: (id: string, payload: { name?: string; role?: UserRole }) =>
    api.patch<User>(`/users/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/users/${id}`),
};
