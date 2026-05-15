import { hasApiBaseUrl } from './api';

/** Firestore/local primero; API CRM cuando EXPO_PUBLIC_API_BASE_URL está definida. */
export function useApiWhenReady(): boolean {
  return hasApiBaseUrl();
}

export async function tryApi<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!hasApiBaseUrl()) return null;
  try {
    return await fn();
  } catch {
    return null;
  }
}
