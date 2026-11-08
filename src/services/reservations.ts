import { fetchWithAuth } from '../utils/api';
export interface DiningTable { id: number; label: string; zone: 'terrace' | 'salon'; capacity: number }
export type ReservationStatus = 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'rejected';
export interface Reservation {
  id: number; table: DiningTable; party_size: number; contact_name: string; phone: string;
  starts_at: string; ends_at: string | null; status: ReservationStatus; notes: string; response_note: string;
}
export const reservationLabels: Record<ReservationStatus, string> = {
  pending: 'Pending confirmation', confirmed: 'Confirmed', arrived: 'At the table', completed: 'Completed', cancelled: 'Cancelled', rejected: 'Rejected',
};
export function getDiningTables() { return fetchWithAuth<DiningTable[]>('/dining-tables/'); }
export function getReservations() { return fetchWithAuth<Reservation[]>('/reservations/'); }
export function requestReservation(data: { table_id: number; party_size: number; contact_name: string; phone: string; starts_at: string; notes: string; request_key: string }) {
  return fetchWithAuth<Reservation>('/reservations/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function changeReservation(id: number, status: ReservationStatus, duration?: number, note?: string) {
  return fetchWithAuth<Reservation>(`/reservations/${id}/status/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, duration_minutes: duration, response_note: note }) });
}
