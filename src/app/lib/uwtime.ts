import { ULTIMATE_WEAPONS } from '../data/ultimate-weapons-data';

export type Mech = 'Timed' | 'Proc' | 'Event' | 'Persistent' | 'Continuous';

export const MECHANICS: Record<string, Mech> = {
  'Chain Lightning': 'Proc',
  'Smart Missiles': 'Event',
  'Death Wave': 'Persistent',
  'Chrono Field': 'Timed',
  'Inner Land Mines': 'Persistent',
  'Golden Tower': 'Timed',
  'Poison Swamp': 'Timed',
  'Black Hole': 'Timed',
  Spotlight: 'Continuous',
};

export const BH_DURATION_PERK_BONUS = 12;

export interface UWTimeRow {
  duration: number;
  runBonus: number;
  cooldown: number;
  extraCd: number;
  cdMult: number;
}

export function effectiveDuration(row: UWTimeRow): number {
  return Math.max(0, row.duration) + Math.max(0, row.runBonus);
}

export function effectiveCooldown(row: UWTimeRow): number {
  return (Math.max(0, row.cooldown) + Math.max(0, row.extraCd)) * Math.max(0.01, row.cdMult);
}

export function uptime(mech: Mech, row: UWTimeRow): number | null {
  if (mech !== 'Timed') return null;
  const cd = effectiveCooldown(row);
  if (!(cd > 0)) return null;
  return Math.min(1, effectiveDuration(row) / cd);
}

export function activationsPerHour(row: UWTimeRow): number | null {
  const cd = effectiveCooldown(row);
  if (!(cd > 0)) return null;
  return 3600 / cd;
}

function gcd(a: number, b: number): number {
  let x = Math.max(1, Math.round(Math.abs(a)));
  let y = Math.max(1, Math.round(Math.abs(b)));
  while (y > 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

export function overlapPair(a: { dur: number; cd: number }, b: { dur: number; cd: number }): number {
  const ca = Math.max(1, Math.round(a.cd));
  const cb = Math.max(1, Math.round(b.cd));
  const cycle = Math.min(200000, Math.abs((ca * cb) / gcd(ca, cb)));
  let both = 0;
  for (let t = 0; t < cycle; t += 1) {
    const aa = ca > 0 && t % ca < Math.min(a.dur, ca);
    const bb = cb > 0 && t % cb < Math.min(b.dur, cb);
    if (aa && bb) both += 1;
  }
  return cycle > 0 ? both / cycle : 0;
}

function tableValue(uw: string, track: string, level: number): number | null {
  try {
    const entry = (ULTIMATE_WEAPONS as unknown as Record<string, { upgrades: Record<string, { values: { value: number }[] }> }>)[uw];
    const vals = entry?.upgrades?.[track]?.values;
    if (!Array.isArray(vals) || vals.length === 0) return null;
    const i = Math.max(0, Math.min(vals.length - 1, Math.floor(level) || 0));
    const v = vals[i]?.value;
    return typeof v === 'number' ? v : null;
  } catch {
    return null;
  }
}

export function prefillFromLevels(
  levels: Record<string, Record<string, number>>,
): Record<string, Partial<UWTimeRow>> {
  const out: Record<string, Partial<UWTimeRow>> = {};
  for (const uw of Object.keys(MECHANICS)) {
    const cd = tableValue(uw, 'Cooldown', levels[uw]?.['Cooldown'] ?? 0);
    const du = tableValue(uw, 'Duration', levels[uw]?.['Duration'] ?? 0);
    const row: Partial<UWTimeRow> = {};
    if (cd != null) row.cooldown = cd;
    if (du != null) row.duration = du;
    out[uw] = row;
  }
  return out;
}
