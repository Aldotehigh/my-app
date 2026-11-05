import { API_URL } from './api';
import { translate as t } from './translations';
export interface AuthResponse {
  token: string;
}

export async function login(username: string, password: string): Promise<string> {
    const response = await fetch(`${API_URL}/api-token-auth/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
    if (!response.ok) {
    throw new Error(t("Invalid credentials"));
  }

  const data: AuthResponse = await response.json();
  return data.token;
}