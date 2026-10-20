// components/DealTable.tsx — список сделок: таблица (десктоп) + карточки (моб.) §10.

import { useMemo, useRef, useState } from 'react';
import type { Deal, Currency } from '../types';
import { computeDeal, isInStock } from '../lib/profit';
import { formatMoney, formatNumber, formatPercent } from '../lib/format';
import { formatShortDate } from '../lib/dates';
import {
  MoreHorizontal,
  Copy,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export type SortKey = 'date' | 'profit' | 'margin';
export type SortDir = 'asc' | 'desc';

type Props = {
  deals: Deal[]; // проданные сделки периода (для основной таблицы)
  inStock: Deal[]; // сделки «в наличии» (отдельная секция)
  currency: Currency;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onEdit: (deal: Deal) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  visibleCount: number;
  onShowMore: () => void;
};

function RowMenu({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Действия со сделкой"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={18} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border bg-popover py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Редактировать
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
          >
            <Copy size={15} aria-hidden /> Дублировать
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-loss hover:bg-[hsl(var(--loss)/0.1)]"
          >
            <Trash2 size={15} aria-hidden /> Удалить
          </button>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}
    >
      {label}
      {active ? (
        dir === 'asc' ? (
          <ArrowUp size={12} aria-hidden />
        ) : (
          <ArrowDown size={12} aria-hidden />
        )
      ) : (
        <ArrowUpDown size={12} className="opacity-40" aria-hidden />
      )}
    </button>
  );
}

export function DealTable({
  deals,
  inStock,
  currency,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onDuplicate,
  onDelete,
  visibleCount,
  onShowMore,
}: Props) {
  const shown = useMemo(() => deals.slice(0, visibleCount), [deals, visibleCount]);

  return (
    <section data-component="deal-table" className="flex flex-col gap-4">
      {/* ===== Десктоп-таблица ===== */}
      <div className="card-soft hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 text-left">
                <SortHeader
                  label="Дата"
                  active={sortKey === 'date'}
                  dir={sortDir}
                  onClick={() => onSort('date')}
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Товар
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Кол-во
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Закупка
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Продажа
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Расходы
              </th>
              <th className="px-3 py-2 text-right">
                <SortHeader
                  label="Прибыль"
                  active={sortKey === 'profit'}
                  dir={sortDir}
                  onClick={() => onSort('profit')}
                  align="right"
                />
              </th>
              <th className="px-3 py-2 text-right">
                <SortHeader
                  label="Маржа"
                  active={sortKey === 'margin'}
                  dir={sortDir}
                  onClick={() => onSort('margin')}
                  align="right"
                />
              </th>
              <th className="px-2 py-2" aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => {
              const m = computeDeal(d);
              const loss = m.profit < 0;
              const giveaway = d.sellPrice === 0;
              return (
                <tr
                  key={d.id}
                  onClick={() => onEdit(d)}
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 tnum text-muted-foreground">
                    {formatShortDate(d.saleDate, true)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground">{d.title}</div>
                    <div className="flex items-center gap-1.5">
                      {d.category && (
                        <span className="text-xs text-muted-foreground">
                          {d.category}
                        </span>
                      )}
                      {giveaway && (
                        <span className="rounded bg-[hsl(var(--loss)/0.12)] px-1.5 py-0.5 text-[10px] font-medium text-loss">
                          В минус
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tnum">{d.qty}</td>
                  <td className="px-3 py-2.5 text-right tnum">
                    <div>{formatMoney(d.buyPrice, currency)}</div>
                    {d.qty > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(m.purchase, currency)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tnum">
                    <div>{formatMoney(d.sellPrice, currency)}</div>
                    {d.qty > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(m.revenue, currency)}
                      </div>
                    )}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right tnum"
                    title={`Закупка ${formatMoney(m.purchase, currency)} + комиссия ${formatMoney(
                      m.commission,
                      currency,
                    )} + доп. ${formatMoney(d.extraCosts, currency)}`}
                  >
                    {formatMoney(m.invested, currency)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right tnum font-bold ${
                      loss ? 'text-loss' : 'text-profit'
                    }`}
                  >
                    {m.profit < 0 ? '−' : ''}
                    {formatMoney(Math.abs(m.profit), currency)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right tnum ${
                      m.marginPct < 0 ? 'text-loss' : 'text-foreground'
                    }`}
                  >
                    {d.sellPrice === 0 && m.revenue === 0
                      ? '—'
                      : formatPercent(m.marginPct)}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <RowMenu
                      onEdit={() => onEdit(d)}
                      onDuplicate={() => onDuplicate(d.id)}
                      onDelete={() => onDelete(d.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== Мобильные карточки ===== */}
      <div className="flex flex-col gap-2 md:hidden">
        {shown.map((d) => (
          <MobileCard
            key={d.id}
            deal={d}
            currency={currency}
            onEdit={() => onEdit(d)}
            onDuplicate={() => onDuplicate(d.id)}
            onDelete={() => onDelete(d.id)}
          />
        ))}
      </div>

      {deals.length > visibleCount && (
        <button
          type="button"
          onClick={onShowMore}
          className="btn btn-outline self-center"
        >
          Показать ещё 50
        </button>
      )}

      {/* ===== Секция «В наличии» ===== */}
      {inStock.length > 0 && (
        <div className="mt-2">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            В наличии
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal">
              {inStock.length}
            </span>
          </h3>
          <div className="flex flex-col gap-2">
            {inStock.map((d) => (
              <InStockRow
                key={d.id}
                deal={d}
                currency={currency}
                onEdit={() => onEdit(d)}
                onDuplicate={() => onDuplicate(d.id)}
                onDelete={() => onDelete(d.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MobileCard({
  deal,
  currency,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  deal: Deal;
  currency: Currency;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const m = computeDeal(deal);
  const loss = m.profit < 0;
  return (
    <div className="card-soft p-3" onClick={onEdit} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onEdit(); }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">{deal.title}</div>
          <div className="text-xs text-muted-foreground tnum">
            {formatShortDate(deal.saleDate, true)}
            {deal.category ? ` · ${deal.category}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`tnum text-lg font-bold ${loss ? 'text-loss' : 'text-profit'}`}
          >
            {m.profit < 0 ? '−' : ''}
            {formatMoney(Math.abs(m.profit), currency)}
          </span>
          <RowMenu onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">
        купил {formatMoney(m.purchase, currency)} → продал{' '}
        {formatMoney(m.revenue, currency)}
        {deal.extraCosts > 0 || m.commission > 0
          ? `, расходы ${formatMoney(deal.extraCosts + m.commission, currency)}`
          : ''}
        {' · '}
        <span className={m.marginPct < 0 ? 'text-loss' : ''}>
          {m.revenue === 0 ? '—' : formatPercent(m.marginPct)}
        </span>
      </div>
    </div>
  );
}

function InStockRow({
  deal,
  currency,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  deal: Deal;
  currency: Currency;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const m = computeDeal(deal);
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3"
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onEdit(); }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground">{deal.title}</span>
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            В наличии
          </span>
        </div>
        <div className="text-xs text-muted-foreground tnum">
          вложено {formatMoney(m.invested, currency)}
          {deal.qty > 1 ? ` · ${deal.qty} шт` : ''}
        </div>
      </div>
      <RowMenu onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
    </div>
  );
}

export { isInStock };
