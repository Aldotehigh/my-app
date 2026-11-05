import { readPreferences, writePreferences } from './preferenceStorage';
import type { PageSize } from './preferenceStorage';
export type { PageSize } from './preferenceStorage';

export const PAGE_SIZES = [10, 20, 30] as const;

export async function getMenuPageSize(): Promise<PageSize> {
  return (await readPreferences()).pageSize;
}

export async function saveMenuPageSize(pageSize: PageSize): Promise<void> {
  const preferences = await readPreferences();
  await writePreferences({ ...preferences, pageSize });
}
