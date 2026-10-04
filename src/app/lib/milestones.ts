import type { Run } from '../hooks/useLocalStorage';
import type { Tournament } from '../components/TournamentTab';
import { labsDurationMap } from '../data/labs-data';

export type MilestoneCategory =
  | 'Waves'
  | 'Tiers'
  | 'Economy'
  | 'Tournament'
  | 'Labs'
  | 'Ultimate Weapons';

export interface MilestoneSnapshot {
  runs: Run[];
  tournaments: Tournament[];
  uwUnlocked: Record<string, boolean>;
  uwSynced: Record<string, boolean>;
  uwNames: string[];
  labSlots: { lab: string; current: number; target: number; speed: number }[];
  labGlobalSpeed: number;
  stones: number;
  gtCd: number;
  bhCd: number;
}

export interface Milestone {
  id: string;
  category: MilestoneCategory;
  label: string;
  currentLabel: string;
  targetLabel: string;
  progress: number;
  done: boolean;
  etaDays: number | null;
  etaLabel: string;
  action: string;
}

export interface Push {
  rank: number;
  category: MilestoneCategory;
  title: string;
  detail: string;
  etaLabel: string;
}

export const LEAGUE_ORDER = ['Copper', 'Silver', 'Gold', 'Platinum', 'Champion', 'Legend', 'Mythic'] as const;

const WAVE_STEPS = [1000, 2500, 5000, 8000, 10000, 15000, 20000];
const TIER_STEPS = [5, 10, 15, 18];
const CPH_STEPS = [1e9, 1e11, 1e12, 1e13];

const PUSH_WEIGHT: Record<MilestoneCategory, number> = {
  Waves: 90,
  Tiers: 85,
  Tournament: 80,
  Economy: 75,
  Labs: 70,
  'Ultimate Weapons': 65,
};

function clamp01(n: number): number {
  if (!isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function byDateAsc<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

function daySpan(firstISO: string, lastISO: string): number {
  const ms = Date.parse(lastISO) - Date.parse(firstISO);
  return Math.max(1, ms / 86400000);
}

export function formatEta(days: number | null): string {
  if (days == null || !isFinite(days)) return 'log more runs for an ETA';
  if (days <= 0) return 'Done';
  if (days < 1) return 'under a day';
  if (days < 14) return `~${Math.max(1, Math.round(days))} day${Math.round(days) === 1 ? '' : 's'}`;
  if (days < 60) return `~${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
  return `~${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
}

function waveTrendPerDay(runs: Run[]): number | null {
  const withWave = byDateAsc(runs.filter((r) => r.wave > 0));
  if (withWave.length < 3) return null;
  const gain = withWave[withWave.length - 1].wave - withWave[0].wave;
  if (gain <= 0) return null;
  return gain / daySpan(withWave[0].date, withWave[withWave.length - 1].date);
}

function cphOf(runs: Run[]): number {
  const per = runs.map((r) => (r.durationMin > 0 ? (r.coins / r.durationMin) * 60 : 0)).filter((v) => v > 0);
  if (per.length === 0) return 0;
  return per.reduce((a, b) => a + b, 0) / per.length;
}

function cphGrowthPerDay(runs: Run[]): number | null {
  const ordered = byDateAsc(runs.filter((r) => r.coins > 0 && r.durationMin > 0));
  if (ordered.length < 4) return null;
  const half = Math.floor(ordered.length / 2);
  const early = cphOf(ordered.slice(0, half));
  const late = cphOf(ordered.slice(half));
  if (early <= 0 || late <= early * 1.02) return null;
  const days = daySpan(ordered[0].date, ordered[ordered.length - 1].date);
  return Math.pow(late / early, 1 / days);
}

function labLevelSeconds(lab: string, level: number): number {
  try {
    const table = (labsDurationMap as Record<string, unknown>)[lab] as Record<string, unknown> | undefined;
    if (table) {
      const raw = table[String(level)];
      if (typeof raw === 'number' && raw > 0) return raw;
      if (raw != null && typeof raw === 'object') {
        const d = (raw as Record<string, unknown>).DURATION;
        if (typeof d === 'number' && d > 0) return d;
      }
    }
  } catch {
    // fall through to estimate
  }
  return 600 * Math.pow(1.22, Math.min(Math.max(level, 1), 99));
}

export function computeMilestones(snap: MilestoneSnapshot): Milestone[] {
  const out: Milestone[] = [];
  const runs = snap.runs;
  const bestWave = runs.reduce((m, r) => Math.max(m, r.wave), 0);
  const maxTier = runs.reduce((m, r) => Math.max(m, r.tier), 0);
  const avgCph = cphOf(runs);
  const wavePerDay = waveTrendPerDay(runs);
  const cphGrowth = cphGrowthPerDay(runs);

  const nextWave = WAVE_STEPS.find((s) => s > bestWave);
  if (nextWave != null) {
    const remaining = nextWave - bestWave;
    const eta = wavePerDay != null && wavePerDay > 0 ? remaining / wavePerDay : null;
    out.push({
      id: `wave-${nextWave}`,
      category: 'Waves',
      label: `Wave ${nextWave.toLocaleString()}`,
      currentLabel: bestWave > 0 ? `best ${bestWave.toLocaleString()}` : 'no runs yet',
      targetLabel: `${remaining.toLocaleString()} waves to go`,
      progress: clamp01(bestWave / nextWave),
      done: false,
      etaDays: eta,
      etaLabel: formatEta(eta),
      action:
        wavePerDay != null
          ? `Push farm tier at +${Math.round(wavePerDay)}/day`
          : 'Log farm runs so a pace can be estimated',
    });
  }

  const nextTier = TIER_STEPS.find((s) => s > maxTier);
  if (nextTier != null) {
    out.push({
      id: `tier-${nextTier}`,
      category: 'Tiers',
      label: `Reach Tier ${nextTier}`,
      currentLabel: maxTier > 0 ? `max tier ${maxTier}` : 'no runs yet',
      targetLabel: maxTier > 0 ? `${nextTier - maxTier} tier${nextTier - maxTier === 1 ? '' : 's'} to climb` : `climb to tier ${nextTier}`,
      progress: clamp01(maxTier / nextTier),
      done: false,
      etaDays: null,
      etaLabel: runs.length === 0 ? 'log runs to unlock ETAs' : 'push when farm tier feels easy',
      action: 'Move up when you one-shot bosses for 500+ waves',
    });
  }

  const nextCph = CPH_STEPS.find((s) => s > avgCph);
  if (nextCph != null) {
    let eta: number | null = null;
    if (cphGrowth != null && cphGrowth > 1 && avgCph > 0) {
      eta = Math.log(nextCph / avgCph) / Math.log(cphGrowth);
    }
    out.push({
      id: `cph-${nextCph}`,
      category: 'Economy',
      label: `${shortNum(nextCph)} coins/hr`,
      currentLabel: avgCph > 0 ? `${shortNum(avgCph)}/hr avg` : 'no income yet',
      targetLabel: avgCph > 0 ? `${(nextCph / avgCph).toFixed(1)}x income needed` : 'log farm runs first',
      progress: clamp01(avgCph / nextCph),
      done: false,
      etaDays: eta,
      etaLabel: formatEta(eta),
      action: 'Coins/Kill + Golden Tower bonus labs, farm best-earner tier',
    });
  }

  const bestLeagueIdx = snap.tournaments.reduce((m, t) => {
    const i = LEAGUE_ORDER.indexOf(t.league as (typeof LEAGUE_ORDER)[number]);
    return Math.max(m, i);
  }, -1);
  if (bestLeagueIdx < LEAGUE_ORDER.length - 1) {
    const next = LEAGUE_ORDER[bestLeagueIdx + 1];
    const hasData = snap.tournaments.length > 0;
    out.push({
      id: `league-${next}`,
      category: 'Tournament',
      label: `${next} League`,
      currentLabel: bestLeagueIdx >= 0 ? `best ${LEAGUE_ORDER[bestLeagueIdx]}` : 'no tournaments logged',
      targetLabel: hasData ? 'place top 3 to promote' : 'join a tournament first',
      progress: clamp01((bestLeagueIdx + 1) / LEAGUE_ORDER.length),
      done: false,
      etaDays: hasData ? 4 : null,
      etaLabel: hasData ? '~next tournament' : 'log a tournament result',
      action: 'Run the tournament prep checklist, push with saved gold',
    });
  }

  snap.labSlots.forEach((s, i) => {
    if (s.target <= s.current) return;
    const eff = Math.max(0.1, snap.labGlobalSpeed * s.speed);
    let secs = 0;
    for (let l = s.current + 1; l <= s.target; l += 1) secs += labLevelSeconds(s.lab, l);
    const days = secs / 86400 / eff;
    out.push({
      id: `lab-${i}`,
      category: 'Labs',
      label: `${s.lab} → ${s.target}`,
      currentLabel: `level ${s.current} @ ${eff.toFixed(1)}x`,
      targetLabel: `${s.target - s.current} levels left`,
      progress: clamp01(s.target > 0 ? s.current / s.target : 1),
      done: false,
      etaDays: days,
      etaLabel: formatEta(days),
      action: `Keep in slot ${i + 1} or raise its speed multiplier`,
    });
  });

  const uwTargets = [
    { name: 'Golden Tower sync (150s)', current: snap.gtCd, base: 300, goal: 150, cost: 2040 },
    { name: 'Black Hole sync (150s)', current: snap.bhCd, base: 300, goal: 150, cost: 2040 },
  ];
  for (const u of uwTargets) {
    if (u.current <= u.goal) continue;
    out.push({
      id: `uw-${u.name}`,
      category: 'Ultimate Weapons',
      label: u.name,
      currentLabel: `${u.current}s cooldown`,
      targetLabel: `${u.current - u.goal}s to shave · costs ${u.cost.toLocaleString()} stones from ${u.current}s`,
      progress: clamp01((u.base - u.current) / (u.base - u.goal)),
      done: false,
      etaDays: null,
      etaLabel: `${snap.stones.toLocaleString()} stones banked`,
      action: 'Spend stones on cooldown when GT/BH drift apart',
    });
  }

  const locked = snap.uwNames.filter((n) => !snap.uwUnlocked[n]);
  if (locked.length > 0) {
    out.push({
      id: 'uw-unlock',
      category: 'Ultimate Weapons',
      label: `Unlock ${locked[0]}`,
      currentLabel: `${snap.uwNames.length - locked.length}/${snap.uwNames.length} unlocked`,
      targetLabel: `${locked.length} remaining`,
      progress: clamp01((snap.uwNames.length - locked.length) / Math.max(1, snap.uwNames.length)),
      done: false,
      etaDays: null,
      etaLabel: 'unlock with stones when available',
      action: `Next unlock: ${locked[0]}`,
    });
  }

  return out;
}

export function computePushes(milestones: Milestone[]): Push[] {
  const scored = milestones
    .filter((m) => !m.done)
    .map((m) => ({
      m,
      score: PUSH_WEIGHT[m.category] / ((m.etaDays ?? 30) + 0.25),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return scored.map((s, i) => ({
    rank: i + 1,
    category: s.m.category,
    title: s.m.label,
    detail: `${s.m.action} — ${s.m.etaLabel}`,
    etaLabel: s.m.etaLabel,
  }));
}

export function shortNum(n: number): string {
  if (n >= 1e12) return `${Math.round((n / 1e12) * 10) / 10}T`;
  if (n >= 1e9) return `${Math.round((n / 1e9) * 10) / 10}B`;
  if (n >= 1e6) return `${Math.round((n / 1e6) * 10) / 10}M`;
  if (n >= 1e3) return `${Math.round((n / 1e3) * 10) / 10}K`;
  return String(Math.round(n));
}
