'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { isPlateValid, plateForSubmit } from '@/lib/plate';
import { useAuth } from '@/components/AuthProvider';
import { PlateInput } from '@/components/Plate';
import { Button } from '@/components/ui';

/** Hero plate field: Continue goes to the report, via sign-in if needed, keeping the plate. */
export function HeroPlateForm() {
  const router = useRouter();
  const { session } = useAuth();
  const [plate, setPlate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlateValid(plate)) {
      setError('Enter 2 to 10 letters and numbers.');
      return;
    }
    const report = `/report?plate=${encodeURIComponent(plateForSubmit(plate))}`;
    router.push(session ? report : `/login?next=${encodeURIComponent(report)}`);
  };

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="hero-plate" className="mb-2 block text-[15px] font-bold">
        Enter the plate that’s blocking you
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <PlateInput
          id="hero-plate"
          label="Plate that's blocking you"
          value={plate}
          onChange={value => { setPlate(value); setError(null); }}
          error={error}
          className="min-w-0 flex-1"
        />
        <Button type="submit" className="h-20 px-7 text-base">
          Continue
          <ArrowRight className="size-[18px]" aria-hidden />
        </Button>
      </div>
      <p className="mt-3 font-mono text-xs text-text-muted">
        Next you sign in with your phone number. We keep the plate.
      </p>
    </form>
  );
}
