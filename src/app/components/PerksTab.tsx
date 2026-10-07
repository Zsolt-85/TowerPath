'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { computeOdds } from '../lib/perks';

export function PerksTab() {
  const [levels, setLevels] = useLocalStorage<Record<string, number>>('towerpath:perks:levels', {});
  const [banned, setBanned] = useLocalStorage<string[]>('towerpath:perks:banned', []);
  const [options, setOptions] = useLocalStorage('towerpath:perks:options', 3);
  const [intervalWaves, setIntervalWaves] = useLocalStorage('towerpath:perks:interval', 200);
  const [uwUnlocked] = useLocalStorage<Record<string, boolean>>('towerpath:uw:unlocked', {});
  const [target, setTarget] = useState('DAMAGE');
  const [catFilter, setCatFilter] = useState<'ALL' | 'STANDARD' | 'ULTIMATE' | 'TRADEOFF'>('ALL');

  const ownedUWs = useMemo(() => Object.keys(uwUnlocked).filter((k) => uwUnlocked[k]), [uwUnlocked]);
  const odds = useMemo(
    () =>
      computeOdds({
        options,
        intervalWaves,
        banned,
        levels,
        ownedUWs,
      }),
    [options, intervalWaves, banned, levels, ownedUWs],
  );
  const visible = odds
    .filter((o) => (catFilter === 'ALL' ? true : o.category === catFilter))
    .sort((a, b) => b.pPerChoice - a.pPerChoice);
  const targetOdds = odds.find((o) => o.name === target);

  const toggleBan = (name: string) =>
    setBanned((prev) => (prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]));
  const setLevel = (name: string, v: number, max: number) =>
    setLevels((prev) => ({ ...prev, [name]: Math.max(0, Math.min(max, Math.floor(v) || 0)) }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Options / choice</div>
          <input type="number" min={1} max={9} value={options} onChange={(e) => setOptions(Math.max(1, Math.min(9, Math.floor(Number(e.target.value) || 1))))} className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold" />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Waves / choice</div>
          <input type="number" min={10} value={intervalWaves} onChange={(e) => setIntervalWaves(Math.max(10, Math.floor(Number(e.target.value) || 200)))} className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold" />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Banned</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{banned.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Target perk</div>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
            {odds.map((o) => (
              <option key={o.name} value={o.name}>{o.name}</option>
            ))}
          </select>
          <div className="text-[11px] text-[var(--color-gold)] mt-1">
            {targetOdds && targetOdds.pPerChoice > 0
              ? `${(targetOdds.pPerChoice * 100).toFixed(1)}%/choice · 50% in ~${targetOdds.wavesTo50?.toLocaleString() ?? '—'} waves`
              : 'unavailable (banned/maxed/locked)'}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'STANDARD', 'ULTIMATE', 'TRADEOFF'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              catFilter === c
                ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <div className="space-y-2">
          {visible.map((o) => (
            <div key={o.name} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_90px_90px_110px_90px] gap-3 items-center rounded-xl border border-[var(--color-border)] px-4 py-3">
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">
                  {o.name}{' '}
                  <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{o.category}</span>
                </div>
                <div className="text-[11px] text-[var(--color-gold)]">
                  {(o.pPerChoice * 100).toFixed(1)}%/choice
                  {o.wavesTo50 != null && <> · 50% in ~{o.wavesTo50.toLocaleString()} waves</>}
                </div>
              </div>
              <input type="number" min={0} max={o.maxLevel} value={o.level} onChange={(e) => setLevel(o.name, Number(e.target.value), o.maxLevel)} title="Current level" className="w-[90px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
              <span className="text-[11px] text-[var(--color-text-muted)] text-center hidden sm:block">max {o.maxLevel}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded text-center hidden sm:block ${o.unavailable ? 'text-[var(--color-text-dim)]' : o.maxed || o.banned ? 'bg-[var(--color-border)] text-[var(--color-text-dim)]' : 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]'}`}>
                {o.unavailable ? 'Locked UW' : o.maxed ? 'Maxed' : o.banned ? 'Banned' : 'Live'}
              </span>
              <button onClick={() => toggleBan(o.name)} className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-2 hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-all">
                {o.banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Odds assume equal weights within a category among eligible perks; the true game weights are
        unknown. Standard/Ultimate/Tradeoff chances are 65/20/15. Edit waves-per-choice to match your game.
      </p>
    </div>
  );
}
