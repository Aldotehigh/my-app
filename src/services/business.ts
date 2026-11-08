import { fetchWithAuth } from '../utils/api';

export interface InventoryItem {
  id: number;
  name: string;
  area: 'kitchen' | 'bar' | 'sushi';
  unit: string;
  quantity: string;
  minimum: string;
  low_stock: boolean;
}

export interface InventoryMovement {
  id: number;
  kind: string;
  delta: string;
  balance: string;
  reason: string;
  author: string;
  created_at: string;
  supply_request_id: number | null;
}

export interface Bill {
  id: number;
  table: string | number | null;
  total: string;
  tip_suggestion?: string;
  fulfillment?: 'dine_in' | 'pickup' | 'delivery';
  subtotal?: string;
  discount?: string;
  can_pay: boolean;
  lines: { title: string; quantity: number; price: string; status: string }[];
}

export interface BusinessSummary {
  timezone: string;
  start: string;
  end: string;
  total: string;
  cash: string;
  card: string;
  paid_orders: number;
  average_ticket: string;
  tip_total: string;
  discount_total?: string;
  collected_total: string;
  daily: { date: string; total: string; orders: number }[];
  pending_supplies: number;
  products: { product_id: number | null; title: string; units: number; revenue: string }[];
  tables: { order__table: string | number; total: string; bills: number }[];
  low_stock: InventoryItem[];
}

export function getBusiness(start: string, end: string) {
  return fetchWithAuth<BusinessSummary>('/business/summary/?' + new URLSearchParams({ start, end }));
}

export function getBills() {
  return fetchWithAuth<Bill[]>('/business/bills/');
}

export function collectPayment(orderId: number, total: string, cash: string, card: string, received: string, tip = '0') {
  return fetchWithAuth<{ total: string; change: string; id: number }>('/business/collect/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, expected_total: total, cash_amount: cash, card_amount: card, cash_received: received, tip_amount: tip }),
  });
}

export function getInventory() {
  return fetchWithAuth<InventoryItem[]>('/inventory/');
}

export function createInventory(data: { name: string; unit: string; area: string; quantity: string; minimum: string }) {
  return fetchWithAuth<InventoryItem>('/inventory/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
}

export function moveInventory(id: number, kind: string, amount: string, reason: string, requestKey: string) {
  return fetchWithAuth<InventoryItem>(`/inventory/${id}/movement/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, amount, reason, request_key: requestKey }),
  });
}

export function getInventoryHistory(id: number) {
  return fetchWithAuth<InventoryMovement[]>(`/inventory/${id}/history/`);
}

export function setInventoryMinimum(id: number, minimum: string) {
  return fetchWithAuth<InventoryItem>(`/inventory/${id}/threshold/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minimum }),
  });
}
