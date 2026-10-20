// Доменные типы приложения «Учёт заработков»

export type Deal = {
  id: string;
  title: string;
  category?: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  extraCosts: number;
  commissionPercent: number;
  purchaseDate: string; // "YYYY-MM-DD"
  saleDate: string | null; // null = ещё не продано ("в наличии")
  note?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type Currency = 'RUB' | 'USD' | 'EUR' | 'KZT';

export type Settings = {
  currency: Currency;
  theme: 'light' | 'dark';
  firstDayOfWeek: 1 | 7;
};

export type PeriodKey =
  | '24h'
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'all'
  | 'custom';

export type CustomRange = {
  from: string | null; // "YYYY-MM-DD"
  to: string | null; // "YYYY-MM-DD"
};

export type StoreData = {
  version: number;
  settings: Settings;
  deals: Deal[];
};

// Результат расчёта по одной сделке
export type DealMetrics = {
  revenue: number;
  purchase: number;
  commission: number;
  invested: number;
  profit: number;
  marginPct: number;
  markupPct: number;
  roiPct: number;
};

// Агрегаты за период
export type Aggregates = {
  totalProfit: number;
  totalRevenue: number;
  totalInvested: number;
  totalCommission: number;
  totalPurchase: number;
  totalExtra: number;
  dealsCount: number;
  unitsSold: number;
  avgProfit: number;
  avgMarginPct: number;
  bestDeal: Deal | null;
  inStockValue: number; // вне периода
  inStockCount: number; // вне периода
};
