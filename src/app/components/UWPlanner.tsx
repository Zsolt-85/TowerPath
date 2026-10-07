'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ULTIMATE_WEAPON_NAMES } from '../data/ultimate-weapons-data';
import {
  trackDefs,
  nextBuy,
  plusNext,
  buildQueue,
  syncJumps,
  type UWLevels,
} from '../lib/uw';

export function UWPlanner() {
  const [unlocked] = useLocalStorage<Record<string, boolean>>('towerpath:uw:unlocked', {});
  const [levels, setLevels] = useLocalStorage<UWLevels>('towerpath:uw:levels', {});
  const [plus, setPlus] = useLocalStorage<Record<string, number>>('towerpath:uw:plus', {});
  const [stones, setStones] = useLocalStorage('towerpath:uw:stones', 0);
  const [openUw, setOpenUw] = useState<string | null>(null);

  const names = [...(ULTIMATE_WEAPON_NAMES as readonly string[])];
  const owned = names.filter((n) => unlocked[n]);
  const queue = useMemo(
    () => buildQueue(levels, plus, unlocked, owned.length),
    [levels, plus, unlocked, owned.length],
  );
  const sync = useMemo(() => syncJumps(levels), [levels]);
  let running = 0;

  const bump = (uw: string, track: string, delta: number) =>
    setLevels((prev) => {
      const max = trackDefs(uw).find((d) => d.name === track)?.values.length ?? 1;
      const cur = prev[uw]?.[track] ?? 0;
      const next = Math.max(0, Math.min(max - 1, cur + delta));
      return { ...prev, [uw]: { ...prev[uw], [track]: next } };
    });
  const applyQueue = (uw: string, track: string | null) => {
    if (!track) return;
    bump(uw, track, 1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Stone wallet</div>
          <input
            type="number"
            min={0}
            value={stones}
            onChange={(e) => setStones(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold"
          />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Trio sync</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">
            {sync ? `${sync.target}s for ${sync.total.toLocaleString()}◇` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Queued cost</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">
            {queue.reduce((m, q) => m + q.cost, 0).toLocaleString()}◇
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">UWs owned</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{owned.length}/{names.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Spending queue</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Sync jumps first, then wiki-priority order. Click ✓ to apply a buy to your owned levels.
        </p>
        <div className="space-y-2">
          {queue.slice(0, 12).map((q, i) => {
            running += q.cost;
            const afford = q.cost <= stones;
            return (
              <div key={`${q.uw}-${q.track}-${i}`} className="flex items-center gap-3 text-sm rounded-xl border border-[var(--color-border)] px-4 py-3">
                <span className="font-['Orbitron'] font-bold text-[var(--color-gold)] w-8">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">
                    {q.uw}{q.track ? ` · ${q.track}` : ''} <span className="text-[var(--color-text-muted)]">{q.from} → {q.to}</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">{q.reason}</div>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">Σ {running.toLocaleString()}◇</span>
                <span className={`font-['Orbitron'] font-bold whitespace-nowrap ${afford ? 'text-[var(--color-teal)]' : 'text-[var(--color-gold)]'}`}>
                  {q.cost.toLocaleString()}◇
                </span>
                {q.track && q.kind !== 'unlock' && (
                  <button onClick={() => applyQueue(q.uw, q.track)} title="Apply this buy" className="text-xs border border-[var(--color-gold-dim)] text-[var(--color-gold)] rounded-lg px-2 py-1 hover:bg-[var(--color-gold-glow)]">
                    ✓
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {names.filter((n) => unlocked[n]).map((uw) => (
        <div key={uw} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <button onClick={() => setOpenUw((v) => (v === uw ? null : uw))} className="w-full flex items-center justify-between">
            <h3 className="font-['Orbitron'] text-base font-bold">{uw}</h3>
            <span className="text-xs text-[var(--color-text-muted)]">{openUw === uw ? '▾' : '▸'}</span>
          </button>
          {openUw === uw && (
            <div className="space-y-2 mt-4">
              {trackDefs(uw).map((d) => {
                const lvl = levels[uw]?.[d.name] ?? 0;
                const nb = nextBuy(uw, d.name, lvl);
                const cur = d.values[Math.min(lvl, d.values.length - 1)];
                return (
                  <div key={d.name} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_90px] gap-3 items-center rounded-xl border border-[var(--color-border)] px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{d.name}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {d.format(cur.value)}{nb && !nb.maxed ? <> → {d.format(nb.value)} · {nb.cost.toLocaleString()}◇</> : ' · MAX'}
                      </div>
                    </div>
                    <div className="hidden sm:block text-[11px] text-[var(--color-text-muted)] text-center">Lv {lvl}/{d.values.length - 1}</div>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => bump(uw, d.name, -1)} className="w-8 h-8 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-all">−</button>
                      <button onClick={() => bump(uw, d.name, 1)} className="w-8 h-8 rounded-lg border border-[var(--color-gold-dim)] text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)] transition-all">+</button>
                    </div>
                  </div>
                );
              })}
              {(() => {
                const pb = plusNext(uw, plus[uw] ?? 0);
                if (!pb) return null;
                return (
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-xl border border-dashed border-[var(--color-border-light)] px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{pb.name} <span className="text-[10px] uppercase text-[var(--color-text-muted)]">enhancement</span></div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {pb.maxed ? 'MAX' : `+${pb.level} → +${pb.level + 1} · ${pb.cost.toLocaleString()}◇`}
                      </div>
                    </div>
                    {!pb.maxed && (
                      <button onClick={() => setPlus((prev) => ({ ...prev, [uw]: (prev[uw] ?? 0) + 1 }))} className="w-8 h-8 rounded-lg border border-[var(--color-gold-dim)] text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)] transition-all">+</button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Costs come straight from the in-game upgrade tables. Sync guidance: keep Black Hole at 200s,
        buy GT/BH/DW cooldowns only as one-go jumps — incremental cuts desync the trio for months of
        lost coins. Multiverse Nexus averages the trio as a fallback (Epic +20 / Legendary +10 /
        Mythic +1 / Ancestral −10).
      </p>
    </div>
  );
}
