/**
 * TowerPath - Analytics Engine
 * World-class analytics with time-series, heatmaps, and ML-ready features
 */

import type { Run } from '../hooks/useLocalStorage';

// ============================================
// TIME-SERIES ANALYTICS
// ============================================

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  series: string;
  points: TimeSeriesPoint[];
  unit: string;
  color: string;
}

export interface AnalyticsSnapshot {
  timestamp: number;
  runs: Run[];
  totals: AggregatedStats;
  byTier: Record<number, AggregatedStats>;
  byStrategy: Record<string, AggregatedStats>;
  byRunType: Record<string, AggregatedStats>;
}

export interface AggregatedStats {
  count: number;
  totalCoins: number;
  totalCells: number;
  totalDamage: number;
  totalDuration: number;
  avgCoinsPerHour: number;
  avgCellsPerHour: number;
  avgDamagePerHour: number;
  avgWave: number;
  avgDuration: number;
  bestWave: number;
  bestCoinsPerHour: number;
  totalDamageDealt: number;
  totalCoinsEarned: number;
  totalCellsEarned: number;
  totalDurationMin: number;
}

// ============================================
// ANALYTICS ENGINE
// ============================================

export class AnalyticsEngine {
  private snapshots: AnalyticsSnapshot[] = [];
  private maxSnapshots = 1000;

  // Ingest a new run and update aggregates
  ingestRun(run: Run): AnalyticsSnapshot {
    const runs = this.getRuns();
    runs.push(run);
    localStorage.setItem('towerpath:runs', JSON.stringify(runs.slice(0, 500)));
    
    const snapshot = this.computeSnapshot();
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    localStorage.setItem('towerpath:analytics:snapshots', JSON.stringify(this.snapshots));
    
    return snapshot;
  }

  private getRuns(): Run[] {
    try {
      return JSON.parse(localStorage.getItem('towerpath:runs') || '[]');
    } catch {
      return [];
    }
  }

  private computeSnapshot(): AnalyticsSnapshot {
    const runs = this.getRuns();

    return {
      timestamp: Date.now(),
      runs: this.getRuns().slice(-100), // Keep last 100 for detail views
      totals: this.aggregateRuns(runs),
      byTier: Object.fromEntries(
        Object.entries(this.groupBy(this.getRuns(), 'tier'))
          .map(([k, v]) => [Number(k), this.aggregateRuns(v)])
      ),
      byStrategy: Object.fromEntries(
        Object.entries(this.groupBy(this.getRuns(), 'strategy'))
          .map(([k, v]) => [k, this.aggregateRuns(v)])
      ),
      byRunType: Object.fromEntries(
        Object.entries(this.groupBy(this.getRuns(), 'runType'))
          .map(([k, v]) => [k, this.aggregateRuns(v)])
      ),
    };
  }

  private groupBy(runs: Run[], key: keyof Run): Record<string, Run[]> {
    return runs.reduce((acc, run) => {
      const groupKey = String(run[key] ?? 'unknown');
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(run);
      return acc;
    }, {} as Record<string, Run[]>);
  }

  private aggregateRuns(runs: Run[]): AggregatedStats {
    if (runs.length === 0) return this.emptyStats();
    
    let totalCoins = 0;
    let totalCells = 0;
    let totalDamage = 0;
    let totalDuration = 0;
    let totalCoinsPerHour = 0;
    let totalCellsPerHour = 0;
    let totalDamagePerHour = 0;
    let bestWave = 0;
    let bestCoinsPerHour = 0;
    let totalDamageDealt = 0;
    let totalCoinsEarned = 0;
    let totalCellsEarned = 0;
    let totalDurationMin = 0;

    for (const run of runs) {
      const cph = run.durationMin > 0 ? (run.coins / run.durationMin) * 60 : 0;
      const cps = run.durationMin > 0 ? ((run.cells ?? 0) / run.durationMin) * 60 : 0;
      const dph = run.durationMin > 0 && run.detail?.damageDealt 
        ? (run.detail.damageDealt / run.durationMin) * 60 : 0;

      totalCoins += run.coins;
      totalCells += run.cells ?? 0;
      totalDamage += run.detail?.damageDealt ?? 0;
      totalDuration += run.durationMin;
      totalCoinsPerHour += cph;
      totalCellsPerHour += cps;
      totalDamagePerHour += dph;
      totalDamageDealt += run.detail?.damageDealt ?? 0;
      totalCoinsEarned += run.coins;
      totalCellsEarned += run.cells ?? 0;
      totalDurationMin += run.durationMin;
      bestWave = Math.max(bestWave, run.wave);
      bestCoinsPerHour = Math.max(bestCoinsPerHour, cph);
    }

    const n = runs.length;
    return {
      count: runs.length,
      totalCoins,
      totalCells,
      totalDamage,
      totalDuration,
      avgCoinsPerHour: totalCoinsPerHour / n,
      avgCellsPerHour: totalCellsPerHour / n,
      avgDamagePerHour: totalDamagePerHour / n,
      avgWave: runs.reduce((s, r) => s + r.wave, 0) / n,
      avgDuration: totalDuration / n,
      bestWave,
      bestCoinsPerHour,
      totalDamageDealt,
      totalCoinsEarned,
      totalCellsEarned,
      totalDurationMin,
    };
  }

  emptyStats() {
    return {
      count: 0, totalCoins: 0, totalCells: 0, totalDamage: 0,
      totalDuration: 0, avgCoinsPerHour: 0, avgCellsPerHour: 0,
      avgDamagePerHour: 0, avgWave: 0, avgDuration: 0,
      bestWave: 0, bestCoinsPerHour: 0, totalDamageDealt: 0,
      totalCoinsEarned: 0, totalCellsEarned: 0, totalDurationMin: 0,
    };
  }

  // Get time-series data for charts
  getTimeSeries(
    metric: 'coins' | 'cells' | 'wave' = 'coins',
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
    days = 30
  ): { timestamp: string; value: number; count: number; sum: number }[] {
    const runs = this.getRuns();
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    
    const recentRuns = runs.filter(r => new Date(r.date).getTime() > cutoff);
    
    // Group by time bucket
    const buckets = new Map<string, { sum: number; count: number }>();
    
    for (const run of recentRuns) {
      const date = new Date(run.date);
      let key: string;
      
      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${String(Math.ceil((date.getDate() + date.getDay()) / 7)).padStart(2,'0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
          break;
      }
      
      const val = metric === 'cells' ? (run.cells ?? 0) : metric === 'wave' ? run.wave : run.coins;
      if (!buckets.has(key)) buckets.set(key, { sum: 0, count: 0 });
      const b = buckets.get(key)!;
      b.sum += val;
      b.count += 1;
    }
    
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, { sum, count }]) => ({
        timestamp,
        value: sum / count,
        count,
        sum,
      }));
  }

  // Heatmap data for tier vs strategy
  getHeatmapData(xAxis: 'tier' | 'strategy' | 'runType', yAxis: 'wave' | 'coinsPerHour' | 'damage' | 'cells'): number[][] {
    void yAxis;
    const yValues = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000, 20000];

    const matrix: number[][] = [];
    for (const y of yValues) {
      const row: number[] = [];
      for (const xVal of ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15']) {
        const runs = this.getRuns().filter(r =>
          (r[xAxis]?.toString() === xVal || ((xAxis as string) === 'wave' && r.wave >= y && r.wave < y + 1000))
        );
        const avg = runs.length > 0 
          ? runs.reduce((s, r) => s + (r.coins / Math.max(1, r.durationMin) * 60), 0) / runs.length
          : 0;
        row.push(Math.round(avg));
      }
      matrix.push(row);
    }
    return matrix;
  }

  // Get best farm tier recommendation
  getBestFarmTier(): { tier: number; coinsPerHour: number; sampleSize: number } | null {
    const runs = this.getRuns();
    if (runs.length === 0) return null;

    let best: { tier: number; cph: number; n: number } | null = null;
    
    for (const [tier, runs] of Object.entries(this.groupBy(this.getRuns(), 'tier'))) {
      if (runs.length < 3) continue; // Need minimum sample
      const avgCph = runs.reduce((s, r) => s + (r.coins / Math.max(1, r.durationMin) * 60), 0) / runs.length;
      if (!best || avgCph > best.cph) {
        best = { tier: Number(tier), cph: avgCph, n: runs.length };
      }
    }
    return best ? { tier: best.tier, coinsPerHour: best.cph, sampleSize: best.n } : null;
  }

  // Strategy comparison
  getStrategyComparison(): Record<string, { avgCph: number; avgWave: number; count: number; bestWave: number }> {
    const result: Record<string, { avgCph: number; avgWave: number; count: number; bestWave: number }> = {};
    
    for (const [strat, runs] of Object.entries(this.groupBy(this.getRuns(), 'strategy'))) {
      if (runs.length === 0) continue;
      result[strat] = {
        avgCph: runs.reduce((s, r) => s + (r.coins / Math.max(1, r.durationMin) * 60), 0) / runs.length,
        avgWave: runs.reduce((s, r) => s + r.wave, 0) / runs.length,
        count: runs.length,
        bestWave: Math.max(...runs.map(r => r.wave)),
      };
    }
    return result;
  }
}

// Singleton instance
export const analyticsEngine = new AnalyticsEngine();

// React hook
export function useAnalytics() {
  // React hook implementation
  return analyticsEngine;
}