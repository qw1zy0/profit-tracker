// components/CustomPeriodModal.tsx — выбор произвольного периода (§8 «Период…»).

import { useEffect, useState } from 'react';
import type { CustomRange } from '../types';
import { todayISODate } from '../lib/dates';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  value: CustomRange;
  onApply: (range: CustomRange) => void;
  onClose: () => void;
};

export function CustomPeriodModal({ open, value, onApply, onClose }: Props) {
  const [from, setFrom] = useState(value.from ?? todayISODate());
  const [to, setTo] = useState(value.to ?? todayISODate());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFrom(value.from ?? todayISODate());
      setTo(value.to ?? todayISODate());
      setError(null);
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const apply = () => {
    if (from && to && from > to) {
      setError('Дата «с» позже даты «по»');
      return;
    }
    onApply({ from, to });
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Произвольный период"
        className="animate-scale-in w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Произвольный период</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label="Закрыть"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cp-from" className="mb-1 block text-sm font-medium">
              С даты
            </label>
            <input
              id="cp-from"
              type="date"
              className="field"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cp-to" className="mb-1 block text-sm font-medium">
              По дату
            </label>
            <input
              id="cp-to"
              type="date"
              className="field"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-loss">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="btn btn-primary" onClick={apply}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
