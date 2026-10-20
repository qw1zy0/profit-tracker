// lib/format.ts — форматирование чисел, денег, процентов (ру-локаль, §7).

import type { Currency } from '../types';

const CURRENCY_SYMBOL: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  KZT: '₸',
};

export function currencySymbol(c: Currency): string {
  return CURRENCY_SYMBOL[c];
}

/** Округление до 2 знаков без float-хвостов. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Разделитель тысяч — пробол, десятичный — запятая.
 * Если дробной части нет — без копеек (12 500, а не 12 500,00). */
export function formatNumber(value: number): string {
  const n = round2(value);
  const hasFraction = Math.abs(n % 1) > 1e-9;
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Деньги со знаком валюты. */
export function formatMoney(value: number, currency: Currency): string {
  return `${formatNumber(value)}\u00A0${currencySymbol(currency)}`;
}

/** Деньги со знаком +/- спереди (для прибыли). */
export function formatSignedMoney(value: number, currency: Currency): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatMoney(Math.abs(value), currency)}`;
}

/** Проценты: 1 знак, запятая (19,2 %). */
export function formatPercent(value: number): string {
  const n = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${n}\u00A0%`;
}

/** Проценты со знаком для дельты (+12,4 % / −8,1 %). */
export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const n = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
  return `${sign}${n}\u00A0%`;
}

/** Компактные деньги для осей графика / больших чисел KPI: 12К, 1,2 млн. */
export function formatCompactMoney(value: number, currency: Currency): string {
  return `${formatCompact(value)}\u00A0${currencySymbol(currency)}`;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}\u00A0млрд`;
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}\u00A0млн`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}К`;
  return `${sign}${trim(abs)}`;
}

function trim(n: number): string {
  const r = Math.round(n * 10) / 10;
  const hasFraction = Math.abs(r % 1) > 1e-9;
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: hasFraction ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(r);
}

/**
 * Разбор числа из поля ввода: принимать и ',' и '.' как десятичный
 * разделитель, пробелы/неразрывные пробелы в числе игнорировать (§7).
 * Возвращает NaN при полностью невалидном вводе.
 */
export function parseNumberInput(raw: string): number {
  if (raw == null) return NaN;
  const cleaned = raw
    .toString()
    .replace(/\s|\u00A0/g, '')
    .replace(',', '.');
  if (cleaned === '') return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
