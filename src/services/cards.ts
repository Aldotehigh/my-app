import { CardItem } from '../types/CardItem';
import { fetchWithAuth } from '../utils/api';

const ENDPOINT = '/cards'; 

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CardFilters {
  search: string;
  categoryId: number | null;
  availableOnly: boolean;
  page: number;
  pageSize?: number;
}

export function getCardsPage(filters: CardFilters) {
  const params = [`page=${filters.page}`];
  if (filters.pageSize !== undefined) {
  params.push(`page_size=${filters.pageSize}`);
}
  const search = filters.search.trim();

  if (search) {
    params.push(`search=${encodeURIComponent(search)}`);
  }

  if (filters.categoryId !== null) {
    params.push(`category=${filters.categoryId}`);
  }

  if (filters.availableOnly) {
    params.push('is_available=true');
  }

  return fetchWithAuth<PaginatedResponse<CardItem>>(
    `/cards/?${params.join('&')}`,
  );
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

interface FavoriteResponse {
  is_favorite: boolean;
}

export function getFavoriteStatus(id: number) {
  return fetchWithAuth<FavoriteResponse>(`${ENDPOINT}/${id}/favorite/`);
}

export function setCardFavorite(id: number, isFavorite: boolean) {
  return fetchWithAuth<FavoriteResponse>(`${ENDPOINT}/${id}/favorite/`, {
    method: isFavorite ? 'POST' : 'DELETE',
  });
}

export function getFavoritesPage(page: number, pageSize = 10) {
  return fetchWithAuth<PaginatedResponse<CardItem>>(
    `${ENDPOINT}/favorites/?page=${page}&page_size=${pageSize}`,
  );
}
export function updateCardAvailability(id: number, isAvailable: boolean) {
  return fetchWithAuth<CardItem>(`${ENDPOINT}/${id}/availability/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available: isAvailable }),
  });
}
