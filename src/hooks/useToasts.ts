// hooks/useToasts.ts — тосты с поддержкой undo (§13).

import { useCallback, useRef, useState } from 'react';

export type Toast = {
  id: string;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
};

export function useToasts(durationMs = 5000) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, opts?: { undoLabel?: string; onUndo?: () => void }) => {
      const id = crypto.randomUUID();
      const toast: Toast = {
        id,
        message,
        undoLabel: opts?.undoLabel,
        onUndo: opts?.onUndo,
      };
      setToasts((prev) => [...prev, toast]);
      const timer = window.setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss, durationMs],
  );

  const runUndo = useCallback(
    (id: string) => {
      setToasts((prev) => {
        const t = prev.find((x) => x.id === id);
        if (t?.onUndo) t.onUndo();
        return prev.filter((x) => x.id !== id);
      });
      const timer = timers.current.get(id);
      if (timer) {
        window.clearTimeout(timer);
        timers.current.delete(id);
      }
    },
    [],
  );

  return { toasts, show, dismiss, runUndo };
}
