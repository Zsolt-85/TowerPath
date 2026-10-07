import {
  ULTIMATE_WEAPONS,
  ULTIMATE_WEAPON_NAMES,
  UNLOCK_COSTS,
} from '../data/ultimate-weapons-data';

export type UWLevels = Record<string, Record<string, number>>;

interface TrackTable {
  values: { value: number; cost: number }[];
  formatValue: (v: number) => string;
}

interface UWEntry {
  upgrades: Record<string, TrackTable>;
  plus: { name: string; cost: readonly number[]; values: readonly unknown[] };
}

function entryOf(uw: string): UWEntry | null {
  const e = (ULTIMATE_WEAPONS as Record<string, unknown>)[uw];
  if (e == null || typeof e !== 'object') return null;
  const upgrades = (e as { upgrades?: unknown }).upgrades;
  const plus = (e as { plus?: unknown }).plus;
  if (upgrades == null || typeof upgrades !== 'object') return null;
  return { upgrades: upgrades as Record<string, TrackTable>, plus: plus as UWEntry['plus'] };
}

export interface UWTrackDef {
  name: string;
  values: { value: number; cost: number }[];
  format: (v: number) => string;
}

export function trackDefs(uw: string): UWTrackDef[] {
  const e = entryOf(uw);
  if (!e) return [];
  return Object.entries(e.upgrades)
    .filter(([, t]) => Array.isArray(t.values) && typeof t.formatValue === 'function')
    .map(([name, t]) => ({ name, values: t.values, format: t.formatValue }));
}

export interface NextBuy {
  value: number;
  cost: number;
  maxed: boolean;
}

export function nextBuy(uw: string, track: string, level: number): NextBuy | null {
  const d = trackDefs(uw).find((x) => x.name === track);
  if (!d || d.values.length === 0) return null;
  const clamped = Math.max(0, Math.min(d.values.length - 1, Math.floor(level) || 0));
  const cur = d.values[clamped];
  const nxt = d.values[clamped + 1];
  if (!nxt) return { value: cur.value, cost: 0, maxed: true };
  return { value: nxt.value, cost: nxt.cost, maxed: false };
}

export function rangeCost(uw: string, track: string, fromIdx: number, toIdx: number): number {
  const d = trackDefs(uw).find((x) => x.name === track);
  if (!d) return 0;
  const lo = Math.max(0, Math.min(fromIdx, toIdx));
  const hi = Math.min(d.values.length - 1, Math.max(fromIdx, toIdx));
  let sum = 0;
  for (let i = lo + 1; i <= hi; i += 1) sum += d.values[i].cost;
  return sum;
}

export function cooldownAt(uw: string, level: number): number | null {
  const d = trackDefs(uw).find((x) => x.name === 'Cooldown');
  if (!d || d.values.length === 0) return null;
  const clamped = Math.max(0, Math.min(d.values.length - 1, Math.floor(level) || 0));
  return d.values[clamped].value;
}

export function cooldownIndex(uw: string, value: number): number | null {
  const d = trackDefs(uw).find((x) => x.name === 'Cooldown');
  if (!d) return null;
  const i = d.values.findIndex((v) => v.value === value);
  return i >= 0 ? i : null;
}

export const UW_PRIORITY = [
  'Golden Tower',
  'Black Hole',
  'Spotlight',
  'Death Wave',
  'Chain Lightning',
  'Smart Missiles',
  'Inner Land Mines',
  'Poison Swamp',
  'Chrono Field',
];

export const SYNC_MILESTONES = [200, 150, 100, 50];

export interface SyncJump {
  uw: string;
  from: number;
  to: number;
  cost: number;
}

export interface SyncPlan {
  current: Record<string, number>;
  target: number;
  jumps: SyncJump[];
  total: number;
}

const SYNC_TRIO = ['Golden Tower', 'Black Hole', 'Death Wave'];

export function trioCooldowns(levels: UWLevels): Record<string, number> | null {
  const out: Record<string, number> = {};
  for (const uw of SYNC_TRIO) {
    const cd = cooldownAt(uw, levels[uw]?.['Cooldown'] ?? 0);
    if (cd == null) return null;
    out[uw] = cd;
  }
  return out;
}

export function syncJumps(levels: UWLevels): SyncPlan | null {
  const cur = trioCooldowns(levels);
  if (!cur) return null;
  const vals = SYNC_TRIO.map((u) => cur[u]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const target = SYNC_MILESTONES.find((m) => m <= lo && m < hi) ?? null;
  if (target == null) return null;
  const jumps: SyncJump[] = [];
  for (const uw of SYNC_TRIO) {
    if (cur[uw] <= target) continue;
    const fromIdx = cooldownIndex(uw, cur[uw]);
    const toIdx = cooldownIndex(uw, target);
    if (fromIdx == null || toIdx == null) continue;
    jumps.push({ uw, from: cur[uw], to: target, cost: rangeCost(uw, 'Cooldown', fromIdx, toIdx) });
  }
  if (jumps.length === 0) return null;
  return { current: cur, target, jumps, total: jumps.reduce((m, j) => m + j.cost, 0) };
}

export function unlockCostFor(unlockedCount: number): number {
  const arr = UNLOCK_COSTS as readonly number[];
  if (unlockedCount < 0) return arr[0];
  return arr[Math.min(unlockedCount, arr.length - 1)];
}

export interface PlusBuy {
  name: string;
  level: number;
  cost: number;
  maxed: boolean;
}

export function plusNext(uw: string, level: number): PlusBuy | null {
  const e = entryOf(uw);
  if (!e || !e.plus || !Array.isArray(e.plus.cost)) return null;
  const costs = e.plus.cost as readonly number[];
  const clamped = Math.max(0, Math.floor(level) || 0);
  const nxt = costs[clamped + 1];
  if (nxt == null) return { name: e.plus.name, level: clamped, cost: 0, maxed: true };
  return { name: e.plus.name, level: clamped, cost: nxt, maxed: false };
}

export type QueueKind = 'sync' | 'unlock' | 'next' | 'plus';

export interface QueueItem {
  uw: string;
  track: string | null;
  from: string;
  to: string;
  cost: number;
  reason: string;
  kind: QueueKind;
}

export function buildQueue(
  levels: UWLevels,
  plus: Record<string, number>,
  unlocked: Record<string, boolean>,
  unlockedCount: number,
): QueueItem[] {
  const items: QueueItem[] = [];
  const plan = syncJumps(levels);
  if (plan) {
    for (const j of plan.jumps) {
      items.push({
        uw: j.uw,
        track: 'Cooldown',
        from: `${j.from}s`,
        to: `${j.to}s`,
        cost: j.cost,
        reason: `Completes ${plan.target}s trio sync in one jump — never buy cooldowns incrementally`,
        kind: 'sync',
      });
    }
  }
  const locked = (ULTIMATE_WEAPON_NAMES as readonly string[]).filter((n) => !unlocked[n]);
  if (locked.length > 0) {
    const ordered = [...locked].sort(
      (a, b) => UW_PRIORITY.indexOf(a) - UW_PRIORITY.indexOf(b),
    );
    const next = ordered[0];
    items.push({
      uw: next,
      track: null,
      from: 'locked',
      to: 'unlocked',
      cost: unlockCostFor(unlockedCount),
      reason: `Next unlock by wiki priority (${UW_PRIORITY.indexOf(next) + 1} of 9)`,
      kind: 'unlock',
    });
  }
  for (const uw of UW_PRIORITY) {
    if (!unlocked[uw]) continue;
    for (const d of trackDefs(uw)) {
      const lvl = levels[uw]?.[d.name] ?? 0;
      const nb = nextBuy(uw, d.name, lvl);
      if (!nb || nb.maxed) continue;
      if (d.name === 'Cooldown' && plan && plan.jumps.some((j) => j.uw === uw)) continue;
      const curVal = d.values[Math.min(lvl, d.values.length - 1)].value;
      items.push({
        uw,
        track: d.name,
        from: d.format(curVal),
        to: d.format(nb.value),
        cost: nb.cost,
        reason: `${uw} is priority ${UW_PRIORITY.indexOf(uw) + 1} of 9`,
        kind: 'next',
      });
    }
  }
  if (locked.length === 0) {
    for (const uw of UW_PRIORITY) {
      const pb = plusNext(uw, plus[uw] ?? 0);
      if (!pb || pb.maxed) continue;
      items.push({
        uw,
        track: pb.name,
        from: `+${pb.level}`,
        to: `+${pb.level + 1}`,
        cost: pb.cost,
        reason: 'Enhancement track — all 9 UWs unlocked',
        kind: 'plus',
      });
    }
  }
  const kindRank: Record<QueueKind, number> = { sync: 0, unlock: 1, next: 2, plus: 3 };
  return items.sort(
    (a, b) =>
      kindRank[a.kind] - kindRank[b.kind] ||
      UW_PRIORITY.indexOf(a.uw) - UW_PRIORITY.indexOf(b.uw) ||
      a.cost - b.cost,
  );
}
