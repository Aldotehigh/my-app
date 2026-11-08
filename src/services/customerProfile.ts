import { API_URL, fetchWithAuth } from '../utils/api';
import { translate } from '../utils/translations';
import type { CurrentUser } from '../types/CurrentUser';

export function apiMessage(payload: unknown): string {
  if (typeof payload === 'string') return translate(payload);
  if (Array.isArray(payload)) return apiMessage(payload[0]);
  if (payload && typeof payload === 'object') {
    const values = payload as Record<string, unknown>;
    return apiMessage(values.detail ?? Object.values(values)[0]);
  }
  return translate('Could not save your profile.');
}

export async function registerCustomer(data: FormData) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(API_URL + '/register/', { method: 'POST', body: data, signal: controller.signal });
    const payload = await response.json();
    if (!response.ok) throw new Error(apiMessage(payload));
    return payload as { token: string };
  } finally {
    clearTimeout(timeout);
  }
}

export function updateCustomerProfile(data: FormData) {
  return fetchWithAuth<CurrentUser>('/me', { method: 'PATCH', body: data });
}
