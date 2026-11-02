'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Download, LogOut, Phone, Trash2, type LucideIcon } from 'lucide-react';
import { accountApi, vehiclesApi } from '@/lib/api';
import { useLoad } from '@/lib/useLoad';
import { useAuth } from '@/components/AuthProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorBanner, PageHeader, Spinner, inputClass } from '@/components/ui';

export function AccountView() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const vehicles = useLoad(vehiclesApi.list);
  const [busy, setBusy] = useState<'export' | 'delete' | 'signout' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const phone = session?.user.phone ? `+${session.user.phone.replace(/^\+/, '')}` : 'Unknown';
  const vehicleCount = vehicles.data?.length;

  // Sign out is immediate: no confirmation (handoff components.md).
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
      setError(e instanceof Error ? e.message : 'Couldn’t download your data.');
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    setBusy('delete');
    setError(null);
    try {
      await accountApi.delete();
      await signOut();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t delete your account.');
      setBusy(null);
      setDeleteOpen(false);
    }
  };

  const vehiclesPhrase =
    vehicleCount === undefined ? 'your vehicles'
      : vehicleCount === 1 ? 'your 1 vehicle'
      : `your ${vehicleCount} vehicles`;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Account" />
      <ErrorBanner message={error} />

      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        <Row icon={Phone} title="Phone number" detail="Used to sign in and for texts">
          <span className="font-mono text-[15px] font-semibold">{phone}</span>
        </Row>
        <ActionRow
          icon={Download}
          title="Download my data"
          detail="A copy of your vehicles, reports and alerts."
          onClick={downloadData}
          busy={busy === 'export'}
        />
        <ActionRow icon={LogOut} title="Sign out" onClick={handleSignOut} busy={busy === 'signout'} />
        <ActionRow
          icon={Trash2}
          title="Delete account"
          tone="stop"
          onClick={() => {
            setConfirmText('');
            setDeleteOpen(true);
          }}
        />
      </ul>

      <p className="mt-4 text-sm text-text-muted">
        RePark doesn’t use a name, photo or password. Your phone number is the account.
      </p>

      <ConfirmDialog
        open={deleteOpen}
        icon={Trash2}
        title="Delete your account?"
        body={`This removes your phone number, ${vehiclesPhrase} and your report history. People who report your cars will be told the owner isn’t on RePark. This can’t be undone.`}
        confirmLabel="Delete account"
        confirmingLabel="Deleting"
        cancelLabel="Keep my account"
        busy={busy === 'delete'}
        // Case-sensitive, as the design asks.
        confirmDisabled={confirmText !== 'DELETE'}
        onConfirm={deleteAccount}
        onCancel={() => setDeleteOpen(false)}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Type DELETE to confirm</span>
          <input
            className={`${inputClass} font-mono`}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}

function Row({ icon: Icon, title, detail, children }: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <Icon className="size-5 shrink-0 text-text-secondary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {detail && <p className="text-sm text-text-secondary">{detail}</p>}
      </div>
      {children}
    </li>
  );
}

function ActionRow({ icon: Icon, title, detail, onClick, busy = false, tone }: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  onClick: () => void;
  busy?: boolean;
  tone?: 'stop';
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-sunken disabled:cursor-wait ${
          tone === 'stop' ? 'text-stop' : ''
        }`}
      >
        <Icon className={`size-5 shrink-0 ${tone === 'stop' ? '' : 'text-text-secondary'}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          {detail && <span className="block text-sm text-text-secondary">{detail}</span>}
        </span>
        {busy ? <Spinner /> : <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />}
      </button>
    </li>
  );
}
