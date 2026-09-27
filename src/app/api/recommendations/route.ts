import { NextRequest, NextResponse } from 'next/server';
import { GOLDEN_TOWER, BLACK_HOLE } from '@/app/data/ultimate-weapons-data';

interface Level {
  value: number;
  cost: number;
}

export interface EngineInput {
  damage?: number;
  attackSpeed?: number;
  coins?: number;
  stones?: number;
  gtCd?: number;
  bhCd?: number;
}

export interface EngineRec {
  id: string;
  name: string;
  desc: string;
  cost: number;
  currency: 'stones' | 'coins';
  impact: string;
  reason: string;
  affordable: boolean;
  computed: boolean;
}

function cooldownTable(uw: { upgrades: Record<string, { values: readonly Level[] }> }): Level[] {
  return [...uw.upgrades.Cooldown.values];
}

/** Index of the table level matching (or just below) an effective cooldown. Tables descend. */
function levelIndex(table: Level[], cd: number): number {
  for (let i = 0; i < table.length; i++) {
    if (table[i].value <= cd) return i;
  }
  return table.length - 1;
}

/** Stones to go from current effective cd down to target cd using real per-level costs. */
function stonesBetween(table: Level[], fromCd: number, toCd: number): { cost: number; fromLevel: number; toLevel: number } {
  const from = levelIndex(table, fromCd);
  const to = levelIndex(table, toCd);
  if (to <= from) return { cost: 0, fromLevel: table[from].value, toLevel: table[from].value };
  let cost = 0;
  for (let i = from + 1; i <= to; i++) cost += table[i].cost;
  return { cost, fromLevel: table[from].value, toLevel: table[to].value };
}

/**
 * Best GT sync target at or below the current GT cooldown: prefer a GT value
 * that the BH cooldown divides evenly into (so every BH lines up with GT),
 * otherwise fall back to matching BH exactly.
 */
function syncTarget(gtTable: Level[], gtCd: number, bhCd: number): number | null {
  const options = gtTable.map((l) => l.value).filter((v) => v < gtCd);
  const aligned = options.filter((v) => v > 0 && bhCd % v === 0);
  if (aligned.length > 0) return aligned[0];
  if (bhCd < gtCd && gtTable.some((l) => l.value === bhCd)) return bhCd;
  return null;
}

export function computeRecommendations(input: EngineInput): { recommendations: EngineRec[]; sync: { gtCd: number; bhCd: number; synced: boolean } } {
  const coins = Math.max(0, input.coins ?? 0);
  const stones = Math.max(0, input.stones ?? 0);
  const gtCd = Math.max(0, input.gtCd ?? 300);
  const bhCd = Math.max(0, input.bhCd ?? 300);

  const gtTable = cooldownTable(GOLDEN_TOWER as unknown as { upgrades: Record<string, { values: readonly Level[] }> });
  const synced = gtCd > 0 && bhCd > 0 && (gtCd === bhCd || bhCd % gtCd === 0 || gtCd % bhCd === 0);

  const recs: EngineRec[] = [];

  const target = syncTarget(gtTable, gtCd, bhCd);
  if (target != null) {
    const { cost, fromLevel, toLevel } = stonesBetween(gtTable, gtCd, target);
    recs.push({
      id: 'gt-sync',
      name: 'Golden Tower Cooldown',
      desc: `Reduce ${fromLevel}s → ${toLevel}s to sync with Black Hole (${bhCd}s)`,
      cost,
      currency: 'stones',
      impact: 'GT+BH multipliers stack every cycle instead of drifting apart',
      reason: `BH fires every ${bhCd}s; a ${toLevel}s GT lines up every cycle. Save the full ${cost.toLocaleString()} stones and drop it in one go — halfway upgrades desync your economy.`,
      affordable: stones >= cost,
      computed: true,
    });
  } else if (!synced && gtCd > 100) {
    const min = gtTable[gtTable.length - 1].value;
    const { cost } = stonesBetween(gtTable, gtCd, min);
    recs.push({
      id: 'gt-min',
      name: 'Golden Tower Cooldown',
      desc: `Push ${gtCd}s toward the ${min}s minimum`,
      cost,
      currency: 'stones',
      impact: 'Shorter cycles = more frequent GT+BH overlaps',
      reason: 'No clean divisor found for your BH — minimize GT so overlaps happen as often as possible.',
      affordable: stones >= cost,
      computed: true,
    });
  }

  const bhTable = cooldownTable(BLACK_HOLE as unknown as { upgrades: Record<string, { values: readonly Level[] }> });
  if (bhCd > 50) {
    const bhMin = bhTable[bhTable.length - 1].value;
    const { cost } = stonesBetween(bhTable, bhCd, bhMin);
    recs.push({
      id: 'bh-min',
      name: 'Black Hole Cooldown',
      desc: `Push ${bhCd}s toward the ${bhMin}s minimum`,
      cost,
      currency: 'stones',
      impact: 'More frequent gathers = more kills inside GT windows',
      reason: 'After GT is synced, BH cooldown is the next economy multiplier.',
      affordable: stones >= cost,
      computed: true,
    });
  }

  recs.push({
    id: 'lab-speed',
    name: 'Lab Speed Research',
    desc: 'Keep Lab Speed among your top research priorities',
    cost: 12000000,
    currency: 'coins',
    impact: 'Every other research finishes sooner, compounding forever',
    reason: 'Guideline from the Effective Paths sheet: lab speed pays back across all 100+ labs.',
    affordable: coins >= 12000000,
    computed: false,
  });

  recs.push({
    id: 'econ',
    name: 'Cash/Wave Workshop Upgrade',
    desc: 'Raise in-run cash flow for longer, richer runs',
    cost: 800000,
    currency: 'coins',
    impact: 'More cash per wave snowballs into more coins per run',
    reason: 'Cheap early economy that shortens every future farm run.',
    affordable: coins >= 800000,
    computed: false,
  });

  return { recommendations: recs, sync: { gtCd, bhCd, synced } };
}

export async function POST(request: NextRequest) {
  let body: EngineInput = {};
  try {
    body = (await request.json()) as EngineInput;
  } catch {
    body = {};
  }
  return NextResponse.json(computeRecommendations(body));
}

export async function GET() {
  return NextResponse.json({
    usage: 'POST JSON { damage, attackSpeed, coins, stones, gtCd, bhCd }',
    example: { damage: 12800000, attackSpeed: 0.85, coins: 12000000, stones: 8420, gtCd: 300, bhCd: 300 },
  });
}
