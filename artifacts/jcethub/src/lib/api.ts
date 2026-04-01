import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "./auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) headers["x-user-id"] = user.id;
    if (user.usn) headers["x-user-usn"] = user.usn;
  } catch {}

  return headers;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "API error" }));
    throw new Error(err.message ?? "API error");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useApiGet<T>(path: string, options?: { enabled?: boolean }) {
  return useQuery<T>({
    queryKey: [path],
    queryFn: () => apiFetch<T>(path),
    enabled: options?.enabled ?? true,
  });
}

export function useApiPost<TData, TBody = unknown>(path: string, opts?: { invalidate?: string[] }) {
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

export function useApiDelete<TData = void>(path: string, opts?: { invalidate?: string[] }) {
  const qc = useQueryClient();
  return useMutation<TData, Error, string>({
    mutationFn: (id: string) =>
      apiFetch<TData>(`${path}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      opts?.invalidate?.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    },
  });
}
