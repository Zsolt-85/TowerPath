/**
 * Pure save-index mapping tables derived from TowerSmith evidence.
 *
 * Card layout: TowerSmith `src/playerSave/cardSaveSlotMap.ts` builds
 * CARD_SAVE_INDEX_BY_CARD_ID by walking WORKSHOP_GAME_CARD_ORDER
 * (src/data/workshopGameCards.ts) and skipping reserved slots
 * [8, 9, 14, 17, 24, 36, 37, 38, 39]. Confirmed by
 * `src/playerSave/cardSaveSlotMap.test.ts` (explicit index assertions and
 * the preset round-trip: save indices [15,6,19,2,12,1,11,20,16,22,23,31,7,3,
 * 0,26,25,18] decode to named cards).
 *
 * UW layout: TowerSmith `src/playerSave/gameUltimateWeaponMapping.ts`
 * GAME_ULTIMATE_WEAPON_INDEX (from Il2Cpp `DevPanelUltimateWeapons`).
 */

/** Length of the game `cardLevel[]` / `cardUnlocked[]` arrays. */
export const CARD_SAVE_ARRAY_LENGTH = 40;

/** Save slots with no card (gaps in the 40-element arrays). */
export const CARD_SAVE_RESERVED_INDICES: readonly number[] = [8, 9, 14, 17, 24, 36, 37, 38, 39];

/**
 * `cardLevel[]` save index -> TowerPath card name.
 *
 * Derived by walking TowerSmith's WORKSHOP_GAME_CARD_ORDER
 * (damage, attackSpeed, health, healthRegen, range, cash, coins, slowAura,
 * criticalChance, enemyBalance, extraDefense, fortress, freeUpgrades,
 * extraOrb, plasmaCannon, criticalCoin, waveSkip, introSprint, landMineStun,
 * recoveryPackageChance, deathRay, energyNet, superTower, secondWind,
 * demonMode, energyShield, waveAccelerator, berserker, ultimateCrit, nuke,
 * areaOfEffect) and skipping CARD_SAVE_RESERVED_INDICES.
 *
 * Note: TowerSmith indices 34 (Nuke) and 35 (Area of Effect) exist in the
 * game save but have no TowerPath card in our 29-card list, so they are
 * intentionally left unmapped. Reserved slots 8-9, 14, 17, 24, 36-39 are
 * likewise absent.
 */
export const CARD_SAVE_INDEX_TO_NAME: Record<number, string> = {
  0: "Damage",
  1: "Attack Speed",
  2: "Health",
  3: "Health Regen",
  4: "Range",
  5: "Cash",
  6: "Coins",
  7: "Slow Aura",
  10: "Critical Chance",
  11: "Enemy Balance",
  12: "Extra Defense",
  13: "Fortress",
  15: "Free Upgrades",
  16: "Extra Orb",
  18: "Plasma Cannon",
  19: "Critical Coin",
  20: "Wave Skip",
  21: "Intro Sprint",
  22: "Land Mine Stun",
  23: "Recovery Package Chance",
  25: "Death Ray",
  26: "Energy Net",
  27: "Super Tower",
  28: "Second Wind",
  29: "Demon Mode",
  30: "Energy Shield",
  31: "Wave Accelerator",
  32: "Berserker",
  33: "Ultimate Crit",
};

/**
 * Order of `ultimateWeaponUnlocked[]` (and `ultimateWeaponLevel[]` groups)
 * mapped to TowerPath UW names. Position i = save array index i.
 *
 * Source: TowerSmith `src/playerSave/gameUltimateWeaponMapping.ts`
 * GAME_ULTIMATE_WEAPON_INDEX: chainLightning 0, smartMissiles 1, deathWave 2,
 * chronoField 3, innerLandMines 4, goldenTower 5, poisonSwamp 6, blackHole 7,
 * spotlight 8.
 */
export const UW_UNLOCKED_ORDER: string[] = [
  "Chain Lightning",
  "Smart Missiles",
  "Death Wave",
  "Chrono Field",
  "Inner Land Mines",
  "Golden Tower",
  "Poison Swamp",
  "Black Hole",
  "Spotlight",
];
