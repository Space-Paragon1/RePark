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
