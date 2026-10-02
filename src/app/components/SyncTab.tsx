'use client';

import { useMemo, useState } from 'react';
import { calculateGTBHsync, getGTBHRequiredStones } from '../lib/calculation';

export function SyncTab() {
  const [gt, setGt] = useState(300);
  const [bh, setBh] = useState(300);
  const [dw, setDw] = useState(150);
  const [sm, setSm] = useState(150);
  const [mvn, setMvn] = useState<'none' | 'standard' | 'ancestral'>('ancestral');
  const [target, setTarget] = useState(150);

  const sync = useMemo(() => calculateGTBHsync(gt, bh, dw, sm), [gt, bh, dw, sm]);
  const stonesToTarget = useMemo(
    () => (gt > target ? getGTBHRequiredStones(gt, target) : 0),
    [gt, target]
  );
  const gtBhRatio = useMemo(() => (bh > 0 ? gt / bh : 0), [gt, bh]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'GT Cooldown', value: `${gt}s` },
          { label: 'BH Cooldown', value: `${bh}s` },
          { label: 'GT : BH Ratio', value: gtBhRatio > 0 ? `${gtBhRatio.toFixed(2)} : 1` : '—' },
          { label: 'Calculated Sync', value: `${Math.round(sync)}s` },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
            <div className="font-['Orbitron'] text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-5">Input Values</h2>
          {[
            { label: 'Golden Tower Cooldown', value: gt, set: setGt },
            { label: 'Black Hole Cooldown', value: bh, set: setBh },
            { label: 'Death Wave Cooldown', value: dw, set: setDw },
            { label: 'Smart Missiles Cooldown', value: sm, set: setSm },
          ].map((input, i) => (
            <div key={i} className="mb-4">
              <label className="text-xs text-[var(--color-text-muted)] block mb-2">{input.label}</label>
              <input type="number" min={0} value={input.value} onChange={(e) => input.set(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-['Orbitron'] focus:border-[var(--color-gold)] focus:outline-none transition-colors" />
            </div>
          ))}
          <div className="mb-4">
            <label className="text-xs text-[var(--color-text-muted)] block mb-2">Multiverse Nexus</label>
            <select value={mvn} onChange={(e) => setMvn(e.target.value as 'none' | 'standard' | 'ancestral')} className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:border-[var(--color-gold)] focus:outline-none transition-all">
              <option value="none">Not Purchased</option>
              <option value="standard">Standard</option>
              <option value="ancestral">Ancestral (Recommended)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="text-xs text-[var(--color-text-muted)] block mb-2">GT Target Cooldown (for stone estimate)</label>
            <input type="number" min={0} value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-['Orbitron'] focus:border-[var(--color-gold)] focus:outline-none transition-all" />
          </div>
          <button className="w-full mt-2 px-4 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold hover:bg-[#ffc000] transition-all shadow-lg shadow-[var(--color-gold-glow)]">Calculate Sync Time</button>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Optimal Sync Time</div>
            <div className="font-['Orbitron'] text-5xl font-black bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-teal)] bg-clip-text text-transparent">{Math.round(sync)}s</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-3">GT + BH fire every {Math.round(sync)}s simultaneously</div>
          </div>

          <div className="rounded-2xl border border-[rgba(0,212,170,0.3)] bg-[var(--color-teal-glow)] p-6">
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-teal)' }}>💎 Optimization Tip</div>
            <div className="text-xs text-[var(--color-text-dim)] leading-relaxed">
              {stonesToTarget > 0 ? (
                <>
                  Dropping GT from <strong style={{ color: 'var(--color-text)' }}>{gt}s → {target}s</strong> costs roughly{' '}
                  <strong style={{ color: 'var(--color-gold)' }}>{stonesToTarget.toLocaleString()} stones</strong>.
                  Save the full amount and drop it in one go — halfway upgrades desync your economy.
                </>
              ) : (
                <>GT is already at or below your {target}s target — put stones into GT Bonus or BH Duration instead.</>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
            <h3 className="text-sm font-semibold mb-5 uppercase tracking-wider text-[var(--color-text-dim)]">Sync History</h3>
            <div className="space-y-3">
              {[
                { title: 'GT/BH Sync Achieved', desc: 'Oct 25 — 150s sync unlocked with 2,400 stone investment' },
                { title: 'GT/BH/DW Sync', desc: 'Target: 100s — Need 4,800 additional stones' },
                { title: 'Full Perma Sync', desc: 'Target: 50s with MVN Ancestral + all UW CDs minimized' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-bg-card-hover)] transition-all">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[var(--color-teal)]' : 'bg-[var(--color-gold)]'}`} />
                  <div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-[var(--color-text-dim)] mt-1">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}