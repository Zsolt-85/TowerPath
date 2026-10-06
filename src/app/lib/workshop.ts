import {
  ATTACK_UPGRADES,
  DEFENSE_UPGRADES,
  UTILITY_UPGRADES,
  ATTACK_UNLOCKS,
  DEFENSE_UNLOCKS,
  UTILITY_UNLOCKS,
} from '../data/workshop-data';

export type WorkshopTree = 'Attack' | 'Defense' | 'Utility';

export interface WorkshopSpec {
  name: string;
  min: number;
  max: number;
  quantity: number;
  tree: WorkshopTree;
}

interface RawSpec {
  name?: unknown;
  min?: unknown;
  max?: unknown;
  quantity?: unknown;
}

function toSpecs(
  table: Record<string, unknown>,
  tree: WorkshopTree,
): WorkshopSpec[] {
  return Object.entries(table)
    .map(([key, raw]) => {
      const r = raw as RawSpec;
      if (typeof r.name !== 'string') return null;
      const min = Number(r.min);
      const max = Number(r.max);
      const quantity = Number(r.quantity);
      if (![min, max, quantity].every(Number.isFinite) || quantity <= 0) return null;
      void key;
      return { name: r.name, min, max, quantity, tree };
    })
    .filter((s): s is WorkshopSpec => s !== null);
}

export function allSpecs(): WorkshopSpec[] {
  return [
    ...toSpecs(ATTACK_UPGRADES as Record<string, unknown>, 'Attack'),
    ...toSpecs(DEFENSE_UPGRADES as Record<string, unknown>, 'Defense'),
    ...toSpecs(UTILITY_UPGRADES as Record<string, unknown>, 'Utility'),
  ];
}

export function valueAt(spec: WorkshopSpec, level: number): number {
  const l = Math.min(spec.quantity, Math.max(0, level));
  return spec.min + ((spec.max - spec.min) * l) / spec.quantity;
}

export function levelsForTarget(spec: WorkshopSpec, target: number): number {
  if (target <= spec.min) return 0;
  if (target >= spec.max) return spec.quantity;
  if (spec.max === spec.min) return 0;
  return Math.min(
    spec.quantity,
    Math.max(0, Math.ceil(((target - spec.min) * spec.quantity) / (spec.max - spec.min))),
  );
}

export interface UnlockInfo {
  tier: string;
  cost: number;
}

export function unlockForUpgrade(upgradeName: string): UnlockInfo | null {
  const groups: { tier: string; list: { name: string; cost: number; upgrades: string[] }[] }[] = [
    { tier: 'Attack', list: ATTACK_UNLOCKS as { name: string; cost: number; upgrades: string[] }[] },
    { tier: 'Defense', list: DEFENSE_UNLOCKS as { name: string; cost: number; upgrades: string[] }[] },
    { tier: 'Utility', list: UTILITY_UNLOCKS as { name: string; cost: number; upgrades: string[] }[] },
  ];
  for (const g of groups) {
    for (const u of g.list) {
      if (u.cost > 0 && u.upgrades.includes(upgradeName)) {
        return { tier: `${g.tier} · ${u.name}`, cost: u.cost };
      }
    }
  }
  return null;
}

export interface UpgradePlan {
  name: string;
  tree: WorkshopTree;
  from: number;
  to: number;
  effectFrom: number;
  effectTo: number;
  unlock: UnlockInfo | null;
}

export function planUpgrades(
  specs: WorkshopSpec[],
  levels: Record<string, number>,
  targets: Record<string, number>,
): UpgradePlan[] {
  return specs
    .map((spec) => {
      const from = Math.max(0, Math.min(spec.quantity, Math.floor(Number(levels[spec.name]) || 0)));
      const to = Math.max(from, Math.min(spec.quantity, Math.floor(Number(targets[spec.name]) || from)));
      if (to <= from) return null;
      return {
        name: spec.name,
        tree: spec.tree,
        from,
        to,
        effectFrom: valueAt(spec, from),
        effectTo: valueAt(spec, to),
        unlock: from === 0 ? unlockForUpgrade(spec.name) : null,
      };
    })
    .filter((p): p is UpgradePlan => p !== null);
}
