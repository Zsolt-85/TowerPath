export const WAVE_DURATION = 26;
export const NORMAL_WAVE_COOLDOWN = 9;
export const BOSS_WAVE_COOLDOWN = 12;
export const TOURNAMENT_COOLDOWN_MODIFIER = 0.5;
export const EB_MODIFIER = 3.56;
export const NO_EB_MODIFIER = 2;

export const SPAWN_THRESHOLDS = Object.freeze([
  0, 1, 3, 6, 20, 40, 60, 80, 100, 150, 160, 200, 250, 300, 320,
  400, 600, 750, 800, 1000, 1250, 1500, 2000, 2500, 3000, 3500,
  4000, 4500, 5000, 5500, 6000, 6500, Number.POSITIVE_INFINITY,
]);

export const GEM_THRESHOLDS = Object.freeze([
  1, 60, 3600, 86400, 604800, 2592000, 7776000, 31104000,
]);

export const PLUS_UNLOCK_COSTS = Object.freeze([
  500, 625, 750, 975, 1250, 1650, 2200, 2900, 3800,
]);

export const UNLOCK_COSTS = Object.freeze([
  5, 50, 150, 300, 800, 1250, 1750, 2400, 3000,
]);

export const MAX_INTEREST_LEVELS: { [level: number]: number | undefined } = Object.freeze({
  0: 50, 1: 100, 2: 200, 3: 300, 4: 500, 5: 700, 6: 1000, 7: 1500,
  8: 2000, 9: 2500, 10: 3500, 11: 5000, 12: 7500, 13: 10000,
  14: 12500, 15: 15000,
});

export const STANDARD_PERK_CHANCE = 65;
export const ULTIMATE_PERK_CHANCE = 20;
export const TRADEOFF_PERK_CHANCE = 15;

export const WORKSHOP_ORB_DISTANCE = 75;
export const BASE_REND_CAP_MAX = 800;

export const isBossWave = (wave: number): boolean => wave % 10 === 0;

export const getRealGameSpeed = (displayedGameSpeed: number, introSprint: boolean = false): number => {
  let realGameSpeed = 1;
  if (displayedGameSpeed <= 1) {
    realGameSpeed = introSprint ? 6.07999992371 : 1.07000005245;
  } else if (displayedGameSpeed <= 1.5) {
    realGameSpeed = introSprint ? 9.11999988556 : 1.60500001907;
  } else if (displayedGameSpeed <= 2) {
    realGameSpeed = introSprint ? 12.15999984741 : 2;
  } else if (displayedGameSpeed <= 2.5) {
    realGameSpeed = introSprint ? 15.19999980927 : 2.375;
  } else if (displayedGameSpeed <= 3) {
    realGameSpeed = introSprint ? 18.23999977112 : 2.75999999046;
  } else if (displayedGameSpeed <= 3.5) {
    realGameSpeed = introSprint ? 21.28000068665 : 3.07999992371;
  } else if (displayedGameSpeed <= 4) {
    realGameSpeed = introSprint ? 24.31999969482 : 3.3599998951;
  } else if (displayedGameSpeed <= 4.5) {
    realGameSpeed = introSprint ? 27.36000061035 : 3.69000005722;
  } else if (displayedGameSpeed <= 5) {
    realGameSpeed = introSprint ? 30.39999961853 : 4;
  } else if (displayedGameSpeed <= 5.5) {
    realGameSpeed = 4.40000009537;
  } else if (displayedGameSpeed <= 6) {
    realGameSpeed = 4.80000019073;
  } else if (displayedGameSpeed <= 6.25 || displayedGameSpeed === 6.3) {
    realGameSpeed = 5;
  } else {
    realGameSpeed = 4.8 + (displayedGameSpeed - 6) * 0.2;
  }
  return realGameSpeed;
};

export const getWaveCooldown = (wave: number, waveAccelerator: number, tournament: boolean): number => {
  const waModifier = 1 - ((WAVE_ACCELERATOR_CARD as unknown as Record<number, number>)[waveAccelerator] || 0) / 100;
  const baseCooldown = isBossWave(wave) ? BOSS_WAVE_COOLDOWN : NORMAL_WAVE_COOLDOWN;
  const tournamentModifier = tournament ? TOURNAMENT_COOLDOWN_MODIFIER : 1;
  return baseCooldown * waModifier * tournamentModifier;
};

export const getInGameWaveTime = (wave: number, waveAccelerator: number, tournament: boolean): number => {
  return WAVE_DURATION + getWaveCooldown(wave, waveAccelerator, tournament);
};

export const getRealWaveTime = ({
  wave, displayedGameSpeed, introSprint, waveAccelerator, tournament,
}: { wave: number; displayedGameSpeed: number; introSprint: boolean; waveAccelerator: number; tournament: boolean }): number => {
  const gameSpeed = getRealGameSpeed(displayedGameSpeed, introSprint);
  const time = getInGameWaveTime(wave, waveAccelerator, tournament);
  return time / gameSpeed;
};

export const getStats = (currentTier: number, currentWave: number, tournament: boolean): { DAMAGE: number; HP: number } => {
  let tierDifficultyMultiplier;
  if (currentTier > 1) {
    tierDifficultyMultiplier = (1 + (currentTier - 1) * 15.5) * (1.43 ** (currentTier - 2) + 0.2 * (currentTier - 1));
  } else {
    tierDifficultyMultiplier = 1;
  }
  if (currentTier >= 5) { tierDifficultyMultiplier *= 1.05; if (currentTier >= 6) { tierDifficultyMultiplier *= 1.11; if (currentTier >= 7) { tierDifficultyMultiplier *= 1.2; if (currentTier >= 8) { tierDifficultyMultiplier *= 1.38; if (currentTier >= 9) { tierDifficultyMultiplier *= 1.75; if (currentTier >= 10) { tierDifficultyMultiplier *= 4.3; if (currentTier >= 11) { tierDifficultyMultiplier *= 41; if (currentTier >= 12) { tierDifficultyMultiplier *= 410; if (currentTier >= 13) { tierDifficultyMultiplier *= 9000; if (currentTier >= 14) { tierDifficultyMultiplier *= 5000; if (currentTier >= 15) { tierDifficultyMultiplier *= 1000; } } } } } } } } } } }

  const multiplesOf1024 = Math.floor(currentWave / 1024);
  const multiplesOf900 = Math.floor(currentWave / 900);
  const multiplesOf400 = Math.floor(currentWave / 400);
  const multiplesOf200 = Math.floor(currentWave / 200);
  const multiplesOf100 = Math.floor(currentWave / 100);
  const multiplesOf107 = Math.floor(currentWave / 107);
  const multiplesOf94 = Math.floor(currentWave / 94);
  const multiplesOf83 = Math.floor(currentWave / 83);
  const multiplesOf72 = Math.floor(currentWave / 72);
  const multiplesOf60 = Math.floor(currentWave / 60);
  const multiplesOf139 = Math.floor(currentWave / 139);
  const multiplesOf182 = Math.floor(currentWave / 182);
  const multiplesOf241 = Math.floor(currentWave / 241);
  const multiplesOf332 = Math.floor(currentWave / 332);
  const multiplesOf50 = Math.floor(currentWave / 50);
  const multiplesOf30 = Math.floor(currentWave / 30);
  const multiplesOf25 = Math.floor(currentWave / 25);
  const multiplesOf10 = Math.floor(currentWave / 10);
  const multiplesOf5 = Math.floor(currentWave / 5);

  let enemyHealthAdjust = 1 + (0.04 * multiplesOf5 + 0.05 * multiplesOf10 + 0.06 * multiplesOf25 + 0.08 * multiplesOf50 + 0.12 * multiplesOf100 + 0.15 * multiplesOf200 + 0.35 * multiplesOf900 + 0.1 * multiplesOf60 + 0.18 * multiplesOf72 + 0.2 * multiplesOf83 + 0.21 * multiplesOf94 + 0.1 * multiplesOf107);
  let enemyAttackAdjust = 1 + (0.02 * multiplesOf5 + 0.025 * multiplesOf10 + 0.012 * multiplesOf25 + 0.017 * multiplesOf50 + 0.02 * multiplesOf100 + 0.025 * multiplesOf200 + 0.02 * multiplesOf900);

  enemyHealthAdjust *= 1.035 ** multiplesOf30;
  enemyHealthAdjust *= 1.02 ** multiplesOf60;
  enemyHealthAdjust *= 1.025 ** multiplesOf72;
  enemyHealthAdjust *= 1.03 ** multiplesOf83;
  enemyHealthAdjust *= 1.03 ** multiplesOf94;
  enemyHealthAdjust *= 1.02 ** multiplesOf100;
  enemyHealthAdjust *= 1.02 ** multiplesOf107;
  enemyHealthAdjust *= 1.03 ** multiplesOf200;
  enemyHealthAdjust *= 1.06 ** multiplesOf400;
  enemyHealthAdjust *= 1.15 ** multiplesOf900;
  enemyHealthAdjust *= 1.15 ** multiplesOf1024;
  enemyHealthAdjust *= 1.11 ** multiplesOf139;
  enemyHealthAdjust *= 1.11 ** multiplesOf182;
  enemyHealthAdjust *= 1.13 ** multiplesOf241;
  enemyHealthAdjust *= 1.13 ** multiplesOf332;

  enemyAttackAdjust *= 1.005 ** multiplesOf30;
  enemyAttackAdjust *= 1.01 ** multiplesOf72;
  enemyAttackAdjust *= 1.01 ** multiplesOf83;
  enemyAttackAdjust *= 1.01 ** multiplesOf94;
  enemyAttackAdjust *= 1.01 ** multiplesOf107;
  enemyAttackAdjust *= 1.02 ** multiplesOf200;
  enemyAttackAdjust *= 1.02 ** multiplesOf400;
  enemyAttackAdjust *= 1.035 ** multiplesOf900;
  enemyAttackAdjust *= 1.05 ** multiplesOf1024;
  if (currentTier >= 7) enemyAttackAdjust *= 1.025 ** multiplesOf139;
  if (currentTier >= 8) enemyAttackAdjust *= 1.025 ** multiplesOf182;
  enemyAttackAdjust *= 1.03 ** multiplesOf241;
  enemyAttackAdjust *= 1.03 ** multiplesOf332;

  let healthExponentialFactor;
  let damageExponentialFactor;
  if (tournament) {
    healthExponentialFactor = 2.308;
    damageExponentialFactor = 2.105;
  } else {
    healthExponentialFactor = 2.13;
    damageExponentialFactor = 2.007;
  }
  if (currentTier >= 10) { healthExponentialFactor += 0.01; damageExponentialFactor += 0.002; }
  if (currentTier >= 11) { healthExponentialFactor += 0.01; damageExponentialFactor += 0.002; }
  if (currentTier >= 12) { healthExponentialFactor += 0.08; damageExponentialFactor += 0.016; }
  if (currentTier >= 13) { healthExponentialFactor += 0.12; damageExponentialFactor += 0.025; }
  if (currentTier >= 14) { healthExponentialFactor += 0.14; damageExponentialFactor += 0.028; }
  if (currentTier >= 15) { healthExponentialFactor += 0.15; damageExponentialFactor += 0.029; }

  let healthMultFactor = 0.8;
  let damageMultFactor = 0.16;
  let healthPreExponentialFactor = 0.05;
  let damagePreExponentialFactor = 0.021;
  if (tournament) { healthMultFactor *= 7.3; damageMultFactor *= 7.3; healthPreExponentialFactor *= 9.3; damagePreExponentialFactor *= 9.3; }

  let currentWaveBaseHealth = (healthPreExponentialFactor * currentWave ** healthExponentialFactor + healthMultFactor * currentWave + 1.5) * enemyHealthAdjust;
  let currentWaveBaseDamage = (damagePreExponentialFactor * currentWave ** damageExponentialFactor + damageMultFactor * currentWave + 1.07) * enemyAttackAdjust;
  currentWaveBaseHealth *= tierDifficultyMultiplier;
  if (currentTier < 4) currentWaveBaseDamage *= tierDifficultyMultiplier * 0.94;
  else if (currentTier < 7) currentWaveBaseDamage *= tierDifficultyMultiplier * 0.9;
  else currentWaveBaseDamage *= tierDifficultyMultiplier * 0.86;

  return { DAMAGE: Math.floor(currentWaveBaseDamage), HP: Math.floor(currentWaveBaseHealth) };
};

export const waveSpawns = (wave: number, enemyBalance: boolean): { spawns: number; basic: number; fast: number; tank: number; ranged: number; boss: number } => {
  let spawnRate: number; let fastRate: number; let tankRate: number; let rangedRate: number;
  if (wave >= 6500) { fastRate = 24; tankRate = 22; rangedRate = 21; spawnRate = 56; }
  else if (wave >= 6000) { fastRate = 24; tankRate = 21; rangedRate = 20; spawnRate = 54; }
  else if (wave >= 5500) { fastRate = 23; tankRate = 21; rangedRate = 19; spawnRate = 52; }
  else if (wave >= 5000) { fastRate = 22; tankRate = 20; rangedRate = 19; spawnRate = 50; }
  else if (wave >= 4500) { fastRate = 21; tankRate = 20; rangedRate = 19; spawnRate = 49; }
  else if (wave >= 4000) { fastRate = 21; tankRate = 20; rangedRate = 18; spawnRate = 48; }
  else if (wave >= 3500) { fastRate = 20; tankRate = 19; rangedRate = 17; spawnRate = 46; }
  else if (wave >= 3000) { fastRate = 19; tankRate = 19; rangedRate = 16; spawnRate = 44; }
  else if (wave >= 2500) { fastRate = 18; tankRate = 18; rangedRate = 15; spawnRate = 42; }
  else if (wave >= 2000) { fastRate = 17; tankRate = 17; rangedRate = 14; spawnRate = 40; }
  else if (wave >= 1500) { fastRate = 15; tankRate = 16; rangedRate = 14; spawnRate = 39; }
  else if (wave >= 1250) { fastRate = 15; tankRate = 16; rangedRate = 11; spawnRate = 38; }
  else if (wave >= 1000) { fastRate = 14; tankRate = 15; rangedRate = 11; spawnRate = 37; }
  else if (wave >= 800) { fastRate = 13; tankRate = 14; rangedRate = 11; spawnRate = 36; }
  else if (wave >= 750) { fastRate = 13; tankRate = 14; rangedRate = 10; spawnRate = 34; }
  else if (wave >= 600) { fastRate = 13; tankRate = 14; rangedRate = 10; spawnRate = 34; }
  else if (wave >= 400) { fastRate = 13; tankRate = 13; rangedRate = 9; spawnRate = 32; }
  else if (wave >= 320) { fastRate = 12; tankRate = 13; rangedRate = 8; spawnRate = 30; }
  else if (wave >= 300) { fastRate = 12; tankRate = 13; rangedRate = 8; spawnRate = 30; }
  else if (wave >= 250) { fastRate = 12; tankRate = 12; rangedRate = 7; spawnRate = 28; }
  else if (wave >= 200) { fastRate = 11; tankRate = 11; rangedRate = 7; spawnRate = 26; }
  else if (wave >= 160) { fastRate = 11; tankRate = 10; rangedRate = 6; spawnRate = 24; }
  else if (wave >= 150) { fastRate = 11; tankRate = 10; rangedRate = 6; spawnRate = 24; }
  else if (wave >= 100) { fastRate = 10; tankRate = 9; rangedRate = 6; spawnRate = 22; }
  else if (wave >= 80) { fastRate = 10; tankRate = 8; rangedRate = 5; spawnRate = 20; }
  else if (wave >= 60) { fastRate = 9; tankRate = 8; rangedRate = 4; spawnRate = 19; }
  else if (wave >= 40) { fastRate = 8; tankRate = 7; rangedRate = 3; spawnRate = 17; }
  else if (wave >= 20) { fastRate = 7; tankRate = 6; rangedRate = 2; spawnRate = 15; }
  else if (wave >= 6) { fastRate = 6; tankRate = 4; rangedRate = 1; spawnRate = 13; }
  else if (wave >= 3) { fastRate = 5; tankRate = 2; rangedRate = 0; spawnRate = 11; }
  else { fastRate = 5; tankRate = 0; rangedRate = 0; spawnRate = 10; }
  const basicRate = 100 - (fastRate + tankRate + rangedRate);
  const spawns = spawnRate * (enemyBalance ? EB_MODIFIER : NO_EB_MODIFIER);
  const isBossWave = wave % 10 === 0;
  const boss = isBossWave ? 1 : 0;
  const basic = Math.floor((basicRate * spawns) / 100 - boss);
  const fast = Math.floor((fastRate * spawns) / 100);
  const tank = Math.floor((tankRate * spawns) / 100);
  const ranged = Math.floor((rangedRate * spawns) / 100);
  return Object.freeze({ spawns, basic, fast, tank, ranged, boss });
};

export const totalSpawns = (wave: number, enemyBalance: boolean): { spawns: number; basic: number; fast: number; tank: number; ranged: number; boss: number } => {
  const total = { spawns: 0, basic: 0, fast: 0, tank: 0, ranged: 0, boss: 0 };
  let previousThresholdWave = 0;
  for (let threshold = 0; threshold < SPAWN_THRESHOLDS.length; threshold += 1) {
    const thresholdWave = SPAWN_THRESHOLDS[threshold];
    const cutoffWave = Math.min(thresholdWave, wave);
    const spawnsForThreshold = waveSpawns(cutoffWave, enemyBalance);
    const wavesSincePrevious = cutoffWave - previousThresholdWave;
    total.spawns += spawnsForThreshold.spawns * wavesSincePrevious;
    total.basic += spawnsForThreshold.basic * wavesSincePrevious;
    total.fast += spawnsForThreshold.fast * wavesSincePrevious;
    total.tank += spawnsForThreshold.tank * wavesSincePrevious;
    total.ranged += spawnsForThreshold.ranged * wavesSincePrevious;
    total.boss += Math.floor(cutoffWave / 10) - Math.floor(previousThresholdWave / 10);
    if (wave <= thresholdWave) return Object.freeze(total);
    previousThresholdWave = thresholdWave;
  }
  return Object.freeze(total);
};

export const timeToGems = (seconds: number): number => {
  const ONE_SECOND = 1; const ONE_MINUTE = 60; const ONE_HOUR = 3600; const ONE_DAY = 86400;
  const ONE_WEEK = 604800; const THIRTY_DAYS = 2592000; const NINETY_DAYS = 7776000; const THREE_HUNDRED_SIXTY_DAYS = 31104000;
  let gems = 0;
  if (seconds > THREE_HUNDRED_SIXTY_DAYS) { gems = 25000; }
  else if (seconds > NINETY_DAYS) { gems = (17000 / (THREE_HUNDRED_SIXTY_DAYS - NINETY_DAYS)) * (seconds - NINETY_DAYS) + 8000; }
  else if (seconds > THIRTY_DAYS) { gems = (4450 / (NINETY_DAYS - THIRTY_DAYS)) * (seconds - THIRTY_DAYS) + 3550; }
  else if (seconds > ONE_WEEK) { gems = (2550 / (THIRTY_DAYS - ONE_WEEK)) * (seconds - ONE_WEEK) + 1000; }
  else if (seconds > ONE_DAY) { gems = (837 / (ONE_WEEK - ONE_DAY)) * (seconds - ONE_DAY) + 163; }
  else if (seconds > ONE_HOUR) { gems = (155.5 / (ONE_DAY - ONE_HOUR)) * (seconds - ONE_HOUR) + 7.5; }
  else if (seconds > ONE_MINUTE) { gems = (7.375 / (ONE_HOUR - ONE_MINUTE)) * (seconds - ONE_MINUTE) + 0.125; }
  else if (seconds > ONE_SECOND) { gems = (0.122917 / (ONE_MINUTE - ONE_SECOND)) * (seconds - ONE_SECOND) + 0.002083; }
  else { gems = 0; }
  return Math.ceil(gems);
};

export const damageFormula = ({ damagePercent, damage, critFactor, critChance, superCritMult, superCritChance }: { damagePercent: number; damage: number; critFactor: number; critChance: number; superCritMult: number; superCritChance: number }): number =>
  (damagePercent / 100) * damage * (1 + (critFactor * critChance) / 100) * (1 + (((superCritMult * critChance) / 100) * superCritChance) / 100);

export const goldenComboBonus = (bonus: number, combo: number): number => (1 + bonus / 100) ** combo - 1;
export const getMineCharge = (bonus: number, seconds: number): number => 1 + bonus * seconds;

export const nextPerkWave = ({ currentPerkQuantity, waveRequirementLab, waveRequirementPerkValue }: { currentPerkQuantity: number; waveRequirementLab: number; waveRequirementPerkValue: number }): number => {
  let currentWave = 0;
  const pwrReduction = 1 - waveRequirementPerkValue / 100;
  for (let currentPerk = 0; currentPerk <= currentPerkQuantity; currentPerk += 1) {
    let currentPerkBase = 200 - waveRequirementLab;
    if (currentPerk > 20) currentPerkBase += 50;
    if (currentPerk > 30) currentPerkBase += 50;
    if (currentPerk > 40) currentPerkBase += 50;
    const currentPerkCost = Math.floor(currentPerkBase * pwrReduction);
    currentWave += currentPerkCost;
  }
  return currentWave;
};

export const formatTime = (time: number): string => {
  const YEAR = 86400 * 365; const DAY = 86400; const HOUR = 3600; const MINUTE = 60;
  const years = Math.floor(time / YEAR); const afterYears = time % YEAR;
  const days = Math.floor(afterYears / DAY); const afterDays = afterYears % DAY;
  const hours = Math.floor(afterDays / HOUR); const afterHours = afterDays % HOUR;
  const minutes = Math.floor(afterHours / MINUTE); const seconds = Math.floor(afterHours % MINUTE);
  const format: string[] = [];
  if (years > 0) format.push(`${years} years`);
  if (days > 0 || years > 0) format.push(`${days} days`);
  if (hours > 0) format.push(`${hours}h`);
  if (minutes > 0 || hours > 0) format.push(`${minutes}m`);
  format.push(`${seconds.toFixed(0)}s`);
  return format.join(', ');
};

export const WAVE_ACCELERATOR_CARD = Object.freeze({
  0: 0, 1: 30, 2: 34, 3: 38, 4: 42, 5: 46, 6: 50, 7: 54,
});

export const INTRO_SPRINT_CARD = Object.freeze({
  0: 0, 1: 20, 2: 25, 3: 30, 4: 35, 5: 40, 6: 45, 7: 50,
});

export const REAL_GAME_SPEED_MAP = Object.freeze([
  { displayed: 1.0, real: 1.07 }, { displayed: 1.5, real: 1.605 }, { displayed: 2.0, real: 2.0 },
  { displayed: 2.5, real: 2.375 }, { displayed: 3.0, real: 2.76 }, { displayed: 3.5, real: 3.08 },
  { displayed: 4.0, real: 3.36 }, { displayed: 4.5, real: 3.69 }, { displayed: 5.0, real: 4.0 },
  { displayed: 5.5, real: 4.4 }, { displayed: 6.0, real: 4.8 }, { displayed: 6.25, real: 5.0 },
]);
