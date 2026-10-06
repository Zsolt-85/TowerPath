# Perk Predictor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Perks tab that turns current perk levels + bans into per-perk next-choice odds and waves-to-target math.

**Architecture:** Pure engine in `src/app/lib/perks.ts` (eligibility pools from `perks-data.ts`, uniform-within-category odds, geometric waves-to-target) consumed by a new `PerksTab.tsx` with persisted level/ban inputs; owned UWs read from the existing unlock store.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars, localStorage via `useLocalStorage`.

**Spec:** `docs/superpowers/specs/2026-10-07-rend-parity-spec.md` (SP-3).

## Global Constraints

Spec §Global constraints applies in full. The uniform-weights assumption must be stated in the UI;
never present odds as exact game values.

---

### Task 1: Engine (`lib/perks.ts`)

**Files:**
- Create: `src/app/lib/perks.ts`
- Test: throwaway Node script (deleted afterwards)

**Interfaces:**
- Consumes: `StandardPerks`, `UltimatePerks`, `TradeoffPerks`, `STANDARD_PERK_CHANCE`, `ULTIMATE_PERK_CHANCE`, `TRADEOFF_PERK_CHANCE`, `UltimateWeaponToEnum` from `src/app/data/perks-data.ts`.
- Produces: `PerkInput`, `PerkOdds`, `computeOdds(input)` — consumed by Task 2.

- [ ] **Step 1: Write the engine file**

```ts
import {
  StandardPerks,
  UltimatePerks,
  TradeoffPerks,
  STANDARD_PERK_CHANCE,
  ULTIMATE_PERK_CHANCE,
  TRADEOFF_PERK_CHANCE,
  UltimateWeaponToEnum,
} from '../data/perks-data';

export interface PerkInput {
  options: number;
  intervalWaves: number;
  banned: string[];
  levels: Record<string, number>;
  ownedUWs: string[];
}

export interface PerkOdds {
  name: string;
  category: 'STANDARD' | 'ULTIMATE' | 'TRADEOFF';
  level: number;
  maxLevel: number;
  maxed: boolean;
  banned: boolean;
  unavailable: boolean;
  pPerChoice: number;
  wavesTo50: number | null;
  wavesTo90: number | null;
}

function wavesForTarget(p: number, intervalWaves: number, target: number): number | null {
  if (!(p > 0) || p >= 1 || !(intervalWaves > 0)) return null;
  const choices = Math.log(1 - target) / Math.log(1 - p);
  return Math.ceil(choices * intervalWaves);
}

export function computeOdds(input: PerkInput): PerkOdds[] {
  const options = Math.max(1, Math.floor(input.options) || 1);
  const interval = Math.max(1, input.intervalWaves || 200);
  const banned = new Set(input.banned);
  const pools: { names: string[]; chance: number; category: PerkOdds['category']; maxOf: (n: string) => number }[] = [
    {
      names: Object.keys(StandardPerks),
      chance: STANDARD_PERK_CHANCE / 100,
      category: 'STANDARD',
      maxOf: (n) => (StandardPerks as Record<string, { maxLevel: number }>)[n].maxLevel,
    },
    {
      names: Object.keys(UltimatePerks).filter((perk) => {
        const owner = Object.keys(UltimateWeaponToEnum).find(
          (uw) => (UltimateWeaponToEnum as Record<string, string>)[uw] === perk,
        );
        return owner == null || input.ownedUWs.includes(owner);
      }),
      chance: ULTIMATE_PERK_CHANCE / 100,
      category: 'ULTIMATE',
      maxOf: (n) => (UltimatePerks as Record<string, { maxLevel: number }>)[n].maxLevel,
    },
    {
      names: Object.keys(TradeoffPerks),
      chance: TRADEOFF_PERK_CHANCE / 100,
      category: 'TRADEOFF',
      maxOf: (n) => (TradeoffPerks as Record<string, { maxLevel: number }>)[n].maxLevel,
    },
  ];
  return pools.flatMap((pool) => {
    const eligible = pool.names.filter((n) => !banned.has(n) && (input.levels[n] ?? 0) < pool.maxOf(n));
    return pool.names.map((name) => {
      const level = Math.max(0, input.levels[name] ?? 0);
      const maxLevel = pool.maxOf(name);
      const maxed = level >= maxLevel;
      const isBanned = banned.has(name);
      const unavailable = pool.category === 'ULTIMATE' && !pool.names.includes(name);
      const perSlot = eligible.length > 0 && !maxed && !isBanned ? 1 / eligible.length : 0;
      const p = pool.chance * (1 - Math.pow(1 - perSlot, options));
      return {
        name,
        category: pool.category,
        level,
        maxLevel,
        maxed,
        banned: isBanned,
        unavailable,
        pPerChoice: maxed || isBanned || unavailable ? 0 : p,
        wavesTo50: wavesForTarget(maxed || isBanned || unavailable ? 0 : p, interval, 0.5),
        wavesTo90: wavesForTarget(maxed || isBanned || unavailable ? 0 : p, interval, 0.9),
      };
    });
  });
}
```

- [ ] **Step 2: Verify odds math with a throwaway Node script**

Run: port `wavesForTarget` plus the core `p` formula into `C:\Users\maias\AppData\Local\Temp\opencode\perk-test.js` and assert: with 14 eligible standard perks, 3 options, `p` equals `0.65 * (1 - (13/14)^3)` within 1e-12; banning 7 perks raises `p`; `wavesForTarget(1, …)` is null; maxed perk yields `p = 0`. Delete the file afterwards.

Expected: all assertions print PASS.
- [ ] **Step 3: Run `npx tsc --noEmit`**

Expected: exit 0.
- [ ] **Step 4: Commit**

```bash
git add src/app/lib/perks.ts
git commit -m "Perk predictor odds engine"
```

### Task 2: PerksTab UI + wiring + verify live

**Files:**
- Create: `src/app/components/PerksTab.tsx`
- Modify: `src/app/components/Sidebar.tsx` (add `{ id: 'perks', label: 'Perks', icon: '✦' }` to the Plan section of `NAV_SECTIONS`)
- Modify: `src/app/page.tsx` (import `PerksTab`, add `perks: 'Perks'` to `TITLES`, render `{activeTab === 'perks' && <PerksTab />}`)

**Interfaces:**
- Consumes: engine from Task 1; `useLocalStorage` from `src/app/hooks/useLocalStorage.ts`; owned UWs from store key `towerpath:uw:unlocked`; UW display names from `ULTIMATE_WEAPON_NAMES` in `src/app/data/ultimate-weapons-data.ts`.
- Produces: working Perks tab — verified in Step 4.

Note: icon `✦` is currently used by the Ultimate Weapons nav entry, so use `❖` for Perks instead (unused across nav: ◈ ▤ 🏆 ★ 🧭 ⚗ ✦ ◉ 🂡 ⚒).

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { computeOdds } from '../lib/perks';

export function PerksTab() {
  const [levels, setLevels] = useLocalStorage<Record<string, number>>('towerpath:perks:levels', {});
  const [banned, setBanned] = useLocalStorage<string[]>('towerpath:perks:banned', []);
  const [options, setOptions] = useLocalStorage('towerpath:perks:options', 3);
  const [intervalWaves, setIntervalWaves] = useLocalStorage('towerpath:perks:interval', 200);
  const [uwUnlocked] = useLocalStorage<Record<string, boolean>>('towerpath:uw:unlocked', {});
  const [target, setTarget] = useState('DAMAGE');
  const [catFilter, setCatFilter] = useState<'ALL' | 'STANDARD' | 'ULTIMATE' | 'TRADEOFF'>('ALL');

  const ownedUWs = useMemo(() => Object.keys(uwUnlocked).filter((k) => uwUnlocked[k]), [uwUnlocked]);
  const odds = useMemo(
    () =>
      computeOdds({
        options,
        intervalWaves,
        banned,
        levels,
        ownedUWs,
      }),
    [options, intervalWaves, banned, levels, ownedUWs],
  );
  const visible = odds
    .filter((o) => (catFilter === 'ALL' ? true : o.category === catFilter))
    .sort((a, b) => b.pPerChoice - a.pPerChoice);
  const targetOdds = odds.find((o) => o.name === target);

  const toggleBan = (name: string) =>
    setBanned((prev) => (prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]));
  const setLevel = (name: string, v: number, max: number) =>
    setLevels((prev) => ({ ...prev, [name]: Math.max(0, Math.min(max, Math.floor(v) || 0)) }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Options / choice</div>
          <input type="number" min={1} max={9} value={options} onChange={(e) => setOptions(Math.max(1, Math.min(9, Math.floor(Number(e.target.value) || 1))))} className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold" />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Waves / choice</div>
          <input type="number" min={10} value={intervalWaves} onChange={(e) => setIntervalWaves(Math.max(10, Math.floor(Number(e.target.value) || 200)))} className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold" />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Banned</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{banned.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Target perk</div>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
            {odds.map((o) => (
              <option key={o.name} value={o.name}>{o.name}</option>
            ))}
          </select>
          <div className="text-[11px] text-[var(--color-gold)] mt-1">
            {targetOdds && targetOdds.pPerChoice > 0
              ? `${(targetOdds.pPerChoice * 100).toFixed(1)}%/choice · 50% in ~${targetOdds.wavesTo50?.toLocaleString() ?? '—'} waves`
              : 'unavailable (banned/maxed/locked)'}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'STANDARD', 'ULTIMATE', 'TRADEOFF'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              catFilter === c
                ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <div className="space-y-2">
          {visible.map((o) => (
            <div key={o.name} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_90px_90px_110px_90px] gap-3 items-center rounded-xl border border-[var(--color-border)] px-4 py-3">
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">
                  {o.name}{' '}
                  <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{o.category}</span>
                </div>
                <div className="text-[11px] text-[var(--color-gold)]">
                  {(o.pPerChoice * 100).toFixed(1)}%/choice
                  {o.wavesTo50 != null && <> · 50% in ~{o.wavesTo50.toLocaleString()} waves</>}
                </div>
              </div>
              <input type="number" min={0} max={o.maxLevel} value={o.level} onChange={(e) => setLevel(o.name, Number(e.target.value), o.maxLevel)} title="Current level" className="w-[90px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
              <span className="text-[11px] text-[var(--color-text-muted)] text-center hidden sm:block">max {o.maxLevel}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded text-center hidden sm:block ${o.unavailable ? 'text-[var(--color-text-dim)]' : o.maxed || o.banned ? 'bg-[var(--color-border)] text-[var(--color-text-dim)]' : 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]'}`}>
                {o.unavailable ? 'Locked UW' : o.maxed ? 'Maxed' : o.banned ? 'Banned' : 'Live'}
              </span>
              <button onClick={() => toggleBan(o.name)} className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-2 hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-all">
                {o.banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Odds assume equal weights within a category among eligible perks; the true game weights are
        unknown. Standard/Ultimate/Tradeoff chances are 65/20/15. Edit waves-per-choice to match your game.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Make the sidebar + page wiring edits**
- [ ] **Step 3: Run `npx tsc --noEmit` then `npx next build`**

Expected: both exit 0.
- [ ] **Step 4: Commit and push**

```bash
git add src/app/lib/perks.ts src/app/components/PerksTab.tsx src/app/components/Sidebar.tsx src/app/page.tsx
git commit -m "Perk predictor tab with next-choice odds"
git push origin main
```

- [ ] **Step 5: Verify production bundle**

Wait ~4 min, fetch `https://tower-path.vercel.app/`, extract `/_next/static/*.js` URLs, download
each, count matches of `{id:"perks"`. Expected: exactly 1 hit.
