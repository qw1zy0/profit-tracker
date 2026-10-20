// components/Toast.tsx — контейнер тостов (aria-live, undo, §13/§16).

import type { Toast } from '../hooks/useToasts';
import { RotateCcw, X } from 'lucide-react';

type Props = {
  toasts: Toast[];
  onUndo: (id: string) => void;
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onUndo, onDismiss }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-lg"
          role="status"
        >
          <span className="flex-1 text-foreground">{t.message}</span>
          {t.onUndo && (
            <button
              type="button"
              onClick={() => onUndo(t.id)}
              className="btn-ghost inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary"
              style={{ minHeight: 'auto' }}
            >
              <RotateCcw size={14} aria-hidden />
              {t.undoLabel ?? 'Отменить'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
            aria-label="Закрыть уведомление"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
