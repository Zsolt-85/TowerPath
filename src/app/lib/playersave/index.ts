/**
 * Public save-decode API for TowerPath (data layer only, client-safe).
 *
 * Self-contained under lib/playersave/ — never imports TowerSmith paths.
 * NRBF decode logic lives in ./nrbf, getters in ./extract, tables in ./mappings.
 */

import { NrbfUtils, NrbfDecoder } from "./nrbf";
import {
  findPlayerDataContext,
  getBoolArray,
  getInt32Array,
  getNumber,
  getNumberArray,
  getString,
} from "./extract";
import { CARD_SAVE_INDEX_TO_NAME, UW_UNLOCKED_ORDER } from "./mappings";

export type DecodedAccount = {
  profile: { userName: string };
  cards: Record<string, number>;
  uwsUnlocked: Record<string, boolean>;
  workshop: { attack: number[]; defense: number[]; utility: number[] };
  labs: number[];
  rawCounts: Record<string, number>;
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
};

/**
 * Gunzip when gzip magic bytes (1f 8b) are present, using native
 * DecompressionStream('gzip'). Returns input unchanged otherwise.
 */
export async function gunzipIfNeeded(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("not a gzip/NRBF save: gzip data requires DecompressionStream");
    }
    const ds = new DecompressionStream("gzip");
    const copy = bytes.slice();
    const out = await new Response(
      new Blob([copy as unknown as BlobPart]).stream().pipeThrough(ds),
    ).arrayBuffer();
    return new Uint8Array(out);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function truncLevel(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0;
}

/**
 * Decode a playerInfo.dat file (gzipped or raw NRBF) into a DecodedAccount.
 * Throws Errors naming the failed stage.
 */
export async function decodeSaveFile(bytes: Uint8Array): Promise<DecodedAccount> {
  if (!bytes || bytes.length === 0) {
    throw new Error("not a gzip/NRBF save: empty file");
  }

  let nrbfBytes: Uint8Array;
  try {
    nrbfBytes = await gunzipIfNeeded(bytes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("not a gzip/NRBF save")) throw e;
    throw new Error(`not a gzip/NRBF save: gunzip failed (${msg})`);
  }

  const ab = toArrayBuffer(nrbfBytes);
  if (!NrbfUtils.startsWithPayloadHeader(ab)) {
    throw new Error("not a gzip/NRBF save: invalid NRBF payload header");
  }

  let decoder: NrbfDecoder;
  let root: ReturnType<NrbfDecoder["decode"]>;
  try {
    decoder = new NrbfDecoder(ab);
    root = decoder.decode();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`not a gzip/NRBF save: NRBF decode failed (${msg})`);
  }

  const ctx = findPlayerDataContext(decoder, root);
  if (!ctx) {
    throw new Error("player data section not found: no PlayerData record in save");
  }

  const userName = getString(ctx, "userName");
  const cardLevel = getInt32Array(ctx, "cardLevel");
  const cardUnlocked = getBoolArray(ctx, "cardUnlocked");
  const uwUnlocked = getBoolArray(ctx, "ultimateWeaponUnlocked");
  const uwLevel = getInt32Array(ctx, "ultimateWeaponLevel");
  const attack = getInt32Array(ctx, "upgradeWorkshopLevel");
  const defense = getInt32Array(ctx, "upgradeWorkshopDefenseLevel");
  const utility = getInt32Array(ctx, "upgradeWorkshopUtilityLevel");
  const labs = getInt32Array(ctx, "researchLevel");

  const hasUnlockFlags = cardUnlocked.length > 0;
  const cards: Record<string, number> = {};
  for (const [indexKey, name] of Object.entries(CARD_SAVE_INDEX_TO_NAME)) {
    const idx = Number(indexKey);
    if (hasUnlockFlags && cardUnlocked[idx] !== true) {
      cards[name] = 0;
      continue;
    }
    cards[name] = truncLevel(cardLevel[idx]);
  }

  const uwsUnlocked: Record<string, boolean> = {};
  for (let i = 0; i < UW_UNLOCKED_ORDER.length; i++) {
    const name = UW_UNLOCKED_ORDER[i] as string;
    uwsUnlocked[name] = uwUnlocked[i] === true;
  }

  const rawCounts: Record<string, number> = {
    cardLevel: cardLevel.length,
    cardUnlocked: cardUnlocked.length,
    ultimateWeaponUnlocked: uwUnlocked.length,
    ultimateWeaponLevel: uwLevel.length,
    upgradeWorkshopLevel: attack.length,
    upgradeWorkshopDefenseLevel: defense.length,
    upgradeWorkshopUtilityLevel: utility.length,
    researchLevel: labs.length,
  };

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
  const milestonesClaimed = getBoolArray(ctx, 'milestonesRewardClaimed');
  const upgradeTiers = {
    attack: getBoolArray(ctx, 'upgradeTierUnlocked'),
    defense: getBoolArray(ctx, 'upgradeDefenseTierUnlocked'),
    utility: getBoolArray(ctx, 'upgradeUtilityTierUnlocked'),
  };
  const tournamentMeta = {
    leagueID: getNumber(ctx, 'leagueID'),
    highestLeague: getNumber(ctx, 'highestLeague'),
    checkedNumber: getNumber(ctx, 'tournamentCheckedNumber'),
  };

  return {
    profile: { userName },
    cards,
    uwsUnlocked,
    workshop: { attack, defense, utility },
    labs,
    rawCounts,
    wallet,
    totals,
    bests,
    labsRaw,
    uwLevels,
    cardsExtra,
    botsRaw,
    perksRaw,
    milestonesClaimed,
    upgradeTiers,
    tournamentMeta,
  };
}
