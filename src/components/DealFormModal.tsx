// components/DealFormModal.tsx — форма добавления/редактирования (§11, §12).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Deal, Currency } from '../types';
import { computeDeal } from '../lib/profit';
import {
  currencySymbol,
  formatSignedMoney,
  formatPercent,
  parseNumberInput,
} from '../lib/format';
import { todayISODate } from '../lib/dates';
import {
  validateDealForm,
  hasErrors,
  buildDeal,
  type DealFormInput,
  type FieldErrors,
  type FieldWarnings,
} from '../lib/validation';
import { Minus, Plus, Trash2, X } from 'lucide-react';

type Props = {
  open: boolean;
  deal: Deal | null; // null = создание
  currency: Currency;
  categories: string[];
  titles: string[];
  onClose: () => void;
  onSave: (deal: Deal, addAnother: boolean) => void;
  onDelete?: (id: string) => void;
  onPossibleDuplicate: (title: string, saleDate: string | null) => boolean;
};

function emptyInput(): DealFormInput {
  const today = todayISODate();
  return {
    title: '',
    buyPrice: '',
    sellPrice: '',
    qty: '1',
    extraCosts: '',
    commissionPercent: '',
    purchaseDate: today,
    saleDate: today,
    notSold: false,
    category: '',
    note: '',
  };
}

function inputFromDeal(deal: Deal): DealFormInput {
  return {
    title: deal.title,
    buyPrice: String(deal.buyPrice),
    sellPrice: String(deal.sellPrice),
    qty: String(deal.qty),
    extraCosts: deal.extraCosts ? String(deal.extraCosts) : '',
    commissionPercent: deal.commissionPercent ? String(deal.commissionPercent) : '',
    purchaseDate: deal.purchaseDate,
    saleDate: deal.saleDate ?? todayISODate(),
    notSold: deal.saleDate === null,
    category: deal.category ?? '',
    note: deal.note ?? '',
  };
}

export function DealFormModal({
  open,
  deal,
  currency,
  categories,
  titles,
  onClose,
  onSave,
  onDelete,
  onPossibleDuplicate,
}: Props) {
  const [input, setInput] = useState<DealFormInput>(emptyInput());
  const [touched, setTouched] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Инициализация при открытии.
  useEffect(() => {
    if (open) {
      setInput(deal ? inputFromDeal(deal) : emptyInput());
      setTouched(false);
      // autofocus на название
      window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [open, deal]);

  const { errors, warnings } = useMemo(
    () => validateDealForm(input),
    [input],
  );

  // Живой предпросмотр (§11).
  const preview = useMemo(() => {
    const previewDeal: Deal = {
      id: 'preview',
      title: input.title,
      qty: Math.max(1, Math.round(parseNumberInput(input.qty) || 1)),
      buyPrice: parseNumberInput(input.buyPrice) || 0,
      sellPrice: parseNumberInput(input.sellPrice) || 0,
      extraCosts: parseNumberInput(input.extraCosts || '0') || 0,
      commissionPercent: parseNumberInput(input.commissionPercent || '0') || 0,
      purchaseDate: input.purchaseDate,
      saleDate: input.notSold ? null : input.saleDate,
      createdAt: '',
      updatedAt: '',
    };
    return computeDeal(previewDeal);
  }, [input]);

  // Возможный дубль (мягкое предупреждение, не блокирует §13).
  const isDuplicate = useMemo(() => {
    if (deal) return false;
    if (!input.title.trim()) return false;
    return onPossibleDuplicate(
      input.title.trim(),
      input.notSold ? null : input.saleDate,
    );
  }, [deal, input.title, input.notSold, input.saleDate, onPossibleDuplicate]);

  // Esc — закрыть, фокус-ловушка (§11, §16).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const list = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'));
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof DealFormInput>(key: K, value: DealFormInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const doSave = (addAnother: boolean) => {
    setTouched(true);
    if (hasErrors(errors)) return;

    const built = buildDeal(input, deal);
    onSave(built, addAnother);

    if (addAnother) {
      // очищаем форму, оставляем категорию и даты (§11)
      setInput((prev) => ({
        ...emptyInput(),
        category: prev.category,
        purchaseDate: prev.purchaseDate,
        saleDate: prev.saleDate,
        notSold: prev.notSold,
      }));
      setTouched(false);
      window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  };

  const onFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      doSave(false);
    }
  };

  const showErr = (field: keyof FieldErrors): string | undefined =>
    touched ? errors[field] : undefined;
  const showWarn = (field: keyof FieldWarnings): string | undefined =>
    warnings[field];

  const sym = currencySymbol(currency);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={deal ? 'Редактирование сделки' : 'Новая сделка'}
        className="animate-sheet-up sm:animate-scale-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card sm:max-w-lg sm:rounded-2xl"
        onKeyDown={onFormKeyDown}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">
            {deal ? 'Редактировать сделку' : 'Новая сделка'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Закрыть"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Тело формы */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4">
            {isDuplicate && (
              <div className="rounded-xl border border-[hsl(var(--accent)/0.4)] bg-[hsl(var(--accent)/0.08)] px-3 py-2 text-xs text-foreground">
                Похоже, это дубль — сделка с таким названием и датой уже есть.
                Можно сохранить всё равно.
              </div>
            )}
            {/* Что продал */}
            <Field label="Что продал" error={showErr('title')} htmlFor="f-title">
              <input
                ref={firstFieldRef}
                id="f-title"
                list="titles-list"
                className="field"
                value={input.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="iPhone 13, кроссовки Nike…"
                maxLength={120}
              />
              <datalist id="titles-list">
                {titles.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>

            {/* Купил / Продал */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Купил за" error={showErr('buyPrice')} htmlFor="f-buy">
                <MoneyInput
                  id="f-buy"
                  sym={sym}
                  value={input.buyPrice}
                  onChange={(v) => set('buyPrice', v)}
                />
              </Field>
              <Field label="Продал за" error={showErr('sellPrice')} htmlFor="f-sell">
                <MoneyInput
                  id="f-sell"
                  sym={sym}
                  value={input.sellPrice}
                  onChange={(v) => set('sellPrice', v)}
                />
              </Field>
            </div>

            {/* Количество */}
            <Field label="Количество" error={showErr('qty')} htmlFor="f-qty">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline h-11 w-11 shrink-0 p-0"
                  aria-label="Уменьшить количество"
                  onClick={() => {
                    const n = Math.max(1, (parseNumberInput(input.qty) || 1) - 1);
                    set('qty', String(n));
                  }}
                >
                  <Minus size={16} aria-hidden />
                </button>
                <input
                  id="f-qty"
                  inputMode="numeric"
                  className="field text-center"
                  value={input.qty}
                  onChange={(e) => set('qty', e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline h-11 w-11 shrink-0 p-0"
                  aria-label="Увеличить количество"
                  onClick={() => {
                    const n = (parseNumberInput(input.qty) || 1) + 1;
                    set('qty', String(n));
                  }}
                >
                  <Plus size={16} aria-hidden />
                </button>
              </div>
            </Field>

            {/* Доп. расходы / Комиссия */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Доп. расходы"
                error={showErr('extraCosts')}
                htmlFor="f-extra"
                hint="доставка, упаковка, реклама"
              >
                <MoneyInput
                  id="f-extra"
                  sym={sym}
                  value={input.extraCosts}
                  onChange={(v) => set('extraCosts', v)}
                  placeholder="0"
                />
              </Field>
              <Field
                label="Комиссия, %"
                error={showErr('commissionPercent')}
                htmlFor="f-comm"
              >
                <input
                  id="f-comm"
                  inputMode="decimal"
                  className="field"
                  value={input.commissionPercent}
                  onChange={(e) => set('commissionPercent', e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>

            {/* Даты */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Дата покупки"
                error={showErr('purchaseDate')}
                htmlFor="f-pdate"
              >
                <input
                  id="f-pdate"
                  type="date"
                  className="field"
                  value={input.purchaseDate}
                  onChange={(e) => set('purchaseDate', e.target.value)}
                />
              </Field>
              <Field
                label="Дата продажи"
                error={showErr('saleDate')}
                warning={showWarn('saleDate')}
                htmlFor="f-sdate"
              >
                <input
                  id="f-sdate"
                  type="date"
                  className="field disabled:opacity-50"
                  value={input.saleDate}
                  disabled={input.notSold}
                  onChange={(e) => set('saleDate', e.target.value)}
                />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                checked={input.notSold}
                onChange={(e) => set('notSold', e.target.checked)}
              />
              Ещё не продано (в наличии)
            </label>

            {/* Категория */}
            <Field label="Категория" htmlFor="f-cat">
              <input
                id="f-cat"
                list="cats-list"
                className="field"
                value={input.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="необязательно"
              />
              <datalist id="cats-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            {/* Заметка */}
            <Field label="Заметка" htmlFor="f-note">
              <textarea
                id="f-note"
                className="field resize-none"
                rows={2}
                value={input.note}
                onChange={(e) => set('note', e.target.value)}
                placeholder="необязательно"
              />
            </Field>
          </div>
        </div>

        {/* Живой предпросмотр */}
        <div className="border-t bg-muted/40 px-5 py-3" aria-live="polite">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground">Чистая прибыль:</span>
            <span
              className={`tnum text-lg font-bold ${
                preview.profit < 0 ? 'text-loss' : 'text-profit'
              }`}
            >
              {formatSignedMoney(preview.profit, currency)}
            </span>
            <span className="text-muted-foreground">
              маржа{' '}
              <span className={preview.marginPct < 0 ? 'text-loss' : ''}>
                {preview.revenue === 0 ? '—' : formatPercent(preview.marginPct)}
              </span>
            </span>
            <span className="text-muted-foreground">
              ROI{' '}
              <span className={preview.roiPct < 0 ? 'text-loss' : ''}>
                {preview.invested === 0 ? '—' : formatPercent(preview.roiPct)}
              </span>
            </span>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
          {deal && onDelete && (
            <button
              type="button"
              className="btn btn-danger order-last mr-auto sm:order-first"
              onClick={() => onDelete(deal.id)}
            >
              <Trash2 size={16} aria-hidden /> Удалить
            </button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Отмена
            </button>
            {!deal && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => doSave(true)}
              >
                Сохранить и ещё
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => doSave(false)}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  warning,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  warning?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 flex items-center justify-between text-sm font-medium text-foreground"
      >
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-loss">{error}</p>}
      {!error && warning && (
        <p className="mt-1 text-xs text-[hsl(var(--accent))]">{warning}</p>
      )}
    </div>
  );
}

function MoneyInput({
  id,
  sym,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  sym: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {sym}
      </span>
      <input
        id={id}
        inputMode="decimal"
        className="field pl-7"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
