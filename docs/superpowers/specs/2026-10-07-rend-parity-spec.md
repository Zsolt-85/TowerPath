# Rend-Parity Build Spec (web-feasible gaps)

Source: reverse-engineering of `project-rend.app` (homepage + v1.7.1 patch notes) vs TowerPath codebase
inventory, agreed 2026-10-07. Five independent sub-projects; each must ship working, testable software
on its own. Desktop-only Rend capabilities (live save polling, emulator/Drive auto-import, tray app)
are explicitly out of scope: TowerPath is a web app and wins on paste-based flows, calculators, planning.

## SP-1 Workshop planner

- Data ready: `src/app/data/workshop-data.ts` exposes `ATTACK_UPGRADES`, `DEFENSE_UPGRADES`,
  `UTILITY_UPGRADES` (each entry `{ name, min, max, quantity, cost }`), `WORKSHOP_UPGRADES` (merged),
  `ATTACK_UNLOCKS` / `DEFENSE_UNLOCKS` / `UTILITY_UNLOCKS` (each `{ name, cost, upgrades }`).
- Effect values interpolate linearly: `value(level) = min + (max - min) * level / quantity`.
- Per-level coin cost curve is NOT in the data: the planner shows exact effect values and exact
  unlock coin costs, never invented per-level coin totals. Current levels are manual inputs
  (persisted), same pattern as `PlannerTab.tsx` stat inputs. Save-file seeding is a non-goal.
- UI: new `Workshop` tab under Plan; tree tabs Attack/Defense/Utility; per-upgrade current/target
  inputs, effect from→to, levels needed; summary with unlock shopping list and wallet input.

## SP-2 Progression snapshots

- One snapshot per calendar day: `{ date, runs, bestWave, totalCoins, avgCph, tournaments, bestRank }`,
  stored at `towerpath:snapshots`, capped at 400 entries, same-day re-record replaces.
- Auto-record once per day on app open (in `page.tsx`, guarded by stored last-date key).
- Surface in `TrackerTab.tsx`: since-first deltas + per-day series for best wave / total coins / avg CPH.
- Milestone ETA engine (`lib/milestones.ts`) is untouched (non-goal).

## SP-3 Perk predictor

- Data: `src/app/data/perks-data.ts` — `StandardPerks` (14 entries, each `maxLevel`), `UltimatePerks`
  (9 entries, `maxLevel: 1`), `TradeoffPerks` (10 entries), category chances 65/20/15,
  `UltimateWeaponToEnum` (ultimate perk → owning UW; a locked UW's perk cannot appear).
- Stated assumption (shown in UI): equal weights within a category among eligible perks; true game
  weights are unknown. `P(see X in next choice) = P(category) × (1 − (1 − 1/eligible)^options)`.
- Inputs (all persisted, all editable): perk options per choice (default 3), waves per choice
  (default 200), current level per standard perk, banned set, owned UWs read from
  `towerpath:uw:unlocked`. Outputs: odds table + waves to 50%/90% for a selected target perk.
- UI: new `Perks` tab under Plan.

## SP-4 Lab Gantt + validation

- Extends the existing 5-slot planner (`LabPlannerTab.tsx`, keys `towerpath:lab-planner-v2`,
  `towerpath:lab-speed-global`). No key changes, no behavior changes to existing controls.
- Extract per-level duration math from `LabPlannerTab.tsx` into `src/app/lib/labs.ts`
  (`labLevelSeconds`, `slotEtaDays`) so engine and UI share it; `LabPlannerTab` imports from there.
- Timeline: per-slot sequential blocks with start/end day offsets, one stable color per lab,
  pure CSS (flex widths), no new dependencies. Validation flags: two slots targeting the same lab,
  slot already at target, slot finishing far later than the rest. Max button per slot sets
  target to that lab's max (same `maxLevelFor` rule the planner uses).

## SP-5 Preset tracking

- Manual preset loadouts first: named presets per type (cards, workshop, bots), each storing item
  selections, one active preset per type, persisted under `towerpath:presets:*`. Cards preset stores
  card→stars snapshot compatible with the `towerpath:cards` shape; workshop preset stores
  upgrade→level map; bots preset stores the 4 bot frequency picks from `bots-data.ts` (`BOTS`).
- Save-file import of presets is a stretch goal, gated on Task 1 discovery: inspect
  `node_modules/tower-idle-toolkit` and list `PlayerData` string fields containing "reset" with a
  throwaway Node script; only wire fields actually found. UI: new `Presets` tab under Collect.

## Global constraints (apply to every plan)

- Next.js 16.3.6 + React 19 + TypeScript strict (`npx tsc --noEmit` clean) + Tailwind CSS v4
  CSS-variable theme (`var(--color-*)`, Orbitron display + system body). No new dependencies.
- Client components start with `'use client'`. Game-exact big numbers via `formatBig`
  (`src/app/hooks/useLocalStorage.ts`). localStorage keys under `towerpath:*`, numeric guards on
  read (`Number(v) || fallback`, clamp ranges), cross-tab sync via the existing
  `towerpath:store` CustomEvent comes free with `useLocalStorage`.
- New tabs follow the Labs-tab wiring: `NAV_SECTIONS` entry in `Sidebar.tsx` (rendered from the
  constant — never a second inline copy), `TITLES` + route render in `page.tsx`.
- Verification per task: `npx tsc --noEmit`, throwaway Node logic checks for math
  (`C:\Users\maias\AppData\Local\Temp\opencode\`, deleted afterwards), `npx next build` per task
  end, production bundle grep after push. One concern per commit, concise messages.
