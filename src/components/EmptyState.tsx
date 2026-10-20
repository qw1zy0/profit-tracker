// components/EmptyState.tsx — пустое состояние (§17: демо только по кнопке).

import { PlusCircle, Sparkles } from 'lucide-react';

type Props = {
  onAdd: () => void;
  onLoadDemo: () => void;
  hasDemo: boolean;
  onRemoveDemo: () => void;
};

export function EmptyState({ onAdd, onLoadDemo, hasDemo, onRemoveDemo }: Props) {
  return (
    <div className="card-soft flex flex-col items-center gap-4 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <PlusCircle size={28} className="text-muted-foreground" aria-hidden />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Пока нет сделок</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Добавьте первую сделку — укажите название и две цены, остальное
          приложение посчитает само.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          <PlusCircle size={18} aria-hidden /> Добавить сделку
        </button>
        {hasDemo ? (
          <button type="button" className="btn btn-outline" onClick={onRemoveDemo}>
            Удалить пример
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={onLoadDemo}>
            <Sparkles size={16} aria-hidden /> Посмотреть на примере
          </button>
        )}
      </div>
    </div>
  );
}
