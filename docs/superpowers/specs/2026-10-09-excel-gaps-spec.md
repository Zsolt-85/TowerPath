# Excel-Gap Build Spec (save import, bots, dissonance, UW uptime)

Source: `Sources/Tower.xlsx` (Tower Path Handoff + sheet formulas) and `Sources/playerInfo.dat`
(787 PlayerData members, decoded with the repo's own `lib/playersave`). Four independent
sub-projects; each ships working, testable software alone. `Sources/` stays untracked (4.9MB
binary); only code constants derived from it enter the repo.

## SP-1 Save import expansion

- Extend `lib/playersave/extract.ts` with `getNumber` (no truncation — wallets exceed int32) and
  `getNumberArray`; existing `getInt32/getBool/getString/getInt32Array/getBoolArray` cover the rest.
- Extend `DecodedAccount` with: `wallet` (coins, stones, medals, gems, cells, tokens, bits,
  tickets, cannon/armor/generator/core shards, reroll shards), `totals` (coinsEarned,
  wavesCompleted, damageDealt, stonesEarned/Spent, wavesSkipped, free upgrades a/d/u,
  researchesComplete, coinsSpentOnResearch), `bests` (currentTier, highestWave/Coins/CellsThisTier
  arrays), `labsRaw` (labLevel, labActiveBool, researchPercentComplete, labsUnlocked),
  `uwLevels` (level, cooldown, plusLevel, plusUnlocked, selectedLevel arrays),
  `cardsExtra` (count, masteryUnlocked, active, slotsUnlocked), `botsRaw` (unlocked, active,
  level arrays, goldSelected), `perksRaw` (level array, pickedCount, banned array),
  `milestonesClaimed` (bool array), `upgradeTiers` (attack/defense/utility bool arrays),
  `tournamentMeta` (leagueID, highestLeague, checkedNumber).
- Ground-truth asserts (this exact file): coins 847068334979602.9, stones 62, medals 668,
  currentTier 10, labsUnlocked 4, researchesComplete 1554, slotsUnlocked 16, perksPickedCount 19,
  leagueID 3, highestLeague 4.
- UI (`ImportModal` save panel): audit grid (wallet, totals, bests table, labs raw read-only,
  UW levels read-only with mapping-unverified note) + Apply buttons ONLY for wallet stats
  (`towerpath:stats:stones`, `towerpath:stats:coins`), cards and UW unlocks (existing).
  Lab/UW-level arrays stay read-only: save index→name mapping is unverified.

## SP-2 Bots simulator

- Engine `lib/bots.ts`: `GBSetup` (duration, baseCooldown, bonus, range, labLevel, labReduction
  default 1, gtDur/gtCd/bhDur/bhCd); `effectiveCooldown = max(1, base − lab×red)`;
  `uptime = duration/cooldown`; LCM second-enumeration overlap for GB×BH, GB×GT, four-way
  (cap 200k iterations, gcd/lcm helpers); route table over lab levels + user medal packages
  `{label, cooldown, medalCost}`; checkpoint flags when a route crosses 112/100/96/80.
- UI `BotsTab`: persisted inputs (`towerpath:bots:setup`), route table with uptime/overlap/gain
  vs current, medal budget, decision note field. GB lab level defaults to 5 (matches save
  `goldenBotLevelCooldownSelected`), user-editable. New `Bots` tab under Plan.

## SP-3 Dissonance tracker

- Engine `lib/dissonance.ts`: categories Attack/UW/Defense/Utility, tiers 1–25;
  `boostFor(cat, wave) = 1+4×(min(wave,5000)/5000)^1.75`, Utility uses `1+2×…`;
  echo rates input (default 0.005 per category); records from runs with
  `runType==='dissonance'` grouped by new optional `run.dissonance` category + manual overrides
  store `towerpath:dissonance:overrides` (`{tier, cat, wave}[]`, best-wins);
  queue ordered by tier asc then Attack→UW→Defense→Utility, `gap = max(0, 5000−wave)`.
- `Run` type gains optional `dissonance?: string` (backward compatible); ImportModal shows a
  category select when run type is dissonance.
- UI `DissonanceTab`: record matrix, echo inputs, override editor, live queue. New tab under Track.

## SP-4 UW uptime simulator

- Engine `lib/uwtime.ts`: mechanics Timed/Proc/Event/Persistent/Continuous per UW
  (CL Proc, SM Event, DW Persistent, CF/GT/PS/BH Timed, ILM Persistent, SL Continuous);
  `effectiveDuration = duration + runBonus`, `effectiveCooldown = (cooldown + extraCd) × cdMult`,
  Timed `uptime = min(1, dur/cd)`, `activationsPerHour = 3600/cd`, LCM overlap enumerator shared
  shape with bots engine (duplicated 15-line helper, not shared — different file ownership);
  `prefillFromLevels(levels)` reads Cooldown/Duration table values at owned indices from
  `ultimate-weapons-data.ts`; BH +12s perk toggle (`BH_DURATION_PERK_BONUS = 12`).
- UI `UWTimeTab`: editable current + target tables, uptime/activations readouts, GT×BH overlap
  current-vs-target, prefill button from `towerpath:uw:levels`. New `Uptime` tab under Plan.
  Coin modeling is a non-goal (needs farm-baseline integration).

## Global constraints (all plans)

- Next.js 16.3.6 + React 19 + TypeScript strict (`npx tsc --noEmit` clean) + Tailwind v4
  CSS-variable theme (Orbitron + system body). No new dependencies.
- `'use client'` on components; `formatBig` for big numbers; `towerpath:*` keys with numeric
  guards and try/catch JSON reads; cross-tab sync free via `useLocalStorage`.
- New tabs follow Labs wiring: `NAV_SECTIONS` entry (rendered constant only), `TITLES` + route.
- Missing means unknown (null, not zero) in all new engines. Verify per task: `tsc`, throwaway
  Node logic checks (temp dir, deleted after), `next build` at task end, production bundle grep
  after push. Concise commits, one concern each.
