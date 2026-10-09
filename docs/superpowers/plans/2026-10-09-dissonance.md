# Dissonance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dissonance record matrix (best wave per tier/category with Echo boosts) plus a gap-ordered run queue and manual overrides.

**Architecture:** Pure engine `lib/dissonance.ts` (boost formula, records from runs + overrides, strategy-ordered queue) + `DissonanceTab`; runs gain an optional `dissonance` category set from the import modal.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars.

**Spec:** `docs/superpowers/specs/2026-10-09-excel-gaps-spec.md` (SP-3).

## Global Constraints

Spec §Global constraints applies in full. Boost formulas from the workbook:
`1+4×(min(wave,5000)/5000)^1.75` (Attack/Defense/UW), `1+2×…` (Utility); echo rates default
0.005, editable. Missing means unknown — never treat a missing record as wave 0 completed.

---

### Task 1: Engine + run type + import category

**Files:**
- Create: `src/app/lib/dissonance.ts`
- Modify: `src/app/hooks/useLocalStorage.ts` (add optional `dissonance?: string` to `Run`)
- Modify: `src/app/components/ImportModal.tsx` (category select when run type is dissonance)
- Test: throwaway Node script (deleted afterwards)

**Interfaces:**
- Consumes: `Run` type (extended); nothing else.
- Produces: `DIS_CATS`, `DIS_TIERS`, `boostFor`, `recordsFromRuns`, `bestOf`, `buildQueue`, `DisOverride` — consumed by Task 2. Runs with `dissonance` category flow into the tracker.

- [ ] **Step 1: Write the engine file**

```ts
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
```

- [ ] **Step 2: Extend the `Run` type and import modal**

In `src/app/hooks/useLocalStorage.ts`, add `dissonance?: string;` to the `Run` interface with
the comment `// dissonance category when runType === 'dissonance' (Attack | UW | Defense | Utility)`.
In `src/app/components/ImportModal.tsx`, when `runType === 'dissonance'`, show a category
`<select>` (options Attack, UW, Defense, Utility, default Attack) beside the Run type select,
and include `dissonance: category` in the saved run (omit the field for other run types).
Read both regions first; keep surrounding code untouched.

- [ ] **Step 3: Verify with a throwaway Node script**

Port `boostFor`, `gapToCap`, and the queue ordering into
`C:\Users\maias\AppData\Local\Temp\opencode\dis-test.js` and assert:
`boostFor('Attack', 5000) === 5`, `boostFor('Utility', 5000) === 3`, `boostFor('Attack', 0) === 1`,
`gapToCap(3613) === 1387` (workbook T1 Defense row), queue puts T1-Defense (gap 1387) before
T3-Defense (gap 196) and orders same-tier as Attack→UW→Defense→Utility, completed pairs
(wave ≥ 5000) excluded. Delete afterwards.

Expected: all assertions print PASS.
- [ ] **Step 4: Run `npx tsc --noEmit`**. Expected: exit 0.
- [ ] **Step 5: Commit**

```bash
git add src/app/lib/dissonance.ts src/app/hooks/useLocalStorage.ts src/app/components/ImportModal.tsx
git commit -m "Dissonance engine with run categories"
```

### Task 2: DissonanceTab UI + wiring + verify live

**Files:**
- Create: `src/app/components/DissonanceTab.tsx`
- Modify: `src/app/components/Sidebar.tsx` (add `{ id: 'dissonance', label: 'Dissonance', icon: '🌀' }` to the Track section of `NAV_SECTIONS`)
- Modify: `src/app/page.tsx` (import `DissonanceTab`, add `dissonance: 'Dissonance'` to `TITLES`, render `{activeTab === 'dissonance' && <DissonanceTab />}`)

**Interfaces:**
- Consumes: engine from Task 1; `useRuns` from hooks; echo rates + overrides persisted.
- Produces: working Dissonance tab — verified live in Step 4.

- [ ] **Step 1: Write the component** (exact code below — transcribe verbatim)

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useRuns, useLocalStorage } from '../hooks/useLocalStorage';
import {
  DIS_CATS,
  DIS_TIERS,
  boostFor,
  gapToCap,
  recordsFromRuns,
  bestOf,
  buildQueue,
  type DisCat,
  type DisOverride,
} from '../lib/dissonance';

const DEFAULT_ECHO: Record<DisCat, number> = { Attack: 0.005, UW: 0.005, Defense: 0.005, Utility: 0.005 };

export function DissonanceTab() {
  const [runs] = useRuns();
  const [echo, setEcho] = useLocalStorage<Record<DisCat, number>>('towerpath:dissonance:echo', DEFAULT_ECHO);
  const [overrides, setOverrides] = useLocalStorage<DisOverride[]>('towerpath:dissonance:overrides', []);
  const [oTier, setOTier] = useState('1');
  const [oCat, setOCat] = useState<DisCat>('Attack');
  const [oWave, setOWave] = useState('');

  const fromRuns = useMemo(() => recordsFromRuns(runs), [runs]);
  const queue = useMemo(() => buildQueue(fromRuns, overrides), [fromRuns, overrides]);
  const donePairs = 100 - queue.length;
  const frontier = queue.length > 0 ? queue[0].tier : null;
  const disRuns = runs.filter((r) => r.runType === 'dissonance').length;
  const tiersWithRecords = useMemo(() => {
    const set = new Set<number>();
    for (const tier of DIS_TIERS) {
      for (const cat of DIS_CATS) {
        if (bestOf(tier, cat, fromRuns, overrides) > 0) set.add(tier);
      }
    }
    return [...set].sort((a, b) => a - b);
  }, [fromRuns, overrides]);

  const setEchoCat = (cat: DisCat, v: number) =>
    setEcho((prev) => ({ ...prev, [cat]: Math.max(0, Math.min(1, v)) }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Completed pairs</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{donePairs}/100</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Active frontier</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{frontier != null ? `T${frontier}` : 'Done'}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Dissonance runs</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{disRuns}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Queue length</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{queue.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Run queue — lowest unfinished first</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Within a tier: Attack → UW → Defense → Utility.</p>
        <div className="space-y-2">
          {queue.slice(0, 20).map((q, i) => (
            <div key={`${q.tier}-${q.cat}`} className={`flex items-center gap-3 text-sm rounded-xl border px-4 py-3 ${i === 0 ? 'border-[var(--color-gold)] bg-[var(--color-gold-glow)]' : 'border-[var(--color-border)]'}`}>
              <span className="font-['Orbitron'] font-bold text-[var(--color-gold)] w-8">#{i + 1}</span>
              <span className="font-bold flex-1">T{q.tier} {q.cat}</span>
              <span className="text-[var(--color-text-muted)]">best {q.best.toLocaleString()} · gap {q.gap.toLocaleString()}</span>
            </div>
          ))}
          {queue.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">All 100 records complete.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Record matrix</h2>
        <div className="space-y-3">
          {tiersWithRecords.map((tier) => (
            <div key={tier} className="grid grid-cols-[52px_repeat(4,1fr)] gap-2 items-center text-sm">
              <span className="font-['Orbitron'] font-bold">T{tier}</span>
              {DIS_CATS.map((cat) => {
                const best = bestOf(tier, cat, fromRuns, overrides);
                return (
                  <div key={cat} className="rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-center">
                    <div className="text-[10px] uppercase text-[var(--color-text-muted)]">{cat}</div>
                    <div className="font-bold">{best > 0 ? best.toLocaleString() : '—'}</div>
                    <div className="text-[10px] text-[var(--color-teal)]">{best > 0 ? `${boostFor(cat, best).toFixed(2)}x` : ''}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {tiersWithRecords.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No records yet — log dissonance runs or add overrides below.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Echo rates</h2>
          <div className="grid grid-cols-2 gap-3">
            {DIS_CATS.map((cat) => (
              <div key={cat}>
                <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">{cat}</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.001}
                  value={echo[cat] ?? 0.005}
                  onChange={(e) => setEchoCat(cat, Number(e.target.value))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-3">Boosts use best wave only; echo rates are recorded for reference.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Historical overrides</h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <input type="number" min={1} max={25} value={oTier} onChange={(e) => setOTier(e.target.value)} placeholder="Tier" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            <select value={oCat} onChange={(e) => setOCat(e.target.value as DisCat)} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              {DIS_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={1} value={oWave} onChange={(e) => setOWave(e.target.value)} placeholder="Wave" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            <button
              onClick={() => {
                const tier = Math.max(1, Math.min(25, Math.floor(Number(oTier) || 0)));
                const wave = Math.max(1, Math.floor(Number(oWave) || 0));
                if (tier < 1 || wave < 1) return;
                setOverrides((prev) => [...prev, { tier, cat: oCat, wave }]);
                setOWave('');
              }}
              className="text-xs border border-[var(--color-gold-dim)] text-[var(--color-gold)] rounded-lg px-3 py-2 hover:bg-[var(--color-gold-glow)]"
            >
              ＋ Add
            </button>
          </div>
          <div className="space-y-1">
            {overrides.map((o, i) => (
              <div key={`${o.tier}-${o.cat}-${i}`} className="flex items-center gap-3 text-sm">
                <span className="flex-1">T{o.tier} {o.cat} · {o.wave.toLocaleString()} (gap {gapToCap(o.wave).toLocaleString()})</span>
                <button onClick={() => setOverrides((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] px-2 py-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Make the sidebar + page wiring edits**
- [ ] **Step 3: Run `npx tsc --noEmit` then `npx next build`**. Expected: both exit 0.
- [ ] **Step 4: Commit, push, verify production**

```bash
git add src/app/components/DissonanceTab.tsx src/app/components/Sidebar.tsx src/app/page.tsx
git commit -m "Dissonance tracker tab with W5000 queue"
git push origin main
```

Wait ~4 min, fetch `https://tower-path.vercel.app/`, extract `/_next/static/*.js` URLs, download
each, count matches of `{id:"dissonance"`. Expected: exactly 1 hit. If 0 after 6+ minutes,
report DONE_WITH_CONCERNS with timing details (do not push again).
