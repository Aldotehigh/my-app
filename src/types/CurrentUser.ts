export type UserRole = 'customer' | 'kitchen' | 'bar' | 'admin';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  role: UserRole;
  can_manage_menu: boolean;
  area: 'kitchen' | 'bar' | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  kitchen: 'Kitchen manager',
  bar: 'Bar manager',
  admin: 'Administrator',
};
