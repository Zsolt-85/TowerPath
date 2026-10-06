# Progression Snapshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily progression snapshots (best wave, coins, CPH, tournaments) recorded automatically and charted in the Tracker with since-first deltas.

**Architecture:** Pure engine in `src/app/lib/snapshots.ts` (snapshot builders, day-bucketing, series/deltas) plus a once-per-day auto-record hook called from `page.tsx`, surfaced as a new section in `TrackerTab.tsx`.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars, localStorage via `useLocalStorage`.

**Spec:** `docs/superpowers/specs/2026-10-07-rend-parity-spec.md` (SP-2).

## Global Constraints

Spec §Global constraints applies in full. Snapshots derive only from stored runs/tournaments —
never invent values when stores are empty (empty store = no snapshot that day).

---

### Task 1: Engine (`lib/snapshots.ts`)

**Files:**
- Create: `src/app/lib/snapshots.ts`
- Test: throwaway Node script (deleted afterwards)

**Interfaces:**
- Consumes: `Run` type from `src/app/hooks/useLocalStorage.ts`; `Tournament` type from `src/app/components/TournamentTab.tsx` (type-only import).
- Produces: `Snapshot`, `SNAP_KEY`, `LAST_KEY`, `buildSnapshot(runs, tournaments, nowISO)`, `recordSnapshot(runs, tournaments, nowISO?)`, `getSnapshots()`, `series(snaps, metric)`, `deltas(snaps)` — consumed by Tasks 2–3.

- [ ] **Step 1: Write the engine file**

```ts
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
```

- [ ] **Step 2: Verify day-bucketing with a throwaway Node script**

Run: port `dayOf` + the replace-same-day branch into `C:\Users\maias\AppData\Local\Temp\opencode\snap-test.js` with an in-memory store and assert: two records same day → 1 entry (second wins); records on 3 days → 3 entries; `deltas` waveGain equals last minus first. Delete the file afterwards.

Expected: all assertions print PASS.
- [ ] **Step 3: Run `npx tsc --noEmit`**

Expected: exit 0.
- [ ] **Step 4: Commit**

```bash
git add src/app/lib/snapshots.ts
git commit -m "Daily progression snapshot engine"
```

### Task 2: Auto-record hook + Tracker UI

**Files:**
- Modify: `src/app/page.tsx` (call `recordSnapshot` once per day on open)
- Modify: `src/app/components/TrackerTab.tsx` (Progression section: deltas + series)

**Interfaces:**
- Consumes: engine from Task 1; existing `useRuns`, tournament store key `towerpath:tournaments`.
- Produces: visible Progression section — verified in Task 3.

- [ ] **Step 1: Add auto-record to `page.tsx`**

Insert after the `runs` hook (component already imports `useRuns`; add `useEffect` to the React import
if missing, and import `recordSnapshot`, `LAST_KEY` from `./lib/snapshots` plus the `Tournament` type):

```tsx
useEffect(() => {
  const today = new Date().toISOString().slice(0, 10);
  let last = '';
  try {
    last = localStorage.getItem(LAST_KEY) ?? '';
  } catch {
    last = '';
  }
  if (last === today) return;
  let tournaments: Tournament[] = [];
  try {
    const raw = localStorage.getItem('towerpath:tournaments');
    const arr = raw != null ? (JSON.parse(raw) as Tournament[]) : [];
    if (Array.isArray(arr)) tournaments = arr;
  } catch {
    tournaments = [];
  }
  recordSnapshot(runs, tournaments);
}, [runs]);
```

- [ ] **Step 2: Add the Progression section to `TrackerTab.tsx`**

Read `TrackerTab.tsx` first and place this block after the existing totals/cards area. It reads
snapshots once per render of new data via a version counter on the `towerpath:store` event is
overkill — instead recompute when `runs` change (snapshots only change on record, which happens on
open before runs load; acceptable and honest):

```tsx
import { getSnapshots, deltas, series } from '../lib/snapshots';
import { formatBig } from '../hooks/useLocalStorage';

// inside the component, after existing useMemos:
const snaps = useMemo(() => getSnapshots(), [runs]);
const prog = useMemo(() => deltas(snaps), [snaps]);
const waveSeries = useMemo(() => series(snaps, 'bestWave'), [snaps]);
```

Render (only when `snaps.length >= 2`; with 0–1 snapshots show one line
`"Progression unlocks after 2 days of snapshots — {snaps.length}/2 recorded."`):

```tsx
{prog ? (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
    <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Progression · last {prog.days} days</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {[
        { label: 'Wave gain', value: prog.waveGain >= 0 ? `+${prog.waveGain.toLocaleString()}` : String(prog.waveGain) },
        { label: 'Coins gained', value: `+${formatBig(Math.max(0, prog.coinsGain))}` },
        { label: 'CPH growth', value: prog.cphGrowth != null ? `${prog.cphGrowth.toFixed(2)}x` : '—' },
        { label: 'Snapshots', value: String(snaps.length) },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
          <div className="font-['Orbitron'] text-xl font-bold mt-1">{s.value}</div>
        </div>
      ))}
    </div>
    <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Best wave per day</div>
    <div className="flex items-end gap-1 h-24">
      {waveSeries.map((p) => {
        const max = Math.max(1, ...waveSeries.map((q) => q.value));
        return (
          <div key={p.date} title={`${p.date}: ${p.value.toLocaleString()}`} className="flex-1 rounded-sm bg-[var(--color-gold)]" style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }} />
        );
      })}
    </div>
  </div>
) : (
  <p className="text-xs text-[var(--color-text-muted)]">
    Progression unlocks after 2 days of snapshots — {snaps.length}/2 recorded.
  </p>
)}
```

- [ ] **Step 3: Run `npx tsc --noEmit` then `npx next build`**

Expected: both exit 0.
- [ ] **Step 4: Commit and push**

```bash
git add src/app/page.tsx src/app/components/TrackerTab.tsx
git commit -m "Daily snapshots with Tracker progression section"
git push origin main
```

- [ ] **Step 5: Verify production**

Wait ~4 min, fetch `https://tower-path.vercel.app/`, confirm HTTP 200 (snapshots are per-browser
local data, so bundle content is unchanged — no bundle grep applies; instead open the Tracker tab
and confirm the progression line or section renders without console errors).
