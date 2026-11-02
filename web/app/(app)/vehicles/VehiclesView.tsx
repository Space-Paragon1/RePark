'use client';

import { useState } from 'react';
import { ApiError, vehiclesApi, type Vehicle, type VehicleCreate } from '@/lib/api';
import { claimStatus, formatDate } from '@/lib/labels';
import { plateForSubmit } from '@/lib/plate';
import { Car, MapPin, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SkeletonRows } from '@/components/Skeleton';
import { Plate, PlateInput } from '@/components/Plate';
import { useLoad } from '@/lib/useLoad';
import {
  Banner, Button, Card, Chip, EmptyState, ErrorBanner, Field, ListError, PageHeader, inputClass, textareaClass,
} from '@/components/ui';

const MAX_VEHICLES = 10;

const EMPTY_FORM: VehicleCreate = { plate_number: '', make: '', model: '', color: '', parking_zone: null };

export function VehiclesView() {
  const vehicles = useLoad(vehiclesApi.list);
  const claims = useLoad(vehiclesApi.listClaims);
  const atLimit = (vehicles.data?.length ?? 0) >= MAX_VEHICLES;
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (vehicle: Vehicle) => {
    setDeleting(true);
    setError(null);
    try {
      await vehiclesApi.delete(vehicle.id);
      vehicles.setData(prev => prev?.filter(v => v.id !== vehicle.id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t remove the vehicle.');
    } finally {
      setDeleting(false);
      setRemoving(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Vehicles"
        subtitle={
          vehicles.data
            ? `${vehicles.data.length} of ${MAX_VEHICLES} · You’ll be alerted when someone reports one of these plates.`
            : 'You’ll be alerted when someone reports one of these plates.'
        }
        action={!adding && !!vehicles.data?.length && (
          <Button icon={Plus} onClick={() => setAdding(true)} disabled={atLimit}>Add a vehicle</Button>
        )}
      />
      <ErrorBanner message={error} />
      {vehicles.error && !vehicles.data && <ListError list="vehicles" onRetry={vehicles.reload} />}
      {atLimit && (
        <Banner tone="notice" className="mb-6">
          You’ve added 10 vehicles, the most one account can have. Remove one to add another.
        </Banner>
      )}

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

      {vehicles.loading && <SkeletonRows card={false} />}
      {vehicles.data?.length === 0 && !adding && (
        <EmptyState
          icon={Car}
          title="No vehicles"
          body="Add your plate so people can reach you without knowing who you are."
          action={<Button variant="secondary" icon={Plus} onClick={() => setAdding(true)}>Add a vehicle</Button>}
        />
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {vehicles.data?.map(vehicle => (
          <li key={vehicle.id}>
            <Card className="flex h-full items-start justify-between gap-4">
              <div>
                <Plate plate={vehicle.plate_number} size="M" className="w-fit" />
                <p className="mt-4 text-[17px] font-semibold">
                  {vehicle.color} {vehicle.make} {vehicle.model}
                </p>
                {vehicle.parking_zone && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                    <MapPin className="size-4 shrink-0" aria-hidden />
                    Usually {vehicle.parking_zone}
                  </p>
                )}
                <p className="mt-2 font-mono text-xs font-medium text-text-muted">Added {formatDate(vehicle.created_at)}</p>
              </div>
              <Button
                variant="quietStop"
                className="-mr-2 -mt-2 px-3"
                onClick={() => setRemoving(vehicle)}
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
          <p className="mb-3 text-sm text-text-secondary">
            Plates you’ve claimed from another account. We review each claim by hand.
          </p>
          <ul className="space-y-3">
            {claims.data?.map(claim => (
              <li key={claim.id}>
                <Card className="flex items-center justify-between gap-4 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Plate plate={claim.plate_number} />
                    <p className="font-mono text-xs font-medium text-text-muted">Filed {formatDate(claim.created_at)}</p>
                  </div>
                  <Chip status={claimStatus(claim)} />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={!!removing}
        icon={Trash2}
        title={`Remove ${removing?.plate_number ?? ''}?`}
        body="You’ll stop getting alerts for this car. People who report it will be told the owner isn’t on RePark."
        confirmLabel="Remove vehicle"
        confirmingLabel="Removing"
        cancelLabel="Keep it"
        busy={deleting}
        onConfirm={() => removing && remove(removing)}
        onCancel={() => setRemoving(null)}
      />
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
      onAdded(await vehiclesApi.create({
        ...form,
        plate_number: plateForSubmit(form.plate_number),
        parking_zone: form.parking_zone || null,
      }));
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
        plate_number: plateForSubmit(form.plate_number),
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
          <div className="sm:col-span-2">
            <label htmlFor="vehicle-plate" className="mb-1.5 block text-sm font-semibold">Plate</label>
            <PlateInput
              id="vehicle-plate"
              value={form.plate_number}
              onChange={plate => {
                setForm(f => ({ ...f, plate_number: plate }));
                setPlateTaken(false);
              }}
              autoFocus
            />
          </div>
          <Field label="Colour">
            <input className={inputClass} value={form.color} onChange={update('color')} placeholder="Silver" required />
          </Field>
          <Field label="Make">
            <input className={inputClass} value={form.make} onChange={update('make')} placeholder="Toyota" required />
          </Field>
          <Field label="Model">
            <input className={inputClass} value={form.model} onChange={update('model')} placeholder="Camry" required />
          </Field>
          <Field label="Usually parked" optional hint="Only for you, to tell your cars apart.">
            <input
              className={inputClass}
              value={form.parking_zone ?? ''}
              onChange={update('parking_zone')}
              placeholder="e.g. Zone A, Elm Street"
            />
          </Field>
        </div>

        {plateTaken ? (
          <div className="space-y-3 rounded-control bg-signal-tint p-4">
            <p className="font-semibold text-text">This plate is already registered to another account.</p>
            <p className="text-sm text-text-secondary">
              If it’s your car, you can file an ownership claim. We review it and let you know. The other
              account isn’t told who you are.
            </p>
            <Field label="Anything that helps us review it (optional)">
              <textarea
                className={textareaClass}
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="e.g. I bought this car in March"
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={fileClaim} loading={saving} loadingLabel="Filing">
                File a claim for {plateForSubmit(form.plate_number)}
              </Button>
              <Button type="button" variant="quiet" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={saving} loadingLabel="Adding">Add</Button>
            <Button type="button" variant="quiet" onClick={onCancel}>Cancel</Button>
          </div>
        )}
      </form>
    </Card>
  );
}
