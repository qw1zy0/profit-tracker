// lib/profit.ts — чистая бизнес-логика расчётов.
// Без обращения к DOM и store. Реализует формулы §7 и агрегаты §7.

import type { Deal, DealMetrics, Aggregates } from '../types';

/** Расчёт метрик по одной сделке (формулы §7, реализовать ровно так). */
export function computeDeal(deal: Deal): DealMetrics {
  const revenue = deal.sellPrice * deal.qty;
  const purchase = deal.buyPrice * deal.qty;
  const commission = revenue * (deal.commissionPercent / 100);
  const invested = purchase + commission + deal.extraCosts;
  const profit = revenue - invested;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const markupPct = purchase > 0 ? ((revenue - purchase) / purchase) * 100 : 0;
  const roiPct = invested > 0 ? (profit / invested) * 100 : 0;

  return {
    revenue,
    purchase,
    commission,
    invested,
    profit,
    marginPct,
    markupPct,
    roiPct,
  };
}

/** Сделка «в наличии» (ещё не продана). */
export function isInStock(deal: Deal): boolean {
  return deal.saleDate === null;
}

/**
 * Агрегаты за период. На вход — уже отфильтрованные по периоду ПРОДАННЫЕ
 * сделки, и отдельно все сделки (для показателя «в обороте», не зависящего
 * от периода).
 */
export function aggregate(soldInPeriod: Deal[], allDeals: Deal[]): Aggregates {
  let totalProfit = 0;
  let totalRevenue = 0;
  let totalInvested = 0;
  let totalCommission = 0;
  let totalPurchase = 0;
  let totalExtra = 0;
  let unitsSold = 0;
  let bestDeal: Deal | null = null;
  let bestProfit = -Infinity;

  for (const d of soldInPeriod) {
    const m = computeDeal(d);
    totalProfit += m.profit;
    totalRevenue += m.revenue;
    totalInvested += m.invested;
    totalCommission += m.commission;
    totalPurchase += m.purchase;
    totalExtra += d.extraCosts;
    unitsSold += d.qty;
    if (m.profit > bestProfit) {
      bestProfit = m.profit;
      bestDeal = d;
    }
  }

  const dealsCount = soldInPeriod.length;
  const avgProfit = dealsCount ? totalProfit / dealsCount : 0;
  const avgMarginPct = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

  let inStockValue = 0;
  let inStockCount = 0;
  for (const d of allDeals) {
    if (isInStock(d)) {
      inStockValue += computeDeal(d).invested;
      inStockCount += 1;
    }
  }

  return {
    totalProfit,
    totalRevenue,
    totalInvested,
    totalCommission,
    totalPurchase,
    totalExtra,
    dealsCount,
    unitsSold,
    avgProfit,
    avgMarginPct,
    bestDeal: dealsCount ? bestDeal : null,
    inStockValue,
    inStockCount,
  };
}

/** Дельта в процентах между текущим и предыдущим значением.
 * null, если базы для сравнения нет (предыдущее = 0). */
export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
