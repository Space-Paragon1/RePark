'use client';

import { useEffect, useId, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './ui';

/**
 * Replaces window.confirm(). Centred dialog, 460 wide, radius 14. Focus stays inside;
 * Esc and a click on the backdrop choose the safe action. The safe button has focus first.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  icon: Icon,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  icon: LucideIcon;
  confirmLabel: string;
  /** Label while the action runs, e.g. "Removing". */
  confirmingLabel?: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  confirmDisabled?: boolean;
  /** Extra content between the body and the buttons, such as a "type DELETE" field. */
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={e => {
        e.preventDefault(); // Esc: let the parent decide, so state stays in step
        cancel();
      }}
      onClick={e => {
        if (e.target === e.currentTarget) cancel(); // click on the backdrop
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[460px] rounded-card bg-surface p-0 text-text shadow-e2 backdrop:bg-black/55"
    >
      {open && (
        <div className="p-6">
          <span className="grid size-12 place-items-center rounded-full bg-stop-tint text-stop">
            <Icon className="size-6" aria-hidden />
          </span>
          <h2 id={titleId} className="mt-4 text-[22px] font-extrabold leading-tight tracking-[-0.015em]">
            {title}
          </h2>
          <div id={bodyId} className="mt-2 text-[15px] leading-6 text-text-secondary">{body}</div>
          {children && <div className="mt-5">{children}</div>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={cancel} disabled={busy} autoFocus>
              {cancelLabel}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              loading={busy}
              loadingLabel={confirmingLabel}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
