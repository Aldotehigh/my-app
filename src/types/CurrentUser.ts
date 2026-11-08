import type { Address } from './Address';
export type UserRole = 'customer' | 'kitchen' | 'bar' | 'sushi' | 'admin' | 'owner';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  address?: Address;
  is_staff: boolean;
  role: UserRole;
  can_manage_menu: boolean;
  can_edit_menu?: boolean;
  can_view_business?: boolean;
  area: 'kitchen' | 'bar' | 'sushi' | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  kitchen: 'Kitchen manager',
  bar: 'Drinks manager',
  sushi: 'Sushi manager',
  admin: 'Administrator',
  owner: 'Owner',
};
