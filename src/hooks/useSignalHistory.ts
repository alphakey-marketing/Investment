import { useState, useEffect } from 'react';
import { SignalEvent } from '../types/binance';

const MAX_HISTORY = 10;
const STORAGE_KEY = 'kma_signal_history';

export function useSignalHistory(signal: SignalEvent | null) {
  const [history, setHistory] = useState<SignalEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!signal) return;
    setHistory((prev) => {
      // Avoid duplicate same-time signals
      if (prev[0]?.time === signal.time && prev[0]?.type === signal.type) return prev;
      const updated = [signal, ...prev].slice(0, MAX_HISTORY);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [signal?.time, signal?.type]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, clearHistory };
}
