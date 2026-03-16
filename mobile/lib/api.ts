import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.detail ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export type Vehicle = {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  color: string;
  parking_zone: string | null;
  created_at: string;
};

export type VehicleCreate = Omit<Vehicle, 'id' | 'created_at'>;

export const vehiclesApi = {
  list: () => request<Vehicle[]>('GET', '/vehicles'),
  create: (data: VehicleCreate) => request<Vehicle>('POST', '/vehicles', data),
  delete: (id: string) => request<void>('DELETE', `/vehicles/${id}`),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export type IssueType =
  | 'blocking_driveway'
  | 'construction_access'
  | 'garbage_pickup'
  | 'restricted_zone'
  | 'emergency_access';

export type ReportCreate = {
  plate_number: string;
  latitude: number;
  longitude: number;
  issue_type: IssueType;
  message?: string;
};

export type Report = {
  id: string;
  plate_number: string;
  issue_type: IssueType;
  status: string;
  owner_notified: boolean;
  created_at: string;
};

export const reportsApi = {
  create: (data: ReportCreate) => request<Report>('POST', '/reports', data),
  list: () => request<Report[]>('GET', '/reports'),
  get: (id: string) => request<Report>('GET', `/reports/${id}`),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type OwnerResponseType =
  | 'moving_now'
  | 'already_moved'
  | 'incorrect_report'
  | 'abuse_reported';

export type AlertDetail = {
  id: string;
  vehicle_id: string;
  report_id: string;
  delivery_status: string;
  owner_response: OwnerResponseType | null;
  responded_at: string | null;
  created_at: string;
  plate_number: string;
  make: string;
  model: string;
  color: string;
  issue_type: IssueType;
  reported_at: string;
};

export const alertsApi = {
  list: () => request<AlertDetail[]>('GET', '/alerts'),
  respond: (id: string, response: OwnerResponseType) =>
    request<AlertDetail>('POST', `/alerts/${id}/respond`, { response }),
};

// ─── Push Tokens ──────────────────────────────────────────────────────────────

export const pushTokensApi = {
  register: (token: string) => request<void>('POST', '/push-tokens', { token }),
};
