// components/ImportModal.tsx — импорт JSON с выбором режима (§14).

import { useEffect, useRef, useState } from 'react';
import type { Deal, Settings } from '../types';
import { parseImport } from '../lib/storage';
import { X, FileUp } from 'lucide-react';

type Mode = 'replace' | 'merge';

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (deals: Deal[], settings: Settings | null, mode: Mode) => void;
};

export function ImportModal({ open, onClose, onImport }: Props) {
  const [mode, setMode] = useState<Mode>('merge');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ deals: Deal[]; settings: Settings | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode('merge');
      setFileName(null);
      setParsed(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setError(null);
    const text = await file.text();
    const result = parseImport(text);
    if (result.ok) {
      setParsed({ deals: result.deals, settings: result.settings });
    } else {
      setParsed(null);
      setError(result.error);
    }
  };

  const confirm = () => {
    if (!parsed) return;
    onImport(parsed.deals, parsed.settings, mode);
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Импорт данных"
        className="animate-scale-in w-full max-w-md rounded-2xl bg-card p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Импорт из файла</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label="Закрыть"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/50"
        >
          <FileUp size={24} aria-hidden />
          {fileName ? (
            <span className="font-medium text-foreground">{fileName}</span>
          ) : (
            <span>Выберите JSON-файл бэкапа</span>
          )}
        </button>

        {error && <p className="mt-2 text-xs text-loss">{error}</p>}

        {parsed && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Найдено сделок в файле:{' '}
              <span className="font-semibold text-foreground">{parsed.deals.length}</span>
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm">
                <input
                  type="radio"
                  name="import-mode"
                  className="mt-0.5 accent-[hsl(var(--primary))]"
                  checked={mode === 'merge'}
                  onChange={() => setMode('merge')}
                />
                <span>
                  <span className="font-medium">Добавить к текущим</span>
                  <span className="block text-xs text-muted-foreground">
                    Дубли по id будут пропущены
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm">
                <input
                  type="radio"
                  name="import-mode"
                  className="mt-0.5 accent-[hsl(var(--primary))]"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                />
                <span>
                  <span className="font-medium text-loss">Заменить всё</span>
                  <span className="block text-xs text-muted-foreground">
                    Текущие данные будут удалены
                  </span>
                </span>
              </label>
            </div>
          </>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary disabled:opacity-40"
            disabled={!parsed}
            onClick={confirm}
          >
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}
