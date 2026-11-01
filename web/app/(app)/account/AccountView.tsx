'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, ErrorBanner, Field, PageHeader, inputClass } from '@/components/ui';

export function AccountView() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<'export' | 'delete' | 'signout' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const phone = session?.user.phone ? `+${session.user.phone.replace(/^\+/, '')}` : 'Unknown';

  const handleSignOut = async () => {
    setBusy('signout');
    await signOut();
    router.replace('/');
  };

  const downloadData = async () => {
    setBusy('export');
    setError(null);
    try {
      const data = await accountApi.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'repark-data.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t export your data.');
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('delete');
    setError(null);
    try {
      await accountApi.delete();
      await signOut();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t delete your account.');
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Account" />
      <ErrorBanner message={error} />

      <div className="space-y-5">
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text-secondary">Signed in as</p>
            <p className="font-semibold">{phone}</p>
          </div>
          <Button variant="secondary" onClick={handleSignOut} loading={busy === 'signout'}>
            Sign out
          </Button>
        </Card>

        <Card>
          <h2 className="font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Download everything RePark stores about you: vehicles, reports, alerts and claims.
          </p>
          <Button variant="secondary" className="mt-4" onClick={downloadData} loading={busy === 'export'}>
            Download my data
          </Button>
        </Card>

        <Card className="border-stop/30">
          <h2 className="font-semibold text-stop">Delete account</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Permanently deletes your account, vehicles, reports and alerts. This can’t be undone, and it
            also signs you out of the RePark app.
          </p>
          <form onSubmit={deleteAccount} className="mt-4 max-w-sm space-y-3">
            <Field label='Type "DELETE" to confirm'>
              <input
                className={inputClass}
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Button
              type="submit"
              variant="danger"
              disabled={confirmText !== 'DELETE'}
              loading={busy === 'delete'}
            >
              Delete my account
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
