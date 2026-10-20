// components/ConfirmDialog.tsx — кастомное подтверждение (§13, §17: без confirm()).

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Если задано — требуется ввести это слово для подтверждения (§13 «Очистить всё»). */
  requireWord?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  requireWord,
  onConfirm,
  onCancel,
}: Props) {
  const [word, setWord] = useState('');
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setWord('');
      window.setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const canConfirm = !requireWord || word.trim().toUpperCase() === requireWord.toUpperCase();

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="animate-scale-in w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label="Закрыть"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        {requireWord && (
          <input
            className="field mt-3"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={`Введите «${requireWord}»`}
            aria-label={`Введите ${requireWord} для подтверждения`}
            autoFocus
          />
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={ref}
            type="button"
            disabled={!canConfirm}
            className={`btn ${danger ? 'bg-[hsl(var(--loss))] text-white hover:opacity-90' : 'btn-primary'} disabled:opacity-40`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
