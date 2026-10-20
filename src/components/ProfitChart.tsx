// components/ProfitChart.tsx — график прибыли по интервалам (§9), собственный SVG.

import { useMemo, useState } from 'react';
import type { Deal, Currency } from '../types';
import type { Interval } from '../lib/dates';
import {
  buildChartBuckets,
  chooseGrouping,
  topDeals,
  type Bucket,
} from '../lib/chart';
import { computeDeal } from '../lib/profit';
import { formatCompact, formatMoney, formatSignedMoney } from '../lib/format';

type Props = {
  soldInPeriod: Deal[];
  interval: Interval;
  currency: Currency;
};

type View = 'bars' | 'top';

export function ProfitChart({ soldInPeriod, interval, currency }: Props) {
  const [view, setView] = useState<View>('bars');
  const grouping = useMemo(() => chooseGrouping(interval), [interval]);
  const buckets = useMemo(
    () => buildChartBuckets(soldInPeriod, interval, grouping),
    [soldInPeriod, interval, grouping],
  );
  const top5 = useMemo(() => topDeals(soldInPeriod, 5), [soldInPeriod]);
  const canShowTop = soldInPeriod.length >= 3;

  const isEmpty = soldInPeriod.length === 0;

  return (
    <section className="card-soft p-4" data-component="profit-chart">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {view === 'bars' ? 'Прибыль по интервалам' : 'Топ-5 сделок по прибыли'}
        </h2>
        {canShowTop && (
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setView('bars')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                view === 'bars'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              По дням
            </button>
            <button
              type="button"
              onClick={() => setView('top')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                view === 'top'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Топ-5
            </button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <EmptyChart />
      ) : view === 'bars' ? (
        <BarChart buckets={buckets} currency={currency} />
      ) : (
        <TopChart deals={top5} currency={currency} />
      )}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-44 items-center justify-center rounded-xl bg-muted/50 text-sm text-muted-foreground">
      Нет данных за этот период
    </div>
  );
}

function BarChart({
  buckets,
  currency,
}: {
  buckets: Bucket[];
  currency: Currency;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const H = 180;
  const maxPos = Math.max(0, ...buckets.map((b) => b.profit));
  const maxNeg = Math.min(0, ...buckets.map((b) => b.profit));
  const range = maxPos - maxNeg || 1;
  const zeroY = (maxPos / range) * H;

  // Подписи оси X разрежаем, если корзин много.
  const step = Math.ceil(buckets.length / 12);

  return (
    <div className="relative">
      <div className="flex items-stretch gap-2">
        {/* ось Y */}
        <div className="flex w-10 shrink-0 flex-col justify-between py-1 text-right text-[10px] text-muted-foreground tnum">
          <span>{formatCompact(maxPos)}</span>
          <span>0</span>
          <span>{maxNeg < 0 ? formatCompact(maxNeg) : ''}</span>
        </div>

        <div className="relative flex-1">
          {/* нулевая линия */}
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border"
            style={{ top: `${zeroY}px` }}
          />
          <div
            className="scrollbar-thin flex items-end gap-1 overflow-x-auto"
            style={{ height: `${H}px` }}
          >
            {buckets.map((b, i) => {
              const positive = b.profit >= 0;
              const hgt = (Math.abs(b.profit) / range) * H;
              return (
                <div
                  key={b.key}
                  className="group relative flex min-w-[14px] flex-1 flex-col"
                  style={{ height: `${H}px` }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${b.fullLabel}: ${formatSignedMoney(b.profit, currency)}, ${b.dealsCount} сделок`}
                >
                  {/* верхняя зона (положительные) */}
                  <div
                    className="flex flex-col justify-end"
                    style={{ height: `${zeroY}px` }}
                  >
                    {positive && (
                      <div
                        className="rounded-t bg-profit transition-opacity group-hover:opacity-80"
                        style={{ height: `${hgt}px` }}
                      />
                    )}
                  </div>
                  {/* нижняя зона (отрицательные) */}
                  <div
                    className="flex flex-col justify-start"
                    style={{ height: `${H - zeroY}px` }}
                  >
                    {!positive && b.profit !== 0 && (
                      <div
                        className="rounded-b bg-loss transition-opacity group-hover:opacity-80"
                        style={{ height: `${hgt}px` }}
                      />
                    )}
                  </div>

                  {hover === i && (
                    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 w-max -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-2 py-1 text-[11px] shadow-lg">
                      <div className="font-medium text-popover-foreground">
                        {b.fullLabel}
                      </div>
                      <div
                        className={`tnum font-semibold ${
                          b.profit >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {formatSignedMoney(b.profit, currency)}
                      </div>
                      <div className="text-muted-foreground">
                        {b.dealsCount} сделок
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ось X */}
          <div className="mt-1 flex gap-1">
            {buckets.map((b, i) => (
              <div
                key={b.key}
                className="min-w-[14px] flex-1 text-center text-[9px] text-muted-foreground"
              >
                {i % step === 0 ? b.label : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopChart({ deals, currency }: { deals: Deal[]; currency: Currency }) {
  const profits = deals.map((d) => computeDeal(d).profit);
  const max = Math.max(1, ...profits.map((p) => Math.abs(p)));
  return (
    <div className="flex flex-col gap-2 py-2">
      {deals.map((d) => {
        const p = computeDeal(d).profit;
        const w = (Math.abs(p) / max) * 100;
        return (
          <div key={d.id} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs text-foreground sm:w-40">
              {d.title}
            </span>
            <div className="relative h-5 flex-1 rounded bg-muted/50">
              <div
                className={`h-full rounded ${p >= 0 ? 'bg-profit' : 'bg-loss'}`}
                style={{ width: `${w}%` }}
              />
            </div>
            <span
              className={`tnum w-24 shrink-0 text-right text-xs font-medium ${
                p >= 0 ? 'text-profit' : 'text-loss'
              }`}
            >
              {formatMoney(p, currency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
