# UW Planner + Dual-Axis Chart Design

Decision: approach B (engine `lib/uw.ts` + upgraded UWTab) and dual-axis coins+cells chart.
Approved in two parts 2026-10-07. Community sources: r/TheTowerGame (Kairos UW guide, sync
threads), game-vault wiki (UW priority, sync guide, plus-cost trees), MuMu sync guide.

## 1. Data model / storage

- `towerpath:uw:levels: Record<uwName, Record<trackName, levelIndex>>` — owned levels per track,
  levelIndex = index into the track's `values` array (0 = base). Numeric guards + clamp to
  `values.length - 1` on read.
- `towerpath:uw:plus: Record<uwName, plusLevel>` — enhancement levels (0–10 scale per `plus.values`
  length; level 0 = first purchased tier per wiki "unlocked at level 0").
- `towerpath:uw:stones: number` — stone wallet for the queue.
- Existing `towerpath:uw:unlocked` / `towerpath:uw:synced` stay the source of truth for gating:
  locked UW tracks are hidden until unlocked (same pattern as today).

## 2. Stone math (exact tables, no invention)

- Track shape in `ultimate-weapons-data.ts`: each UW in `ULTIMATE_WEAPONS` has
  `upgrades: Record<trackName, { values: { value, cost }[] }>` plus `plus: { name, cost, values }`.
  Track names per UW: DW (Damage %, Quantity, Cooldown), BH (Size, Duration, Cooldown),
  GT (Bonus, Duration, Cooldown), SM (Damage, Quantity, Cooldown), CF (Duration, Slow %, Cooldown),
  PS (Damage %, Duration, Chance %), ILM (Damage %, Quantity, Cooldown), CL (Damage %, Bolts,
  Chance %), SL (Bonus, Angle, Quantity). CL and SL have NO Cooldown track — the engine must not
  assume one; sync logic applies only to a track literally named `Cooldown` on GT/BH/DW.
- Cost interpretation: table `cost` entries are INCREMENTAL per step (evidence: GT Cooldown
  300→200 sums to exactly 910, matching two independent community sources). Next-buy cost =
  `values[level + 1].cost`; jump cost = sum of incremental costs over the range.
- OPEN VERIFICATION: DW Cooldown 300→200 sums to 800 from our tables, but one community guide
  says 600. Engine uses table sums as source of truth; implementation plan includes a task to
  cross-check the DW table against the wiki and correct the data file if stale.
- Enhancement costs: `plus.cost` arrays (`BASE_300`/`ALTERNATE_BASE_300`/`BASE_400` in-file).
- Unlock costs: `UNLOCK_COSTS` (5/50/150/300/800/1250/1750/2400/3000) by unlock order index;
  `PLUS_UNLOCK_COSTS` for plus unlocks. Engine exposes both for the queue.

## 3. Sync rules + priority scoring (community-sourced, cited in UI)

- Hard rules: BH Cooldown stays at 200 until trio sync; GT/BH/DW cooldown buys must be one-go
  jumps (GT 300→200, DW 300→200), never incremental — incremental GT 300→270 desyncs to a 90-min
  realign; BH mistouches are the most expensive to recover (partial-sync table in wiki).
- Engine flags any queued cooldown buy that breaks 1:1 GT/BH/DW equality and proposes the safe
  jump instead with its summed stone cost. MVN noted as fallback (averages the three cooldowns;
  Epic +20 / Legendary +10 / Mythic +1 / Ancestral −10) — surfaced as info text, not math.
- Priority score blends: wiki unlock order GT>BH>SL>DW>CL>SM>ILM>PS>CF, sync urgency (desynced
  trio outranks everything affordable), and stone efficiency. Every suggestion cites its reason.

## 4. Spending queue UI (UWTab upgrade)

- Per-UW cards with per-track steppers showing current value → next value + stone cost per click
  (game-panel style), using each track's `formatValue`. Wallet input with running affordability.
- Spending queue: priority-weighted next buys across all owned UWs with cumulative stone totals;
  clicking a queued buy applies it to owned levels (persisted). Enhancement tracks included.
- Unlock row for locked UWs with `UNLOCK_COSTS` and wiki priority order guidance.

## 5. Dual-axis coins+cells chart (TrackerTab)

- Replace the coins|cells toggle with one chart carrying two series: coins/run (gold, left axis)
  and cells/run (teal, right axis), shared run index. Same for the per-hour chart.
- `LineChart` (`charts.tsx`) already accepts `series[]`; extend it with an optional second scale:
  `rightTicks`/`rightLabels` rendering. Single-series behavior for other tabs unchanged.
- Hover readout shows both values at the run index.

## 6. Verification

- Node checks: next-buy lookups per track, GT 300→200 = 910 assertion, DW table cross-check
  task, priority ordering on fixture states, dual-axis scale math (both axes span their data).
- `tsc --noEmit` + `next build` clean; production bundle grep for new strings.
