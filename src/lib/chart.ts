// lib/chart.ts — агрегация прибыли по интервалам для графика (§9).

import type { Deal } from '../types';
import type { Interval } from './dates';
import { parseLocalDate, MS_DAY } from './dates';
import { computeDeal } from './profit';

export type Bucket = {
  key: string; // машинный ключ интервала
  label: string; // подпись оси X
  fullLabel: string; // для тултипа
  profit: number;
  dealsCount: number;
};

export type Grouping = 'day' | 'week' | 'month';

/** Выбор группировки по длине периода (§9):
 * ≤31 дн — по дням, ≤180 дн — по неделям, иначе по месяцам. */
export function chooseGrouping(interval: Interval): Grouping {
  const days = (interval.end.getTime() - interval.start.getTime()) / MS_DAY;
  if (days <= 31) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

/** Понедельник недели, содержащей дату (неделя с Пн). */
function startOfWeek(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  const dow = (n.getDay() + 6) % 7; // 0 = понедельник
  n.setDate(n.getDate() - dow);
  return n;
}

/** Построить корзины графика по проданным сделкам внутри интервала. */
export function buildChartBuckets(
  soldInPeriod: Deal[],
  interval: Interval,
  grouping: Grouping,
): Bucket[] {
  const map = new Map<string, Bucket>();
  const order: string[] = [];

  const ensure = (key: string, label: string, fullLabel: string): Bucket => {
    let b = map.get(key);
    if (!b) {
      b = { key, label, fullLabel, profit: 0, dealsCount: 0 };
      map.set(key, b);
      order.push(key);
    }
    return b;
  };

  // Предзаполняем интервал пустыми корзинами, чтобы ось была непрерывной.
  if (grouping === 'day') {
    const cur = new Date(interval.start);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(interval.end);
    let guard = 0;
    while (cur <= end && guard < 400) {
      const key = dayKey(cur);
      ensure(key, `${pad(cur.getDate())}.${pad(cur.getMonth() + 1)}`,
        `${pad(cur.getDate())}.${pad(cur.getMonth() + 1)}.${cur.getFullYear()}`);
      cur.setDate(cur.getDate() + 1);
      guard++;
    }
  } else if (grouping === 'week') {
    const cur = startOfWeek(interval.start);
    const end = new Date(interval.end);
    let guard = 0;
    while (cur <= end && guard < 60) {
      const key = dayKey(cur);
      const wEnd = new Date(cur);
      wEnd.setDate(wEnd.getDate() + 6);
      ensure(
        key,
        `${pad(cur.getDate())}.${pad(cur.getMonth() + 1)}`,
        `${pad(cur.getDate())}.${pad(cur.getMonth() + 1)} – ${pad(wEnd.getDate())}.${pad(wEnd.getMonth() + 1)}`,
      );
      cur.setDate(cur.getDate() + 7);
      guard++;
    }
  } else {
    const cur = new Date(interval.start.getFullYear(), interval.start.getMonth(), 1);
    const end = new Date(interval.end);
    let guard = 0;
    while (cur <= end && guard < 120) {
      const key = monthKey(cur);
      ensure(key, `${MONTHS_SHORT[cur.getMonth()]} ${String(cur.getFullYear()).slice(-2)}`,
        `${MONTHS_SHORT[cur.getMonth()]} ${cur.getFullYear()}`);
      cur.setMonth(cur.getMonth() + 1);
      guard++;
    }
  }

  // Раскладываем сделки по корзинам.
  for (const deal of soldInPeriod) {
    if (!deal.saleDate) continue;
    const sd = parseLocalDate(deal.saleDate);
    let key: string;
    if (grouping === 'day') key = dayKey(sd);
    else if (grouping === 'week') key = dayKey(startOfWeek(sd));
    else key = monthKey(sd);

    const b = map.get(key);
    if (b) {
      b.profit += computeDeal(deal).profit;
      b.dealsCount += 1;
    }
  }

  return order.map((k) => map.get(k)!);
}

/** Топ-N сделок по прибыли внутри периода (§9, второй вид). */
export function topDeals(soldInPeriod: Deal[], n: number): Deal[] {
  return [...soldInPeriod]
    .sort((a, b) => computeDeal(b).profit - computeDeal(a).profit)
    .slice(0, n);
}
