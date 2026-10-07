import {
  StandardPerks,
  UltimatePerks,
  TradeoffPerks,
  STANDARD_PERK_CHANCE,
  ULTIMATE_PERK_CHANCE,
  TRADEOFF_PERK_CHANCE,
  UltimateWeaponToEnum,
} from '../data/perks-data';

export interface PerkInput {
  options: number;
  intervalWaves: number;
  banned: string[];
  levels: Record<string, number>;
  ownedUWs: string[];
}

export interface PerkOdds {
  name: string;
  category: 'STANDARD' | 'ULTIMATE' | 'TRADEOFF';
  level: number;
  maxLevel: number;
  maxed: boolean;
  banned: boolean;
  unavailable: boolean;
  pPerChoice: number;
  wavesTo50: number | null;
  wavesTo90: number | null;
}

function wavesForTarget(p: number, intervalWaves: number, target: number): number | null {
  if (!(p > 0) || p >= 1 || !(intervalWaves > 0)) return null;
  const choices = Math.log(1 - target) / Math.log(1 - p);
  return Math.ceil(choices * intervalWaves);
}

export function computeOdds(input: PerkInput): PerkOdds[] {
  const options = Math.max(1, Math.floor(input.options) || 1);
  const interval = Math.max(1, input.intervalWaves || 200);
  const banned = new Set(input.banned);
  const pools: { names: string[]; chance: number; category: PerkOdds['category']; maxOf: (n: string) => number }[] = [
    {
      names: Object.keys(StandardPerks),
      chance: STANDARD_PERK_CHANCE / 100,
      category: 'STANDARD',
      maxOf: (n) => (StandardPerks as Record<string, { maxLevel: number }>)[n].maxLevel,
    },
    {
      names: Object.keys(UltimatePerks).filter((perk) => {
        const owner = Object.keys(UltimateWeaponToEnum).find(
          (uw) => (UltimateWeaponToEnum as Record<string, string>)[uw] === perk,
        );
        return owner == null || input.ownedUWs.includes(owner);
      }),
      chance: ULTIMATE_PERK_CHANCE / 100,
      category: 'ULTIMATE',
      maxOf: (n) => (UltimatePerks as Record<string, { maxLevel: number }>)[n].maxLevel,
    },
    {
      names: Object.keys(TradeoffPerks),
      chance: TRADEOFF_PERK_CHANCE / 100,
      category: 'TRADEOFF',
      maxOf: (n) => (TradeoffPerks as Record<string, { maxLevel: number }>)[n].maxLevel,
    },
  ];
  return pools.flatMap((pool) => {
    const eligible = pool.names.filter((n) => !banned.has(n) && (input.levels[n] ?? 0) < pool.maxOf(n));
    return pool.names.map((name) => {
      const level = Math.max(0, input.levels[name] ?? 0);
      const maxLevel = pool.maxOf(name);
      const maxed = level >= maxLevel;
      const isBanned = banned.has(name);
      const unavailable = pool.category === 'ULTIMATE' && !pool.names.includes(name);
      const perSlot = eligible.length > 0 && !maxed && !isBanned ? 1 / eligible.length : 0;
      const p = pool.chance * (1 - Math.pow(1 - perSlot, options));
      return {
        name,
        category: pool.category,
        level,
        maxLevel,
        maxed,
        banned: isBanned,
        unavailable,
        pPerChoice: maxed || isBanned || unavailable ? 0 : p,
        wavesTo50: wavesForTarget(maxed || isBanned || unavailable ? 0 : p, interval, 0.5),
        wavesTo90: wavesForTarget(maxed || isBanned || unavailable ? 0 : p, interval, 0.9),
      };
    });
  });
}
