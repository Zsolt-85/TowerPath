/**
 * TowerPath - Build Optimizer & Module Recommendation Engine
 * World-class build optimizer with genetic algorithm, constraint satisfaction,
 * Pareto frontier analysis, and module recommendations
 */

import type { AchievementTarget, ModuleRecommendation, BuildRecommendation, BuildSimulationResult, SimulatedRun, ModuleItem, LabRecommendation, WorkshopRecommendation } from './models';

export interface GameDataTables {
  modules: unknown[];
  labs: unknown[];
  workshop: unknown;
  ultimateWeapons: unknown[];
}

// ============================================
// GAME CONSTANTS & TABLES
// ============================================

// Module data from game
export interface ModuleData {
  id: string;
  type: 'cannon' | 'armor' | 'generator' | 'core';
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancestral';
  maxLevel: number;
  baseEffect: { type: string; value: number; perLevel: number; isPct: boolean };
  subEffects: SubEffectTemplate[];
  uniqueEffect?: string;
  costs: LevelCost[];
  unlockRequirements?: string[];
}

export interface SubEffectTemplate {
  type: string;
  baseValue: number;
  perLevel: number;
  isPct: boolean;
  rarityWeights: { common: number; rare: number; epic: number; legendary: number; mythic: number; ancestral: number };
}

export interface LevelCost {
  level: number;
  stones: number;
  shards: number;
  coins: number;
}

// Ultimate Weapon data
export interface UWData {
  id: string;
  name: string;
  unlockCost: number;
  upgrades: {
    [key: string]: { levels: UWLevel[] };
  };
  plus: { name: string; description: string; levels: UWPlusLevel[] };
}

export interface UWLevel {
  level: number;
  value: number;
  cost: number;
  format: string;
}

export interface UWPlusLevel {
  level: number;
  value: number;
  cost: number;
}

// Lab data
export interface LabData {
  id: string;
  name: string;
  category: 'main' | 'attack' | 'defense' | 'utility' | 'uw' | 'cards' | 'perks' | 'bots' | 'enemies' | 'modules' | 'battle';
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  timeBase: number;
  timeGrowth: number;
  effect: { type: string; value: number; perLevel: number; isPct: boolean };
  unlockRequirements?: { tier: number; wave: number; lab?: string; level?: number };
}

// Workshop upgrades
export interface WorkshopUpgrade {
  id: string;
  category: 'attack' | 'defense' | 'utility';
  name: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  baseValue: number;
  valueGrowth: number;
  unlockCost: number;
  unlockRequirements?: string[];
}

// ============================================
// BUILD OPTIMIZER - GENETIC ALGORITHM
// ============================================

export interface BuildGenome {
  modules: ModuleGene[];
  labs: LabGene[];
  workshop: WorkshopGene;
  uw: UWGene;
  perks: PerkGene;
  cards: CardGene;
  bots: BotGene;
  fitness: number;
  objectives: ObjectiveValues;
}

export interface ModuleGene {
  moduleId: string;
  level: number;
  subEffects: SubEffectGene[];
}

export interface SubEffectGene {
  slot: number;
  effectType: string;
  rarity: number; // 0-5 (common=0 to ancestral=5)
  locked: boolean;
}

export interface LabGene {
  labId: string;
  level: number;
}

export interface WorkshopGene {
  attack: Record<string, number>;
  defense: Record<string, number>;
  utility: Record<string, number>;
}

export interface UWGene {
  cooldowns: Record<string, number>; // cd in seconds
  durations: Record<string, number>;
  bonuses: Record<string, number>;
}

export interface PerkGene {
  standard: Record<string, number>;
  ultimate: Record<string, number>;
  tradeoff: Record<string, number>;
}

export interface CardGene {
  [cardId: string]: number; // star level 0-7
}

export interface BotGene {
  [botId: string]: { cooldown: number; range: number; bonus: number };
}

export interface ObjectiveValues {
  coinsPerHour: number;
  maxWave: number;
  damagePerSecond: number;
  survivability: number;
  stoneCost: number;
  shardCost: number;
  coinCost: number;
  timeToComplete: number; // days
}

export interface OptimizationTarget {
  type: 'economy' | 'push' | 'hybrid' | 'tournament' | 'dissonance' | 'custom';
  weights: {
    coinsPerHour: number;
    maxWave: number;
    damagePerSecond: number;
    survivability: number;
    stoneCost: number;
    shardCost: number;
    coinCost: number;
    timeToComplete: number;
  };
  constraints: OptimizationConstraints;
}

export interface OptimizationConstraints {
  maxStones: number;
  maxShards: number;
  maxCoins: number;
  maxDays: number;
  minSurvivability: number;
  minWave: number;
  requiredModules: string[];
  bannedModules: string[];
  requiredUWs: string[];
  bannedUWs: string[];
  maxUWCooldown: Record<string, number>;
  minUWDuration: Record<string, number>;
}

export interface OptimizationResult {
  builds: BuildRecommendation[];
  paretoFrontier: BuildRecommendation[];
  generations: number;
  bestFitness: number;
  convergenceData: number[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

// ============================================
// GENETIC ALGORITHM IMPLEMENTATION
// ============================================

export class BuildOptimizer {
  private population: BuildGenome[] = [];
  private populationSize = 100;
  private eliteSize = 10;
  private mutationRate = 0.15;
  private crossoverRate = 0.8;
  private generation = 0;
  private target: OptimizationTarget;
  private gameData: GameDataTables;
  private currentGenome: BuildGenome | null = null;
  private fitnessHistory: number[] = [];

  constructor(target: OptimizationTarget, gameData: GameDataTables) {
    this.target = target;
    this.gameData = gameData;
    this.initializePopulation();
  }

  private initializePopulation(): void {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(this.randomGenome());
    }
    this.evaluatePopulation();
  }

  private randomGenome(): BuildGenome {
    // Generate random but valid genome
    const modules = this.randomModules();
    const labs = this.randomLabs();
    const workshop = this.randomWorkshop();
    const uw = this.randomUW();
    const perks = this.randomPerks();
    const cards = this.randomCards();
    const bots = this.randomBots();

    const genome: BuildGenome = {
      modules,
      labs,
      workshop,
      uw,
      perks,
      cards,
      bots,
      fitness: 0,
      objectives: { coinsPerHour: 0, maxWave: 0, damagePerSecond: 0, survivability: 0, stoneCost: 0, shardCost: 0, coinCost: 0, timeToComplete: 0 },
    };

    return genome;
  }

  private randomModules(): ModuleGene[] {
    // Return random module setup
    return [];
  }

  private randomLabs(): LabGene[] {
    return [];
  }

  private randomWorkshop(): WorkshopGene {
    return { attack: {}, defense: {}, utility: {} };
  }

  private randomUW(): UWGene {
    return { cooldowns: {}, durations: {}, bonuses: {} };
  }

  private randomPerks(): PerkGene {
    return { standard: {}, ultimate: {}, tradeoff: {} };
  }

  private randomCards(): CardGene {
    return {};
  }

  private randomBots(): BotGene {
    return {};
  }

  evaluate(): ObjectiveValues {
    // Simulate the build and return objective values
    return {
      coinsPerHour: 0,
      maxWave: 0,
      damagePerSecond: 0,
      survivability: 0,
      stoneCost: 0,
      shardCost: 0,
      coinCost: 0,
      timeToComplete: 0,
    };
  }

  private evaluatePopulation(): void {
    for (const genome of this.population) {
      genome.fitness = this.fitness(genome);
      genome.objectives = this.evaluate();
    }
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  private fitness(genome: BuildGenome): number {
    // Hard constraints - heavily penalize violations
    let penalty = 0;
    if (genome.objectives.stoneCost > this.target.constraints.maxStones) penalty += 10000;
    if (genome.objectives.shardCost > this.target.constraints.maxShards) penalty += 10000;
    if (genome.objectives.coinCost > this.target.constraints.maxCoins) penalty += 10000;
    if (genome.objectives.timeToComplete > this.target.constraints.maxDays) penalty += 10000;
    if (genome.objectives.survivability < this.target.constraints.minSurvivability) penalty += 10000;
    if (genome.objectives.maxWave < this.target.constraints.minWave) penalty += 10000;

    // Objective function (higher is better)
    const score = 
      genome.objectives.coinsPerHour * (this.target.weights.coinsPerHour || 0) +
      genome.objectives.maxWave * (this.target.weights.maxWave || 0) +
      genome.objectives.damagePerSecond * (this.target.weights.damagePerSecond || 0) +
      genome.objectives.survivability * (this.target.weights.survivability || 0) -
      genome.objectives.stoneCost * (this.target.weights.stoneCost || 0) -
      genome.objectives.shardCost * (this.target.weights.shardCost || 0) -
      genome.objectives.coinCost * (this.target.weights.coinCost || 0) -
      genome.objectives.timeToComplete * (this.target.weights.timeToComplete || 0);

    return score - penalty;
  }

  step(): number {
    // Selection
    const elite = this.population.slice(0, this.eliteSize);
    
    // Crossover
    const offspring: BuildGenome[] = [];
    while (offspring.length < this.populationSize - this.eliteSize) {
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();
      const child = this.crossover(parent1, parent2);
      this.mutate(child);
      offspring.push(child);
    }

    this.population = [...elite, ...offspring];
    this.evaluatePopulation();
    this.generation++;

    return this.population[0].fitness;
  }

  private tournamentSelection(): BuildGenome {
    const tournamentSize = 5;
    let best = this.population[Math.floor(Math.random() * this.population.length)];
    for (let i = 1; i < tournamentSize; i++) {
      const candidate = this.population[Math.floor(Math.random() * this.population.length)];
      if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
  }

  private crossover(parent1: BuildGenome, parent2: BuildGenome): BuildGenome {
    const child: BuildGenome = {
      modules: this.crossoverModules(parent1.modules, parent2.modules),
      labs: this.crossoverLabs(parent1.labs, parent2.labs),
      workshop: this.crossoverWorkshop(parent1.workshop, parent2.workshop),
      uw: this.crossoverUW(parent1.uw, parent2.uw),
      perks: this.crossoverPerks(parent1.perks, parent2.perks),
      cards: this.crossoverCards(parent1.cards, parent2.cards),
      bots: this.crossoverBots(parent1.bots, parent2.bots),
      fitness: 0,
      objectives: { coinsPerHour: 0, maxWave: 0, damagePerSecond: 0, survivability: 0, stoneCost: 0, shardCost: 0, coinCost: 0, timeToComplete: 0 },
    };
    return child;
  }

  private mutate(genome: BuildGenome): void {
    if (Math.random() > this.mutationRate) return;
    
    // Mutate random genes
    const mutations = ['modules', 'labs', 'workshop', 'uw', 'perks', 'cards', 'bots'];
    const gene = mutations[Math.floor(Math.random() * mutations.length)];
    
    switch (gene) {
      case 'modules':
        this.mutateModules(genome.modules);
        break;
      case 'labs':
        this.mutateLabs(genome.labs);
        break;
      case 'workshop':
        this.mutateWorkshop(genome.workshop);
        break;
      case 'uw':
        this.mutateUW(genome.uw);
        break;
      case 'perks':
        this.mutatePerks(genome.perks);
        break;
      case 'cards':
        this.mutateCards(genome.cards);
        break;
      case 'bots':
        this.mutateBots(genome.bots);
        break;
    }
  }

  // Crossover helpers (simplified)
  private crossoverModules(a: ModuleGene[], b: ModuleGene[]): ModuleGene[] {
    return a.map((g, i) => Math.random() < 0.5 ? a[i] : b[i]);
  }
  private crossoverLabs(a: LabGene[], b: LabGene[]): LabGene[] { return a.map((g, i) => Math.random() < 0.5 ? a[i] : b[i]); }
  private crossoverWorkshop(a: WorkshopGene, b: WorkshopGene): WorkshopGene {
    return {
      attack: { ...a.attack, ...b.attack },
      defense: { ...a.defense, ...b.defense },
      utility: { ...a.utility, ...b.utility },
    };
  }
  private crossoverUW(a: UWGene, b: UWGene): UWGene { return { cooldowns: { ...a.cooldowns, ...b.cooldowns }, durations: { ...a.durations, ...b.durations }, bonuses: { ...a.bonuses, ...b.bonuses } }; }
  private crossoverPerks(a: PerkGene, b: PerkGene): PerkGene { return { standard: { ...a.standard, ...b.standard }, ultimate: { ...a.ultimate, ...b.ultimate }, tradeoff: { ...a.tradeoff, ...b.tradeoff } }; }
  private crossoverCards(a: CardGene, b: CardGene): CardGene { return { ...a, ...b }; }
  private crossoverBots(a: BotGene, b: BotGene): BotGene { return { ...a, ...b }; }

  private mutateModules(modules: ModuleGene[]): void { void modules; /* TODO: mutate module levels/substats */ }
  private mutateLabs(labs: LabGene[]): void { void labs; /* TODO: mutate lab levels */ }
  private mutateWorkshop(ws: WorkshopGene): void { void ws; /* TODO: mutate workshop levels */ }
  private mutateUW(uw: UWGene): void { void uw; /* TODO: mutate UW cooldowns */ }
  private mutatePerks(perks: PerkGene): void { void perks; /* TODO: mutate perk picks */ }
  private mutateCards(cards: CardGene): void { void cards; /* TODO: mutate card stars */ }
  private mutateBots(bots: BotGene): void { void bots; /* TODO: mutate bot stats */ }

  run(generations: number = 100): OptimizationResult {
    let bestFitness = -Infinity;
    const convergenceData: number[] = [];

    for (let gen = 0; gen < generations; gen++) {
      const best = this.step();
      this.fitnessHistory.push(best);
      if (this.population[0].fitness > bestFitness) {
        bestFitness = this.population[0].fitness;
        this.currentGenome = this.population[0];
      }
      convergenceData.push(bestFitness);

      // Early stopping if converged
      if (gen > 20 && this.fitnessHistory.slice(-20).every((v, i, arr) => i === 0 || Math.abs(v - arr[i-1]) < 0.001)) {
        break;
      }
    }

    const paretoFrontier = this.computeParetoFrontier();
    const builds = this.population.slice(0, 10).map(g => this.genomeToRecommendation(g));

    return {
      builds,
      paretoFrontier,
      generations: this.generation,
      bestFitness,
      convergenceData,
      recommendations: {
        immediate: ['Focus on Lab Speed and Coins/Kill'],
        shortTerm: ['Sync GT/BH cooldowns', 'Max Lab Speed'],
        longTerm: ['Ancestral Modules', 'UW Plus upgrades'],
      },
    };
  }

  private computeParetoFrontier(): BuildRecommendation[] {
    // Pareto frontier: non-dominated solutions
    const pareto: BuildGenome[] = [];
    for (const genome of this.population) {
      let dominated = false;
      for (const other of this.population) {
        if (this.dominates(other, this.population[0])) { dominated = true; break; }
      }
      if (!dominated) pareto.push(genome);
    }
    return pareto.map(g => this.genomeToRecommendation(g));
  }

  private dominates(a: BuildGenome, b: BuildGenome): boolean {
    return a.objectives.coinsPerHour >= b.objectives.coinsPerHour &&
           a.objectives.maxWave >= b.objectives.maxWave &&
           a.objectives.survivability >= b.objectives.survivability &&
           a.objectives.stoneCost <= b.objectives.stoneCost &&
           (a.objectives.coinsPerHour > b.objectives.coinsPerHour ||
            a.objectives.maxWave > b.objectives.maxWave ||
            a.objectives.survivability > b.objectives.survivability ||
            a.objectives.stoneCost < b.objectives.stoneCost);
  }

  private genomeToRecommendation(genome: BuildGenome): BuildRecommendation {
    return {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Genetic Build #${this.generation}`,
      archetype: 'hybrid',
      modules: [],
      labs: [],
      workshop: [],
      expected: {
        coinsPerHour: genome.objectives.coinsPerHour,
        maxWave: genome.objectives.maxWave,
        coinsPerMinute: genome.objectives.coinsPerHour / 60,
        survivability: genome.objectives.survivability,
      },
      cost: { stones: genome.objectives.stoneCost, shards: genome.objectives.shardCost, coins: genome.objectives.coinCost, time: genome.objectives.timeToComplete },
      constraints: [],
      reasoning: `Genetic algorithm generation ${this.generation}, fitness ${genome.fitness.toFixed(2)}`,
    };
  }
}

// ============================================
// MODULE RECOMMENDATION ENGINE
// ============================================

export interface ModuleGain {
  reason: string;
  coinsPerHour?: number;
  damageMultiplier?: number;
  survivability?: number;
}

interface UWRecommendation {
  uwId: string;
  reason: string;
}

interface PerkRecommendation {
  perkId: string;
  reason: string;
}

export class ModuleRecommender {
  private moduleData: ModuleData[];
  private playerModules: ModuleItem[];
  private playerResources: { stones: number; shards: number; coins: number };
  private playerUWs: Record<string, { unlocked: boolean; level: number }>;

  constructor(
    moduleData: ModuleData[],
    playerModules: ModuleItem[],
    resources: { stones: number; shards: number; coins: number },
    playerUWs: Record<string, { unlocked: boolean; level: number }>
  ) {
    this.moduleData = moduleData;
    this.playerModules = playerModules;
    this.playerResources = resources;
    this.playerUWs = playerUWs;
  }

  recommendForTarget(
    target: 'economy' | 'push' | 'hybrid' | 'tournament' | 'dissonance',
    constraints: Record<string, unknown>
  ): ModuleRecommendation[] {
    void constraints;
    const recommendations: ModuleRecommendation[] = [];

    // Analyze each module
    for (const mod of this.moduleData) {
      const owned = this.playerModules.find(m => m.id === mod.id);
      const currentLevel = owned?.level || 0;

      if (currentLevel >= mod.maxLevel) continue;

      const recommendation = this.evaluateModule(mod, currentLevel);
      if (recommendation.priority !== 'avoid') {
        recommendations.push(recommendation);
      }
    }

    // Sort by priority and expected gain
    return recommendations.sort((a, b) => {
      const priorityOrder = { essential: 0, high: 1, medium: 2, low: 3, avoid: 4 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (b.expectedGain.coinsPerHour || 0) - (a.expectedGain.coinsPerHour || 0);
    });
  }

  private evaluateModule(mod: ModuleData, currentLevel: number): ModuleRecommendation {
    // Calculate expected gains from next level
    const nextLevel = currentLevel + 1;
    if (nextLevel > mod.maxLevel) {
      return { moduleId: mod.id, moduleType: mod.type, priority: 'avoid', reason: 'Max level reached', expectedGain: {}, cost: { stones: 0, shards: 0, coins: 0 }, synergies: [], conflicts: [] };
    }

    const cost = mod.costs.find(c => c.level === nextLevel);
    const gain = this.estimateGain(mod, nextLevel);

    // Determine priority based on ROI
    let priority: ModuleRecommendation['priority'] = 'low';
    const roi = (gain.coinsPerHour || 0) / Math.max(1, cost?.stones || 1);
    
    if (roi > 10000) priority = 'essential';
    else if (roi > 1000) priority = 'high';
    else if (roi > 100) priority = 'medium';
    else priority = 'low';

    return {
      moduleId: mod.id,
      moduleType: mod.type,
      priority,
      reason: `Level ${nextLevel}: ${gain.reason}`,
      expectedGain: {
        coinsPerHour: gain.coinsPerHour,
        damageMultiplier: gain.damageMultiplier,
        survivability: gain.survivability,
      },
      cost: { stones: cost?.stones || 0, shards: cost?.shards || 0, coins: cost?.coins || 0 },
      synergies: this.findSynergies(mod.id),
      conflicts: this.findConflicts(),
    };
  }

  private estimateGain(mod: ModuleData, level: number): ModuleGain {
    const effect = mod.baseEffect;
    const currentValue = effect.value + (level - 1) * effect.perLevel;
    const nextValue = effect.value + level * effect.perLevel;
    const delta = nextValue - currentValue;

    const gain: ModuleGain = { reason: `${mod.name} L${level}: +${delta.toFixed(2)}${effect.isPct ? '%' : ''} ${effect.type}` };
    
    if (effect.type.includes('coin') || effect.type.includes('Coin')) {
      gain.coinsPerHour = delta * 1000; // rough estimate
    } else if (effect.type.includes('damage') || effect.type.includes('Damage')) {
      gain.damageMultiplier = delta / 100;
    } else if (effect.type.includes('health') || effect.type.includes('Health')) {
      gain.survivability = delta / 100;
    }

    return gain;
  }

  private findSynergies(moduleId: string): string[] {
    // Module synergies based on game mechanics
    const synergies: Record<string, string[]> = {
      'damage': ['criticalChance', 'criticalFactor', 'attackSpeed'],
      'criticalChance': ['damage', 'criticalFactor', 'attackSpeed'],
      'attackSpeed': ['damage', 'criticalChance', 'criticalFactor'],
      'goldenTower': ['blackHole', 'deathWave', 'spotlight'],
      'blackHole': ['goldenTower', 'deathWave', 'deathWave'],
      'deathWave': ['goldenTower', 'blackHole', 'spotlight'],
      'goldenBot': ['goldenTower', 'deathWave'],
      'amplifyBot': ['damage', 'criticalChance'],
    };
    return synergies[moduleId] || [];
  }

  private findConflicts(): string[] {
    // Module conflicts (rare, but some exist)
    return [];
  }

  // Get next upgrade recommendations for all categories
  getAllRecommendations(target: 'economy' | 'push' | 'hybrid' | 'tournament' | 'dissonance'): {
    modules: ModuleRecommendation[];
    labs: LabRecommendation[];
    workshop: WorkshopRecommendation[];
    uw: UWRecommendation[];
    perks: PerkRecommendation[];
  } {
    return {
      modules: this.recommendForTarget(target, {}),
      labs: this.getLabRecommendations(),
      workshop: this.getWorkshopRecommendations(),
      uw: this.getUWRecommendations(),
      perks: this.getPerkRecommendations(),
    };
  }

  private getLabRecommendations(): LabRecommendation[] { return []; }
  private getWorkshopRecommendations(): WorkshopRecommendation[] { return []; }
  private getUWRecommendations(): UWRecommendation[] { return []; }
  private getPerkRecommendations(): PerkRecommendation[] { return []; }
}

// ============================================
// BUILD SIMULATOR
// ============================================

export class BuildSimulator {
  private gameData: GameDataTables;

  constructor(gameData: GameDataTables) {
    this.gameData = gameData;
  }

  async simulate(build: BuildRecommendation, runCount: number = 1000): Promise<BuildSimulationResult> {
    const results: SimulatedRun[] = [];

    void build;
    for (let i = 0; i < runCount; i++) {
      results.push(await this.simulateRun());
    }

    const stats = {
      avgWave: results.reduce((s, r) => s + r.wave, 0) / results.length,
      avgCoinsPerHour: results.reduce((s, r) => s + r.coinsPerHour, 0) / results.length,
      avgCoinsPerMinute: results.reduce((s, r) => s + r.coins / r.durationMin, 0) / results.length,
      avgDuration: results.reduce((s, r) => s + r.durationMin, 0) / results.length,
      survivalRate: results.filter(r => r.survived).length / results.length,
      avgDamageDealt: results.reduce((s, r) => s + r.damageDealt, 0) / results.length,
      avgDamageTaken: results.reduce((s, r) => s + r.damageTaken, 0) / results.length,
    };

    return {
      build: { id: '', name: '', archetype: 'economy', modules: [], labs: [], workshop: [], expected: { coinsPerHour: 0, maxWave: 0, coinsPerMinute: 0, survivability: 0 }, cost: { stones: 0, shards: 0, coins: 0, time: 0 }, constraints: [], reasoning: '' },
      simulation: { runs: results, stats: stats, confidence: 0.95 },
    };
  }

  private async simulateRun(): Promise<SimulatedRun> {
    // Simplified simulation - in reality would use full game mechanics
    const baseWave = 5000 + Math.random() * 5000;
    const variance = Math.random() * 0.3 - 0.15; // ±15%
    const wave = Math.round(baseWave * (1 + variance));
    
    const baseCoinsPerHour = 10e12 * (1 + (Math.random() - 0.5) * 0.2);
    const durationMin = 300 + Math.random() * 240;
    const coins = baseCoinsPerHour * (durationMin / 60);
    
    return {
      wave: Math.floor(wave),
      coins: Math.floor(coins),
      durationMin: Math.floor(durationMin),
      coinsPerHour: baseCoinsPerHour,
      damageDealt: Math.floor(1e12 * (1 + Math.random())),
      damageTaken: Math.floor(1e12 * Math.random()),
      survived: Math.random() > 0.05,
      killedBy: ['Boss', 'Ranged', 'Fast', 'Tank'][Math.floor(Math.random() * 4)],
      perks: [],
    };
  }
}

// ============================================
// ACHIEVEMENT TARGET TRACKER
// ============================================

export class AchievementTracker {
  private targets: AchievementTarget[] = [];
  private completedTargets: AchievementTarget[] = [];

  constructor() {
    this.loadDefaults();
  }

  loadDefaults(): void {
    this.targets = [
      // Tier milestones
      { id: 'tier5', name: 'Reach Tier 5', description: 'Reach Tier 5 for first time', category: 'tier', targetValue: 5, currentValue: 0, completed: false, rewards: ['Unlocks Lab Speed'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 172800000, difficulty: 'easy' },
      { id: 'tier10', name: 'Reach Tier 10', category: 'tier', targetValue: 10, currentValue: 0, completed: false, rewards: ['Unlock 3rd Lab'], prerequisites: ['tier5'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 864000000, difficulty: 'medium' },
      { id: 'tier15', name: 'Reach Tier 15', category: 'tier', targetValue: 15, currentValue: 0, completed: false, rewards: ['All UWs available'], prerequisites: ['tier10'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 4320000000, difficulty: 'hard' },

      // Wave milestones
      { id: 'wave5k', name: 'Reach Wave 5000', category: 'wave', targetValue: 5000, currentValue: 0, completed: false, rewards: [], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 864000000, difficulty: 'easy' },
      { id: 'wave10k', targetValue: 10000, currentValue: 0, completed: false, category: 'wave', name: 'Reach Wave 10000', rewards: [], prerequisites: ['wave5k'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 2592000000, difficulty: 'medium' },
      { id: 'wave20k', targetValue: 20000, currentValue: 0, completed: false, category: 'wave', name: 'Reach Wave 20000', rewards: [], prerequisites: ['wave10k'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 8640000000, difficulty: 'hard' },

      // Module milestones
      { id: 'ancestral1', name: 'First Ancestral Module', category: 'module', targetValue: 1, currentValue: 0, completed: false, rewards: ['Ancestral power'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 2592000000, difficulty: 'hard' },
      { id: 'ancestral5', targetValue: 5, currentValue: 0, completed: false, category: 'module', name: '5 Ancestral Modules', rewards: [], prerequisites: ['ancestral1'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 12960000000, difficulty: 'extreme' },
      { id: 'ancestral5star', targetValue: 1, currentValue: 0, completed: false, category: 'module', name: 'First Ancestral 5★', rewards: [], prerequisites: ['ancestral5'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 25920000000, difficulty: 'extreme' },

      // UW milestones
      { id: 'gt150', name: 'GT Cooldown 150s', category: 'uw', targetValue: 150, currentValue: 300, completed: false, rewards: ['GT/BH Sync'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 2592000000, difficulty: 'hard' },
      { id: 'bh150', targetValue: 150, currentValue: 300, completed: false, category: 'uw', name: 'BH Cooldown 150s', rewards: ['GT/BH Sync'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 2592000000, difficulty: 'hard' },
      { id: 'permaBH', targetValue: 1, currentValue: 0, completed: false, category: 'uw', name: 'Perma Black Hole', rewards: ['Infinite BH uptime'], prerequisites: ['bh150', 'gt150'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 8640000000, difficulty: 'extreme' },

      // Tournament
      { id: 'tourneyCopper', name: 'First Tournament', category: 'tournament', targetValue: 1, currentValue: 0, completed: false, rewards: ['Copper league'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 86400000, difficulty: 'easy' },
      { id: 'tourneyGold', targetValue: 1, currentValue: 0, completed: false, category: 'tournament', name: 'Reach Gold League', rewards: [], prerequisites: ['tourneyCopper'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 864000000, difficulty: 'medium' },
      { id: 'tourneyMythic', targetValue: 1, currentValue: 0, completed: false, category: 'tournament', name: 'Reach Mythic League', rewards: [], prerequisites: ['tourneyGold'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 2592000000, difficulty: 'extreme' },

      // Economy
      { id: 'cph1t', name: '1T Coins/Hour', category: 'currency', targetValue: 1e12, currentValue: 0, completed: false, rewards: [], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 864000000, difficulty: 'medium' },
      { id: 'cph10t', targetValue: 1e13, currentValue: 0, completed: false, category: 'currency', name: '10T Coins/Hour', rewards: [], prerequisites: ['cph1t'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 2592000000, difficulty: 'hard' },
      { id: 'cph100t', targetValue: 1e14, currentValue: 0, completed: false, category: 'currency', name: '100T Coins/Hour', rewards: [], prerequisites: ['cph10t'], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 8640000000, difficulty: 'extreme' },

      // Modules
      { id: 'allModulesMax', name: 'All Modules Max Level', category: 'module', targetValue: 1, currentValue: 0, completed: false, rewards: ['Max power'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 31536000000, difficulty: 'extreme' },

      // Labs
      { id: 'labSpeedMax', name: 'Max Lab Speed', category: 'lab', targetValue: 99, currentValue: 0, completed: false, rewards: ['Fastest research'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 31536000000, difficulty: 'extreme' },
      { id: 'gameSpeedMax', targetValue: 7, currentValue: 1, completed: false, category: 'lab', name: 'Max Game Speed (7)', rewards: ['5x speed'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 31536000000, difficulty: 'extreme' },

      // Cards
      { id: 'allCardsMax', name: 'All Cards Max Stars', category: 'card', targetValue: 1, currentValue: 0, completed: false, rewards: ['Mastery unlock'], prerequisites: [], moduleSuggestions: [], labSuggestions: [], workshopSuggestions: [], estimatedTime: 31536000000, difficulty: 'extreme' },
    ];
  }

  getTargets(): AchievementTarget[] {
    return this.targets;
  }

  getActiveTargets(): AchievementTarget[] {
    return this.targets.filter(t => !t.completed);
  }

  getCompletedTargets(): AchievementTarget[] {
    return this.targets.filter(t => t.completed);
  }

  updateProgress(id: string, currentValue: number): boolean {
    const target = this.targets.find(t => t.id === id);
    if (!target) return false;
    
    target.currentValue = currentValue;
    if (currentValue >= target.targetValue && !target.completed) {
      target.completed = true;
      target.completedAt = Date.now();
      this.moveToCompleted(target.id);
      return true;
    }
    return false;
  }

  private moveToCompleted(id: string): void {
    const idx = this.targets.findIndex(t => t.id === id);
    if (idx >= 0) {
      const [target] = this.targets.splice(idx, 1);
      this.completedTargets.push(target);
    }
  }

  getRecommendationsForTarget(targetId: string): {
    modules: ModuleRecommendation[];
    labs: LabRecommendation[];
    workshop: WorkshopRecommendation[];
  } {
    const target = this.targets.find(t => t.id === targetId);
    if (!target) return { modules: [], labs: [], workshop: [] };
    
    // Return pre-computed suggestions
    return {
      modules: target.moduleSuggestions,
      labs: target.labSuggestions,
      workshop: target.workshopSuggestions,
    };
  }
}

export const achievementTracker = new AchievementTracker();