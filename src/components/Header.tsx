// components/Header.tsx — шапка: название, тема, экспорт/импорт, настройки, +Сделка (§5).

import { useEffect, useRef, useState } from 'react';
import type { Settings, Currency } from '../types';
import {
  Plus,
  Sun,
  Moon,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Settings as SettingsIcon,
} from 'lucide-react';

type Props = {
  theme: Settings['theme'];
  currency: Currency;
  onToggleTheme: () => void;
  onAdd: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImport: () => void;
  onChangeCurrency: (c: Currency) => void;
};

const CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR', 'KZT'];

function Dropdown({
  button,
  children,
  align = 'right',
}: {
  button: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{button(open)}</div>
      {open && (
        <div
          className={`animate-fade-in absolute z-30 mt-1 w-52 overflow-hidden rounded-xl border bg-popover py-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function Header({
  theme,
  currency,
  onToggleTheme,
  onAdd,
  onExportJSON,
  onExportCSV,
  onImport,
  onChangeCurrency,
}: Props) {
  return (
    <header className="flex items-center justify-between gap-2 py-4">
      <h1 className="text-lg font-bold sm:text-xl">Учёт заработков</h1>

      <div className="flex items-center gap-1.5">
        {/* Тема */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="btn btn-outline h-11 w-11 p-0"
          aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
        </button>

        {/* Экспорт / импорт */}
        <Dropdown
          button={(open) => (
            <button
              type="button"
              className="btn btn-outline h-11 w-11 p-0"
              aria-label="Экспорт и импорт"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <Download size={18} aria-hidden />
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuItem
                icon={<FileJson size={15} />}
                onClick={() => { close(); onExportJSON(); }}
              >
                Экспорт JSON (бэкап)
              </MenuItem>
              <MenuItem
                icon={<FileSpreadsheet size={15} />}
                onClick={() => { close(); onExportCSV(); }}
              >
                Экспорт CSV (Excel)
              </MenuItem>
              <div className="my-1 border-t" />
              <MenuItem
                icon={<Upload size={15} />}
                onClick={() => { close(); onImport(); }}
              >
                Импорт из файла
              </MenuItem>
            </>
          )}
        </Dropdown>

        {/* Настройки (валюта) */}
        <Dropdown
          button={(open) => (
            <button
              type="button"
              className="btn btn-outline h-11 w-11 p-0"
              aria-label="Настройки"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <SettingsIcon size={18} aria-hidden />
            </button>
          )}
        >
          {() => (
            <>
              <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Валюта
              </div>
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChangeCurrency(c)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                    currency === c ? 'font-semibold text-primary' : ''
                  }`}
                >
                  {c}
                  {currency === c && <span aria-hidden>✓</span>}
                </button>
              ))}
            </>
          )}
        </Dropdown>

        {/* + Сделка */}
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          <Plus size={18} aria-hidden />
          <span className="hidden sm:inline">Сделка</span>
        </button>
      </div>
    </header>
  );
}

function MenuItem({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </button>
  );
}
