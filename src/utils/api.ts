import { getToken } from './tokenStorage';

const API_URL = 'http://127.0.0.1:8000';

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // 1. Recuperamos el token guardado al iniciar sesión.
  const token = await getToken();

  if (!token) {
    throw new Error('Inicia sesión para continuar.');
  }

  // 2. Preparamos los encabezados para identificar al usuario.
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Token ${token}`);
  headers.set('Accept', 'application/json');

  // 3. Enviamos la petición a Django.
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'No se pudo conectar con Django. Comprueba que esté encendido.',
    );
  }

  // 4. Comprobamos si Django rechazó la petición.
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Tu sesión no es válida. Vuelve a iniciar sesión.');
    }

    if (response.status === 403) {
      throw new Error('No tienes permiso para realizar esta acción.');
    }

    throw new Error(`Error del servidor: ${response.status}`);
  }

  // 5. Devolvemos los datos. Algunas operaciones no devuelven contenido.
  const body = await response.text();

  return body ? (JSON.parse(body) as T) : (undefined as T);
}