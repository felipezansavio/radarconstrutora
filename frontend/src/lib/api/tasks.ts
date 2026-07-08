import { api } from "./client";
import type { Task, TaskType } from "@/types/api";

export interface QueryTasksParams {
  from?: string;
  to?: string;
  leadId?: string;
  assigneeId?: string;
  type?: TaskType;
  completed?: boolean;
}

export interface CreateTaskPayload {
  title: string;
  type?: TaskType;
  dueAt: string;
  notes?: string;
  leadId?: string;
  assigneeId?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  type?: TaskType;
  dueAt?: string;
  notes?: string;
  assigneeId?: string;
  completed?: boolean;
}

export const tasksApi = {
  list: (params: QueryTasksParams = {}) =>
    api.get<Task[]>("/tasks", { query: params }),
  getById: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (payload: CreateTaskPayload) => api.post<Task>("/tasks", payload),
  update: (id: string, payload: UpdateTaskPayload) =>
    api.patch<Task>(`/tasks/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/tasks/${id}`),
};
