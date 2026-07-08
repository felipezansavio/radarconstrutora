import { useAuthStore } from "@/stores/auth-store";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
    if (
      message &&
      typeof message === "object" &&
      "message" in (message as Record<string, unknown>)
    ) {
      const nested = (message as Record<string, unknown>).message;
      if (typeof nested === "string") return nested;
      if (Array.isArray(nested)) return nested.join(", ");
    }
  }
  return fallback;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearSession();
      return false;
    }

    const data = await res.json();
    setSession(data);
    return true;
  } catch {
    return false;
  }
}

export interface RequestOptions extends RequestInit {
  query?: object;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  path: string,
  { query, headers, ...init }: RequestOptions = {},
  allowRetry = true,
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Content-Type", "application/json");
  if (accessToken) {
    finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(buildUrl(path, query), {
    ...init,
    headers: finalHeaders,
  });

  if (
    res.status === 401 &&
    allowRetry &&
    path !== "/auth/login" &&
    path !== "/auth/refresh"
  ) {
    refreshPromise ??= tryRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;

    if (refreshed) {
      return request<T>(path, { query, headers, ...init }, false);
    }

    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new ApiError(res.status, extractMessage(body, res.statusText), body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
