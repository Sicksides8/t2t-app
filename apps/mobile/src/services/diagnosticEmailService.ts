import { apiFetch, hasApiBaseUrl } from './api';
import type { DiagnosticResult } from '../types';

type DiagnosticEmailResponse = {
  success: boolean;
  data?: { id: string };
  error?: { message?: string };
};

export async function sendDiagnosticResultEmail(params: {
  email: string;
  diagnostic: Pick<DiagnosticResult, 'scores' | 'topSkills' | 'weakSkills'>;
}): Promise<{ id: string }> {
  if (!hasApiBaseUrl()) {
    throw new Error('API_BASE_URL no configurada');
  }

  const response = await apiFetch<DiagnosticEmailResponse>('/api/diagnostic-email', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      scores: params.diagnostic.scores,
      topSkills: params.diagnostic.topSkills,
      weakSkills: params.diagnostic.weakSkills,
    }),
  });

  if (!response?.success || !response.data?.id) {
    throw new Error(response?.error?.message || 'No pudimos enviar el email.');
  }

  return { id: response.data.id };
}
