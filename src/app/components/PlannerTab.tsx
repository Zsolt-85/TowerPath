'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage, formatBig } from '../hooks/useLocalStorage';
import { useRecommendations } from '../hooks/useRecommendations';

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-['Orbitron'] focus:border-[var(--color-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gold-glow)] transition-all";

export function PlannerTab() {
  const [damage, setDamage] = useLocalStorage('towerpath:stats:damage', 12800000);
  const [attackSpeed, setAttackSpeed] = useLocalStorage('towerpath:stats:aspd', 0.85);
  const [coinsPerKill, setCoinsPerKill] = useLocalStorage('towerpath:stats:cpk', 320);
  const [stones, setStones] = useLocalStorage('towerpath:stats:stones', 8420);
  const [coins, setCoins] = useLocalStorage('towerpath:stats:coins', 12000000);
  const [gtCd, setGtCd] = useLocalStorage('towerpath:stats:gtcd', 300);
  const [bhCd, setBhCd] = useLocalStorage('towerpath:stats:bhcd', 300);
  const [focus, setFocus] = useState<'balanced' | 'damage' | 'econ'>('balanced');

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  const { recs: serverRecs, source } = useRecommendations({ damage, attackSpeed, coins, stones, gtCd, bhCd });
  const recs = serverRecs ?? [];

  const affordable = recs.filter((r) =>
    r.currency === 'stones' ? stones >= r.cost : coins >= r.cost
  );
  const ordered = useMemo(() => {
    if (focus === 'damage') return [...recs].sort((a, b) => (b.impact.includes('DPS') ? 1 : 0) - (a.impact.includes('DPS') ? 1 : 0));
    if (focus === 'econ') return [...recs].sort((a, b) => (b.impact.includes('coin') ? 1 : 0) - (a.impact.includes('coin') ? 1 : 0));
    return recs;
  }, [recs, focus]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Damage', value: damage, set: setDamage },
          { label: 'Attack Speed', value: attackSpeed, set: setAttackSpeed },
          { label: 'Coins / Kill', value: coinsPerKill, set: setCoinsPerKill },
          { label: 'Stones', value: stones, set: setStones },
          { label: 'Coins', value: coins, set: setCoins },
          { label: 'GT Cooldown', value: gtCd, set: setGtCd },
          { label: 'BH Cooldown', value: bhCd, set: setBhCd },
        ].map((f, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <label className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-2">
              {f.label}
            </label>
            <input
              type="number"
              min={0}
              value={f.value}
              onChange={(e) => f.set(num(e.target.value, f.value))}
              className="w-full bg-transparent font-['Orbitron'] text-xl font-bold text-[var(--color-text)] focus:outline-none focus:text-[var(--color-gold)] transition-colors"
            />
            <div className="font-['Orbitron'] text-xs font-bold mt-1" style={{ color: 'var(--color-gold)' }}>
              = {formatBig(f.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mr-1">Focus:</span>
        {(['balanced', 'damage', 'econ'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFocus(f)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              focus === f
                ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            {f === 'balanced' ? 'Balanced' : f === 'damage' ? 'Damage' : 'Economy'}
          </button>
        ))}
        <span className="text-xs text-[var(--color-text-muted)] ml-2">
          {affordable.length} of {recs.length} affordable with your current wallet
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Orbitron'] text-lg font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[var(--color-gold-glow)] text-[var(--color-gold)] flex items-center justify-center text-base">◈</span>
              Optimal Upgrade Path
            </h2>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-3 py-1 rounded-full">
              {source === 'server' ? 'Backend engine · live' : 'Local engine · backend offline'}
            </span>
          </div>
          <div className="space-y-2">
            {ordered.map((r, i) => {
              const canAfford = r.currency === 'stones' ? stones >= r.cost : coins >= r.cost;
              return (
                <div
                  key={r.name}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    i === 0
                      ? 'bg-gradient-to-r from-[rgba(240,165,0,0.08)] to-transparent border-l-2 border-[var(--color-gold)]'
                      : 'hover:bg-[var(--color-bg-card-hover)]'
                  } ${canAfford ? '' : 'opacity-60'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] font-bold text-sm bg-[var(--color-gold)] text-[var(--color-bg-deep)]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-[var(--color-text-dim)] mt-0.5">{r.desc}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-teal)' }}>{r.impact}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-['Orbitron'] text-sm font-bold">
                      {r.cost.toLocaleString()} {r.currency === 'stones' ? '◇' : '©'}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${canAfford ? 'text-[var(--color-teal)]' : 'text-[var(--color-red)]'}`}>
                      {canAfford ? 'Affordable' : 'Save up'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
            <h2 className="font-['Orbitron'] text-lg font-bold mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[var(--color-teal-glow)] text-[var(--color-teal)] flex items-center justify-center text-base">⚖</span>
              Damage vs Economy
            </h2>
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Damage focus</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>+18% DPS</span>
              </div>
              <div className="h-2.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold-dim)] to-[var(--color-gold)] transition-all duration-500" style={{ width: '68%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Economy focus</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-teal)' }}>+45% coins/hr</span>
              </div>
              <div className="h-2.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-teal-dim)] to-[var(--color-teal)] transition-all duration-500" style={{ width: '92%' }} />
              </div>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-4 leading-relaxed">
              Rule of thumb from the Effective Paths sheet: sync GT/BH first (it multiplies everything),
              then economy until coin income doubles roughly every 2–3 days, then damage to push waves.
            </p>
          </div>
          <div className="rounded-2xl border border-[rgba(240,165,0,0.3)] bg-gradient-to-br from-[rgba(240,165,0,0.1)] to-[rgba(0,212,170,0.1)] p-6">
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-gold)' }}>💡 Path Recommendation</div>
            <div className="text-xs text-[var(--color-text-dim)] leading-relaxed">
              {gtCd > 150 ? (
                <>Your GT cooldown is <strong style={{ color: 'var(--color-gold)' }}>{gtCd}s — sync is your bottleneck</strong>. Save stones and drop GT straight to 150s in one go to unlock the GT+BH multiplier.</>
              ) : (
                <>GT is synced at <strong style={{ color: 'var(--color-teal)' }}>{gtCd}s</strong>. Push economy (Coins/Kill, GT Bonus) until income stalls, then damage to climb tiers.</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
