import { getAdminAuthHeader } from './adminSession';

export type WaitlistItem = {
  id: string;
  email: string;
  status: 'pending' | 'invited';
  createdAt: string | null;
  invitedAt: string | null;
  source: string | null;
};

async function adminFetch(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const auth = getAdminAuthHeader();
  if (!auth) {
    throw new Error('Sesión no iniciada');
  }

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: auth,
      ...init?.headers,
    },
  });

  const json = (await res.json()) as { success?: boolean; error?: string };

  if (res.status === 401) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Error HTTP ${res.status}`);
  }

  return json as Record<string, unknown>;
}

export async function fetchWaitlist(status: 'pending' | 'invited'): Promise<WaitlistItem[]> {
  const json = await adminFetch(`/api/admin/waitlist?status=${status}`);
  return (json.items as WaitlistItem[]) || [];
}

export async function inviteTester(email: string): Promise<void> {
  const json = await adminFetch('/api/admin/testers', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  const results = json.results as Array<{ success: boolean; error?: string }> | undefined;
  const failed = results?.find((r) => !r.success);
  if (failed) {
    throw new Error(failed.error || 'No se pudo enviar la invitación');
  }
}
