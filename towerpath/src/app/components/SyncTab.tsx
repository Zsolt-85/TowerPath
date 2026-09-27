'use client';

import { useMemo, useState } from 'react';
import { ULTIMATE_WEAPONS } from '../data/ultimate-weapons-data';
import { calculateGTBHsync, getGTBHRequiredStones } from '../lib/calculation';

function baseCooldown(uwName: string): number {
  const uw = (ULTIMATE_WEAPONS as Record<string, any>)[uwName];
  const cd = uw?.upgrades?.Cooldown?.values?.[0]?.value;
  return typeof cd === 'number' ? cd : 150;
}

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-['Orbitron'] focus:border-[var(--color-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gold-glow)] transition-all";

export function SyncTab() {
  const [gt, setGt] = useState(baseCooldown('Golden Tower'));
  const [bh, setBh] = useState(baseCooldown('Black Hole'));
  const [dw, setDw] = useState(baseCooldown('Death Wave'));
  const [sm, setSm] = useState(baseCooldown('Smart Missiles'));
  const [mvn, setMvn] = useState<'none' | 'standard' | 'ancestral'>('ancestral');
  const [target, setTarget] = useState(150);

  const sync = useMemo(() => calculateGTBHsync(gt, bh, dw, sm), [gt, bh, dw, sm]);
  const stonesToTarget = useMemo(
    () => (gt > target ? getGTBHRequiredStones(gt, target) : 0),
    [gt, target]
  );
  const gtBhRatio = useMemo(() => (bh > 0 ? gt / bh : 0), [gt, bh]);

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'GT Cooldown', value: `${gt}s` },
          { label: 'BH Cooldown', value: `${bh}s` },
          { label: 'GT : BH ratio', value: gtBhRatio ? `${gtBhRatio.toFixed(2)} : 1` : '—' },
          { label: 'MVN Sync', value: mvn === 'none' ? 'off' : `${Math.round(sync)}s` },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
            <div className="font-['Orbitron'] text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-6">Your Cooldowns</h2>
          {[
            { label: 'Golden Tower Cooldown (s)', value: gt, set: setGt },
            { label: 'Black Hole Cooldown (s)', value: bh, set: setBh },
            { label: 'Death Wave Cooldown (s)', value: dw, set: setDw },
            { label: 'Smart Missiles Cooldown (s)', value: sm, set: setSm },
          ].map((f, i) => (
            <div key={i} className="mb-4">
              <label className="text-xs text-[var(--color-text-muted)] block mb-2">{f.label}</label>
              <input
                type="number"
                min={0}
                value={f.value}
                onChange={(e) => f.set(num(e.target.value, f.value))}
                className={inputCls}
              />
            </div>
          ))}
          <div className="mb-2">
            <label className="text-xs text-[var(--color-text-muted)] block mb-2">Multiverse Nexus</label>
            <select
              value={mvn}
              onChange={(e) => setMvn(e.target.value as typeof mvn)}
              className={inputCls}
            >
              <option value="none">Not purchased</option>
              <option value="standard">Standard</option>
              <option value="ancestral">Ancestral (recommended)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-2">
              GT target cooldown (s) — for stone estimate
            </label>
            <input
              type="number"
              min={0}
              value={target}
              onChange={(e) => setTarget(num(e.target.value, target))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              {mvn === 'none' ? 'No forced sync (MVN not purchased)' : 'MVN Sync Time'}
            </div>
            {mvn === 'none' ? (
              <>
                <div className="font-['Orbitron'] text-2xl font-black text-[var(--color-text)]">
                  GT {gt}s · BH {bh}s
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-3">
                  Without MVN each weapon fires on its own timer. Aim for a GT:BH ratio of 2:1
                  (e.g. 300s GT with 150s BH) so every second BH lines up with GT.
                </div>
              </>
            ) : (
              <>
                <div className="font-['Orbitron'] text-5xl font-black bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-teal)] bg-clip-text text-transparent">
                  {Math.round(sync)}s
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-3">
                  GT + BH + DW + SM averaged by MVN — all fire together every {Math.round(sync)}s
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-gold)' }}>
              ◈ Stone estimate
            </div>
            <div className="text-xs text-[var(--color-text-dim)] leading-relaxed">
              {stonesToTarget > 0 ? (
                <>
                  Bringing GT from <strong style={{ color: 'var(--color-text)' }}>{gt}s → {target}s</strong> costs
                  roughly <strong style={{ color: 'var(--color-gold)' }}>{stonesToTarget.toLocaleString()} stones</strong>.
                  Never upgrade GT cooldown halfway — save up and drop it to the sync target in one go, or you desync your economy for weeks.
                </>
              ) : (
                <>GT is already at or below your {target}s target — no stones needed. Put them into GT Bonus or BH Duration instead.</>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(0,212,170,0.3)] bg-[var(--color-teal-glow)] p-6">
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-teal)' }}>💎 Optimization Tip</div>
            <div className="text-xs text-[var(--color-text-dim)] leading-relaxed">
              Cooldown upgrades are the most expensive stones in the game per second saved. Duration and Bonus
              first, cooldown last — except the single drop that completes a sync, which multiplies your whole economy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
