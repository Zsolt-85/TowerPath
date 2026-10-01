'use client';

import { parseBig } from './import';

export interface RunDetail {
  gameTimeMin?: number;
  realTimeMin?: number;
  killedBy?: string;
  coinsPerHour?: number;
  cellsPerHour?: number;
  damageDealt?: number;
  damage?: Record<string, number>;
  damageTaken?: Record<string, number>;
  bonusHealth?: Record<string, number>;
  healthRegen?: Record<string, number>;
  blocked?: Record<string, number>;
  utility?: Record<string, number>;
  counts?: Record<string, number>;
  hitBy?: Record<string, number>;
  effects?: Record<string, { kills: number; pct: number }>;
  enemies?: Record<string, number>;
  coinsSrc?: Record<string, number>;
  cash?: Record<string, number>;
  currencies?: Record<string, number>;
  destroyedBy?: Record<string, number>;
  records?: Record<string, number>;
}

export interface FullParse {
  tier: number | null;
  wave: number | null;
  coins: number | null;
  cells: number | null;
  durationMin: number | null;
  detail: RunDetail;
  stats: { fieldsParsed: number; sectionsFound: string[]; unmapped: string[] };
}

const SECTIONS = [
  'records',
  'damage',
  'damage taken',
  'bonus health gained',
  'health regenerated',
  'damage blocked',
  'utility',
  'counts',
  'enemies hit by',
  'killed with effect active',
  'total enemies',
  'coins',
  'cash',
  'currencies',
  'enemies destroyed by',
] as const;

type Section = (typeof SECTIONS)[number];

const num = (v: string): number | null => {
  const direct = parseBig(v);
  if (direct != null) return direct;
  const plain = Number(v.replace(/,/g, ''));
  return Number.isFinite(plain) ? plain : null;
};

function parseDuration(s: string): number | null {
  const m = s.match(/(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i);
  if (!m || m[0].trim() === '') return null;
  const d = Number(m[1] ?? 0);
  const h = Number(m[2] ?? 0);
  const min = Number(m[3] ?? 0);
  const sec = Number(m[4] ?? 0);
  if (![d, h, min, sec].every(Number.isFinite)) return null;
  const total = d * 1440 + h * 60 + min + sec / 60;
  return total > 0 ? total : null;
}

function splitKV(line: string): [string, string] | null {
  const tab = line.split('\t');
  if (tab.length >= 2) {
    return [tab[0].trim(), tab.slice(1).join(' ').trim()];
  }
  const m = line.match(/^(.+?)\s{2,}(.+)$/);
  if (m) return [m[1].trim(), m[2].trim()];
  return null;
}

const norm = (s: string) => s.toLowerCase().replace(/[%/]/g, ' ').replace(/\s+/g, ' ').trim();

// section -> normalized key -> detail field
const FIELD_MAP: Record<Section, Record<string, string>> = {
  records: {
    'highest coins minute': 'highestCoinsPerMin',
    'largest wave skip': 'largestWaveSkip',
    'most coins from wave skip': 'mostCoinsWaveSkip',
    'most cells from wave skip': 'mostCellsWaveSkip',
    'largest smart missile stack': 'largestSMStack',
    'largest golden combo': 'largestGoldenCombo',
    'most coins from golden combo': 'mostCoinsGoldenCombo',
    'largest inner landmine charge': 'largestMineCharge',
  },
  damage: {
    'damage dealt': '__total',
    projectiles: 'projectiles',
    'rend armor': 'rendArmor',
    'death ray': 'deathRay',
    thorns: 'thorns',
    orbs: 'orbs',
    'land mines': 'landMines',
    'chain lightning': 'chainLightning',
    'smart missiles': 'smartMissiles',
    'inner land mines': 'innerLandMines',
    'poison swamp': 'poisonSwamp',
    'death wave': 'deathWave',
    'black hole': 'blackHole',
    'flame bot': 'flameBot',
    'attack chip': 'attackChip',
    electrons: 'electrons',
  },
  'damage taken': { tower: 'tower', wall: 'wall' },
  'bonus health gained': { 'from death wave': 'deathWave' },
  'health regenerated': {
    lifesteal: 'lifesteal',
    'tower health regen': 'towerRegen',
    'wall health regen': 'wallRegen',
    'recovery packages': 'recoveryPackages',
  },
  'damage blocked': {
    'defense': 'defensePct',
    'defense absolute': 'defenseAbs',
    'chrono field': 'chronoField',
    'chain thunder': 'chainThunder',
    'flame bot': 'flameBot',
    'primordial collapse': 'primordialCollapse',
    'negative mass projector': 'negMassProjector',
  },
  utility: {
    'recovery packages': 'recoveryPackages',
    'free attack upgrade': 'freeAttack',
    'free defense upgrade': 'freeDefense',
    'free utility upgrade': 'freeUtility',
    'enemy attack levels skipped': 'attackSkipped',
    'enemy health levels skipped': 'healthSkipped',
  },
  counts: {
    'projectiles count': 'projectiles',
    'land mines spawned': 'minesSpawned',
    'thunder bot stuns': 'thunderStuns',
    'waves skipped': 'wavesSkipped',
    'death defy': 'deathDefy',
    'hits absorbed by energy shield': 'shieldHits',
    nuke: 'nuke',
    'second wind': 'secondWind',
    'demon mode': 'demonMode',
  },
  'enemies hit by': {
    projectiles: 'projectiles',
    thorns: 'thorns',
    orbs: 'orbs',
    'death ray': 'deathRay',
    'chain lightning': 'chainLightning',
    'smart missiles': 'smartMissiles',
    'inner land mines': 'innerLandMines',
    'poison swamp': 'poisonSwamp',
    'death wave': 'deathWave',
    'black hole': 'blackHole',
    'chrono field': 'chronoField',
    'land mines': 'landMines',
    'thunder bot': 'thunderBot',
    'flame bot': 'flameBot',
    'attack chip': 'attackChip',
    'orbital augment': 'orbitalAugment',
  },
  'killed with effect active': {},
  'total enemies': {
    'total enemies': '__skip',
    basic: 'basic',
    fast: 'fast',
    tank: 'tank',
    ranged: 'ranged',
    boss: 'boss',
    protector: 'protector',
    vampires: 'vampires',
    rays: 'rays',
    scatters: 'scatters',
    saboteur: 'saboteur',
    commander: 'commander',
    overcharge: 'overcharge',
    'summoned enemies': 'summoned',
  },
  coins: {
    'coins earned': '__skip',
    'coins kill': 'perKill',
    'other coin bonuses': 'otherBonuses',
    'critical coin': 'critCoin',
    'golden tower': 'goldenTower',
    'golden combo': 'goldenCombo',
    'death wave': 'deathWave',
    spotlight: 'spotlight',
    'black hole': 'blackHole',
    orbs: 'orbs',
    'golden bot': 'goldenBot',
    'wave skip': 'waveSkip',
    'coins wave': 'perWave',
    'coins fetched': 'fetched',
    'bounty coins': 'bounty',
  },
  cash: {
    'cash earned': 'earned',
    'golden tower': 'goldenTower',
    'interest earned': 'interest',
  },
  currencies: {
    'cells earned': 'cells',
    gems: 'gems',
    'ad gems': 'adGems',
    'gem blocks tapped': 'gemBlocks',
    'fetch gems': 'fetchGems',
    medals: 'medals',
    'reroll shards earned': 'rerollShards',
    'reroll shards fetched': 'rerollFetched',
    'cannon shards': 'cannonShards',
    'armor shards': 'armorShards',
    'generator shards': 'generatorShards',
    'core shards': 'coreShards',
    'common modules': 'commonModules',
    'rare modules': 'rareModules',
  },
  'enemies destroyed by': {
    projectiles: 'projectiles',
    thorns: 'thorns',
    'land mines': 'landMines',
    orbs: 'orbs',
    'chain lightning': 'chainLightning',
    'smart missiles': 'smartMissiles',
    'death wave': 'deathWave',
    'inner land mines': 'innerLandMines',
    'poison swamp': 'poisonSwamp',
    'death ray': 'deathRay',
    'black hole': 'blackHole',
    'flame bot': 'flameBot',
    other: 'other',
  },
};

const SECTION_TARGET: Record<Section, keyof RunDetail> = {
  records: 'records',
  damage: 'damage',
  'damage taken': 'damageTaken',
  'bonus health gained': 'bonusHealth',
  'health regenerated': 'healthRegen',
  'damage blocked': 'blocked',
  utility: 'utility',
  counts: 'counts',
  'enemies hit by': 'hitBy',
  'killed with effect active': 'effects',
  'total enemies': 'enemies',
  coins: 'coinsSrc',
  cash: 'cash',
  currencies: 'currencies',
  'enemies destroyed by': 'destroyedBy',
};

function parseEffectLine(value: string): { kills: number; pct: number } | null {
  const m = value.match(/^([\d,]+\.?\d*\s*[A-Za-z]{0,2})\s*\[([\d.]+)%\]$/);
  if (!m) {
    const k = num(value);
    return k == null ? null : { kills: k, pct: 0 };
  }
  const kills = num(m[1]);
  if (kills == null) return null;
  return { kills, pct: Number(m[2]) };
}

/** Parse a full pasted battle report — header fields plus all 15 detail sections. */
export function parseFullReport(text: string): FullParse {
  const detail: RunDetail = {};
  const sectionsFound = new Set<string>();
  const unmapped: string[] = [];
  let fieldsParsed = 0;

  let tier: number | null = null;
  let wave: number | null = null;
  let coins: number | null = null;
  let cells: number | null = null;
  let durationMin: number | null = null;
  let killedBy: string | undefined;
  let gameTimeMin: number | undefined;
  let realTimeMin: number | undefined;
  let coinsPerHour: number | undefined;
  let cellsPerHour: number | undefined;

  let section: Section | null = null;
  const buckets = new Map<Section, Record<string, number | { kills: number; pct: number }>>();

  const bucket = (s: Section) => {
    let b = buckets.get(s);
    if (!b) {
      b = {};
      buckets.set(s, b);
    }
    return b;
  };

  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line || /^battle report$/i.test(line)) continue;

    const asSection = (SECTIONS as readonly string[]).find((s) => s === line.toLowerCase());
    if (asSection) {
      section = asSection as Section;
      sectionsFound.add(asSection);
      continue;
    }

    let m = line.match(/^(game time|real time)\s+(.+)$/i);
    if (m) {
      const mins = parseDuration(m[2]);
      if (mins != null) {
        fieldsParsed++;
        if (/^game/i.test(m[1])) gameTimeMin = mins;
        else {
          realTimeMin = mins;
          if (durationMin == null) durationMin = mins;
        }
      }
      continue;
    }
    m = line.match(/^tier\s+(\d+)$/i);
    if (m) {
      tier = Number(m[1]);
      fieldsParsed++;
      continue;
    }
    m = line.match(/^wave\s+([\d,]+)$/i);
    if (m) {
      wave = Number(m[1].replace(/,/g, ''));
      fieldsParsed++;
      continue;
    }
    m = line.match(/^killed by\s+(.+)$/i);
    if (m) {
      killedBy = m[1].trim();
      fieldsParsed++;
      continue;
    }
    m = line.match(/^coins earned\s+(.+)$/i);
    if (m && section == null) {
      const v = num(m[1]);
      if (v != null) {
        coins = v;
        fieldsParsed++;
      }
      continue;
    }
    m = line.match(/^coins per hour\s+(.+)$/i);
    if (m) {
      const v = num(m[1]);
      if (v != null) {
        coinsPerHour = v;
        fieldsParsed++;
      }
      continue;
    }
    m = line.match(/^cells earned\s+(.+)$/i);
    if (m && (section == null || section === 'currencies')) {
      const v = num(m[1]);
      if (v != null) {
        if (section == null) cells = v;
        else bucket('currencies')['cells'] = v;
        fieldsParsed++;
      }
      continue;
    }
    m = line.match(/^cells per hour\s+(.+)$/i);
    if (m) {
      const v = num(m[1]);
      if (v != null) {
        cellsPerHour = v;
        fieldsParsed++;
      }
      continue;
    }

    const kv = splitKV(line);
    if (!kv || section == null) {
      if (kv && unmapped.length < 25) unmapped.push(`${section ?? 'header'}: ${kv[0]}`);
      continue;
    }
    const [key, rawVal] = kv;
    if (section === 'killed with effect active') {
      const eff = parseEffectLine(rawVal);
      if (eff) {
        bucket(section)[key] = eff;
        fieldsParsed++;
      } else if (unmapped.length < 25) unmapped.push(`${section}: ${key}`);
      continue;
    }
    const field = FIELD_MAP[section][norm(key)];
    if (!field || field === '__skip') {
      if (!field && unmapped.length < 25) unmapped.push(`${section}: ${key}`);
      continue;
    }
    if (field === '__total') {
      const v = num(rawVal);
      if (v != null) {
        detail.damageDealt = v;
        fieldsParsed++;
      }
      continue;
    }
    const v = num(rawVal);
    if (v == null) {
      if (unmapped.length < 25) unmapped.push(`${section}: ${key}`);
      continue;
    }
    bucket(section)[field] = v;
    fieldsParsed++;
  }

  for (const [s, b] of buckets) {
    const target = SECTION_TARGET[s];
    if (s === 'killed with effect active') {
      (detail as Record<string, unknown>)[target] = b;
    } else if (Object.keys(b).length > 0) {
      (detail as Record<string, unknown>)[target] = b as Record<string, number>;
    }
  }
  if (gameTimeMin != null) detail.gameTimeMin = gameTimeMin;
  if (realTimeMin != null) detail.realTimeMin = realTimeMin;
  if (killedBy) detail.killedBy = killedBy;
  if (coinsPerHour != null) detail.coinsPerHour = coinsPerHour;
  if (cellsPerHour != null) detail.cellsPerHour = cellsPerHour;

  return {
    tier,
    wave,
    coins,
    cells,
    durationMin,
    detail,
    stats: { fieldsParsed, sectionsFound: [...sectionsFound], unmapped },
  };
}
