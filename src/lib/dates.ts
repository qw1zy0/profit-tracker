// lib/dates.ts — работа с датами и периодами (§8, локальный часовой пояс).

import type { Deal, PeriodKey, CustomRange } from '../types';

export type Interval = { start: Date; end: Date };

/** Текущая дата как "YYYY-MM-DD" в ЛОКАЛЬНОМ времени. */
export function todayISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Парсинг "YYYY-MM-DD" как ЛОКАЛЬНОЙ даты (00:00 местного времени),
 * чтобы «Сегодня» не съезжало на день из-за UTC (§8). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/** Начало локального дня (00:00:00.000). */
export function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

/** Конец локального дня (23:59:59.999). */
export function endOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
}

export function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

/**
 * Границы периода и границы ПРЕДЫДУЩЕГО периода для сравнения (§8).
 * now — опорный момент, allDeals — для вычисления «Всё время».
 */
export function getPeriodInterval(
  period: PeriodKey,
  now: Date,
  allDeals: Deal[],
  custom?: CustomRange,
): { current: Interval; previous: Interval | null } {
  switch (period) {
    case '24h': {
      const end = now;
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const prevEnd = start;
      const prevStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    case 'today': {
      const start = startOfDay(now);
      const end = now;
      const prevStart = startOfDay(addDays(now, -1));
      const prevEnd = endOfDay(addDays(now, -1));
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    case 'yesterday': {
      const start = startOfDay(addDays(now, -1));
      const end = endOfDay(addDays(now, -1));
      const prevStart = startOfDay(addDays(now, -2));
      const prevEnd = endOfDay(addDays(now, -2));
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    case 'week': {
      const end = now;
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevEnd = start;
      const prevStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    case 'month': {
      const end = now;
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevEnd = start;
      const prevStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    case 'all': {
      const sold = allDeals.filter((d) => d.saleDate !== null);
      let earliest = now;
      for (const d of sold) {
        const sd = parseLocalDate(d.saleDate as string);
        if (sd < earliest) earliest = sd;
      }
      return {
        current: { start: startOfDay(earliest), end: now },
        previous: null,
      };
    }
    case 'custom': {
      const fromISO = custom?.from;
      const toISO = custom?.to;
      const start = fromISO ? startOfDay(parseLocalDate(fromISO)) : startOfDay(now);
      const end = toISO ? endOfDay(parseLocalDate(toISO)) : endOfDay(now);
      const lengthMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - lengthMs);
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    default:
      return { current: { start: startOfDay(now), end: now }, previous: null };
  }
}

/** Попадает ли дата продажи сделки в интервал (период считается по saleDate §8). */
export function dealInInterval(deal: Deal, interval: Interval): boolean {
  if (deal.saleDate === null) return false;
  const sd = parseLocalDate(deal.saleDate);
  return sd >= interval.start && sd <= interval.end;
}

/** Фильтр проданных сделок по интервалу. */
export function filterSoldInInterval(deals: Deal[], interval: Interval): Deal[] {
  return deals.filter((d) => dealInInterval(d, interval));
}

/** Короткая дата для UI: "14.03" или "14.03.26". */
export function formatShortDate(iso: string | null, withYear = false): string {
  if (!iso) return '—';
  const d = parseLocalDate(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  if (withYear) {
    const y = String(d.getFullYear()).slice(-2);
    return `${day}.${m}.${y}`;
  }
  return `${day}.${m}`;
}

export const MS_DAY = 24 * 60 * 60 * 1000;
