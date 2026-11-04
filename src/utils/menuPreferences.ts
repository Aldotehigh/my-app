import * as SecureStore from 'expo-secure-store';

const PAGE_SIZE_KEY = 'menu_page_size';

export const PAGE_SIZES = [10, 20, 30] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export async function getMenuPageSize(): Promise<PageSize> {
  const savedValue = await SecureStore.getItemAsync(PAGE_SIZE_KEY);

  return PAGE_SIZES.find((size) => String(size) === savedValue) ?? 10;
}

export async function saveMenuPageSize(pageSize: PageSize): Promise<void> {
  await SecureStore.setItemAsync(PAGE_SIZE_KEY, String(pageSize));
}