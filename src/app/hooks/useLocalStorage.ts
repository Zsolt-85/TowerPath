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

// Game-exact unit ladder (mirrors the in-game formatter):
// K M B T q Q s S O N D, then ab-az, then exponential.
const GAME_UNITS = [
  'K', 'M', 'B', 'T', 'q', 'Q', 's', 'S', 'O', 'N', 'D',
  'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am',
  'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax', 'ay', 'az',
];

export function formatBig(n: number): string {
  if (!isFinite(n)) return '0';
  if (n < 0) return `-${formatBig(-n)}`;
  if (n < 1000) return String(Math.round(n));
  let v = n;
  for (let i = 0; i < GAME_UNITS.length; i++) {
    v /= 1000;
    if (v < 1000) return `${Math.round(v * 100) / 100}${GAME_UNITS[i]}`;
  }
  return n.toExponential(2);
}
