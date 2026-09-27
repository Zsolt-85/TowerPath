'use client';

import { useEffect, useState } from 'react';
import { getRecommendedPath } from '../lib/calculation';

export interface RecItem {
  id?: string;
  name: string;
  desc: string;
  cost: number;
  currency: string;
  impact: string;
  reason?: string;
  computed?: boolean;
}

export interface RecStats {
  damage: number;
  attackSpeed: number;
  coins: number;
  stones: number;
  gtCd: number;
  bhCd: number;
}

/**
 * Ranked upgrade suggestions, computed by the backend engine
 * (POST /api/recommendations) with real UW stone-cost math.
 * Falls back to the local engine if the backend is unreachable.
 */
export function useRecommendations(stats: RecStats) {
  const [recs, setRecs] = useState<RecItem[] | null>(null);
  const [source, setSource] = useState<'server' | 'local'>('local');

  const { damage, attackSpeed, coins, stones, gtCd, bhCd } = stats;

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ damage, attackSpeed, coins, stones, gtCd, bhCd }),
        });
        if (!res.ok) throw new Error(`backend ${res.status}`);
        const data = await res.json();
        if (alive && Array.isArray(data.recommendations)) {
          setRecs(data.recommendations as RecItem[]);
          setSource('server');
          return;
        }
        throw new Error('bad shape');
      } catch {
        if (alive) {
          setRecs(getRecommendedPath(damage, attackSpeed, 0, stones, gtCd));
          setSource('local');
        }
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [damage, attackSpeed, coins, stones, gtCd, bhCd]);

  return { recs, source };
}
