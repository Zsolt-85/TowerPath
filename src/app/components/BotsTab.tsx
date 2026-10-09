'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { buildRoutes, effectiveCooldown, uptime, overlap3, type GBSetup } from '../lib/bots';

interface Pkg {
  label: string;
  cooldown: number;
  medalCost: number;
}

const DEFAULTS: GBSetup & { medalBudget: number } = {
  duration: 27.5,
  baseCooldown: 117,
  bonus: 4.8,
  range: 50,
  labLevel: 5,
  labReduction: 1,
  gtDur: 41,
  gtCd: 160,
  bhDur: 42,
  bhCd: 80,
  medalBudget: 540,
};

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function BotsTab() {
  const [setup, setSetup] = useLocalStorage<GBSetup & { medalBudget: number }>('towerpath:bots:setup', DEFAULTS);
  const [packages, setPackages] = useLocalStorage<Pkg[]>('towerpath:bots:packages', []);
  const [note, setNote] = useLocalStorage('towerpath:bots:note', 'Validate three comparable farm runs after timing changes.');
  const [pLabel, setPLabel] = useState('');
  const [pCd, setPCd] = useState('');
  const [pCost, setPCost] = useState('');

  const set = (k: keyof typeof DEFAULTS, v: number, min: number, max: number) =>
    setSetup((prev) => ({ ...prev, [k]: Math.max(min, Math.min(max, v)) }));
  const cd = effectiveCooldown(setup.baseCooldown, setup.labLevel, setup.labReduction);
  const up = uptime(setup.duration, cd);
  const fourWay = overlap3(
    { dur: setup.duration, cd },
    { dur: setup.bhDur, cd: setup.bhCd },
    { dur: setup.gtDur, cd: setup.gtCd },
  );
  const labs = useMemo(() => {
    const arr: number[] = [];
    for (let l = Math.max(0, Math.floor(setup.labLevel)); l <= 25; l += 1) arr.push(l);
    return arr;
  }, [setup.labLevel]);
  const routes = useMemo(() => buildRoutes(setup, labs, packages), [setup, labs, packages]);
  const packTotal = packages.reduce((m, p) => m + p.medalCost, 0);

  const fields: { key: keyof typeof DEFAULTS; label: string; min: number; max: number; step: number }[] = [
    { key: 'duration', label: 'GB duration (s)', min: 1, max: 120, step: 0.5 },
    { key: 'baseCooldown', label: 'GB base cooldown (s)', min: 10, max: 300, step: 1 },
    { key: 'bonus', label: 'GB bonus (×)', min: 0.1, max: 50, step: 0.1 },
    { key: 'range', label: 'GB range (m)', min: 1, max: 200, step: 1 },
    { key: 'labLevel', label: 'Cooldown lab level', min: 0, max: 25, step: 1 },
    { key: 'labReduction', label: 'Reduction / lab (s)', min: 0, max: 5, step: 0.5 },
    { key: 'gtDur', label: 'GT duration (s)', min: 1, max: 120, step: 1 },
    { key: 'gtCd', label: 'GT cooldown (s)', min: 10, max: 600, step: 1 },
    { key: 'bhDur', label: 'BH duration (s)', min: 1, max: 120, step: 1 },
    { key: 'bhCd', label: 'BH cooldown (s)', min: 10, max: 600, step: 1 },
    { key: 'medalBudget', label: 'Medal budget', min: 0, max: 100000, step: 10 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Effective cooldown</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{cd}s</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">GB uptime</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{(up * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Four-way overlap</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{(fourWay * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Medals: packages / budget</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{packTotal}/{setup.medalBudget}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Setup</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">{f.label}</label>
              <input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={setup[f.key]}
                onChange={(e) => set(f.key, num(e.target.value, DEFAULTS[f.key]), f.min, f.max)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <label className="text-[11px] text-[var(--color-text-muted)] block mt-4 mb-1">Decision note</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 200))}
          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Cooldown routes</h2>
        <div className="space-y-2">
          {routes.map((r, i) => (
            <div key={`${r.label}-${i}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.2fr_repeat(6,auto)] gap-3 items-center rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">
              <div className="min-w-0">
                <span className="font-bold">{r.label}</span>{' '}
                <span className="text-[var(--color-text-muted)]">{r.cooldown}s</span>
                {r.checkpoint != null && (
                  <span className="ml-2 text-[10px] font-bold uppercase text-[var(--color-gold)]">◆ {r.checkpoint}s</span>
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)]">up {(r.uptime * 100).toFixed(1)}%</span>
              <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">×BH {(r.gbWithBh * 100).toFixed(1)}%</span>
              <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">×GT {(r.gbWithGt * 100).toFixed(1)}%</span>
              <span className="font-bold hidden sm:inline">{(r.fourWay * 100).toFixed(1)}%</span>
              <span className={`text-[11px] font-bold hidden sm:inline ${r.gainVsCurrent != null && r.gainVsCurrent >= 0 ? 'text-[var(--color-teal)]' : 'text-[var(--color-red)]'}`}>
                {r.gainVsCurrent != null ? `${r.gainVsCurrent >= 0 ? '+' : ''}${(r.gainVsCurrent * 100).toFixed(1)}%` : '—'}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{r.medalCost > 0 ? `${r.medalCost}🏅` : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Medal packages</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <input value={pLabel} onChange={(e) => setPLabel(e.target.value.slice(0, 40))} placeholder="Label" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          <input type="number" min={1} value={pCd} onChange={(e) => setPCd(e.target.value)} placeholder="Cooldown" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          <input type="number" min={0} value={pCost} onChange={(e) => setPCost(e.target.value)} placeholder="Medals" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          <button
            onClick={() => {
              const cdv = Math.max(1, Math.floor(num(pCd, 0)));
              if (!pLabel.trim() || cdv <= 0) return;
              setPackages((prev) => [...prev, { label: pLabel.trim(), cooldown: cdv, medalCost: Math.max(0, Math.floor(num(pCost, 0))) }]);
              setPLabel('');
              setPCd('');
              setPCost('');
            }}
            className="text-xs border border-[var(--color-gold-dim)] text-[var(--color-gold)] rounded-lg px-3 py-2 hover:bg-[var(--color-gold-glow)]"
          >
            ＋ Add
          </button>
        </div>
        <div className="space-y-2">
          {packages.map((p, i) => (
            <div key={`${p.label}-${i}`} className="flex items-center gap-3 text-sm">
              <span className="flex-1 font-bold">{p.label} <span className="text-[var(--color-text-muted)]">{p.cooldown}s · {p.medalCost}🏅</span></span>
              <button onClick={() => setPackages((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] px-2 py-1">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
