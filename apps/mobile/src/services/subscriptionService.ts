import type { Plan } from '../types';
import { plans as seedPlans } from '../data/academy';
import { apiFetch, hasApiBaseUrl } from './api';

type PlansResponse = { success: boolean; data: Plan[] };
type RedeemResponse = { success: boolean; data?: { subscriptionId: string } };

export async function fetchPlans(): Promise<Plan[]> {
  if (!hasApiBaseUrl()) return seedPlans;
  try {
    const response = await apiFetch<PlansResponse>('/api/plans');
    return response.data?.length ? response.data : seedPlans;
  } catch {
    return seedPlans;
  }
}

export async function redeemSubscriptionCode(code: string): Promise<string | null> {
  if (!hasApiBaseUrl()) return null;
  const response = await apiFetch<RedeemResponse>('/api/subscriptions/redeem', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return response.data?.subscriptionId || null;
}
