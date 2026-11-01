'use client';

import { useState } from 'react';
import { ApiError, vehiclesApi, type Vehicle, type VehicleCreate } from '@/lib/api';
import { formatDateTime } from '@/lib/labels';
import { useLoad } from '@/lib/useLoad';
import {
  Badge, Button, Card, EmptyState, ErrorBanner, Field, PageHeader, Spinner, inputClass,
} from '@/components/ui';

const EMPTY_FORM: VehicleCreate = { plate_number: '', make: '', model: '', color: '', parking_zone: null };

const CLAIM_TONE = { pending: 'amber', approved: 'green', rejected: 'neutral' } as const;

export function VehiclesView() {
  const vehicles = useLoad(vehiclesApi.list);
  const claims = useLoad(vehiclesApi.listClaims);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (vehicle: Vehicle) => {
    if (!window.confirm(`Remove ${vehicle.plate_number}? You’ll stop getting alerts for it.`)) return;
    setDeletingId(vehicle.id);
    setError(null);
    try {
      await vehiclesApi.delete(vehicle.id);
      vehicles.setData(prev => prev?.filter(v => v.id !== vehicle.id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t remove the vehicle.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="My vehicles"
        subtitle="You’ll be alerted when someone reports one of these plates."
        action={!adding && <Button onClick={() => setAdding(true)}>Add vehicle</Button>}
      />
      <ErrorBanner message={error ?? vehicles.error} />

      {adding && (
        <AddVehicleForm
          onCancel={() => setAdding(false)}
          onAdded={vehicle => {
            vehicles.setData(prev => [...(prev ?? []), vehicle]);
            setAdding(false);
          }}
          onClaimed={() => {
            claims.reload();
            setAdding(false);
          }}
        />
      )}

      {vehicles.loading && <Spinner className="size-6 text-brand" />}
      {vehicles.data?.length === 0 && !adding && (
        <EmptyState
          title="No vehicles yet"
          body="Add your plate so people can let you know when your car is in the way. Alerts come by text if you don’t use the app."
          action={<Button onClick={() => setAdding(true)}>Add your first vehicle</Button>}
        />
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {vehicles.data?.map(vehicle => (
          <li key={vehicle.id}>
            <Card className="flex h-full items-start justify-between gap-4">
              <div>
                <p className="inline-block rounded-md border-2 border-ink px-2 py-0.5 font-mono text-lg font-bold tracking-wider">
                  {vehicle.plate_number}
                </p>
                <p className="mt-3 font-medium">
                  {vehicle.color} {vehicle.make} {vehicle.model}
                </p>
                {vehicle.parking_zone && (
                  <p className="text-sm text-ink-secondary">Usually parked: {vehicle.parking_zone}</p>
                )}
                <p className="mt-1 text-xs text-ink-muted">Added {formatDateTime(vehicle.created_at)}</p>
              </div>
              <Button
                variant="danger"
                onClick={() => remove(vehicle)}
                loading={deletingId === vehicle.id}
                aria-label={`Remove ${vehicle.plate_number}`}
              >
                Remove
              </Button>
            </Card>
          </li>
        ))}
      </ul>

      {!!claims.data?.length && (
        <section className="mt-10">
          <h2 className="mb-1 text-lg font-semibold">Ownership claims</h2>
          <p className="mb-3 text-sm text-ink-secondary">
            Plates you’ve claimed from another account. We review each claim by hand.
          </p>
          <ul className="space-y-3">
            {claims.data?.map(claim => (
              <li key={claim.id}>
                <Card className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold">{claim.plate_number}</p>
                    <p className="text-sm text-ink-secondary">Filed {formatDateTime(claim.created_at)}</p>
                  </div>
                  <Badge tone={CLAIM_TONE[claim.status]}>
                    {claim.status === 'pending' ? 'Under review' : claim.status === 'approved' ? 'Approved' : 'Not approved'}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function AddVehicleForm({ onCancel, onAdded, onClaimed }: {
  onCancel: () => void;
  onAdded: (vehicle: Vehicle) => void;
  onClaimed: () => void;
}) {
  const [form, setForm] = useState<VehicleCreate>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when the plate belongs to another account; offers a claim instead.
  const [plateTaken, setPlateTaken] = useState(false);
  const [note, setNote] = useState('');

  const update = (field: keyof VehicleCreate) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (field === 'plate_number') setPlateTaken(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onAdded(await vehiclesApi.create({ ...form, parking_zone: form.parking_zone || null }));
    } catch (e) {
      if (e instanceof ApiError && e.code === 'plate_taken') {
        setPlateTaken(true);
      } else {
        setError(e instanceof Error ? e.message : 'Couldn’t add the vehicle.');
      }
    } finally {
      setSaving(false);
    }
  };

  const fileClaim = async () => {
    setSaving(true);
    setError(null);
    try {
      await vehiclesApi.createClaim({
        plate_number: form.plate_number,
        make: form.make,
        model: form.model,
        color: form.color,
        note: note.trim() || null,
      });
      onClaimed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t file the claim.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 p-6">
      <h2 className="mb-4 text-lg font-semibold">Add a vehicle</h2>
      <form onSubmit={save} className="space-y-4">
        <ErrorBanner message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plate number">
            <input
              className={`${inputClass} font-semibold uppercase tracking-wider`}
              value={form.plate_number}
              onChange={update('plate_number')}
              placeholder="ABC 123"
              maxLength={12}
              required
              autoFocus
            />
          </Field>
          <Field label="Colour">
            <input className={inputClass} value={form.color} onChange={update('color')} placeholder="Silver" required />
          </Field>
          <Field label="Make">
            <input className={inputClass} value={form.make} onChange={update('make')} placeholder="Toyota" required />
          </Field>
          <Field label="Model">
            <input className={inputClass} value={form.model} onChange={update('model')} placeholder="Camry" required />
          </Field>
          <Field label="Where you usually park (optional)">
            <input
              className={inputClass}
              value={form.parking_zone ?? ''}
              onChange={update('parking_zone')}
              placeholder="e.g. Zone A, Elm Street"
            />
          </Field>
        </div>

        {plateTaken ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-warning-light p-4">
            <p className="font-semibold text-warning">This plate is registered to another account</p>
            <p className="text-sm text-ink-secondary">
              If it’s your vehicle, file an ownership claim. We’ll review it, and if it’s approved the
              plate moves to your account. The other account holder won’t see your details.
            </p>
            <Field label="Anything that helps us review it (optional)">
              <textarea
                className={`${inputClass} min-h-20`}
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="e.g. I bought this car in March"
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={fileClaim} loading={saving}>File ownership claim</Button>
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={saving}>Add vehicle</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        )}
      </form>
    </Card>
  );
}
