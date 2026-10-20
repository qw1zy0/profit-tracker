import { useEffect, useMemo, useState } from 'react';
import type { Deal, PeriodKey, CustomRange, Currency } from './types';
import { useDeals } from './hooks/useDeals';
import { useToasts } from './hooks/useToasts';
import { useMinuteClock } from './hooks/useClock';
import { getPeriodInterval, filterSoldInInterval } from './lib/dates';
import { aggregate, computeDeal, isInStock, deltaPct } from './lib/profit';
import { exportJSON, exportCSV, buildBackupBlob, mergeDeals, loadPeriod, savePeriod } from './lib/storage';
import { makeDemoDeals, hasDemoDeals, isDemoDeal } from './lib/demo';
import { Header } from './components/Header';
import { PeriodTabs } from './components/PeriodTabs';
import { KpiCards } from './components/KpiCards';
import { ProfitChart } from './components/ProfitChart';
import { Toolbar } from './components/Toolbar';
import { DealTable, type SortKey, type SortDir } from './components/DealTable';
import { DealFormModal } from './components/DealFormModal';
import { CustomPeriodModal } from './components/CustomPeriodModal';
import { ImportModal } from './components/ImportModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { EmptyState } from './components/EmptyState';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { AlertTriangle } from 'lucide-react';

const APP_VERSION = '1.0.0';

export default function App() {
  const store = useDeals();
  const { deals, settings, storageStatus } = store;
  const toasts = useToasts(5000);
  const now = useMinuteClock();

  // период
  const [period, setPeriod] = useState<PeriodKey>(() => {
    const saved = loadPeriod();
    const valid: PeriodKey[] = ['24h', 'today', 'yesterday', 'week', 'month', 'all', 'custom'];
    return saved && valid.includes(saved as PeriodKey) ? (saved as PeriodKey) : 'today';
  });
  const [custom, setCustom] = useState<CustomRange>({ from: null, to: null });
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => { savePeriod(period); }, [period]);

  // тема
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  // форма
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // подтверждения
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmImportReplace, setConfirmImportReplace] = useState<{ deals: Deal[]; settings: Currency | null } | null>(null);

  // список: поиск/фильтр/сортировка
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // интервалы периода
  const { current, previous } = useMemo(
    () => getPeriodInterval(period, now, deals, custom),
    [period, now, deals, custom],
  );
  const soldInPeriod = useMemo(() => filterSoldInInterval(deals, current), [deals, current]);
  const agg = useMemo(() => aggregate(soldInPeriod, deals), [soldInPeriod, deals]);

  const deltaProfit = useMemo(() => {
    if (!previous) return null;
    const prevSold = filterSoldInInterval(deals, previous);
    const prevAgg = aggregate(prevSold, deals);
    return deltaPct(agg.totalProfit, prevAgg.totalProfit);
  }, [previous, deals, agg.totalProfit]);

  // нормализация строки (без учёта ё/е, регистра)
  const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

  // категории и названия для подсказок
  const categories = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => d.category && set.add(d.category));
    return Array.from(set).sort();
  }, [deals]);
  const titles = useMemo(() => Array.from(new Set(deals.map((d) => d.title))).sort(), [deals]);

  // отфильтрованный список для таблицы
  const filtered = useMemo(() => {
    let list = deals.filter((d) => (onlyInStock ? isInStock(d) : true));
    if (category) list = list.filter((d) => d.category === category);
    if (search.trim()) {
      const q = norm(search.trim());
      list = list.filter(
        (d) => norm(d.title).includes(q) || norm(d.note ?? '').includes(q),
      );
    }
    return list;
  }, [deals, onlyInStock, category, search]);

  // для основной таблицы — проданные, для секции — в наличии
  const soldRows = useMemo(() => {
    const rows = filtered.filter((d) => !isInStock(d));
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') {
        cmp = (a.saleDate ?? '').localeCompare(b.saleDate ?? '');
      } else if (sortKey === 'profit') {
        cmp = computeDeal(a).profit - computeDeal(b).profit;
      } else {
        cmp = computeDeal(a).marginPct - computeDeal(b).marginPct;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filtered, sortKey, sortDir]);

  const inStockRows = useMemo(() => filtered.filter(isInStock), [filtered]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  // CRUD
  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (d: Deal) => { setEditing(d); setFormOpen(true); };

  const handleSave = (deal: Deal, addAnother: boolean) => {
    if (editing) {
      store.updateDeal(deal);
      toasts.show('Сделка обновлена');
    } else {
      store.addDeal(deal);
      toasts.show('Сделка добавлена');
    }
    if (!addAnother) { setFormOpen(false); setEditing(null); }
  };

  const doDelete = (id: string) => {
    const snapshot = deals;
    const removed = deals.find((d) => d.id === id);
    store.removeDeal(id);
    setConfirmDelete(null);
    setFormOpen(false);
    setEditing(null);
    toasts.show(`Сделка удалена${removed ? `: ${removed.title}` : ''}`, {
      undoLabel: 'Отменить',
      onUndo: () => store.setDeals(snapshot),
    });
  };

  const possibleDuplicate = (title: string, saleDate: string | null) =>
    deals.some(
      (d) => norm(d.title) === norm(title) && d.saleDate === saleDate,
    );

  // демо
  const demoPresent = hasDemoDeals(deals);
  const loadDemo = () => { store.setDeals([...makeDemoDeals(), ...deals]); toasts.show('Загружен пример'); };
  const removeDemo = () => { store.setDeals(deals.filter((d) => !isDemoDeal(d))); toasts.show('Пример удалён'); };

  // экспорт/импорт
  const doImport = (incoming: Deal[], importedSettings: Currency | null, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setImportOpen(false);
      setConfirmImportReplace({ deals: incoming, settings: importedSettings });
      return;
    }
    store.replaceAll(mergeDeals(deals, incoming));
    setImportOpen(false);
    toasts.show('Данные добавлены');
  };
  const confirmReplace = () => {
    if (!confirmImportReplace) return;
    store.replaceAll(confirmImportReplace.deals);
    setConfirmImportReplace(null);
    toasts.show('Данные заменены');
  };

  const clearAll = () => {
    buildBackupBlob(deals, settings); // авто-бэкап перед очисткой (§13)
    store.clearAll();
    setConfirmClear(false);
    toasts.show('Все данные очищены (бэкап скачан)');
  };

  const isEmpty = deals.length === 0;

  return (
    <div className="mx-auto min-h-screen max-w-content px-4 pb-10 sm:px-6">
      <Header
        theme={settings.theme}
        currency={settings.currency}
        onToggleTheme={() => store.updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        onAdd={openAdd}
        onExportJSON={() => exportJSON(deals, settings)}
        onExportCSV={() => exportCSV(deals)}
        onImport={() => setImportOpen(true)}
        onChangeCurrency={(c) => store.updateSettings({ currency: c })}
      />

      {storageStatus === 'unavailable' && (
        <Banner text="Не удаётся сохранить данные в браузере — они будут потеряны при закрытии вкладки." />
      )}
      {storageStatus === 'corrupted' && (
        <Banner text="Сохранённые данные повреждены. Можно восстановить из JSON-бэкапа через «Импорт»." />
      )}

      {isEmpty ? (
        <div className="mt-4">
          <EmptyState onAdd={openAdd} onLoadDemo={loadDemo} hasDemo={demoPresent} onRemoveDemo={removeDemo} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <PeriodTabs
            value={period}
            onChange={setPeriod}
            onOpenCustom={() => setCustomOpen(true)}
            customActive={period === 'custom'}
          />
          <p className="-mt-2 text-xs text-muted-foreground">
            Период считается по дате продажи.
          </p>

          <KpiCards agg={agg} prevProfit={null} deltaProfitPct={deltaProfit} currency={settings.currency} />

          <ProfitChart soldInPeriod={soldInPeriod} interval={current} currency={settings.currency} />

          <Toolbar
            search={search}
            onSearch={setSearch}
            category={category}
            categories={categories}
            onCategory={setCategory}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortKey={(k) => onSort(k)}
            onlyInStock={onlyInStock}
            onToggleInStock={setOnlyInStock}
          />

          <DealTable
            deals={soldRows}
            inStock={inStockRows}
            currency={settings.currency}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            onEdit={openEdit}
            onDuplicate={store.duplicateDeal}
            onDelete={(id) => setConfirmDelete(id)}
            visibleCount={visibleCount}
            onShowMore={() => setVisibleCount((c) => c + 50)}
          />

          {demoPresent && (
            <button type="button" className="btn btn-ghost self-center text-xs" onClick={removeDemo}>
              Удалить демо-данные
            </button>
          )}

          <Footer count={deals.length} version={APP_VERSION} onClearAll={() => setConfirmClear(true)} />
        </div>
      )}

      <DealFormModal
        open={formOpen}
        deal={editing}
        currency={settings.currency}
        categories={categories}
        titles={titles}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        onDelete={(id) => setConfirmDelete(id)}
        onPossibleDuplicate={possibleDuplicate}
      />

      <CustomPeriodModal
        open={customOpen}
        value={custom}
        onApply={(r) => { setCustom(r); setPeriod('custom'); setCustomOpen(false); }}
        onClose={() => setCustomOpen(false)}
      />

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={doImport} />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Удалить сделку?"
        message="Сделка будет удалена. В течение 5 секунд можно отменить."
        confirmLabel="Удалить"
        danger
        onConfirm={() => confirmDelete && doDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Очистить все данные?"
        message="Перед удалением автоматически скачается JSON-бэкап. Для подтверждения введите слово УДАЛИТЬ."
        confirmLabel="Очистить всё"
        danger
        requireWord="УДАЛИТЬ"
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmImportReplace !== null}
        title="Заменить все данные?"
        message="Текущие сделки будут полностью заменены данными из файла."
        confirmLabel="Заменить"
        danger
        onConfirm={confirmReplace}
        onCancel={() => setConfirmImportReplace(null)}
      />

      <ToastContainer toasts={toasts.toasts} onUndo={toasts.runUndo} onDismiss={toasts.dismiss} />
    </div>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-[hsl(var(--loss)/0.4)] bg-[hsl(var(--loss)/0.08)] px-3 py-2 text-sm text-foreground">
      <AlertTriangle size={16} className="shrink-0 text-loss" aria-hidden />
      {text}
    </div>
  );
}
