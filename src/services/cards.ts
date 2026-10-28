import { CardItem } from '../types/CardItem';
import { fetchWithAuth } from '../utils/api';

const ENDPOINT = '/cards'; 

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function getCards(): Promise<CardItem[]> {
  const data = await fetchWithAuth<PaginatedResponse<CardItem>>(`${ENDPOINT}/`);
  console.log('Respuesta del backend:', JSON.stringify(data, null, 2));

  return data.results;
}

export async function getCard(id: number): Promise<CardItem> {
  return fetchWithAuth<CardItem>(`${ENDPOINT}/${id}/`);
}

export async function createCard(formData: FormData): Promise<CardItem> {
  return fetchWithAuth<CardItem>(`${ENDPOINT}/`, {
    method: 'POST',
    body: formData,
  });
}

export async function updateCard(id: number, formData: FormData): Promise<CardItem> {
  return fetchWithAuth<CardItem>(`${ENDPOINT}/${id}/`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteCard(id: number): Promise<void> {
  return fetchWithAuth<void>(`${ENDPOINT}/${id}/`, {
    method: 'DELETE',
  });
}