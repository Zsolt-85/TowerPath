'use client';

import { useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  MECHANICS,
  BH_DURATION_PERK_BONUS,
  effectiveDuration,
  effectiveCooldown,
  uptime,
  activationsPerHour,
  overlapPair,
  prefillFromLevels,
  type UWTimeRow,
} from '../lib/uwtime';

const ORDER = Object.keys(MECHANICS);
const fullRow = (p?: Partial<UWTimeRow>): UWTimeRow => ({
  duration: p?.duration ?? 0,
  runBonus: p?.runBonus ?? 0,
  cooldown: p?.cooldown ?? 0,
  extraCd: p?.extraCd ?? 0,
  cdMult: p?.cdMult ?? 1,
});

function readLevels(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem('towerpath:uw:levels');
    const obj = raw != null ? (JSON.parse(raw) as unknown) : null;
    if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const out: Record<string, Record<string, number>> = {};
    for (const [uw, tracks] of Object.entries(obj as Record<string, unknown>)) {
      if (tracks == null || typeof tracks !== 'object' || Array.isArray(tracks)) continue;
      const clean: Record<string, number> = {};
      for (const [t, v] of Object.entries(tracks as Record<string, unknown>)) {
        if (typeof v === 'number' && Number.isFinite(v)) clean[t] = v;
      }
      out[uw] = clean;
    }
    return out;
  } catch {
    return {};
  }
}

export function UWTimeTab() {
  const [setup, setSetup] = useLocalStorage<Record<string, UWTimeRow>>('towerpath:uwtime:setup', {});
  const [target, setTarget] = useLocalStorage<Record<string, UWTimeRow>>('towerpath:uwtime:target', {});
  const [bhPerk, setBhPerk] = useLocalStorage('towerpath:uwtime:bhperk', true);

  const rowOf = (store: Record<string, UWTimeRow>, uw: string): UWTimeRow =>
    fullRow(store[uw]);
  const withBh = (r: UWTimeRow, uw: string): UWTimeRow =>
    uw === 'Black Hole' && bhPerk ? { ...r, duration: r.duration + BH_DURATION_PERK_BONUS } : r;

  const gt = withBh(rowOf(setup, 'Golden Tower'), 'Golden Tower');
  const bh = withBh(rowOf(setup, 'Black Hole'), 'Black Hole');
  const curOverlap = overlapPair(
    { dur: effectiveDuration(gt), cd: effectiveCooldown(gt) },
    { dur: effectiveDuration(bh), cd: effectiveCooldown(bh) },
  );
  const tgt = useMemo(() => {
    const g = withBh(rowOf(target, 'Golden Tower'), 'Golden Tower');
    const b = withBh(rowOf(target, 'Black Hole'), 'Black Hole');
    return overlapPair(
      { dur: effectiveDuration(g), cd: effectiveCooldown(g) },
      { dur: effectiveDuration(b), cd: effectiveCooldown(b) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, bhPerk]);
  const timedRows = ORDER.filter((uw) => MECHANICS[uw] === 'Timed');
  const avgUp = (store: Record<string, UWTimeRow>) => {
    const ups = timedRows
      .map((uw) => uptime('Timed', withBh(rowOf(store, uw), uw)))
      .filter((u): u is number => u != null);
    return ups.length > 0 ? ups.reduce((a, b) => a + b, 0) / ups.length : 0;
  };

  const setCell = (
    store: 'setup' | 'target',
    uw: string,
    key: keyof UWTimeRow,
    v: number,
  ) => {
    const set = store === 'setup' ? setSetup : setTarget;
    set((prev) => ({ ...prev, [uw]: { ...fullRow(prev[uw]), [key]: v } }));
  };

  const prefill = () => {
    const filled = prefillFromLevels(readLevels());
    setSetup((prev) => {
      const next: Record<string, UWTimeRow> = { ...prev };
      for (const [uw, part] of Object.entries(filled)) {
        next[uw] = { ...fullRow(prev[uw]), ...part };
      }
      return next;
    });
  };

  const numProps = (v: number) => ({
    type: 'number' as const,
    min: 0,
    value: v,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">GT×BH overlap now</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{(curOverlap * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">GT×BH overlap target</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{(tgt * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Avg timed uptime</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{(avgUp(setup) * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">BH +12s perk</div>
          <button
            onClick={() => setBhPerk(!bhPerk)}
            className={`mt-2 text-xs font-bold px-4 py-2 rounded-lg border transition-all ${bhPerk ? 'border-[var(--color-teal)] text-[var(--color-teal)] bg-[var(--color-teal-glow)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)]'}`}
          >
            {bhPerk ? '✓ On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-['Orbitron'] text-lg font-bold">Current setup</h2>
          <button onClick={prefill} className="text-xs text-[var(--color-gold)] border border-[var(--color-gold-dim)] rounded-lg px-3 py-1 hover:bg-[var(--color-gold-glow)]">
            Prefill from UW planner levels
          </button>
        </div>
        <div className="space-y-2">
          {ORDER.map((uw) => {
            const r = rowOf(setup, uw);
            const mech = MECHANICS[uw];
            const up = uptime(mech, withBh(r, uw));
            const act = activationsPerHour(withBh(r, uw));
            return (
              <div key={uw} className="grid grid-cols-[1fr_auto] lg:grid-cols-[180px_repeat(5,90px)_1fr] gap-2 items-center rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">
                <div className="font-bold truncate">{uw} <span className="text-[10px] uppercase text-[var(--color-text-muted)]">{mech}</span></div>
                {(['duration', 'runBonus', 'cooldown', 'extraCd', 'cdMult'] as (keyof UWTimeRow)[]).map((k) => (
                  <input
                    key={k}
                    {...numProps(r[k])}
                    step={k === 'cdMult' ? 0.01 : 1}
                    title={k}
                    onChange={(e) => setCell('setup', uw, k, Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm"
                  />
                ))}
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  {up != null ? `up ${(up * 100).toFixed(1)}%` : mech}
                  {act != null && ` · ${act.toFixed(1)}/h`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Target scenario (duration + cooldown)</h2>
        <div className="space-y-2">
          {ORDER.map((uw) => {
            const r = rowOf(target, uw);
            return (
              <div key={uw} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">
                <div className="font-bold truncate">{uw}</div>
                <input {...numProps(r.duration)} title="Target duration" onChange={(e) => setCell('target', uw, 'duration', Math.max(0, Number(e.target.value) || 0))} className="w-24 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm" />
                <input {...numProps(r.cooldown)} title="Target cooldown" onChange={(e) => setCell('target', uw, 'cooldown', Math.max(0, Number(e.target.value) || 0))} className="w-24 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm" />
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Uptime = duration ÷ cooldown (Timed only); activations = 3600 ÷ cooldown. Coin modeling is
        out of scope — compare overlaps, then plan stones in the UW tab.
      </p>
    </div>
  );
}
