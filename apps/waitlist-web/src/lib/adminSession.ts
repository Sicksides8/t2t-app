const STORAGE_KEY = 't2t_waitlist_admin_auth';

export function getAdminAuthHeader(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAdminAuthHeader(user: string, password: string): void {
  const token = btoa(`${user}:${password}`);
  sessionStorage.setItem(STORAGE_KEY, `Basic ${token}`);
}

export function clearAdminAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
