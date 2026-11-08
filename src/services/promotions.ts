import { fetchWithAuth } from '../utils/api';
import { serializeCartLines } from './tableOrders';
import type { CartLine } from '../context/CartContext';

export interface Pricing {
  paid?: boolean;
  subtotal: string;
  discount: string;
  total: string;
  tip: string;
  grand_total: string;
  promotion_applied: boolean;
}

export interface PromotionStatus {
  date: string;
  active: boolean;
  state: 'not_monday' | 'calendar_unconfirmed' | 'active' | 'suspended';
  calendar?: { date: string; eligible: boolean; reason: string }[];
}

export function getPromotion() {
  return fetchWithAuth<PromotionStatus>('/promotions/');
}

export function savePromotion(date: string, eligible: boolean, reason: string) {
  return fetchWithAuth<PromotionStatus>('/promotions/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, eligible, reason }),
  });
}

export function quoteOrder(lines: CartLine[], tipPercent: number, signal: AbortSignal) {
  return fetchWithAuth<Pricing>('/promotions/quote/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines: serializeCartLines(lines), tip_percent: tipPercent }), signal,
  });
}

export function reviewDelivery(id: number, accept: boolean) {
  return fetchWithAuth('/table-orders/' + id + '/confirm-delivery/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accept }),
  });
}
