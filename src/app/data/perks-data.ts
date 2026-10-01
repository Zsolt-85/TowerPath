export const STANDARD_PERK_CHANCE = 65;
export const ULTIMATE_PERK_CHANCE = 20;
export const TRADEOFF_PERK_CHANCE = 15;

export const StandardPerks = Object.freeze({
  MAX_HEALTH: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 1 + 0.2 * c, formatValue: (v: number) => 'Max Health x' + v.toFixed(2) },
  DAMAGE: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 1 + 0.15 * c, formatValue: (v: number) => 'Damage x' + v.toFixed(2) },
  HEALTH_REGEN: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 1 + 0.6 * c, formatValue: (v: number) => 'Health Regen x' + v.toFixed(2) },
  COIN_BONUSES: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 1 + 0.15 * c, formatValue: (v: number) => 'Coin Bonuses x' + v.toFixed(2) },
  BOUNCE_SHOT: { category: 'STANDARD', maxLevel: 3, getValue: ({ count }: { count: number }) => count, formatValue: (v: number) => 'Bounce Shot +' + v },
  INTEREST: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 1 + 0.5 * c, formatValue: (v: number) => 'Interest x' + v.toFixed(2) },
  LAND_MINE_DAMAGE: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 1 + 2.5 * c, formatValue: (v: number) => 'Land Mine Damage x' + v.toFixed(2) },
  ORBS: { category: 'STANDARD', maxLevel: 2, getValue: ({ count }: { count: number }) => count, formatValue: (v: number) => 'Orbs +' + v },
  FREE_UPGRADE_CHANCE: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 5 * c, formatValue: (v: number) => 'Free upgrade chance +' + v.toFixed(2) + '%' },
  DEFENSE_PERCENT: { category: 'STANDARD', maxLevel: 5, getValue: (c: number) => 4 * c, formatValue: (v: number) => 'Defense percent +' + v.toFixed(2) + '%' },
  PERK_WAVE_REQUIREMENT: { category: 'STANDARD', maxLevel: 3, getValue: (c: number) => 20 * c, formatValue: (v: number) => 'Perk wave requirement -' + v.toFixed(2) + '%' },
  UNLOCK_ULTIMATE_WEAPON: { category: 'STANDARD', maxLevel: 1, getValue: ({ count }: { count: number }) => count, formatValue: () => 'Unlock a random ultimate weapon' },
  INCREASE_GAME_SPEED: { category: 'STANDARD', maxLevel: 1, getValue: (c: number) => c, formatValue: (v: number) => 'Game speed +' + v.toFixed(2) },
});

export const UltimatePerks = Object.freeze({
  SMART_MISSILES: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 4, formatValue: () => '4 extra Smart missiles' },
  POISON_SWAMP: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 1.5, formatValue: () => 'Swamp radius x1.5' },
  DEATH_WAVE: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 1, formatValue: () => '+1 wave on death wave' },
  GOLDEN_TOWER: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 1.5, formatValue: () => 'Golden tower bonus x1.5' },
  CHAIN_LIGHTNING: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 2, formatValue: () => 'Chain lightning damage x2' },
  CHRONO_FIELD: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 1.5, formatValue: () => 'Chrono field radius x1.5' },
  INNER_LAND_MINES: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 1, formatValue: () => 'Extra set of inner mines' },
  BLACK_HOLE: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 12, formatValue: () => 'Black hole duration +12s' },
  SPOTLIGHT: { category: 'ULTIMATE', maxLevel: 1, getValue: () => 1.5, formatValue: () => 'Spotlight bonus x1.5' },
});

export const TradeoffPerks = Object.freeze({
  DAMAGE_BOSS_HEALTH: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 1.5, getDebuff: () => 8, formatValue: (v: number, d: number) => v.toFixed(2) + ' tower damage, bosses x' + d.toFixed(2) + ' health' },
  COINS_HEALTH: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 1.8, getDebuff: () => 70, formatValue: (v: number, d: number) => 'x' + v.toFixed(2) + ' coins, max health -' + d.toFixed(2) + '%' },
  HEALTH_REGEN_LIFESTEAL: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 50, getDebuff: () => 90, formatValue: (v: number, d: number) => 'Enemies -' + v.toFixed(2) + '% health, tower regen -' + d.toFixed(2) + '%' },
  DAMAGE_DAMAGE: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 50, getDebuff: () => 50, formatValue: (v: number, d: number) => 'Enemies damage -' + v.toFixed(2) + '%, tower damage -' + d.toFixed(2) + '%' },
  RANGE_RANGE: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 10, getDebuff: () => 3, formatValue: (_v: number, d: number) => 'Ranged reduced, damage x' + d.toFixed(2) },
  SPEED_DAMAGE: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 50, getDebuff: () => 2.5, formatValue: (v: number, d: number) => 'Speed -' + v.toFixed(2) + '%, damage x' + d.toFixed(2) },
  CASH_WAVE_KILL: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 12, getDebuff: () => 100, formatValue: (v: number) => 'x' + v + ' cash/wave, kills no cash' },
  REGEN_HEALTH: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 8, getDebuff: () => 60, formatValue: (v: number, d: number) => 'Tower regen x' + v.toFixed(2) + ', max health -' + d.toFixed(2) + '%' },
  BOSS_HEALTH_SPEED: { category: 'TRADEOFF', maxLevel: 1, getValue: (p: { tradeoffPerkLabLevel: number }) => 70 + p.tradeoffPerkLabLevel / 200, getDebuff: () => 50, formatValue: (v: number, d: number) => 'Boss health -' + v.toFixed(2) + '%, speed +' + d.toFixed(2) + '%' },
  LIFESTEAL_KNOCKBACK: { category: 'TRADEOFF', maxLevel: 1, getValue: () => 2.5, getDebuff: () => 70, formatValue: (v: number, d: number) => 'Lifesteal x' + v.toFixed(2) + ', knockback -' + d.toFixed(2) + '%' },
});

export const UltimateWeaponToEnum = Object.freeze({ 'Smart Missiles': 'SMART_MISSILES', 'Poison Swamp': 'POISON_SWAMP', 'Death Wave': 'DEATH_WAVE', 'Golden Tower': 'GOLDEN_TOWER', 'Chain Lightning': 'CHAIN_LIGHTNING', 'Chrono Field': 'CHRONO_FIELD', 'Inner Land Mines': 'INNER_LAND_MINES', 'Black Hole': 'BLACK_HOLE', 'Spotlight': 'SPOTLIGHT' });
