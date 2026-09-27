'use client';

import { useMemo, useState } from 'react';
import { StatsBar } from './StatsBar';
import { useRuns, formatBig, type Run } from '../hooks/useLocalStorage';
import { useRecommendations } from '../hooks/useRecommendations';
import { useLocalStorage } from '../hooks/useLocalStorage';

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-['Orbitron'] focus:border-[var(--color-gold)] focus:outline-none transition-all";

export function LogRunModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setRuns] = useRuns();
  const [tier, setTier] = useState(10);
  const [wave, setWave] = useState(4000);
  const [coins, setCoins] = useState(2000000000);
  const [durationMin, setDurationMin] = useState(480);

  if (!open) return null;

  const save = () => {
    const run: Run = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      tier: Math.max(1, tier),
      wave: Math.max(1, wave),
      coins: Math.max(0, coins),
      durationMin: Math.max(1, durationMin),
    };
    setRuns((prev) => [run, ...prev].slice(0, 200));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Log a Run</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">Saved in your browser — feeds the dashboard and progress charts.</p>
        {[
          { label: 'Tier', value: tier, set: setTier },
          { label: 'Wave reached', value: wave, set: setWave },
          { label: 'Coins earned', value: coins, set: setCoins },
          { label: 'Duration (minutes)', value: durationMin, set: setDurationMin },
        ].map((f, i) => (
          <div key={i} className="mb-4">
            <label className="text-xs text-[var(--color-text-muted)] block mb-2">{f.label}</label>
            <input
              type="number"
              min={0}
              value={f.value}
              onChange={(e) => f.set(Math.max(0, Number(e.target.value) || 0))}
              className={inputCls}
            />
          </div>
        ))}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-text-muted)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] text-sm font-bold hover:bg-[#ffc000] transition-all"
          >
            Save Run
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardTab({
  onOpenSync,
  logOpen,
  setLogOpen,
}: {
  onOpenSync: () => void;
  logOpen: boolean;
  setLogOpen: (b: boolean) => void;
}) {
  const [runs] = useRuns();
  const [stones] = useLocalStorage('towerpath:stats:stones', 8420);
  const [damage] = useLocalStorage('towerpath:stats:damage', 12800000);
  const [attackSpeed] = useLocalStorage('towerpath:stats:aspd', 0.85);
  const [coins] = useLocalStorage('towerpath:stats:coins', 12000000);
  const [gtCd] = useLocalStorage('towerpath:stats:gtcd', 300);
  const [bhCd] = useLocalStorage('towerpath:stats:bhcd', 300);
  const setModalOpen = setLogOpen;

  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const best = runs.reduce((m, r) => Math.max(m, r.wave), 0);
    const totalCoins = runs.reduce((m, r) => m + r.coins, 0);
    const totalMin = runs.reduce((m, r) => m + r.durationMin, 0);
    const cph = totalMin > 0 ? (totalCoins / totalMin) * 60 : 0;
    return { totalRuns, best, totalCoins, cph };
  }, [runs]);

  const { recs: serverRecs, source } = useRecommendations({ damage, attackSpeed, coins, stones, gtCd, bhCd });
  const recs = (serverRecs ?? []).slice(0, 4);

  const bestTier = useMemo(() => {
    if (runs.length === 0) return null;
    const perTier = new Map<number, { coins: number; min: number; n: number }>();
    for (const r of runs) {
      const e = perTier.get(r.tier) ?? { coins: 0, min: 0, n: 0 };
      e.coins += r.coins;
      e.min += r.durationMin;
      e.n += 1;
      perTier.set(r.tier, e);
    }
    let bestT: number | null = null;
    let bestCph = 0;
    for (const [t, e] of perTier) {
      const cph = e.min > 0 ? (e.coins / e.min) * 60 : 0;
      if (cph > bestCph) {
        bestCph = cph;
        bestT = t;
      }
    }
    return bestT == null ? null : { tier: bestT, cph: bestCph };
  }, [runs]);

  const milestones = [
    { label: 'Tier 5', done: runs.some((r) => r.tier >= 5) || stats.best >= 1000 },
    { label: 'Tier 10', done: runs.some((r) => r.tier >= 10) },
    { label: 'T15 UWs', done: runs.some((r) => r.tier >= 15) },
    { label: 'Wave 5K', done: stats.best >= 5000 },
    { label: 'Wave 8K', done: stats.best >= 8000 },
    { label: '100 runs', done: stats.totalRuns >= 100 },
    { label: '1T coins', done: stats.totalCoins >= 1e12 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <StatsBar
        stats={[
          { label: 'Runs Logged', value: String(stats.totalRuns), change: stats.totalRuns > 0 ? `${stats.totalRuns} total` : 'Log your first run', changeDir: 'up', variant: 'gold' },
          { label: 'Best Wave', value: stats.best > 0 ? stats.best.toLocaleString() : '—', changeDir: 'up', variant: 'teal' },
          { label: 'Coins / Hour', value: stats.cph > 0 ? formatBig(stats.cph) : '—', changeDir: 'up', variant: 'gold' },
          { label: 'Total Coins', value: stats.totalCoins > 0 ? formatBig(stats.totalCoins) : '—', variant: 'red' },
          { label: 'Stones', value: stones.toLocaleString(), change: 'edit in Path Planner', variant: 'teal' },
        ]}
      />

      {bestTier && (
        <div className="rounded-2xl border border-[rgba(0,212,170,0.3)] bg-gradient-to-r from-[rgba(0,212,170,0.1)] to-transparent p-6 flex items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-[var(--color-teal-glow)] text-[var(--color-teal)] flex items-center justify-center text-base flex-shrink-0">◉</span>
          <div className="text-sm">
            <strong style={{ color: 'var(--color-teal)' }}>Farm Tier {bestTier.tier}</strong>
            <span className="text-[var(--color-text-dim)]"> — your best earner at {formatBig(bestTier.cph)} coins/hr across logged runs.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 hover:border-[var(--color-border-light)] transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Orbitron'] text-lg font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[var(--color-gold-glow)] text-[var(--color-gold)] flex items-center justify-center text-base">◈</span>
              Recommended Next Steps
            </h2>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-3 py-1 rounded-full">
              {source === 'server' ? 'Backend engine' : 'Local engine'}
            </span>
          </div>
          {runs.length === 0 && (
            <div className="mb-4 rounded-xl border border-[rgba(240,165,0,0.3)] bg-[rgba(240,165,0,0.06)] p-4 text-xs text-[var(--color-text-dim)] leading-relaxed">
              No runs logged yet — recommendations use starter assumptions. Log a run to personalize them.
            </div>
          )}
          <div className="space-y-2">
            {recs.map((r, i) => (
              <div
                key={r.name}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  i === 0
                    ? 'bg-gradient-to-r from-[rgba(240,165,0,0.08)] to-transparent border-l-2 border-[var(--color-gold)]'
                    : 'hover:bg-[var(--color-bg-card-hover)]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] font-bold text-sm bg-[var(--color-gold)] text-[var(--color-bg-deep)]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)] mt-0.5">{r.desc}</div>
                </div>
                <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-gold-glow)] text-[var(--color-gold)]">
                  {r.cost.toLocaleString()} {r.currency === 'stones' ? '◇' : '©'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Orbitron'] text-lg font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[var(--color-teal-glow)] text-[var(--color-teal)] flex items-center justify-center text-base">◆</span>
              Quick Actions
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold text-sm hover:bg-[#ffc000] transition-all shadow-lg shadow-[var(--color-gold-glow)]"
            >
              ＋ Log Run
            </button>
            <button
              onClick={onOpenSync}
              className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all"
            >
              ⚡ Sync Calc
            </button>
          </div>

          <div className="mb-8">
            <div className="text-sm font-semibold mb-4 text-[var(--color-text-dim)] uppercase tracking-wider">Milestones (from your runs)</div>
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-3 min-w-[64px]">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${m.done ? 'bg-[var(--color-gold)] border-[var(--color-gold)] shadow-lg shadow-[var(--color-gold-glow)]' : 'border-[var(--color-text-muted)]'}`} />
                  <span className="text-[11px] text-[var(--color-text-dim)] text-center">{m.label}</span>
                </div>
              ))}
              <div className="w-px h-10 bg-[var(--color-border)] mx-3 self-center flex-shrink-0" />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-4 text-[var(--color-text-dim)] uppercase tracking-wider">Latest Run</div>
            {runs.length === 0 ? (
              <div className="text-xs text-[var(--color-text-muted)]">Nothing logged yet.</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-full text-xs font-medium bg-[var(--color-gold-glow)] text-[var(--color-gold)]">
                  Tier {runs[0].tier} · Wave {runs[0].wave.toLocaleString()}
                </span>
                <span className="px-4 py-2 rounded-full text-xs font-medium bg-[var(--color-teal-glow)] text-[var(--color-teal)]">
                  {formatBig(runs[0].coins)} coins
                </span>
                <span className="px-4 py-2 rounded-full text-xs font-medium bg-[var(--color-bg-card-hover)] text-[var(--color-text-dim)]">
                  {runs[0].durationMin} min
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
