// components/KpiCards.tsx — KPI-блок (§8, §16 aria-live).

import type { Aggregates, Currency } from '../types';
import {
  formatMoney,
  formatCompactMoney,
  formatPercent,
  formatSignedPercent,
} from '../lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Props = {
  agg: Aggregates;
  prevProfit: number | null; // прибыль за предыдущий период (для дельты)
  deltaProfitPct: number | null;
  currency: Currency;
};

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const positive = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positive ? 'text-profit' : 'text-loss'
      }`}
    >
      {positive ? (
        <TrendingUp size={13} aria-hidden />
      ) : (
        <TrendingDown size={13} aria-hidden />
      )}
      {formatSignedPercent(pct)}
    </span>
  );
}

function Card({
  label,
  children,
  className = '',
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={`card-soft p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {hint && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function KpiCards({ agg, deltaProfitPct, currency }: Props) {
  const expenses = agg.totalPurchase + agg.totalCommission + agg.totalExtra;
  const profitPositive = agg.totalProfit >= 0;

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      aria-live="polite"
    >
      {/* Главная карточка — на всю ширину на мобильном, 3 колонки на десктопе */}
      <Card
        label="Чистая прибыль"
        className="sm:col-span-3 lg:col-span-2"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`tnum text-3xl font-bold leading-none sm:text-4xl ${
              profitPositive ? 'text-profit' : 'text-loss'
            }`}
          >
            {agg.totalProfit < 0 ? '−' : ''}
            {formatMoney(Math.abs(agg.totalProfit), currency)}
          </span>
          <Delta pct={deltaProfitPct} />
        </div>
      </Card>

      <Card label="Выручка">
        <span className="tnum text-xl font-semibold text-foreground">
          {formatMoney(agg.totalRevenue, currency)}
        </span>
      </Card>

      <Card label="Расходы">
        <span className="tnum text-xl font-semibold text-foreground">
          {formatMoney(expenses, currency)}
        </span>
      </Card>

      <Card label="Сделок / штук">
        <span className="tnum text-xl font-semibold text-foreground">
          {agg.dealsCount} / {agg.unitsSold}
        </span>
      </Card>

      <Card label="Средняя маржа">
        <span
          className={`tnum text-xl font-semibold ${
            agg.avgMarginPct < 0 ? 'text-loss' : 'text-foreground'
          }`}
        >
          {agg.dealsCount ? formatPercent(agg.avgMarginPct) : '—'}
        </span>
      </Card>

      <Card
        label="В обороте"
        hint="вне периода"
        className="sm:col-span-3 lg:col-span-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="tnum text-xl font-semibold text-foreground">
            {formatCompactMoney(agg.inStockValue, currency)}
          </span>
          <span className="text-xs text-muted-foreground">
            {agg.inStockCount}{' '}
            {pluralDeals(agg.inStockCount)} в наличии
          </span>
        </div>
      </Card>
    </div>
  );
}

function pluralDeals(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'сделка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'сделки';
  return 'сделок';
}
