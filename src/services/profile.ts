import { fetchWithAuth } from '../utils/api';
import type { CurrentUser } from '../types/CurrentUser';

export async function getCurrentUser(): Promise<CurrentUser> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    return await fetchWithAuth<CurrentUser>('/me', { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
