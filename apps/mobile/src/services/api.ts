import { auth } from './firebase';

function baseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const base = baseUrl();
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL no configurada');
  }

  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (json as { error?: { message?: string } })?.error?.message || res.statusText;
    throw new Error(message || 'Error de API');
  }

  return json as T;
}

export function hasApiBaseUrl(): boolean {
  return Boolean(baseUrl());
}
