// components/Toolbar.tsx — поиск, фильтр по категории, сортировка, «только в наличии» (§10).

import type { SortKey, SortDir } from './DealTable';
import { Search } from 'lucide-react';

type Props = {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  categories: string[];
  onCategory: (v: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortKey: (k: SortKey) => void;
  onlyInStock: boolean;
  onToggleInStock: (v: boolean) => void;
};

export function Toolbar({
  search,
  onSearch,
  category,
  categories,
  onCategory,
  sortKey,
  onSortKey,
  onlyInStock,
  onToggleInStock,
}: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[200px]">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          className="field pl-9"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Поиск по названию и заметке"
          aria-label="Поиск сделок"
          type="search"
        />
      </div>

      <select
        className="field sm:w-auto"
        value={category}
        onChange={(e) => onCategory(e.target.value)}
        aria-label="Фильтр по категории"
      >
        <option value="">Все категории</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        className="field sm:w-auto"
        value={sortKey}
        onChange={(e) => onSortKey(e.target.value as SortKey)}
        aria-label="Сортировка"
      >
        <option value="date">Сначала новые</option>
        <option value="profit">По прибыли</option>
        <option value="margin">По марже</option>
      </select>

      <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm sm:w-auto">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
          checked={onlyInStock}
          onChange={(e) => onToggleInStock(e.target.checked)}
        />
        Только в наличии
      </label>
    </div>
  );
}
