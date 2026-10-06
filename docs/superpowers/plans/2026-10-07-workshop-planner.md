# Workshop Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Workshop tab that turns target effect values into exact levels-needed plus an exact coin unlock shopping list.

**Architecture:** Pure engine in `src/app/lib/workshop.ts` (spec maps, linear interpolation, inverted targets, unlock lookup) consumed by a new `WorkshopTab.tsx` with manual persisted level inputs; wired into sidebar/page like the Labs tab.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars, localStorage via `useLocalStorage`.

**Spec:** `docs/superpowers/specs/2026-10-07-rend-parity-spec.md` (SP-1).

## Global Constraints

Spec §Global constraints applies in full. Additionally: never display per-level coin upgrade costs
(the curve is not in the data); only exact interpolated effects and exact unlock costs.

---

### Task 1: Engine (`lib/workshop.ts`)

**Files:**
- Create: `src/app/lib/workshop.ts`
- Test: throwaway Node script (deleted afterwards)

**Interfaces:**
- Consumes: `ATTACK_UPGRADES`, `DEFENSE_UPGRADES`, `UTILITY_UPGRADES`, `ATTACK_UNLOCKS`, `DEFENSE_UNLOCKS`, `UTILITY_UNLOCKS` from `src/app/data/workshop-data.ts` (entries `{ name, min, max, quantity, cost }`; unlocks `{ name, cost, upgrades }`).
- Produces: `WorkshopSpec`, `allSpecs()`, `valueAt(spec, level)`, `levelsForTarget(spec, target)`, `unlockForUpgrade(name)`, `planUpgrades(specs, levels, targets)` — consumed by Task 2.

- [ ] **Step 1: Write the engine file**

```ts
import {
  ATTACK_UPGRADES,
  DEFENSE_UPGRADES,
  UTILITY_UPGRADES,
  ATTACK_UNLOCKS,
  DEFENSE_UNLOCKS,
  UTILITY_UNLOCKS,
} from '../data/workshop-data';

export type WorkshopTree = 'Attack' | 'Defense' | 'Utility';

export interface WorkshopSpec {
  name: string;
  min: number;
  max: number;
  quantity: number;
  tree: WorkshopTree;
}

interface RawSpec {
  name?: unknown;
  min?: unknown;
  max?: unknown;
  quantity?: unknown;
}

function toSpecs(
  table: Record<string, unknown>,
  tree: WorkshopTree,
): WorkshopSpec[] {
  return Object.entries(table)
    .map(([key, raw]) => {
      const r = raw as RawSpec;
      if (typeof r.name !== 'string') return null;
      const min = Number(r.min);
      const max = Number(r.max);
      const quantity = Number(r.quantity);
      if (![min, max, quantity].every(Number.isFinite) || quantity <= 0) return null;
      void key;
      return { name: r.name, min, max, quantity, tree };
    })
    .filter((s): s is WorkshopSpec => s !== null);
}

export function allSpecs(): WorkshopSpec[] {
  return [
    ...toSpecs(ATTACK_UPGRADES as Record<string, unknown>, 'Attack'),
    ...toSpecs(DEFENSE_UPGRADES as Record<string, unknown>, 'Defense'),
    ...toSpecs(UTILITY_UPGRADES as Record<string, unknown>, 'Utility'),
  ];
}

export function valueAt(spec: WorkshopSpec, level: number): number {
  const l = Math.min(spec.quantity, Math.max(0, level));
  return spec.min + ((spec.max - spec.min) * l) / spec.quantity;
}

export function levelsForTarget(spec: WorkshopSpec, target: number): number {
  if (target <= spec.min) return 0;
  if (target >= spec.max) return spec.quantity;
  if (spec.max === spec.min) return 0;
  return Math.min(
    spec.quantity,
    Math.max(0, Math.ceil(((target - spec.min) * spec.quantity) / (spec.max - spec.min))),
  );
}

export interface UnlockInfo {
  tier: string;
  cost: number;
}

export function unlockForUpgrade(upgradeName: string): UnlockInfo | null {
  const groups: { tier: string; list: { name: string; cost: number; upgrades: string[] }[] }[] = [
    { tier: 'Attack', list: ATTACK_UNLOCKS as { name: string; cost: number; upgrades: string[] }[] },
    { tier: 'Defense', list: DEFENSE_UNLOCKS as { name: string; cost: number; upgrades: string[] }[] },
    { tier: 'Utility', list: UTILITY_UNLOCKS as { name: string; cost: number; upgrades: string[] }[] },
  ];
  for (const g of groups) {
    for (const u of g.list) {
      if (u.cost > 0 && u.upgrades.includes(upgradeName)) {
        return { tier: `${g.tier} · ${u.name}`, cost: u.cost };
      }
    }
  }
  return null;
}

export interface UpgradePlan {
  name: string;
  tree: WorkshopTree;
  from: number;
  to: number;
  effectFrom: number;
  effectTo: number;
  unlock: UnlockInfo | null;
}

export function planUpgrades(
  specs: WorkshopSpec[],
  levels: Record<string, number>,
  targets: Record<string, number>,
): UpgradePlan[] {
  return specs
    .map((spec) => {
      const from = Math.max(0, Math.min(spec.quantity, Math.floor(Number(levels[spec.name]) || 0)));
      const to = Math.max(from, Math.min(spec.quantity, Math.floor(Number(targets[spec.name]) || from)));
      if (to <= from) return null;
      return {
        name: spec.name,
        tree: spec.tree,
        from,
        to,
        effectFrom: valueAt(spec, from),
        effectTo: valueAt(spec, to),
        unlock: from === 0 ? unlockForUpgrade(spec.name) : null,
      };
    })
    .filter((p): p is UpgradePlan => p !== null);
}
```

- [ ] **Step 2: Verify math with a throwaway Node script**

Run: save the snippet below to `C:\Users\maias\AppData\Local\Temp\opencode\ws-test.js` and run `node <file>`, then delete it.

```js
const valueAt = (spec, level) => {
  const l = Math.min(spec.quantity, Math.max(0, level));
  return spec.min + ((spec.max - spec.min) * l) / spec.quantity;
};
const levelsForTarget = (spec, target) => {
  if (target <= spec.min) return 0;
  if (target >= spec.max) return spec.quantity;
  return Math.ceil(((target - spec.min) * spec.quantity) / (spec.max - spec.min));
};
const dmg = { min: 3, max: 9, quantity: 3 };
console.log(valueAt(dmg, 0) === 3 ? 'PASS endpoints-lo' : 'FAIL endpoints-lo');
console.log(valueAt(dmg, 3) === 9 ? 'PASS endpoints-hi' : 'FAIL endpoints-hi');
console.log(levelsForTarget(dmg, 5) === 1 ? 'PASS invert' : 'FAIL invert');
console.log(levelsForTarget(dmg, 99) === 3 ? 'PASS clamp' : 'FAIL clamp');
// Round-trip every spec shape: valueAt(levelsForTarget(t)) >= t
const specs = [
  { min: 0.4, max: 6.1, quantity: 38 },
  { min: 1200, max: 600, quantity: 300 },
  { min: 0.05, max: 35, quantity: 699 },
];
let ok = true;
for (const s of specs) {
  for (const t of [s.min, (s.min + s.max) / 2, s.max]) {
    if (valueAt(s, levelsForTarget(s, t)) < Math.min(s.min, s.max) - 1e-9) ok = false;
  }
}
console.log(ok ? 'PASS roundtrip' : 'FAIL roundtrip');
```

Expected: all four lines PASS (note the Wall Rebuild min>max shape still round-trips).
- [ ] **Step 3: Run `npx tsc --noEmit`**

Expected: exit 0, no output.
- [ ] **Step 4: Commit**

```bash
git add src/app/lib/workshop.ts
git commit -m "Workshop planner engine with exact effect math"
```

### Task 2: WorkshopTab UI

**Files:**
- Create: `src/app/components/WorkshopTab.tsx`

**Interfaces:**
- Consumes: engine from Task 1; `useLocalStorage`, `formatBig` from `src/app/hooks/useLocalStorage.ts`.
- Produces: exported `WorkshopTab()` component — consumed by Task 3.

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage, formatBig } from '../hooks/useLocalStorage';
import { allSpecs, valueAt, planUpgrades, type WorkshopTree } from '../lib/workshop';

const TREES: WorkshopTree[] = ['Attack', 'Defense', 'Utility'];

export function WorkshopTab() {
  const [tree, setTree] = useState<WorkshopTree>('Attack');
  const [levels, setLevels] = useLocalStorage<Record<string, number>>('towerpath:workshop:levels', {});
  const [targets, setTargets] = useLocalStorage<Record<string, number>>('towerpath:workshop:targets', {});
  const [wallet, setWallet] = useLocalStorage('towerpath:workshop:wallet', 0);

  const specs = useMemo(() => allSpecs(), []);
  const inTree = specs.filter((s) => s.tree === tree);
  const plan = useMemo(() => planUpgrades(specs, levels, targets), [specs, levels, targets]);
  const unlocks = plan.filter((p) => p.unlock);
  const unlockTotal = unlocks.reduce((m, p) => m + (p.unlock?.cost ?? 0), 0);
  const setLevel = (name: string, v: number) =>
    setLevels((prev) => ({ ...prev, [name]: Math.max(0, Math.floor(v) || 0) }));
  const setTarget = (name: string, v: number) =>
    setTargets((prev) => ({ ...prev, [name]: Math.max(0, Math.floor(v) || 0) }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Upgrades tracked</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{specs.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Planned upgrades</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{plan.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Unlock shopping list</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{formatBig(unlockTotal)} coins</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Wallet</div>
          <input
            type="number"
            min={0}
            value={wallet}
            onChange={(e) => setWallet(Math.max(0, Number(e.target.value) || 0))}
            className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TREES.map((t) => (
          <button
            key={t}
            onClick={() => setTree(t)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              tree === t
                ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <div className="space-y-3">
          {inTree.map((s) => {
            const cur = Math.max(0, Math.min(s.quantity, Math.floor(levels[s.name] ?? 0)));
            const tgt = Math.max(cur, Math.min(s.quantity, Math.floor(targets[s.name] ?? cur)));
            return (
              <div key={s.name} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_repeat(3,110px)] gap-3 items-center rounded-xl border border-[var(--color-border)] px-4 py-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{s.name}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {formatBig(valueAt(s, cur))} → {formatBig(valueAt(s, tgt))}
                    {tgt > cur && <> · {tgt - cur} levels</>}
                  </div>
                </div>
                <input type="number" min={0} max={s.quantity} value={cur} onChange={(e) => setLevel(s.name, Number(e.target.value))} title="Current level" className="w-[110px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
                <input type="number" min={0} max={s.quantity} value={tgt} onChange={(e) => setTarget(s.name, Number(e.target.value))} title="Target level" className="w-[110px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded text-center ${tgt > cur ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]' : 'text-[var(--color-text-dim)]'}`}>
                  {tgt > cur ? 'Planned' : `max ${s.quantity}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {unlocks.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-4">
            Unlock shopping list · {formatBig(unlockTotal)} coins{' '}
            <span className={unlockTotal <= wallet ? 'text-[var(--color-teal)]' : 'text-[var(--color-gold)]'}>
              ({unlockTotal <= wallet ? 'affordable' : 'save up'})
            </span>
          </h2>
          <div className="space-y-2">
            {unlocks.map((p) => (
              <div key={p.name} className="flex items-center gap-3 text-sm rounded-xl border border-[var(--color-border)] px-4 py-3">
                <span className="font-bold flex-1">{p.name}</span>
                <span className="text-[var(--color-text-muted)]">{p.unlock?.tier}</span>
                <span className="font-['Orbitron'] font-bold">{formatBig(p.unlock?.cost ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Effects interpolate linearly between the game min/max per level count. Per-level coin costs are
        not shown because the game cost curve is not in our data — only the exact unlock costs above.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Run `npx tsc --noEmit`**

Expected: exit 0.
- [ ] **Step 3: Commit**

```bash
git add src/app/components/WorkshopTab.tsx
git commit -m "Workshop planner tab with unlock shopping list"
```

### Task 3: Wire tab + verify live

**Files:**
- Modify: `src/app/components/Sidebar.tsx` (add `{ id: 'workshop', label: 'Workshop', icon: '⚒' }` to the Plan section of `NAV_SECTIONS` — the rendered constant, no second copy)
- Modify: `src/app/page.tsx` (import `WorkshopTab`, add `workshop: 'Workshop'` to `TITLES`, render `{activeTab === 'workshop' && <WorkshopTab />}`)

- [ ] **Step 1: Make the two wiring edits**
- [ ] **Step 2: Run `npx tsc --noEmit` then `npx next build`**

Expected: both exit 0; routes list unchanged plus static `/`.
- [ ] **Step 3: Commit and push**

```bash
git add src/app/components/Sidebar.tsx src/app/page.tsx
git commit -m "Wire Workshop tab into nav"
git push origin main
```

- [ ] **Step 4: Verify production bundle**

Run: fetch `https://tower-path.vercel.app/`, extract `/_next/static/*.js` URLs, download each,
count matches of `{id:"workshop"`. Expected: exactly 1 hit after the Vercel deployment completes
(wait ~4 min after push before checking).
