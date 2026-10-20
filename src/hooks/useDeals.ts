// hooks/useDeals.ts — центральное состояние сделок и настроек (§4, §14).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Deal, Settings } from '../types';
import {
  loadAll,
  saveDeals,
  saveSettings,
  type StorageStatus,
} from '../lib/storage';

export type UndoState = {
  deals: Deal[];
  label: string;
} | null;

export function useDeals() {
  const initial = useRef(loadAll());
  const [deals, setDeals] = useState<Deal[]>(initial.current.deals);
  const [settings, setSettings] = useState<Settings>(initial.current.settings);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(
    initial.current.status,
  );

  const debounceRef = useRef<number | null>(null);

  // Запись сделок с debounce 200 мс (§14).
  useEffect(() => {
    if (storageStatus === 'unavailable') return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const ok = saveDeals(deals);
      if (!ok) setStorageStatus('unavailable');
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [deals, storageStatus]);

  // Настройки хранятся отдельно (§14).
  useEffect(() => {
    if (storageStatus === 'unavailable') return;
    saveSettings(settings);
  }, [settings, storageStatus]);

  const addDeal = useCallback((deal: Deal) => {
    setDeals((prev) => [deal, ...prev]);
  }, []);

  const updateDeal = useCallback((deal: Deal) => {
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? deal : d)));
  }, []);

  const removeDeal = useCallback((id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const duplicateDeal = useCallback((id: string) => {
    setDeals((prev) => {
      const src = prev.find((d) => d.id === id);
      if (!src) return prev;
      const now = new Date().toISOString();
      const copy: Deal = {
        ...src,
        id: crypto.randomUUID(),
        title: `${src.title} (копия)`,
        createdAt: now,
        updatedAt: now,
      };
      const idx = prev.findIndex((d) => d.id === id);
      const next = [...prev];
      next.splice(idx, 0, copy);
      return next;
    });
  }, []);

  const replaceAll = useCallback((next: Deal[]) => {
    setDeals(next);
  }, []);

  const clearAll = useCallback(() => {
    setDeals([]);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    deals,
    settings,
    storageStatus,
    setStorageStatus,
    addDeal,
    updateDeal,
    removeDeal,
    duplicateDeal,
    replaceAll,
    clearAll,
    updateSettings,
    setDeals,
  };
}
