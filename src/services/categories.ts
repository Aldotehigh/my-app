import type { Category } from '../types/CardItem';
import { fetchWithAuth } from '../utils/api';

interface CategoryPage {
  results: Category[];
  next: string | null;
}

export async function getCategories(): Promise<Category[]> {
  const categories: Category[] = [];
  let page = 1;

  while (true) {
    const data = await fetchWithAuth<CategoryPage>(
      `/categories/?page=${page}`,
    );

    categories.push(...data.results);

    if (!data.next) {
      return categories;
    }

    page += 1;
  }
}