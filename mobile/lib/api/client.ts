import * as SecureStore from "expo-secure-store";
import { logger } from "@/lib/logger";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

let _onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  _onUnauthorized = cb;
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const method = options.method ?? "GET";
  const start = Date.now();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const ms = Date.now() - start;

  if (res.status === 401) {
    logger.warn("net", `${method} ${path} → 401 (${ms}ms)`);
    await SecureStore.deleteItemAsync("access_token");
    _onUnauthorized?.();
    throw new ApiError("Session expirée, veuillez vous reconnecter", 401);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    logger.error("net", `${method} ${path} → ${res.status} (${ms}ms)`, error);
    throw new ApiError(error.error ?? `HTTP ${res.status}`, res.status);
  }

  logger.log("net", `${method} ${path} → ${res.status} (${ms}ms)`);

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
