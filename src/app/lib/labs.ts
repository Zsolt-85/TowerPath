import { LAB_GROUPS, labsDurationMap } from '../data/labs-data';

export function labGroupOf(lab: string): string {
  const groups = LAB_GROUPS as Record<string, string[]>;
  for (const g of Object.keys(groups)) {
    if (groups[g].includes(lab)) return g;
  }
  return 'Main Labs';
}

function durationEntry(lab: string, level: number): number | null {
  try {
    const table = (labsDurationMap as Record<string, unknown>)[lab] as
      | Record<string, unknown>
      | undefined;
    if (!table) return null;
    const raw = table[String(level)];
    if (typeof raw === 'number') return raw;
    if (raw != null && typeof raw === 'object') {
      const d = (raw as Record<string, unknown>).DURATION;
      if (typeof d === 'number') return d;
    }
    return null;
  } catch {
    return null;
  }
}

export function labLevelSeconds(lab: string, level: number): number {
  const known = durationEntry(lab, level);
  if (known != null && isFinite(known) && known > 0) return known;
  const g = labGroupOf(lab);
  const base = g === 'Main Labs' ? 900 : g === 'Ultimate Weapon Labs' ? 2400 : 600;
  return base * Math.pow(1.22, Math.min(Math.max(level, 1), 99));
}

export function maxLevelFor(lab: string): number {
  try {
    const table = (labsDurationMap as Record<string, unknown>)[lab] as
      | Record<string, unknown>
      | undefined;
    if (table) {
      const keys = Object.keys(table)
        .map((k) => Number(k))
        .filter((n) => isFinite(n));
      if (keys.length > 0) return Math.max(...keys);
    }
  } catch {
    // fall through
  }
  if (lab === 'Game Speed') return 7;
  return 99;
}

export function slotEtaDays(
  lab: string,
  current: number,
  target: number,
  effectiveSpeed: number,
): number {
  const lo = Math.max(0, Math.min(current, target));
  const hi = Math.max(lo, target);
  let secs = 0;
  for (let l = lo + 1; l <= hi; l += 1) secs += labLevelSeconds(lab, l);
  return secs / 86400 / Math.max(0.1, effectiveSpeed);
}

const PALETTE = [
  '#f0a500', '#00d4aa', '#e5484d', '#8e7bff', '#46a758',
  '#f76b15', '#12a594', '#e93d82', '#0091ff', '#f5d90a',
];

export function labColor(lab: string): string {
  let h = 0;
  for (let i = 0; i < lab.length; i += 1) h = (h * 31 + lab.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export interface LabBlock {
  slot: number;
  lab: string;
  from: number;
  to: number;
  startDay: number;
  endDay: number;
}

export function buildBlocks(
  slots: { lab: string; current: number; target: number; speed: number }[],
  globalSpeed: number,
): LabBlock[] {
  return slots
    .map((s, i) => {
      const target = Math.min(Math.max(s.current, s.target), maxLevelFor(s.lab));
      if (target <= s.current) return null;
      const eff = Math.max(0.1, globalSpeed * s.speed);
      let secs = 0;
      for (let l = s.current + 1; l <= target; l += 1) secs += labLevelSeconds(s.lab, l);
      return {
        slot: i,
        lab: s.lab,
        from: s.current,
        to: target,
        startDay: 0,
        endDay: secs / 86400 / eff,
      };
    })
    .filter((b): b is LabBlock => b !== null);
}

export interface LabFlag {
  slot: number;
  message: string;
}

export function validateSlots(
  slots: { lab: string; current: number; target: number }[],
): LabFlag[] {
  const flags: LabFlag[] = [];
  const seen = new Map<string, number>();
  slots.forEach((s, i) => {
    if (s.target <= s.current) {
      flags.push({ slot: i, message: 'Already at target — pick the next lab for this slot.' });
      return;
    }
    const first = seen.get(s.lab);
    if (first != null) {
      flags.push({ slot: i, message: `Same lab as slot ${first + 1} — research does not stack.` });
    } else {
      seen.set(s.lab, i);
    }
  });
  return flags;
}
