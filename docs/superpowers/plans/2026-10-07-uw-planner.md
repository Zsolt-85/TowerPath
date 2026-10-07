# UW Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Click-to-plan Ultimate Weapon upgrades with exact stone costs, sync-safe cooldown jumps, and a priority spending queue.

**Architecture:** Pure engine `lib/uw.ts` (track tables, next-buy/jump costs, sync milestones, deterministic queue) consumed by a new `UWPlanner.tsx` rendered inside the existing UW tab; owned levels, plus levels, and stone wallet persisted under `towerpath:uw:*`.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars, localStorage via `useLocalStorage`.

**Spec:** `docs/superpowers/specs/2026-10-07-uw-planner-design.md` (all 6 sections; this plan covers §1–§4+§6).

## Global Constraints

Spec §Global constraints applies in full (the UW planner spec has no separate constraints section;
the shared project rules bind every task). Additionally: costs come only from
`ultimate-weapons-data.ts` tables (incremental interpretation); sync logic applies only to a
track literally named `Cooldown` on GT/BH/DW; CL and SL have no Cooldown track and the engine
must not assume one.

---

### Task 1: Engine (`lib/uw.ts`)

**Files:**
- Create: `src/app/lib/uw.ts`
- Test: throwaway Node script (deleted afterwards)

**Interfaces:**
- Consumes: `ULTIMATE_WEAPONS`, `ULTIMATE_WEAPON_NAMES`, `UNLOCK_COSTS`, `PLUS_UNLOCK_COSTS` from `src/app/data/ultimate-weapons-data.ts`.
- Produces: `UWLevels`, `trackDefs`, `nextBuy`, `rangeCost`, `cooldownAt`, `UW_PRIORITY`, `SYNC_MILESTONES`, `SyncPlan`, `syncJumps`, `QueueItem`, `buildQueue`, `unlockCostFor`, `plusNext` — consumed by Task 2.

- [ ] **Step 1: Write the engine file** (exact code below — transcribe verbatim)

```ts
import {
  ULTIMATE_WEAPONS,
  ULTIMATE_WEAPON_NAMES,
  UNLOCK_COSTS,
  PLUS_UNLOCK_COSTS,
} from '../data/ultimate-weapons-data';

export type UWLevels = Record<string, Record<string, number>>;

interface TrackTable {
  values: { value: number; cost: number }[];
  formatValue: (v: number) => string;
}

interface UWEntry {
  upgrades: Record<string, TrackTable>;
  plus: { name: string; cost: readonly number[]; values: readonly unknown[] };
}

function entryOf(uw: string): UWEntry | null {
  const e = (ULTIMATE_WEAPONS as Record<string, unknown>)[uw];
  if (e == null || typeof e !== 'object') return null;
  const upgrades = (e as { upgrades?: unknown }).upgrades;
  const plus = (e as { plus?: unknown }).plus;
  if (upgrades == null || typeof upgrades !== 'object') return null;
  return { upgrades: upgrades as Record<string, TrackTable>, plus: plus as UWEntry['plus'] };
}

export interface UWTrackDef {
  name: string;
  values: { value: number; cost: number }[];
  format: (v: number) => string;
}

export function trackDefs(uw: string): UWTrackDef[] {
  const e = entryOf(uw);
  if (!e) return [];
  return Object.entries(e.upgrades)
    .filter(([, t]) => Array.isArray(t.values) && typeof t.formatValue === 'function')
    .map(([name, t]) => ({ name, values: t.values, format: t.formatValue }));
}

export interface NextBuy {
  value: number;
  cost: number;
  maxed: boolean;
}

export function nextBuy(uw: string, track: string, level: number): NextBuy | null {
  const d = trackDefs(uw).find((x) => x.name === track);
  if (!d || d.values.length === 0) return null;
  const clamped = Math.max(0, Math.min(d.values.length - 1, Math.floor(level) || 0));
  const cur = d.values[clamped];
  const nxt = d.values[clamped + 1];
  if (!nxt) return { value: cur.value, cost: 0, maxed: true };
  return { value: nxt.value, cost: nxt.cost, maxed: false };
}

export function rangeCost(uw: string, track: string, fromIdx: number, toIdx: number): number {
  const d = trackDefs(uw).find((x) => x.name === track);
  if (!d) return 0;
  const lo = Math.max(0, Math.min(fromIdx, toIdx));
  const hi = Math.min(d.values.length - 1, Math.max(fromIdx, toIdx));
  let sum = 0;
  for (let i = lo + 1; i <= hi; i += 1) sum += d.values[i].cost;
  return sum;
}

export function cooldownAt(uw: string, level: number): number | null {
  const d = trackDefs(uw).find((x) => x.name === 'Cooldown');
  if (!d || d.values.length === 0) return null;
  const clamped = Math.max(0, Math.min(d.values.length - 1, Math.floor(level) || 0));
  return d.values[clamped].value;
}

export function cooldownIndex(uw: string, value: number): number | null {
  const d = trackDefs(uw).find((x) => x.name === 'Cooldown');
  if (!d) return null;
  const i = d.values.findIndex((v) => v.value === value);
  return i >= 0 ? i : null;
}

export const UW_PRIORITY = [
  'Golden Tower',
  'Black Hole',
  'Spotlight',
  'Death Wave',
  'Chain Lightning',
  'Smart Missiles',
  'Inner Land Mines',
  'Poison Swamp',
  'Chrono Field',
];

export const SYNC_MILESTONES = [200, 150, 100, 50];

export interface SyncJump {
  uw: string;
  from: number;
  to: number;
  cost: number;
}

export interface SyncPlan {
  current: Record<string, number>;
  target: number;
  jumps: SyncJump[];
  total: number;
}

const SYNC_TRIO = ['Golden Tower', 'Black Hole', 'Death Wave'];

export function trioCooldowns(levels: UWLevels): Record<string, number> | null {
  const out: Record<string, number> = {};
  for (const uw of SYNC_TRIO) {
    const cd = cooldownAt(uw, levels[uw]?.['Cooldown'] ?? 0);
    if (cd == null) return null;
    out[uw] = cd;
  }
  return out;
}

export function syncJumps(levels: UWLevels): SyncPlan | null {
  const cur = trioCooldowns(levels);
  if (!cur) return null;
  const vals = SYNC_TRIO.map((u) => cur[u]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const target = SYNC_MILESTONES.find((m) => m <= lo && m < hi) ?? null;
  if (target == null) return null;
  const jumps: SyncJump[] = [];
  for (const uw of SYNC_TRIO) {
    if (cur[uw] <= target) continue;
    const fromIdx = cooldownIndex(uw, cur[uw]);
    const toIdx = cooldownIndex(uw, target);
    if (fromIdx == null || toIdx == null) continue;
    jumps.push({ uw, from: cur[uw], to: target, cost: rangeCost(uw, 'Cooldown', fromIdx, toIdx) });
  }
  if (jumps.length === 0) return null;
  return { current: cur, target, jumps, total: jumps.reduce((m, j) => m + j.cost, 0) };
}

export function unlockCostFor(unlockedCount: number): number {
  const arr = UNLOCK_COSTS as readonly number[];
  if (unlockedCount < 0) return arr[0];
  return arr[Math.min(unlockedCount, arr.length - 1)];
}

export interface PlusBuy {
  name: string;
  level: number;
  cost: number;
  maxed: boolean;
}

export function plusNext(uw: string, level: number): PlusBuy | null {
  const e = entryOf(uw);
  if (!e || !e.plus || !Array.isArray(e.plus.cost)) return null;
  const costs = e.plus.cost as readonly number[];
  const clamped = Math.max(0, Math.floor(level) || 0);
  const nxt = costs[clamped + 1];
  if (nxt == null) return { name: e.plus.name, level: clamped, cost: 0, maxed: true };
  return { name: e.plus.name, level: clamped, cost: nxt, maxed: false };
}

export type QueueKind = 'sync' | 'unlock' | 'next' | 'plus';

export interface QueueItem {
  uw: string;
  track: string | null;
  from: string;
  to: string;
  cost: number;
  reason: string;
  kind: QueueKind;
}

export function buildQueue(
  levels: UWLevels,
  plus: Record<string, number>,
  unlocked: Record<string, boolean>,
  unlockedCount: number,
): QueueItem[] {
  const items: QueueItem[] = [];
  const plan = syncJumps(levels);
  if (plan) {
    for (const j of plan.jumps) {
      items.push({
        uw: j.uw,
        track: 'Cooldown',
        from: `${j.from}s`,
        to: `${j.to}s`,
        cost: j.cost,
        reason: `Completes ${plan.target}s trio sync in one jump — never buy cooldowns incrementally`,
        kind: 'sync',
      });
    }
  }
  const locked = (ULTIMATE_WEAPON_NAMES as readonly string[]).filter((n) => !unlocked[n]);
  if (locked.length > 0) {
    const ordered = [...locked].sort(
      (a, b) => UW_PRIORITY.indexOf(a) - UW_PRIORITY.indexOf(b),
    );
    const next = ordered[0];
    items.push({
      uw: next,
      track: null,
      from: 'locked',
      to: 'unlocked',
      cost: unlockCostFor(unlockedCount),
      reason: `Next unlock by wiki priority (${UW_PRIORITY.indexOf(next) + 1} of 9)`,
      kind: 'unlock',
    });
  }
  for (const uw of UW_PRIORITY) {
    if (!unlocked[uw]) continue;
    for (const d of trackDefs(uw)) {
      const lvl = levels[uw]?.[d.name] ?? 0;
      const nb = nextBuy(uw, d.name, lvl);
      if (!nb || nb.maxed) continue;
      if (d.name === 'Cooldown' && plan && plan.jumps.some((j) => j.uw === uw)) continue;
      const curVal = d.values[Math.min(lvl, d.values.length - 1)].value;
      items.push({
        uw,
        track: d.name,
        from: d.format(curVal),
        to: d.format(nb.value),
        cost: nb.cost,
        reason: `${uw} is priority ${UW_PRIORITY.indexOf(uw) + 1} of 9`,
        kind: 'next',
      });
    }
  }
  if (locked.length === 0) {
    for (const uw of UW_PRIORITY) {
      const pb = plusNext(uw, plus[uw] ?? 0);
      if (!pb || pb.maxed) continue;
      items.push({
        uw,
        track: pb.name,
        from: `+${pb.level}`,
        to: `+${pb.level + 1}`,
        cost: pb.cost,
        reason: 'Enhancement track — all 9 UWs unlocked',
        kind: 'plus',
      });
    }
  }
  const kindRank: Record<QueueKind, number> = { sync: 0, unlock: 1, next: 2, plus: 3 };
  return items.sort(
    (a, b) =>
      kindRank[a.kind] - kindRank[b.kind] ||
      UW_PRIORITY.indexOf(a.uw) - UW_PRIORITY.indexOf(b.uw) ||
      a.cost - b.cost,
  );
}
```

- [ ] **Step 2: Verify costs with a throwaway Node script**

Port `rangeCost` semantics (sum of per-step costs over the index range) plus the GT/BH/DW
Cooldown tables by copying the three `values` arrays verbatim from
`src/app/data/ultimate-weapons-data.ts` into
`C:\Users\maias\AppData\Local\Temp\opencode\uw-test.js` and assert:
GT 300→200 (index of value 300 to index of value 200) sums to exactly 910; BH 200 stays 200
(zero-length range costs 0); DW 300→200 prints its sum WITHOUT asserting (known community
discrepancy: one guide says 600 — record the printed number in the commit message body as
`DW-table-check: <sum>`); `nextBuy` at last index returns `maxed: true`; `cooldownIndex` of a
missing value returns null. Delete the file afterwards.

Expected: GT assertion PASS, DW number printed, others PASS.
- [ ] **Step 3: Run `npx tsc --noEmit`** (working directory `C:\Projects\The Tower`). Expected: exit 0.
- [ ] **Step 4: Commit**

```bash
git add src/app/lib/uw.ts
git commit -m "UW planner engine with sync-safe jump math" -m "DW-table-check: <sum from test>"
```

(working directory `C:\Projects\The Tower`; replace `<sum from test>` with the printed number.)

### Task 2: Planner UI (`UWPlanner.tsx` + UWTab integration)

**Files:**
- Create: `src/app/components/UWPlanner.tsx`
- Modify: `src/app/components/UWTab.tsx` (render `<UWPlanner />` below the existing planner card)

**Interfaces:**
- Consumes: engine from Task 1; `useLocalStorage` from `src/app/hooks/useLocalStorage.ts`; owned unlocks from existing store key `towerpath:uw:unlocked` (same defaults as UWTab — read-only here, UWTab owns the toggles).
- Produces: exported `UWPlanner()` — rendered by UWTab.

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ULTIMATE_WEAPON_NAMES } from '../data/ultimate-weapons-data';
import {
  trackDefs,
  nextBuy,
  plusNext,
  buildQueue,
  syncJumps,
  type UWLevels,
} from '../lib/uw';

export function UWPlanner() {
  const [unlocked] = useLocalStorage<Record<string, boolean>>('towerpath:uw:unlocked', {});
  const [levels, setLevels] = useLocalStorage<UWLevels>('towerpath:uw:levels', {});
  const [plus, setPlus] = useLocalStorage<Record<string, number>>('towerpath:uw:plus', {});
  const [stones, setStones] = useLocalStorage('towerpath:uw:stones', 0);
  const [openUw, setOpenUw] = useState<string | null>(null);

  const names = [...(ULTIMATE_WEAPON_NAMES as readonly string[])];
  const owned = names.filter((n) => unlocked[n]);
  const queue = useMemo(
    () => buildQueue(levels, plus, unlocked, owned.length),
    [levels, plus, unlocked, owned.length],
  );
  const sync = useMemo(() => syncJumps(levels), [levels]);
  let running = 0;

  const bump = (uw: string, track: string, delta: number) =>
    setLevels((prev) => {
      const max = trackDefs(uw).find((d) => d.name === track)?.values.length ?? 1;
      const cur = prev[uw]?.[track] ?? 0;
      const next = Math.max(0, Math.min(max - 1, cur + delta));
      return { ...prev, [uw]: { ...prev[uw], [track]: next } };
    });
  const applyQueue = (uw: string, track: string | null) => {
    if (!track) return;
    bump(uw, track, 1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Stone wallet</div>
          <input
            type="number"
            min={0}
            value={stones}
            onChange={(e) => setStones(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold"
          />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Trio sync</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">
            {sync ? `${sync.target}s for ${sync.total.toLocaleString()}◇` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Queued cost</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">
            {queue.reduce((m, q) => m + q.cost, 0).toLocaleString()}◇
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">UWs owned</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{owned.length}/{names.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Spending queue</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Sync jumps first, then wiki-priority order. Click ✓ to apply a buy to your owned levels.
        </p>
        <div className="space-y-2">
          {queue.slice(0, 12).map((q, i) => {
            running += q.cost;
            const afford = q.cost <= stones;
            return (
              <div key={`${q.uw}-${q.track}-${i}`} className="flex items-center gap-3 text-sm rounded-xl border border-[var(--color-border)] px-4 py-3">
                <span className="font-['Orbitron'] font-bold text-[var(--color-gold)] w-8">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">
                    {q.uw}{q.track ? ` · ${q.track}` : ''} <span className="text-[var(--color-text-muted)]">{q.from} → {q.to}</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">{q.reason}</div>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">Σ {running.toLocaleString()}◇</span>
                <span className={`font-['Orbitron'] font-bold whitespace-nowrap ${afford ? 'text-[var(--color-teal)]' : 'text-[var(--color-gold)]'}`}>
                  {q.cost.toLocaleString()}◇
                </span>
                {q.track && q.kind !== 'unlock' && (
                  <button onClick={() => applyQueue(q.uw, q.track)} title="Apply this buy" className="text-xs border border-[var(--color-gold-dim)] text-[var(--color-gold)] rounded-lg px-2 py-1 hover:bg-[var(--color-gold-glow)]">
                    ✓
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {names.filter((n) => unlocked[n]).map((uw) => (
        <div key={uw} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <button onClick={() => setOpenUw((v) => (v === uw ? null : uw))} className="w-full flex items-center justify-between">
            <h3 className="font-['Orbitron'] text-base font-bold">{uw}</h3>
            <span className="text-xs text-[var(--color-text-muted)]">{openUw === uw ? '▾' : '▸'}</span>
          </button>
          {openUw === uw && (
            <div className="space-y-2 mt-4">
              {trackDefs(uw).map((d) => {
                const lvl = levels[uw]?.[d.name] ?? 0;
                const nb = nextBuy(uw, d.name, lvl);
                const cur = d.values[Math.min(lvl, d.values.length - 1)];
                return (
                  <div key={d.name} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_90px] gap-3 items-center rounded-xl border border-[var(--color-border)] px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{d.name}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {d.format(cur.value)}{nb && !nb.maxed ? <> → {d.format(nb.value)} · {nb.cost.toLocaleString()}◇</> : ' · MAX'}
                      </div>
                    </div>
                    <div className="hidden sm:block text-[11px] text-[var(--color-text-muted)] text-center">Lv {lvl}/{d.values.length - 1}</div>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => bump(uw, d.name, -1)} className="w-8 h-8 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-all">−</button>
                      <button onClick={() => bump(uw, d.name, 1)} className="w-8 h-8 rounded-lg border border-[var(--color-gold-dim)] text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)] transition-all">+</button>
                    </div>
                  </div>
                );
              })}
              {(() => {
                const pb = plusNext(uw, plus[uw] ?? 0);
                if (!pb) return null;
                return (
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-xl border border-dashed border-[var(--color-border-light)] px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{pb.name} <span className="text-[10px] uppercase text-[var(--color-text-muted)]">enhancement</span></div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {pb.maxed ? 'MAX' : `+${pb.level} → +${pb.level + 1} · ${pb.cost.toLocaleString()}◇`}
                      </div>
                    </div>
                    {!pb.maxed && (
                      <button onClick={() => setPlus((prev) => ({ ...prev, [uw]: (prev[uw] ?? 0) + 1 }))} className="w-8 h-8 rounded-lg border border-[var(--color-gold-dim)] text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)] transition-all">+</button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Costs come straight from the in-game upgrade tables. Sync guidance: keep Black Hole at 200s,
        buy GT/BH/DW cooldowns only as one-go jumps — incremental cuts desync the trio for months of
        lost coins. Multiverse Nexus averages the trio as a fallback (Epic +20 / Legendary +10 /
        Mythic +1 / Ancestral −10).
      </p>
    </div>
  );
}
```

Then in `UWTab.tsx`: add `import { UWPlanner } from './UWPlanner';` and render `<UWPlanner />`
after the existing planner card closes (before the outer `</div>`), keeping all existing
unlock/sync UI untouched.

- [ ] **Step 2: Run `npx tsc --noEmit`** (working directory `C:\Projects\The Tower`). Expected: exit 0.
- [ ] **Step 3: Commit**

```bash
git add src/app/components/UWPlanner.tsx src/app/components/UWTab.tsx
git commit -m "UW planner with spending queue and sync jumps"
```

### Task 3: Verify (tsc + build + push + live)

**Files:** none (verification only).

- [ ] **Step 1: Run `npx tsc --noEmit` then `npx next build`** (working directory `C:\Projects\The Tower`).

Expected: both exit 0.
- [ ] **Step 2: Commit and push** — if Tasks 1–2 already committed everything and the tree is
clean, push directly with `git push origin main`; otherwise first `git add -A` + inspect
`git status --short` and commit only intended files. (Push to origin main is pre-authorized.)
- [ ] **Step 3: Verify production bundle**

Wait ~4 min, fetch `https://tower-path.vercel.app/`, extract `/_next/static/*.js` URLs, download
each, count matches of `Spending queue`. Expected: exactly 1 hit. If 0 after 6+ minutes, report
DONE_WITH_CONCERNS with timing details (do not push again).
