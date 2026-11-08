import { fetchWithAuth } from '../utils/api';

export type SupplyStatus = 'pending' | 'purchased' | 'received';

export interface SupplyDraftItem {
  name: string;
  quantity: string;
  unit: string;
  urgent: boolean;
}

export interface SupplyItem extends SupplyDraftItem {
  id: number;
  status: SupplyStatus;
  updated_at: string;
}

export interface SupplyRequest {
  id: number;
  author_name: string;
  area: 'kitchen' | 'bar' | 'sushi';
  required_by: string;
  notes: string;
  created_at: string;
  items: SupplyItem[];
}

export const supplyStatusLabels: Record<SupplyStatus, string> = {
  pending: 'Pending purchase',
  purchased: 'Purchased',
  received: 'Received by the area',
};

export async function getSupplies() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetchWithAuth<SupplyRequest[]>('/supply-requests/', { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function sendSupplies(requiredBy: string, notes: string, items: SupplyDraftItem[], requestKey: string) {
  return fetchWithAuth<SupplyRequest>('/supply-requests/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ required_by: requiredBy, notes, items, request_key: requestKey }),
  });
}

export function changeSupplyStatus(requestId: number, itemId: number, status: SupplyStatus) {
  return fetchWithAuth<SupplyRequest>(`/supply-requests/${requestId}/item-status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId, status }),
  });
}
