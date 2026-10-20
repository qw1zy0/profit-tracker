// lib/validation.ts — валидация формы сделки (§12).

import type { Deal } from '../types';
import { parseLocalDate } from './dates';

export type DealFormInput = {
  title: string;
  buyPrice: string;
  sellPrice: string;
  qty: string;
  extraCosts: string;
  commissionPercent: string;
  purchaseDate: string;
  saleDate: string;
  notSold: boolean;
  category: string;
  note: string;
};

export type FieldErrors = Partial<Record<keyof DealFormInput, string>>;
export type FieldWarnings = Partial<Record<keyof DealFormInput, string>>;

import { parseNumberInput } from './format';

const MAX_MONEY = 1_000_000_000;
const MAX_QTY = 100_000;

export function validateDealForm(input: DealFormInput): {
  errors: FieldErrors;
  warnings: FieldWarnings;
} {
  const errors: FieldErrors = {};
  const warnings: FieldWarnings = {};

  const title = input.title.trim();
  if (!title) errors.title = 'Укажите название';
  else if (title.length > 120) errors.title = 'Не больше 120 символов';

  const buy = parseNumberInput(input.buyPrice);
  if (input.buyPrice.trim() === '' || Number.isNaN(buy)) {
    errors.buyPrice = 'Укажите сумму';
  } else if (buy < 0) errors.buyPrice = 'Не меньше 0';
  else if (buy > MAX_MONEY) errors.buyPrice = 'Слишком большое число';

  const sell = parseNumberInput(input.sellPrice);
  if (input.sellPrice.trim() === '' || Number.isNaN(sell)) {
    errors.sellPrice = 'Укажите сумму';
  } else if (sell < 0) errors.sellPrice = 'Не меньше 0';
  else if (sell > MAX_MONEY) errors.sellPrice = 'Слишком большое число';

  const qty = parseNumberInput(input.qty);
  if (Number.isNaN(qty) || !Number.isInteger(qty)) {
    errors.qty = 'Целое число';
  } else if (qty < 1) errors.qty = 'Не меньше 1';
  else if (qty > MAX_QTY) errors.qty = 'Слишком много';

  const extra = parseNumberInput(input.extraCosts || '0');
  if (Number.isNaN(extra)) errors.extraCosts = 'Неверное число';
  else if (extra < 0) errors.extraCosts = 'Не меньше 0';
  else if (extra > MAX_MONEY) errors.extraCosts = 'Слишком большое число';

  const comm = parseNumberInput(input.commissionPercent || '0');
  if (Number.isNaN(comm)) errors.commissionPercent = 'Неверное число';
  else if (comm < 0 || comm > 100) errors.commissionPercent = 'От 0 до 100';

  if (!input.purchaseDate) errors.purchaseDate = 'Укажите дату';

  if (!input.notSold) {
    if (!input.saleDate) {
      errors.saleDate = 'Укажите дату продажи';
    } else if (input.purchaseDate) {
      const pd = parseLocalDate(input.purchaseDate);
      const sd = parseLocalDate(input.saleDate);
      if (sd < pd) errors.saleDate = 'Продажа раньше покупки';
      // Дата продажи в будущем — мягкое предупреждение (§12).
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (sd > today) warnings.saleDate = 'Дата продажи в будущем';
    }
  }

  return { errors, warnings };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Собрать Deal из валидной формы. */
export function buildDeal(
  input: DealFormInput,
  existing: Deal | null,
): Deal {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    title: input.title.trim(),
    category: input.category.trim() || undefined,
    qty: Math.round(parseNumberInput(input.qty) || 1),
    buyPrice: parseNumberInput(input.buyPrice) || 0,
    sellPrice: parseNumberInput(input.sellPrice) || 0,
    extraCosts: parseNumberInput(input.extraCosts || '0') || 0,
    commissionPercent: parseNumberInput(input.commissionPercent || '0') || 0,
    purchaseDate: input.purchaseDate,
    saleDate: input.notSold ? null : input.saleDate,
    note: input.note.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
