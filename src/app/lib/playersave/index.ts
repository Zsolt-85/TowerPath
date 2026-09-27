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

  return {
    profile: { userName },
    cards,
    uwsUnlocked,
    workshop: { attack, defense, utility },
    labs,
    rawCounts,
  };
}
