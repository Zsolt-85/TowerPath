/**
 * TowerPath - Comprehensive Game Data Models
 * Based on v28+ game data, Rend's schema, and TowerSmith's mappings
 */

// ============================================
// CORE GAME ENTITIES
// ============================================

export interface PlayerProfile {
  userName: string;
  towerId: string;
  playfabId: string;
  selectedTower: number;
  selectedBackground: number;
  selectedMenu: number;
  selectedProfileBanner: number;
  guardianSkinIndex: number;
  fakeUserName: string;
  lastGuildID: string;
  lastGuildSeason: number;
  guildChestClaimedWeek: number;
  hasSeenGuildChatDisclaimer: boolean;
  trackAvailable: boolean[];
}

export interface RunDetail {
  // Header fields
  gameTimeMin: number;
  realTimeMin: number;
  killedBy: string;
  coinsPerHour: number;
  cellsPerHour: number;
  damageDealt: number;

  // Damage breakdown
  damage: Record<string, number>;

  // Damage taken
  damageTaken: {
    tower: number;
    wall: number;
  };

  // Bonus health
  bonusHealth: {
    deathWave: number;
  };

  // Health regeneration
  healthRegen: {
    lifesteal: number;
    towerRegen: number;
    wallRegen: number;
    recoveryPackages: number;
  };

  // Damage blocked
  blocked: {
    defensePct: number;
    defenseAbs: number;
    chronoField: number;
    chainThunder: number;
    flameBot: number;
    primordialCollapse: number;
    negMassProjector: number;
  };

  // Utility
  utility: {
    recoveryPackages: number;
    freeAttack: number;
    freeDefense: number;
    freeUtility: number;
    attackSkipped: number;
    healthSkipped: number;
  };

  // Counts
  counts: {
    projectiles: number;
    minesSpawned: number;
    thunderStuns: number;
    wavesSkipped: number;
    deathDefy: number;
    shieldHits: number;
    secondWind: number;
    demonMode: number;
  };

  // Enemies hit by
  hitBy: Record<string, number>;

  // Effects active during kills
  effects: Record<string, { kills: number; pct: number }>;

  // Enemy breakdown
  enemies: {
    total: number;
    basic: number;
    fast: number;
    tank: number;
    ranged: number;
    boss: number;
    protector: number;
    vampires: number;
    rays: number;
    scatters: number;
    saboteur: number;
    commander: number;
    overcharge: number;
    summoned: number;
  };

  // Coin sources
  coinsSrc: Record<string, number>;

  // Cash sources
  cash: Record<string, number>;

  // Currencies
  currencies: Record<string, number>;

  // Enemies destroyed by
  destroyedBy: Record<string, number>;

  // Records
  records: Record<string, number>;
}

export interface Run {
  id: string;
  date: string;
  tier: number;
  wave: number;
  coins: number;
  durationMin: number;
  cells?: number;
  strategy?: string;
  source: 'manual' | 'paste' | 'json' | 'savefile';
  runType: 'farm' | 'tournament' | 'dissonance' | 'dissonance_rush';
  detail?: RunDetail;
  synced: boolean;
  syncedAt?: number;
  deviceId: string;
  gameVersion: string;
}

export interface PlayerStats {
  // Core stats from save file
  researchLevel: number[];
  upgradeWorkshopLevel: number[];
  upgradeWorkshopDefenseLevel: number[];
  upgradeWorkshopUtilityLevel: number[];
  enhancementLevel: number[];
  enhancementDefenseLevel: number[];
  enhancementUtilityLevel: number[];
  cardLevel: number[];
  cardUnlocked: boolean[];
  slotsUnlocked: number;
  currentCardPreset: number;
  slotPresetCardInt: number[];
  slotPresetCardAssignedBool: boolean[];
  currentWorkshopPreset: number;
  relicsUnlocked: number[];
  towerUnlocked: boolean[];
  backgroundUnlocked: boolean[];
  menuUnlocked: boolean[];
  profileBannerUnlocked: boolean[];
  guardianSkinUnlocked: boolean[];
  trackAvailable: boolean[];
  guardianUnlocked: boolean;
  guardianSlotsUnlocked: number;
  guardianChipSlot: number[];
  guardianChipUnlocked: boolean[];
  guardianChipLevel: number[];
  selectedTower: number;
  selectedBackground: number;
  selectedMenu: number;
  selectedProfileBanner: number;
  guardianSkinIndex: number;
  botsUnlocked: boolean[];
  botsActive: boolean[];
  botsLevel: number[];
  currentBotPreset: number;
  botPresets: Record<string, BotPreset[]>;
  flameBotLevelCooldownSelected: number;
  thunderBotLevelCooldownSelected: number;
  goldenBotLevelCooldownSelected: number;
  amplifyBotLevelCooldownSelected: number;
  botBotLevelCooldownSelected: number;
  ultimateWeaponLevel: number[];
  ultimateWeaponUnlocked: boolean[];
  ultimateWeaponOn: boolean[];
  ultimateWeaponPlusLevel: number[];
  ultimateWeaponPlusUnlocked: boolean[];
  moduleEquipped: ModuleItem[];
  moduleInventory: ModuleItem[];
  assistModuleSlots: AssistModuleSlot[];
  assistModulesAvailable: boolean;
  lastGuildID: string;
  lastGuildSeason: number;
  guildChestClaimedWeek: number;
  hasSeenGuildChatDisclaimer: boolean;
  userName: string;
  fakeUserName: string;
  playfabID: string;
}

export interface BotPreset {
  botId: string;
  presetIndex: number;
  cooldown: number;
  range: number;
  damage: number;
  duration: number;
}

export interface ModuleItem {
  id: string;
  type: 'cannon' | 'armor' | 'generator' | 'core';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancestral';
  level: number;
  mainEffect: ModuleEffect;
  subEffects: SubEffect[];
  uniqueEffect?: UniqueEffect;
  locked: boolean;
  xp: number;
}

export interface ModuleEffect {
  type: string;
  value: number;
  isPercentage: boolean;
}

export interface SubEffect {
  type: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancestral';
  locked: boolean;
}

export interface UniqueEffect {
  type: string;
  description: string;
  value: number;
}

export interface AssistModuleSlot {
  slotIndex: number;
  moduleId: string | null;
  moduleType: 'cannon' | 'armor' | 'generator' | 'core' | null;
  effects: ModuleEffect[];
}

export interface BotData {
  unlocked: boolean;
  active: boolean;
  level: number;
  cooldown: number;
  range: number;
  damage: number;
  duration: number;
  burnStacks: number;
  lingerTime: number;
}

export interface UltimateWeapon {
  unlocked: boolean;
  on: boolean;
  level: number;
  plusLevel: number;
  plusUnlocked: boolean;
  cooldown: number;
  duration: number;
  damage: number;
  quantity: number;
  size: number;
  chance: number;
  slowPercent: number;
  bonus: number;
  angle: number;
}

export interface Relic {
  id: string;
  name: string;
  unlocked: boolean;
  unlockSource: string;
  eventId?: string;
}

export interface RelicEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  relics: string[];
}

export interface Theme {
  id: string;
  name: string;
  unlocked: boolean;
  isCustom: boolean;
  colors: ThemeColors;
}

export interface ThemeColors {
  bg: string;
  bgCard: string;
  border: string;
  gold: string;
  teal: string;
  red: string;
  purple: string;
  text: string;
  textDim: string;
  textMuted: string;
}

export interface Guardian {
  unlocked: boolean;
  slotsUnlocked: number;
  chipSlot: number[];
  chipUnlocked: boolean[];
  chipLevel: number[];
  skinIndex: number;
  skinUnlocked: boolean[];
}

export interface CardCollection {
  [cardId: string]: {
    level: number;
    unlocked: boolean;
    masteryLevel: number;
  };
}

export interface WorkshopState {
  attack: Record<string, number>;
  defense: Record<string, number>;
  utility: Record<string, number>;
  enhancement: {
    attack: number[];
    defense: number[];
    utility: number[];
  };
}

export interface LabState {
  levels: Record<string, number>;
  queue: LabQueueItem[];
  speedBoost: number;
  discount: number;
}

export interface LabQueueItem {
  labId: string;
  targetLevel: number;
  currentLevel: number;
  startTime: number;
  estimatedFinish: number;
  speedBoost: number;
  cost: number;
}

export interface TournamentRun {
  id: string;
  date: string;
  league: string;
  tier: number;
  rank: number;
  wave: number;
  diedTo: string;
  durationMin: number;
  prepComplete: boolean;
  battleConditions: string[];
  synced: boolean;
  syncedAt?: number;
}

export interface ModuleRecommendation {
  moduleId: string;
  moduleType: 'cannon' | 'armor' | 'generator' | 'core';
  priority: 'essential' | 'high' | 'medium' | 'low' | 'avoid';
  reason: string;
  expectedGain: {
    coinsPerHour?: number;
    waveIncrease?: number;
    damageMultiplier?: number;
    survivability?: number;
  };
  cost: {
    stones: number;
    shards: number;
    coins: number;
  };
  synergies: string[];
  conflicts: string[];
}

export interface BuildRecommendation {
  id: string;
  name: string;
  archetype: 'economy' | 'push' | 'hybrid' | 'tournament' | 'dissonance';
  modules: ModuleRecommendation[];
  labs: LabRecommendation[];
  workshop: WorkshopRecommendation[];
  expected: {
    coinsPerHour: number;
    maxWave: number;
    coinsPerMinute: number;
    survivability: number;
  };
  cost: {
    stones: number;
    shards: number;
    coins: number;
    time: number; // days
  };
  constraints: string[];
  reasoning: string;
}

export interface LabRecommendation {
  labId: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'essential' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: number;
  estimatedCost: number;
}

export interface WorkshopRecommendation {
  category: 'attack' | 'defense' | 'utility';
  upgradeId: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'essential' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedCost: number;
}

export interface AchievementTarget {
  id: string;
  name: string;
  description?: string;
  category: 'tier' | 'wave' | 'module' | 'lab' | 'tournament' | 'relic' | 'card' | 'bot' | 'uw' | 'currency';
  targetValue: number;
  currentValue: number;
  completed: boolean;
  completedAt?: number;
  rewards: string[];
  prerequisites: string[];
  moduleSuggestions: ModuleRecommendation[];
  labSuggestions: LabRecommendation[];
  workshopSuggestions: WorkshopRecommendation[];
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface BuildArchetype {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  typicalModules: string[];
  typicalLabs: string[];
  typicalWorkshop: string[];
  playstyle: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  moduleWinRates: Record<string, number>;
  avgCoinsPerHour: number;
  avgMaxWave: number;
  popularity: number;
  tierRange: [number, number];
}

export interface MetaAnalysis {
  archetypes: BuildArchetype[];
  moduleWinRates: Record<string, { pickRate: number; winRate: number; avgWave: number; coinsPerHour: number }>;
  metaShifts: MetaShift[];
  topBuilds: TopBuild[];
  patchVersion: string;
  lastUpdated: number;
  sampleSize: number;
}

export interface MetaShift {
  patchVersion: string;
  date: number;
  changes: {
    moduleId: string;
    oldWinRate: number;
    newWinRate: number;
    change: number;
  }[];
  affectedArchetypes: string[];
  severity: 'minor' | 'moderate' | 'major';
}

export interface TopBuild {
  id: string;
  playerId: string;
  archetype: string;
  wave: number;
  coinsPerHour: number;
  modules: string[];
  labs: Record<string, number>;
  workshop: Record<string, number>;
  timestamp: number;
  verified: boolean;
}

export interface BuildSimulationResult {
  build: BuildRecommendation;
  simulation: {
    runs: SimulatedRun[];
    stats: {
      avgWave: number;
      avgCoinsPerHour: number;
      avgCoinsPerMinute: number;
      avgDuration: number;
      survivalRate: number;
      avgDamageDealt: number;
      avgDamageTaken: number;
    };
    confidence: number;
  };
}

export interface SimulatedRun {
  wave: number;
  coins: number;
  durationMin: number;
  coinsPerHour: number;
  survived: boolean;
  damageDealt: number;
  damageTaken: number;
  killedBy: string;
  perks: string[];
}

export interface SyncState {
  bucketId: string;
  lastPush: number;
  lastPull: number;
  pendingOps: SyncOperation[];
  conflicts: SyncConflict[];
  lastSyncDevice: string;
  devices: SyncDevice[];
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  entityId: string;
  data: unknown;
  timestamp: number;
  deviceId: string;
  synced: boolean;
}

export interface SyncConflict {
  id: string;
  collection: string;
  entityId: string;
  localData: unknown;
  remoteData: unknown;
  baseData: unknown;
  fieldConflicts: FieldConflict[];
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merged';
}

export interface FieldConflict {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  baseValue: unknown;
}

export interface SyncDevice {
  id: string;
  name: string;
  lastSeen: number;
  platform: string;
  appVersion: string;
  isCurrent: boolean;
}

export interface AnalyticsSnapshot {
  timestamp: number;
  runs: Run[];
  stats: PlayerStats;
  tournaments: TournamentRun[];
  modules: ModuleItem[];
  labs: LabState;
  workshop: WorkshopState;
  uws: UltimateWeapon[];
  bots: Record<string, BotData>;
  cards: CardCollection;
  relics: Relic[];
  guardian: Guardian;
  achievements: AchievementTarget[];
  sync: SyncState;
}

// Query/Filter types
export interface RunFilters {
  dateRange?: [number, number];
  tiers?: number[];
  strategies?: string[];
  runTypes?: string[];
  minWave?: number;
  maxWave?: number;
  minCoinsPerHour?: number;
  killedBy?: string[];
  hasDetail?: boolean;
}

export interface AnalyticsQuery {
  runs?: RunFilters;
  groupBy?: 'tier' | 'strategy' | 'runType' | 'killedBy' | 'date' | 'week' | 'month';
  metrics?: ('coinsPerHour' | 'wave' | 'damageDealt' | 'coinsPerMinute' | 'duration' | 'cellsPerHour')[];
  aggregations?: ('sum' | 'avg' | 'min' | 'max' | 'count' | 'percentile50' | 'percentile90' | 'percentile99')[];
  limit?: number;
  offset?: number;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  series?: string;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  series: string[];
  points: ChartDataPoint[];
  xAxis: 'date' | 'runIndex' | 'wave' | 'tier';
  yAxis: string;
  granularity: 'run' | 'hour' | 'day' | 'week' | 'month';
}

export interface HeatmapData {
  xLabels: string[];
  yLabels: string[];
  values: number[][];
  xAxis: string;
  yAxis: string;
  colorScale: 'sequential' | 'diverging' | 'qualitative';
}

export interface SankeyData {
  nodes: { id: string; name: string; color?: string }[];
  links: { source: string; target: string; value: number; color?: string }[];
}

export interface RadarData {
  axes: { axis: string; max: number }[];
  series: { name: string; values: number[]; color: string }[];
}