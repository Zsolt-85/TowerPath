import { NextRequest, NextResponse } from 'next/server';

interface RunInput {
  tier: number;
  wave: number;
  coins: number;
  cells?: number;
  durationMin: number;
  strategy?: string;
}

/**
 * Analyze a set of runs: totals, bests, and coins/hr broken down by
 * tier and strategy. Pure computation over caller-supplied data —
 * this endpoint stores nothing.
 */
export function analyzeRuns(runs: RunInput[]) {
  const clean = runs.filter(
    (r) =>
      typeof r.tier === 'number' &&
      typeof r.wave === 'number' &&
      typeof r.coins === 'number' &&
      typeof r.durationMin === 'number' &&
      r.durationMin > 0
  );
  const cph = (r: RunInput) => (r.coins / r.durationMin) * 60;

  const byTier = new Map<number, { runs: number; cph: number }>();
  const byStrategy = new Map<string, { runs: number; cph: number }>();
  for (const r of clean) {
    const t = byTier.get(r.tier) ?? { runs: 0, cph: 0 };
    t.runs += 1;
    t.cph += cph(r);
    byTier.set(r.tier, t);
    const s = r.strategy || 'Unknown';
    const e = byStrategy.get(s) ?? { runs: 0, cph: 0 };
    e.runs += 1;
    e.cph += cph(r);
    byStrategy.set(s, e);
  }

  const avg = (e: { runs: number; cph: number }) => (e.runs > 0 ? e.cph / e.runs : 0);
  const tierRows = [...byTier.entries()]
    .map(([tier, e]) => ({ tier, runs: e.runs, coinsPerHour: Math.round(avg(e)) }))
    .sort((a, b) => b.coinsPerHour - a.coinsPerHour);
  const strategyRows = [...byStrategy.entries()]
    .map(([strategy, e]) => ({ strategy, runs: e.runs, coinsPerHour: Math.round(avg(e)) }))
    .sort((a, b) => b.coinsPerHour - a.coinsPerHour);

  return {
    totalRuns: clean.length,
    skipped: runs.length - clean.length,
    bestWave: clean.reduce((m, r) => Math.max(m, r.wave), 0),
    totalCoins: clean.reduce((m, r) => m + r.coins, 0),
    totalCells: clean.reduce((m, r) => m + (r.cells ?? 0), 0),
    bestTier: tierRows[0]?.tier ?? null,
    byTier: tierRows,
    byStrategy: strategyRows,
  };
}

export async function GET() {
  return NextResponse.json({
    usage: 'POST JSON { runs: [{ tier, wave, coins, durationMin, cells?, strategy? }] }',
    example: { runs: [{ tier: 11, wave: 7842, coins: 412800000000000, durationMin: 372, strategy: 'Blender' }] },
  });
}

export async function POST(request: NextRequest) {
  let body: { runs?: RunInput[] } = {};
  try {
    body = (await request.json()) as { runs?: RunInput[] };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!Array.isArray(body.runs)) {
    return NextResponse.json({ error: 'Body must be { runs: [...] }.' }, { status: 400 });
  }
  return NextResponse.json(analyzeRuns(body.runs.slice(0, 1000)));
}
