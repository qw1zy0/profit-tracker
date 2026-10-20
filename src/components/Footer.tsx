// components/Footer.tsx — футер: счётчик, «Очистить всё», версия (§5).

import { Trash2 } from 'lucide-react';

type Props = {
  count: number;
  version: string;
  onClearAll: () => void;
};

export function Footer({ count, version, onClearAll }: Props) {
  return (
    <footer className="mt-6 flex flex-col items-center justify-between gap-3 border-t py-5 text-sm text-muted-foreground sm:flex-row">
      <span>
        Записей: <span className="tnum font-medium text-foreground">{count}</span>
      </span>
      <div className="flex items-center gap-4">
        {count > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 text-loss hover:underline"
          >
            <Trash2 size={15} aria-hidden /> Очистить всё
          </button>
        )}
        <span className="text-xs">v{version}</span>
      </div>
    </footer>
  );
}
