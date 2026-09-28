import * as toolkit from "tower-idle-toolkit";

export function calculateGTBHsync(gtCD: number, bhCD: number, dwCD: number = 150, smCD: number = 150) {
  const total = gtCD + bhCD + dwCD + smCD;
  const mvnPenalty = 10;
  const syncTime = Math.max(0, total / 4 - mvnPenalty);
  return syncTime;
}

import { GOLDEN_TOWER } from '../data/ultimate-weapons-data';

type UWLevel = { value: number; cost: number };

function gtCooldownTable(): UWLevel[] {
  const upgrades = (GOLDEN_TOWER as unknown as { upgrades: Record<string, { values: readonly UWLevel[] }> }).upgrades;
  return [...upgrades.Cooldown.values];
}

function gtLevelIndex(table: UWLevel[], cd: number): number {
  for (let i = 0; i < table.length; i++) {
    if (table[i].value <= cd) return i;
  }
  return table.length - 1;
}

export function getGTBHRequiredStones(currentGTCD: number, targetGTCD: number) {
  const table = gtCooldownTable();
  const from = gtLevelIndex(table, currentGTCD);
  const to = gtLevelIndex(table, targetGTCD);
  if (to <= from) return 0;
  let cost = 0;
  for (let i = from + 1; i <= to; i++) cost += table[i].cost;
  return cost;
}

export function calculateDPS(damage: number, attackSpeed: number) {
  return damage * (1 / Math.max(0.01, attackSpeed));
}

export function calculateCoinsPerHour(damage: number, waveDuration: number = 26) {
  const wavesPerHour = 3600 / Math.max(1, waveDuration);
  return damage * wavesPerHour * 0.01;
}

export function getRecommendedPath(
  damage: number,
  attackSpeed: number,
  coinsPerKill: number,
  stones: number,
  currentGTCD: number = 300
) {
  const recommendations: Array<{ priority: number; name: string; desc: string; cost: number; currency: string; impact: string }> = [];

  if (stones >= 2400) {
    recommendations.push({
      priority: 1,
      name: "Golden Tower Cooldown",
      desc: `Reduce from ${currentGTCD}s → 150s`,
      cost: 2400,
      currency: "stones",
      impact: "+50% coin efficiency via sync",
    });
  }

  if (stones >= 1800) {
    recommendations.push({
      priority: 2,
      name: "Black Hole Duration",
      desc: "Increase from 180s → 240s",
      cost: 1800,
      currency: "stones",
      impact: "+33% more enemies captured",
    });
  }

  recommendations.push({
    priority: 3,
    name: "Lab Speed Research",
    desc: "50 → 75 research speed",
    cost: 12000000,
    currency: "coins",
    impact: "-33% research time",
  });

  recommendations.push({
    priority: 4,
    name: "Cash/Wave Workshop Upgrade",
    desc: "+50% coins per wave",
    cost: 800000,
    currency: "coins",
    impact: "+50% coin income",
  });

  return recommendations.sort((a, b) => a.priority - b.priority);
}

export function getAllGameData() {
  return {
    constants: {
      waveDuration: 26,
      normalCooldown: 9,
      bossCooldown: 12,
      spawnThresholds: [0, 50, 200, 500, 1000],
      gameSpeedMap: {
        1: { cost: 300, time: "9m", value: 2.0 },
        2: { cost: 2500, time: "2h30m", value: 2.5 },
        3: { cost: 12000, time: "9h48m", value: 3.0 },
        4: { cost: 50000, time: "1d10h", value: 3.5 },
        5: { cost: 150000, time: "3d19h", value: 4.0 },
        6: { cost: 500000, time: "14d1h", value: 4.5 },
        7: { cost: 1000000, time: "25d11h", value: 5.0 },
      },
    },
    labs: Object.keys(toolkit.LAB_GROUPS || {}),
    workshop: Object.keys(toolkit.WORKSHOP_UPGRADES || {}),
    ultimateWeapons: Object.keys(toolkit.ULTIMATE_WEAPONS || {}),
    bots: Object.keys(toolkit.BOTS || {}),
    cards: Object.keys(toolkit.CARDS || {}),
    perks: Object.keys(toolkit.Perks || {}),
  };
}

export { toolkit };
