import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "./auth";

const DEV_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const PROD_API  = import.meta.env.VITE_API_URL ?? "";

function apiBase(): string {
  if (PROD_API) return PROD_API.replace(/\/$/, "");
  return DEV_BASE;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id)  headers["x-user-id"]  = user.id;
    if (user.usn) headers["x-user-usn"] = user.usn;
  } catch {}
  return headers;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${apiBase()}/api${path}`;
  console.log(`[API] ▶ ${options?.method ?? "GET"} ${url}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...authHeaders(), ...(options?.headers ?? {}) },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      const msg = err.message ?? `HTTP ${res.status}`;
      console.warn(`[API] ✗ ${options?.method ?? "GET"} ${url} → ${res.status} ${msg}`);
      throw new Error(msg);
    }
    if (res.status === 204) return undefined as T;
    const data = await res.json() as T;
    console.log(`[API] ✓ ${options?.method ?? "GET"} ${url} → OK`);
    return data;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[API] ✗ ${url} timed out after 8 s`);
      throw new Error("Request timed out");
    }
    if (err instanceof TypeError) {
      console.warn(`[API] ✗ ${url} network error (backend unreachable)`);
      throw new Error("Network error – backend unreachable");
    }
    throw err;
  }
}

export function useApiGet<T>(
  path: string,
  options?: { enabled?: boolean; retry?: number },
) {
  return useQuery<T>({
    queryKey: [path],
    queryFn: () => apiFetch<T>(path),
    enabled: options?.enabled ?? true,
    retry: options?.retry ?? 1,
    retryDelay: 800,
    staleTime: 30_000,
  });
}

export function useApiPost<TData, TBody = unknown>(
  path: string,
  opts?: { invalidate?: string[] },
) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TBody>({
    mutationFn: (body: TBody) =>
      apiFetch<TData>(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      opts?.invalidate?.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    },
  });
}

export function useApiDelete<TData = void>(
  path: string,
  opts?: { invalidate?: string[] },
) {
  const qc = useQueryClient();
  return useMutation<TData, Error, string>({
    mutationFn: (id: string) =>
      apiFetch<TData>(`${path}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      opts?.invalidate?.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    },
  });
}
