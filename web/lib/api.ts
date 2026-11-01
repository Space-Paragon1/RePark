// Typed client for the RePark API. Mirrors mobile/lib/api.ts: when the backend
// changes, update both.
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Error from the API. `code` comes from the X-Error-Code header, when sent. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string | null) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { data: { session } } = await supabase().auth.getSession();
  if (!session) throw new ApiError('Not signed in', 401, null);

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const message = typeof json.detail === 'string' ? json.detail : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, res.headers.get('X-Error-Code'));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

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

export type PlateClaim = {
  id: string;
  plate_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export const vehiclesApi = {
  list: () => request<Vehicle[]>('GET', '/vehicles'),
  create: (data: VehicleCreate) => request<Vehicle>('POST', '/vehicles', data),
  delete: (id: string) => request<void>('DELETE', `/vehicles/${id}`),
  createClaim: (data: Omit<VehicleCreate, 'parking_zone'> & { note?: string | null }) =>
    request<PlateClaim>('POST', '/vehicles/claims', data),
  listClaims: () => request<PlateClaim[]>('GET', '/vehicles/claims'),
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
  status: 'submitted' | 'notified' | 'responded' | 'closed' | 'rejected';
  owner_notified: boolean;
  created_at: string;
};

export const reportsApi = {
  create: (data: ReportCreate) => request<Report>('POST', '/reports', data),
  list: () => request<Report[]>('GET', '/reports'),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type OwnerResponseType = 'moving_now' | 'already_moved' | 'incorrect_report' | 'abuse_reported';

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

// ─── Account ──────────────────────────────────────────────────────────────────

export const accountApi = {
  export: () => request<Record<string, unknown>>('GET', '/account/export'),
  delete: () => request<void>('DELETE', '/account'),
};
