// components/PeriodTabs.tsx — сегментированный переключатель периодов (§5, §8).
// На мобильных — горизонтальный скролл, прилипает к верху.

import type { PeriodKey } from '../types';
import { CalendarRange } from 'lucide-react';

const TABS: { key: PeriodKey; label: string }[] = [
  { key: '24h', label: '24 часа' },
  { key: 'today', label: 'Сегодня' },
  { key: 'yesterday', label: 'Вчера' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'all', label: 'Всё время' },
];

type Props = {
  value: PeriodKey;
  onChange: (p: PeriodKey) => void;
  onOpenCustom: () => void;
  customActive: boolean;
};

export function PeriodTabs({ value, onChange, onOpenCustom, customActive }: Props) {
  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + TABS.length) % TABS.length;
      onChange(TABS[next].key);
      const el = document.getElementById(`period-${TABS[next].key}`);
      el?.focus();
    }
  };

  return (
    <div
      className="sticky top-0 z-30 -mx-4 bg-background/90 px-4 py-2 backdrop-blur md:mx-0 md:rounded-2xl md:px-2"
      role="tablist"
      aria-label="Период"
    >
      <div className="scrollbar-thin flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab, idx) => {
          const active = value === tab.key;
          return (
            <button
              key={tab.key}
              id={`period-${tab.key}`}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onKeyDown={(e) => handleKey(e, idx)}
              onClick={() => onChange(tab.key)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenCustom}
          className={`ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            customActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          aria-label="Произвольный период"
        >
          <CalendarRange size={16} aria-hidden />
          Период…
        </button>
      </div>
    </div>
  );
}
