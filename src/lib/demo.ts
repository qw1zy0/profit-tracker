// lib/demo.ts — демо-данные (только по кнопке в пустом состоянии, §17).

import type { Deal } from '../types';

function iso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const DEMO_FLAG = '__demo__';

type DemoSpec = {
  title: string;
  category: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  extraCosts: number;
  commissionPercent: number;
  purchaseDate: string;
  saleDate: string | null;
};

export function makeDemoDeals(): Deal[] {
  const now = new Date().toISOString();
  const specs: DemoSpec[] = [
    { title: 'iPhone 13 128GB', category: 'Электроника', qty: 1, buyPrice: 32000, sellPrice: 41000, extraCosts: 300, commissionPercent: 0, purchaseDate: iso(5), saleDate: iso(0) },
    { title: 'Кроссовки Nike', category: 'Обувь', qty: 2, buyPrice: 4500, sellPrice: 7200, extraCosts: 400, commissionPercent: 5, purchaseDate: iso(3), saleDate: iso(1) },
    { title: 'Партия кофе', category: 'Продукты', qty: 10, buyPrice: 350, sellPrice: 600, extraCosts: 500, commissionPercent: 0, purchaseDate: iso(9), saleDate: iso(3) },
    { title: 'Наушники AirPods', category: 'Электроника', qty: 1, buyPrice: 9000, sellPrice: 8200, extraCosts: 200, commissionPercent: 10, purchaseDate: iso(12), saleDate: iso(6) },
    { title: 'Велосипед', category: 'Спорт', qty: 1, buyPrice: 15000, sellPrice: 0, extraCosts: 0, commissionPercent: 0, purchaseDate: iso(4), saleDate: null },
    { title: 'Куртка зимняя', category: 'Одежда', qty: 1, buyPrice: 6000, sellPrice: 9500, extraCosts: 0, commissionPercent: 0, purchaseDate: iso(20), saleDate: iso(18) },
    { title: 'Монитор 27"', category: 'Электроника', qty: 3, buyPrice: 11000, sellPrice: 14500, extraCosts: 900, commissionPercent: 7, purchaseDate: iso(28), saleDate: iso(25) },
  ];

  return specs.map((s) => ({
    id: crypto.randomUUID(),
    title: s.title,
    category: s.category,
    qty: s.qty,
    buyPrice: s.buyPrice,
    sellPrice: s.sellPrice,
    extraCosts: s.extraCosts,
    commissionPercent: s.commissionPercent,
    purchaseDate: s.purchaseDate,
    saleDate: s.saleDate,
    note: DEMO_FLAG,
    createdAt: now,
    updatedAt: now,
  }));
}

export function isDemoDeal(deal: Deal): boolean {
  return deal.note === DEMO_FLAG;
}

export function hasDemoDeals(deals: Deal[]): boolean {
  return deals.some(isDemoDeal);
}
