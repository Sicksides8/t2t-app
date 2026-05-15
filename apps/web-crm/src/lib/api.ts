'use client';

import { auth } from './firebase';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error?: { message?: string } };

export async function getAuthToken(): Promise<string | null> {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };

  const res = await fetch(path, { ...init, headers });
  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    const message = json.error?.message || `Error HTTP ${res.status}`;
    throw new Error(message);
  }

  return json.data as T;
}
