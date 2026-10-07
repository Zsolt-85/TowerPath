import type { Run } from '../hooks/useLocalStorage';
import type { Tournament } from '../components/TournamentTab';

export interface Snapshot {
  date: string;
  runs: number;
  bestWave: number;
  totalCoins: number;
  avgCph: number;
  tournaments: number;
  bestRank: number | null;
}

export const SNAP_KEY = 'towerpath:snapshots';
export const LAST_KEY = 'towerpath:snapshots:last';
const CAP = 400;

function dayOf(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function readSnaps(): Snapshot[] {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    const arr = raw != null ? (JSON.parse(raw) as Snapshot[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeSnaps(snaps: Snapshot[]): void {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(snaps.slice(-CAP)));
  } catch {
    // storage full: keep in-memory state only
  }
}

export function buildSnapshot(runs: Run[], tournaments: Tournament[], nowISO: string): Snapshot | null {
  if (runs.length === 0 && tournaments.length === 0) return null;
  const bestWave = runs.reduce((m, r) => Math.max(m, r.wave), 0);
  const totalCoins = runs.reduce((m, r) => m + r.coins, 0);
  const perHour = runs.map((r) => (r.durationMin > 0 ? (r.coins / r.durationMin) * 60 : 0));
  const avgCph = perHour.length > 0 ? perHour.reduce((a, b) => a + b, 0) / perHour.length : 0;
  const ranks = tournaments.map((t) => t.rank).filter((n) => n > 0);
  return {
    date: nowISO,
    runs: runs.length,
    bestWave,
    totalCoins,
    avgCph,
    tournaments: tournaments.length,
    bestRank: ranks.length > 0 ? Math.min(...ranks) : null,
  };
}

export function recordSnapshot(runs: Run[], tournaments: Tournament[], nowISO?: string): Snapshot | null {
  const now = nowISO ?? new Date().toISOString();
  const snaps = readSnaps();
  const snap = buildSnapshot(runs, tournaments, now);
  if (!snap) return null;
  const today = dayOf(now);
  const idx = snaps.findIndex((s) => dayOf(s.date) === today);
  if (idx >= 0) snaps[idx] = snap;
  else snaps.push(snap);
  writeSnaps(snaps);
  try {
    localStorage.setItem(LAST_KEY, today);
  } catch {
    // ignore
  }
  return snap;
}

export function getSnapshots(): Snapshot[] {
  return readSnaps();
}

export type Metric = 'bestWave' | 'totalCoins' | 'avgCph' | 'runs';

export function series(snaps: Snapshot[], metric: Metric): { date: string; value: number }[] {
  return snaps.map((s) => ({ date: dayOf(s.date), value: s[metric] }));
}

export interface Deltas {
  days: number;
  waveGain: number;
  coinsGain: number;
  cphGrowth: number | null;
}

export function deltas(snaps: Snapshot[]): Deltas | null {
  if (snaps.length < 2) return null;
  const first = snaps[0];
  const last = snaps[snaps.length - 1];
  const days = Math.max(
    1,
    Math.round((Date.parse(last.date) - Date.parse(first.date)) / 86400000),
  );
  return {
    days,
    waveGain: last.bestWave - first.bestWave,
    coinsGain: last.totalCoins - first.totalCoins,
    cphGrowth: first.avgCph > 0 ? last.avgCph / first.avgCph : null,
  };
}
