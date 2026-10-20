// lib/storage.ts — localStorage, версионирование, миграции, экспорт/импорт (§14).

import type { Deal, Settings, StoreData, Currency } from '../types';

export const DEALS_KEY = 'profit-tracker.v1';
export const SETTINGS_KEY = 'profit-tracker.settings.v1';
export const PERIOD_KEY = 'profit-tracker.period.v1';
export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  currency: 'RUB',
  theme:
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  firstDayOfWeek: 1,
};

export type StorageStatus = 'ok' | 'unavailable' | 'corrupted';

export type LoadResult = {
  deals: Deal[];
  settings: Settings;
  status: StorageStatus;
};

function isStorageAvailable(): boolean {
  try {
    const k = '__pt_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** Явная обработка неизвестной версии схемы (§14). */
export function migrate(data: unknown): { deals: Deal[]; version: number } {
  if (!data || typeof data !== 'object') {
    return { deals: [], version: SCHEMA_VERSION };
  }
  const obj = data as Partial<StoreData> & { deals?: unknown };
  const version = typeof obj.version === 'number' ? obj.version : 1;

  // На данный момент существует только версия 1.
  if (version > SCHEMA_VERSION) {
    // Будущая версия — читаем сделки как есть, не ломаемся.
    return { deals: sanitizeDeals(obj.deals), version: SCHEMA_VERSION };
  }
  return { deals: sanitizeDeals(obj.deals), version: SCHEMA_VERSION };
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeDeals(raw: unknown): Deal[] {
  if (!Array.isArray(raw)) return [];
  const out: Deal[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const d = item as Record<string, unknown>;
    if (typeof d.id !== 'string' || typeof d.title !== 'string') continue;
    out.push({
      id: d.id,
      title: d.title,
      category: typeof d.category === 'string' ? d.category : undefined,
      qty: Math.max(1, Math.round(num(d.qty, 1))),
      buyPrice: num(d.buyPrice),
      sellPrice: num(d.sellPrice),
      extraCosts: num(d.extraCosts),
      commissionPercent: num(d.commissionPercent),
      purchaseDate:
        typeof d.purchaseDate === 'string' ? d.purchaseDate : isoDate(),
      saleDate:
        d.saleDate === null
          ? null
          : typeof d.saleDate === 'string'
            ? d.saleDate
            : null,
      note: typeof d.note === 'string' ? d.note : undefined,
      createdAt:
        typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
      updatedAt:
        typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
    });
  }
  return out;
}

function isoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function sanitizeSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const s = raw as Record<string, unknown>;
  const currencies: Currency[] = ['RUB', 'USD', 'EUR', 'KZT'];
  return {
    currency: currencies.includes(s.currency as Currency)
      ? (s.currency as Currency)
      : DEFAULT_SETTINGS.currency,
    theme: s.theme === 'dark' ? 'dark' : s.theme === 'light' ? 'light' : DEFAULT_SETTINGS.theme,
    firstDayOfWeek: s.firstDayOfWeek === 7 ? 7 : 1,
  };
}

/** Загрузка данных и настроек (настройки хранятся отдельно от сделок, §14). */
export function loadAll(): LoadResult {
  if (!isStorageAvailable()) {
    return { deals: [], settings: { ...DEFAULT_SETTINGS }, status: 'unavailable' };
  }
  let settings = { ...DEFAULT_SETTINGS };
  try {
    const rawS = window.localStorage.getItem(SETTINGS_KEY);
    if (rawS) settings = sanitizeSettings(JSON.parse(rawS));
  } catch {
    /* настройки сбрасываем к дефолту молча */
  }

  try {
    const rawD = window.localStorage.getItem(DEALS_KEY);
    if (!rawD) return { deals: [], settings, status: 'ok' };
    const parsed = JSON.parse(rawD);
    const { deals } = migrate(parsed);
    return { deals, settings, status: 'ok' };
  } catch {
    // Повреждённый JSON — не падаем (§13).
    return { deals: [], settings, status: 'corrupted' };
  }
}

export function saveDeals(deals: Deal[]): boolean {
  try {
    const payload: StoreData = {
      version: SCHEMA_VERSION,
      settings: DEFAULT_SETTINGS, // настройки хранятся отдельно; здесь — заглушка схемы
      deals,
    };
    window.localStorage.setItem(DEALS_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function saveSettings(settings: Settings): boolean {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function savePeriod(value: string): void {
  try {
    window.localStorage.setItem(PERIOD_KEY, value);
  } catch {
    /* молча */
  }
}

export function loadPeriod(): string | null {
  try {
    return window.localStorage.getItem(PERIOD_KEY);
  } catch {
    return null;
  }
}

// ----- Экспорт / импорт -----

function fileStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Полный JSON-бэкап. */
export function exportJSON(deals: Deal[], settings: Settings): void {
  const payload = { version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), settings, deals };
  download(`zarabotki-${fileStamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

/** Возвращает JSON-строку бэкапа (для авто-скачивания перед «Очистить всё»). */
export function buildBackupBlob(deals: Deal[], settings: Settings): void {
  exportJSON(deals, settings);
}

/** CSV с разделителем ; и BOM (для корректного Excel с кириллицей, §14). */
export function exportCSV(deals: Deal[]): void {
  const headers = [
    'id', 'Товар', 'Категория', 'Кол-во', 'Цена покупки', 'Цена продажи',
    'Доп. расходы', 'Комиссия %', 'Дата покупки', 'Дата продажи', 'Заметка',
  ];
  const esc = (v: string | number | null): string => {
    const s = v === null ? '' : String(v);
    if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = deals.map((d) =>
    [
      d.id, d.title, d.category ?? '', d.qty, d.buyPrice, d.sellPrice,
      d.extraCosts, d.commissionPercent, d.purchaseDate, d.saleDate ?? '', d.note ?? '',
    ]
      .map(esc)
      .join(';'),
  );
  const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  download(`zarabotki-${fileStamp()}.csv`, csv, 'text/csv;charset=utf-8');
}

export type ImportResult =
  | { ok: true; deals: Deal[]; settings: Settings | null }
  | { ok: false; error: string };

/** Разбор и валидация импортируемого JSON. */
export function parseImport(text: string): ImportResult {
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') {
      return { ok: false, error: 'Файл не похож на бэкап приложения.' };
    }
    const { deals } = migrate(data);
    const settings =
      'settings' in data && data.settings ? sanitizeSettings(data.settings) : null;
    return { ok: true, deals, settings };
  } catch {
    return { ok: false, error: 'Не удалось прочитать файл: повреждённый JSON.' };
  }
}

/** Слияние при импорте «Добавить к текущим» — дубли по id пропускаются (§14). */
export function mergeDeals(current: Deal[], incoming: Deal[]): Deal[] {
  const ids = new Set(current.map((d) => d.id));
  const added = incoming.filter((d) => !ids.has(d.id));
  return [...current, ...added];
}
