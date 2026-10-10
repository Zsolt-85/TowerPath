'use client';

import { useMemo, useState } from 'react';
import { useRuns, useLocalStorage } from '../hooks/useLocalStorage';
import {
  DIS_CATS,
  DIS_TIERS,
  boostFor,
  gapToCap,
  recordsFromRuns,
  bestOf,
  buildQueue,
  type DisCat,
  type DisOverride,
} from '../lib/dissonance';

const DEFAULT_ECHO: Record<DisCat, number> = { Attack: 0.005, UW: 0.005, Defense: 0.005, Utility: 0.005 };

export function DissonanceTab() {
  const [runs] = useRuns();
  const [echo, setEcho] = useLocalStorage<Record<DisCat, number>>('towerpath:dissonance:echo', DEFAULT_ECHO);
  const [overrides, setOverrides] = useLocalStorage<DisOverride[]>('towerpath:dissonance:overrides', []);
  const [oTier, setOTier] = useState('1');
  const [oCat, setOCat] = useState<DisCat>('Attack');
  const [oWave, setOWave] = useState('');

  const fromRuns = useMemo(() => recordsFromRuns(runs), [runs]);
  const queue = useMemo(() => buildQueue(fromRuns, overrides), [fromRuns, overrides]);
  const donePairs = 100 - queue.length;
  const frontier = queue.length > 0 ? queue[0].tier : null;
  const disRuns = runs.filter((r) => r.runType === 'dissonance').length;
  const tiersWithRecords = useMemo(() => {
    const set = new Set<number>();
    for (const tier of DIS_TIERS) {
      for (const cat of DIS_CATS) {
        if (bestOf(tier, cat, fromRuns, overrides) > 0) set.add(tier);
      }
    }
    return [...set].sort((a, b) => a - b);
  }, [fromRuns, overrides]);

  const setEchoCat = (cat: DisCat, v: number) => {
    const n = Number(v);
    setEcho((prev) => ({ ...prev, [cat]: Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : (prev[cat] ?? 0.005) }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Completed pairs</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{donePairs}/100</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Active frontier</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{frontier != null ? `T${frontier}` : 'Done'}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Dissonance runs</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{disRuns}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Queue length</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{queue.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Run queue — lowest unfinished first</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Within a tier: Attack → UW → Defense → Utility.</p>
        <div className="space-y-2">
          {queue.slice(0, 20).map((q, i) => (
            <div key={`${q.tier}-${q.cat}`} className={`flex items-center gap-3 text-sm rounded-xl border px-4 py-3 ${i === 0 ? 'border-[var(--color-gold)] bg-[var(--color-gold-glow)]' : 'border-[var(--color-border)]'}`}>
              <span className="font-['Orbitron'] font-bold text-[var(--color-gold)] w-8">#{i + 1}</span>
              <span className="font-bold flex-1">T{q.tier} {q.cat}</span>
              <span className="text-[var(--color-text-muted)]">best {q.best.toLocaleString()} · gap {q.gap.toLocaleString()}</span>
            </div>
          ))}
          {queue.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">All 100 records complete.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Record matrix</h2>
        <div className="space-y-3">
          {tiersWithRecords.map((tier) => (
            <div key={tier} className="grid grid-cols-[52px_repeat(4,1fr)] gap-2 items-center text-sm">
              <span className="font-['Orbitron'] font-bold">T{tier}</span>
              {DIS_CATS.map((cat) => {
                const best = bestOf(tier, cat, fromRuns, overrides);
                return (
                  <div key={cat} className="rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-center">
                    <div className="text-[10px] uppercase text-[var(--color-text-muted)]">{cat}</div>
                    <div className="font-bold">{best > 0 ? best.toLocaleString() : '—'}</div>
                    <div className="text-[10px] text-[var(--color-teal)]">{best > 0 ? `${boostFor(cat, best).toFixed(2)}x` : ''}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {tiersWithRecords.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No records yet — log dissonance runs or add overrides below.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Echo rates</h2>
          <div className="grid grid-cols-2 gap-3">
            {DIS_CATS.map((cat) => (
              <div key={cat}>
                <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">{cat}</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.001}
                  value={echo[cat] ?? 0.005}
                  onChange={(e) => setEchoCat(cat, Number(e.target.value))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-3">Boosts use best wave only; echo rates are recorded for reference.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Historical overrides</h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <input type="number" min={1} max={25} value={oTier} onChange={(e) => setOTier(e.target.value)} placeholder="Tier" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            <select value={oCat} onChange={(e) => setOCat(e.target.value as DisCat)} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              {DIS_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={1} value={oWave} onChange={(e) => setOWave(e.target.value)} placeholder="Wave" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            <button
              onClick={() => {
                const tier = Math.max(1, Math.min(25, Math.floor(Number(oTier) || 0)));
                const wave = Math.max(1, Math.floor(Number(oWave) || 0));
                if (tier < 1 || wave < 1) return;
                setOverrides((prev) => [...prev, { tier, cat: oCat, wave }]);
                setOWave('');
              }}
              className="text-xs border border-[var(--color-gold-dim)] text-[var(--color-gold)] rounded-lg px-3 py-2 hover:bg-[var(--color-gold-glow)]"
            >
              ＋ Add
            </button>
          </div>
          <div className="space-y-1">
            {overrides.map((o, i) => (
              <div key={`${o.tier}-${o.cat}-${i}`} className="flex items-center gap-3 text-sm">
                <span className="flex-1">T{o.tier} {o.cat} · {o.wave.toLocaleString()} (gap {gapToCap(o.wave).toLocaleString()})</span>
                <button onClick={() => setOverrides((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] px-2 py-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
