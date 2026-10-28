'use client';

import { useEffect, useRef } from 'react';

type Props = {
  title: string;
  message?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// In-page confirmation. The browser's own confirm() pop-up is blocked (and silently
// answers "no") in many phone in-app browsers, e.g. links opened from WhatsApp or Gmail.
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancel', danger, busy, onConfirm, onCancel }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 id="confirm-title" className="text-lg font-medium text-gray-900">
          {title}
        </h3>
        {message && <div className="mt-2 text-sm text-gray-600">{message}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-md px-4 py-2 text-sm text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
