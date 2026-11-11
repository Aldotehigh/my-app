import type { Address } from '../types/Address';
import type { Pricing } from './promotions';
import type { CartLine } from '../context/CartContext';
import { fetchWithAuth } from '../utils/api';

export type LineStatus = 'review' | 'received' | 'preparing' | 'ready' | 'declined' | 'served';

export interface OrderLine {
  id: number;
  title: string;
  quantity: number;
  unit_price: string;
  area: 'kitchen' | 'bar' | 'sushi';
  removals: string[];
  selections?: string[];
  allergy: string;
  status: LineStatus;
  course?: 'starter' | 'main' | 'dessert' | 'drink';
}

export interface TableOrder {
  fulfillment?: 'dine_in' | 'pickup' | 'delivery';
  delivery_status?: 'pending' | 'accepted' | 'rejected';
  dispatched_at?: string | null;
  delivery_address?: Partial<Address>;
  pricing?: Pricing | null;
  id: number;
  table: string | number | null;
  created_at: string;
  tip_percent?: number;
  lines: OrderLine[];
}

export const orderStatusLabels: Record<LineStatus, string> = {
  review: 'Pending restaurant review',
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  declined: 'Declined',
  served: 'Served',
};

export async function getTableOrders() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetchWithAuth<TableOrder[]>('/table-orders/', { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function sendTableOrder(table: string | number | null, requestKey: string, lines: CartLine[], allergyNotice = '', tipPercent = 0, options: { fulfillment?: string; address_confirmed?: boolean; expected_total?: string } = {}) {
  return fetchWithAuth<TableOrder>('/table-orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table,
      ...options,
      tip_percent: tipPercent,
      request_key: requestKey,
      allergy_notice: allergyNotice.trim(),
      lines: serializeCartLines(lines),
    }),
  });
}

export function updateOrderLine(orderId: number, lineId: number, status: LineStatus) {
  return fetchWithAuth<TableOrder>(`/table-orders/${orderId}/line-status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ line_id: lineId, status }),
  });
}

export function serializeCartLines(lines: CartLine[]) {
  return lines.map((line) => ({
        card_id: line.cardId,
        quantity: line.quantity,
        removals: line.removals,
        selections: line.choices ? [] : line.selections.map((selection) => selection.id),
        choices: line.choices ?? {},

        allergy: line.allergy,
  }));
}

export function updateDeliveryProgress(id: number, status: 'dispatched' | 'delivered') {
  return fetchWithAuth<TableOrder>(`/table-orders/${id}/delivery-progress/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
