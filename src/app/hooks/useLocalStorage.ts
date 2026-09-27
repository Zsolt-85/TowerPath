'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) setValue(JSON.parse(raw));
      } catch {
        // corrupted storage: keep defaults
      }
    };
    read();
    const onStore = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) read();
    };
    window.addEventListener('towerpath:store', onStore);
    return () => window.removeEventListener('towerpath:store', onStore);
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
          window.dispatchEvent(new CustomEvent('towerpath:store', { detail: key }));
        } catch {
          // storage full or unavailable: keep in-memory value
        }
        return next;
      });
    },
    [key]
  );

  return [value, set] as const;
}

export interface Run {
  id: string;
  date: string;
  tier: number;
  wave: number;
  coins: number;
  durationMin: number;
  cells?: number;
  strategy?: string;
  source?: 'manual' | 'paste' | 'json';
}

export function useRuns() {
  return useLocalStorage<Run[]>('towerpath:runs', []);
}

export function formatBig(n: number): string {
  if (!isFinite(n)) return '0';
  if (n < 1000) return n % 1 === 0 ? String(n) : n.toFixed(1);
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let v = n;
  let u = -1;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)}${units[u]}`;
}
