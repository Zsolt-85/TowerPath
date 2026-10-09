# Save Import Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decode wallet, totals, bests, labs, UW levels, cards, bots, perks, and milestones from playerInfo.dat with ground-truth tests, and surface an audit + safe apply in the import modal.

**Architecture:** Two new getters in `extract.ts`, extended `DecodedAccount` in `index.ts`, audit grid + wallet apply in `ImportModal.tsx`. Lab/UW-level arrays are read-only (index→name mapping unverified).

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars.

**Spec:** `docs/superpowers/specs/2026-10-09-excel-gaps-spec.md` (SP-1).

## Global Constraints

Spec §Global constraints applies in full. Ground-truth values in this plan were read from
`Sources/playerInfo.dat` (untracked): coins 847068334979602.9, stones 62, medals 668,
currentTier 10, labsUnlocked 4, researchesComplete 1554, slotsUnlocked 16, perksPickedCount 19,
leagueID 3, highestLeague 4. Never invent save values; missing members yield safe defaults.

---

### Task 1: Getters + extended decode + ground-truth test

**Files:**
- Modify: `src/app/lib/playersave/extract.ts` (add `getNumber`, `getNumberArray`)
- Modify: `src/app/lib/playersave/index.ts` (extend `DecodedAccount`, populate new sections)
- Test: throwaway Node script against `Sources/playerInfo.dat` (deleted afterwards)

**Interfaces:**
- Consumes: existing `resolveValue`, `unwrapPrimitive`, `ArraySinglePrimitiveRecord`, `getInt32Array`, `getBoolArray`, `getString`, `getInt32`.
- Produces: `getNumber(ctx, name)`, `getNumberArray(ctx, name)`, and the extended `DecodedAccount` fields exactly as specified below — consumed by Task 2.

- [ ] **Step 1: Add getters to `extract.ts`**

```ts
export function getNumber(ctx: PlayerDataContext, name: string): number {
  const raw = unwrapPrimitive(resolveValue(ctx, ctx.player.getValue(name)));
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

export function getNumberArray(ctx: PlayerDataContext, name: string): number[] {
  const raw = resolveValue(ctx, ctx.player.getValue(name));
  if (raw instanceof ArraySinglePrimitiveRecord) {
    return raw.getArray().map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0));
  }
  return [];
}
```

- [ ] **Step 2: Extend `DecodedAccount` and populate it**

Add to the type:

```ts
wallet: {
  coins: number; stones: number; medals: number; gems: number; cells: number;
  tokens: number; bits: number; tickets: number; cannonShards: number; armorShards: number;
  generatorShards: number; coreShards: number; rerollShards: number;
};
totals: {
  coinsEarned: number; wavesCompleted: number; damageDealt: number; stonesEarned: number;
  stonesSpent: number; wavesSkipped: number; freeAttack: number; freeDefense: number;
  freeUtility: number; researchesComplete: number; coinsSpentOnResearch: number;
};
bests: { currentTier: number; wave: number[]; coins: number[]; cells: number[] };
labsRaw: { level: number[]; active: boolean[]; pctComplete: number[]; unlocked: number };
uwLevels: { level: number[]; cooldown: number[]; plusLevel: number[]; plusUnlocked: boolean[]; selected: number[] };
cardsExtra: { count: number[]; mastery: boolean[]; active: number[]; slots: number };
botsRaw: { unlocked: boolean[]; active: boolean[]; level: number[]; goldSelected: number };
perksRaw: { level: number[]; picked: number; banned: number[] };
milestonesClaimed: boolean[];
upgradeTiers: { attack: boolean[]; defense: boolean[]; utility: boolean[] };
tournamentMeta: { leagueID: number; highestLeague: number; checkedNumber: number };
```

Populate with this exact member map (scalar via `getNumber`/`getInt32`/`getString` as today,
arrays via `getNumberArray`/`getInt32Array`/`getBoolArray`):

```ts
const wallet = {
  coins: getNumber(ctx, 'coins'),
  stones: getNumber(ctx, 'stones'),
  medals: getNumber(ctx, 'medals'),
  gems: getNumber(ctx, 'gems'),
  cells: getNumber(ctx, 'cells'),
  tokens: getNumber(ctx, 'tokens'),
  bits: getNumber(ctx, 'bits'),
  tickets: getNumber(ctx, 'tickets'),
  cannonShards: getNumber(ctx, 'moduleCannonShards'),
  armorShards: getNumber(ctx, 'moduleArmorShards'),
  generatorShards: getNumber(ctx, 'moduleGeneratorShards'),
  coreShards: getNumber(ctx, 'moduleCoreShards'),
  rerollShards: getNumber(ctx, 'moduleRerollCurrency'),
};
const totals = {
  coinsEarned: getNumber(ctx, 'totalCoinsEarned'),
  wavesCompleted: getNumber(ctx, 'totalWavesCompleted'),
  damageDealt: getNumber(ctx, 'totalDamageDealt'),
  stonesEarned: getNumber(ctx, 'totalStonesEarned'),
  stonesSpent: getNumber(ctx, 'totalStonesSpent'),
  wavesSkipped: getNumber(ctx, 'totalWavesSkipped'),
  freeAttack: getNumber(ctx, 'totalFreeAttackUpgrades'),
  freeDefense: getNumber(ctx, 'totalFreeDefenseUpgrades'),
  freeUtility: getNumber(ctx, 'totalFreeUtilityUpgrades'),
  researchesComplete: getNumber(ctx, 'researchesComplete'),
  coinsSpentOnResearch: getNumber(ctx, 'totalCoinsSpentOnResearch'),
};
const bests = {
  currentTier: getNumber(ctx, 'currentTier'),
  wave: getNumberArray(ctx, 'highestWaveThisTier'),
  coins: getNumberArray(ctx, 'highestCoinsEarnedThisTier'),
  cells: getNumberArray(ctx, 'highestCellsEarnedThisTier'),
};
const labsRaw = {
  level: getInt32Array(ctx, 'labLevel'),
  active: getBoolArray(ctx, 'labActiveBool'),
  pctComplete: getNumberArray(ctx, 'researchPercentComplete'),
  unlocked: getNumber(ctx, 'labsUnlocked'),
};
const uwLevels = {
  level: getInt32Array(ctx, 'ultimateWeaponLevel'),
  cooldown: getInt32Array(ctx, 'ultimateWeaponCooldown'),
  plusLevel: getInt32Array(ctx, 'ultimateWeaponPlusLevel'),
  plusUnlocked: getBoolArray(ctx, 'ultimateWeaponPlusUnlocked'),
  selected: getInt32Array(ctx, 'ultimateWeaponSelectedLevel'),
};
const cardsExtra = {
  count: getInt32Array(ctx, 'cardCount'),
  mastery: getBoolArray(ctx, 'cardMasteryUnlocked'),
  active: getInt32Array(ctx, 'cardActive'),
  slots: getNumber(ctx, 'slotsUnlocked'),
};
const botsRaw = {
  unlocked: getBoolArray(ctx, 'botsUnlocked'),
  active: getBoolArray(ctx, 'botsActive'),
  level: getInt32Array(ctx, 'botsLevel'),
  goldSelected: getNumber(ctx, 'goldenBotLevelCooldownSelected'),
};
const perksRaw = {
  level: getInt32Array(ctx, 'perkLevel'),
  picked: getNumber(ctx, 'perksPickedCount'),
  banned: getInt32Array(ctx, 'bannedPerksIndex'),
};
```

`milestonesClaimed` from `getBoolArray(ctx, 'milestonesRewardClaimed')`; `upgradeTiers` from
`getBoolArray` of `upgradeTierUnlocked` / `upgradeDefenseTierUnlocked` / `upgradeUtilityTierUnlocked`;
`tournamentMeta` from `getNumber` of `leagueID`, `highestLeague`, `tournamentCheckedNumber`.
Return all new sections alongside the existing fields (do not change existing behavior).

- [ ] **Step 3: Ground-truth test with a throwaway Node script**

Compile the four `src/app/lib/playersave/*.ts` files with
`npx tsc <files> --outDir <tempdir> --module commonjs --target es2020 --skipLibCheck` (do not
touch repo tsconfig), then run a Node script that calls `decodeSaveFile` on
`Sources/playerInfo.dat` and asserts: `wallet.coins === 847068334979602.9`,
`wallet.stones === 62`, `wallet.medals === 668`, `bests.currentTier === 10`,
`labsRaw.unlocked === 4`, `totals.researchesComplete === 1554`, `cardsExtra.slots === 16`,
`perksRaw.picked === 19`, `tournamentMeta.leagueID === 3`, `tournamentMeta.highestLeague === 4`,
plus `bests.wave.length > 0`, `uwLevels.level.length === 9`, `labsRaw.level.length > 0`.
Delete the script and compiled output afterwards.

Expected: all assertions print PASS.
- [ ] **Step 4: Run `npx tsc --noEmit`**. Expected: exit 0.
- [ ] **Step 5: Commit**

```bash
git add src/app/lib/playersave/extract.ts src/app/lib/playersave/index.ts
git commit -m "Save decode: wallet, totals, bests, labs, UW, bots, perks"
```

### Task 2: Audit UI + wallet apply + verify live

**Files:**
- Modify: `src/app/components/ImportModal.tsx` (extend `SaveFilePanel` preview + apply)

**Interfaces:**
- Consumes: extended `DecodedAccount` from Task 1.
- Produces: visible audit + apply — verified live in Step 4.

- [ ] **Step 1: Extend the save preview**

Read the current `SaveFilePanel` preview block first. Add a wallet row (coins/stones/medals/gems
via `formatBig`), a totals row (lifetime coins, waves, stones earned/spent), a per-tier bests
mini-table (tier index → best wave, only non-zero entries, first 25 tiers), and read-only rows:
active lab count (`labsRaw.active.filter(Boolean).length`), UW level array length, bot arrays
length, mastery count. Under UW levels and lab levels add the note: "Save order → name mapping
unverified — shown for reference, not applied."

- [ ] **Step 2: Add wallet apply**

In `apply`, after the existing cards/UW writes, add:
`writeStore('towerpath:stats:stones', Math.floor(account.wallet.stones))` and
`writeStore('towerpath:stats:coins', Math.floor(account.wallet.coins))`.
Apply ONLY these two keys — never touch other planner inputs. Extend the applied message with
`` + `, wallet ${account.wallet.stones}◇` ``.

- [ ] **Step 3: Run `npx tsc --noEmit` then `npx next build`**. Expected: both exit 0.
- [ ] **Step 4: Commit, push, verify production**

```bash
git add src/app/components/ImportModal.tsx
git commit -m "Save audit grid with wallet apply"
git push origin main
```

Wait ~4 min, fetch `https://tower-path.vercel.app/`, extract `/_next/static/*.js` URLs, download
each, count matches of `Save order`. Expected: at least 1 hit (the mapping note). If 0 after 6+
minutes, report DONE_WITH_CONCERNS with timing details (do not push again).
