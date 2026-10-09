/**
 * Minimal NRBF context/getter helpers for playerInfo.dat.
 *
 * Adapted from TowerSmith (https://github.com/AngryBrit/tower-smith,
 * src/playerSave/nrbfExtract.ts, license CC BY-NC-SA 4.0).
 * Only the getters TowerPath needs are ported. Missing fields yield safe
 * defaults (empty array / 0 / '') and never throw.
 */

import {
  ArraySinglePrimitiveRecord,
  BinaryObjectStringRecord,
  ClassRecord,
  MemberPrimitiveTypedRecord,
  MemberReferenceRecord,
  type NrbfDecoder,
  type NrbfRecord,
  type ObjectValue,
} from "./nrbf";

export type PlayerDataContext = {
  decoder: NrbfDecoder;
  player: ClassRecord;
};

export function findPlayerDataContext(
  decoder: NrbfDecoder,
  root: NrbfRecord,
): PlayerDataContext | null {
  let player: ClassRecord | null =
    root instanceof ClassRecord && root.typeName.includes("PlayerData") ? root : null;
  if (!player) {
    for (const rec of decoder.getAllRecords().values()) {
      if (rec instanceof ClassRecord && rec.typeName.includes("PlayerData")) {
        player = rec;
        break;
      }
    }
  }
  if (!player) return null;
  return { decoder, player };
}

export function resolveValue(
  ctx: PlayerDataContext,
  value: ObjectValue | undefined,
): ObjectValue | undefined {
  if (value instanceof MemberReferenceRecord) {
    return ctx.decoder.getRecord(value.idRef);
  }
  return value;
}

function unwrapPrimitive(raw: ObjectValue | undefined): PrimitiveValueOrRecord {
  if (raw instanceof MemberPrimitiveTypedRecord) return raw.value;
  return raw;
}

type PrimitiveValueOrRecord = ObjectValue | undefined;

export function getInt32(ctx: PlayerDataContext, name: string): number {
  const raw = unwrapPrimitive(resolveValue(ctx, ctx.player.getValue(name)));
  return typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : 0;
}

export function getBool(ctx: PlayerDataContext, name: string): boolean {
  const raw = unwrapPrimitive(resolveValue(ctx, ctx.player.getValue(name)));
  return raw === true;
}

export function getString(ctx: PlayerDataContext, name: string): string {
  const raw = unwrapPrimitive(resolveValue(ctx, ctx.player.getValue(name)));
  if (typeof raw === "string") return raw;
  if (raw instanceof BinaryObjectStringRecord) return raw.value;
  return "";
}

export function getInt32Array(ctx: PlayerDataContext, name: string): number[] {
  const raw = resolveValue(ctx, ctx.player.getValue(name));
  if (raw instanceof ArraySinglePrimitiveRecord) {
    return raw.getArray().map((v) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : Number(v) || 0));
  }
  return [];
}

export function getBoolArray(ctx: PlayerDataContext, name: string): boolean[] {
  const raw = resolveValue(ctx, ctx.player.getValue(name));
  if (raw instanceof ArraySinglePrimitiveRecord) {
    return raw.getArray().map((v) => v === true);
  }
  return [];
}

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
