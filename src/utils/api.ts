import { getToken } from './tokenStorage';
import { translate as t } from './translations';

/*const API_URL = 'http://127.0.0.1:8000';
export const API_URL = 'http://192.168.100.5:8000';*/
export const API_URL = 'http://10.0.2.2:8000';

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // Read the stored authentication token.
  const token = await getToken();

  if (!token) {
    throw new Error(t("Sign in to continue."));
  }

  // Add authentication headers.
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Token ${token}`);
  headers.set('Accept', 'application/json');

  // Send the request.
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      t("Could not connect to the server. Check that it is running."),
    );
  }

  // Handle unsuccessful responses.
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(t("Your session is invalid. Please sign in again."));
    }

    if (response.status === 403) {
      throw new Error(t("You do not have permission to perform this action."));
    }

    const failure = await response.json().catch(() => null);
    if (typeof failure?.detail === 'string') {
      throw new Error(t(failure.detail));
    }
    const fieldMessage = Object.values(failure ?? {}).flat().find((value) => typeof value === 'string');
    if (typeof fieldMessage === 'string') throw new Error(t(fieldMessage));
    throw new Error(`${t('Server error')}: ${response.status}`);
  }

  // Read the response if content is present.
  const body = await response.text();

  return body ? (JSON.parse(body) as T) : (undefined as T);
}