import type { CartLine } from '../context/CartContext';
import { fetchWithAuth } from '../utils/api';

export type LineStatus = 'review' | 'received' | 'preparing' | 'ready' | 'declined';

export interface OrderLine {
  id: number;
  title: string;
  quantity: number;
  unit_price: string;
  area: 'kitchen' | 'bar';
  removals: string[];
  selections?: string[];
  allergy: string;
  status: LineStatus;
}

export interface TableOrder {
  id: number;
  table: number;
  created_at: string;
  lines: OrderLine[];
}

export const orderStatusLabels: Record<LineStatus, string> = {
  review: 'Pending allergy review',
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  declined: 'Declined',
};

export function getTableOrders() {
  return fetchWithAuth<TableOrder[]>('/table-orders/');
}

export function sendTableOrder(table: number, requestKey: string, lines: CartLine[]) {
  return fetchWithAuth<TableOrder>('/table-orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table,
      request_key: requestKey,
      lines: lines.map((line) => ({
        card_id: line.cardId,
        quantity: line.quantity,
        removals: line.removals,
        selections: line.selections.map((selection) => selection.id),
        allergy: line.allergy,
      })),
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
