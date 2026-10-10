import type { Run } from '../hooks/useLocalStorage';

export const DIS_CATS = ['Attack', 'UW', 'Defense', 'Utility'] as const;
export type DisCat = (typeof DIS_CATS)[number];
const CAT_ORDER: DisCat[] = ['Attack', 'UW', 'Defense', 'Utility'];

export const DIS_TIERS: number[] = Array.from({ length: 25 }, (_, i) => i + 1);

export const DIS_CAP = 5000;

export function boostFor(cat: DisCat, wave: number): number {
  const w = Math.min(Math.max(0, wave), DIS_CAP) / DIS_CAP;
  const mult = cat === 'Utility' ? 2 : 4;
  return 1 + mult * Math.pow(w, 1.75);
}

export function gapToCap(wave: number): number {
  return Math.max(0, DIS_CAP - Math.max(0, wave));
}

export interface DisOverride {
  tier: number;
  cat: DisCat;
  wave: number;
}

export function recordsFromRuns(runs: Run[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const r of runs) {
    if (r.runType !== 'dissonance' || typeof r.dissonance !== 'string') continue;
    if (!(DIS_CATS as readonly string[]).includes(r.dissonance)) continue;
    if (!Number.isInteger(r.tier) || r.tier < 1 || r.tier > 25 || !(r.wave > 0)) continue;
    const key = `${r.tier}|${r.dissonance}`;
    best.set(key, Math.max(best.get(key) ?? 0, r.wave));
  }
  return best;
}

export function bestOf(
  tier: number,
  cat: DisCat,
  fromRuns: Map<string, number>,
  overrides: DisOverride[],
): number {
  const a = fromRuns.get(`${tier}|${cat}`) ?? 0;
  const b = overrides
    .filter((o) => o.tier === tier && o.cat === cat && o.wave > 0)
    .reduce((m, o) => Math.max(m, o.wave), 0);
  return Math.max(a, b);
}

export interface QueueEntry {
  tier: number;
  cat: DisCat;
  best: number;
  gap: number;
}

export function buildQueue(
  fromRuns: Map<string, number>,
  overrides: DisOverride[],
): QueueEntry[] {
  const out: QueueEntry[] = [];
  for (const tier of DIS_TIERS) {
    for (const cat of CAT_ORDER) {
      const best = bestOf(tier, cat, fromRuns, overrides);
      const gap = gapToCap(best);
      if (gap <= 0) continue;
      out.push({ tier, cat, best, gap });
    }
  }
  return out;
}
