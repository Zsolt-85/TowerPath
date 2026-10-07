'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage, formatBig } from '../hooks/useLocalStorage';
import { ALL_LABS, labsDurationMap } from '../data/labs-data';
import { labLevelSeconds, maxLevelFor, slotEtaDays, labGroupOf } from '../lib/labs';

const SLOT_COUNT = 5;
const STORE_KEY = 'towerpath:lab-planner-v2';
const GLOBAL_KEY = 'towerpath:lab-speed-global';

interface SlotState {
  lab: string;
  current: number;
  target: number;
  speed: number;
}

interface Suggestion {
  lab: string;
  reason: string;
  hours: number;
  score: number;
}

const DEFAULT_SLOTS: SlotState[] = [
  { lab: 'Lab Speed', current: 0, target: 10, speed: 1 },
  { lab: 'Game Speed', current: 0, target: 5, speed: 1 },
  { lab: 'Coins / Kill Bonus', current: 0, target: 20, speed: 1 },
  { lab: 'Labs Coin Discount', current: 0, target: 20, speed: 1 },
  { lab: 'Damage', current: 0, target: 20, speed: 1 },
];

const PRIORITY_WEIGHT: Record<string, number> = {
  'Lab Speed': 100,
  'Game Speed': 95,
  'Labs Coin Discount': 90,
  'Coins / Kill Bonus': 80,
  'Coins / Wave': 78,
  'Cash Bonus': 70,
  'Cash / Wave': 68,
  'Starting Cash': 65,
  Damage: 60,
  'Attack Speed': 60,
  Health: 58,
  'Defense %': 55,
  'Critical Factor': 52,
  Range: 50,
};

function weightFor(lab: string, current: number): number {
  const base = PRIORITY_WEIGHT[lab] ?? (labGroupOf(lab) === 'Main Labs' ? 60 : 45);
  const catchUp = current < 10 ? 1.4 : current < 30 ? 1.15 : 1;
  return base * catchUp;
}

function formatHours(h: number): string {
  if (!isFinite(h)) return '—';
  if (h <= 0) return 'Done';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${Math.round(h * 10) / 10}h`;
  const d = Math.floor(h / 24);
  const rh = Math.round(h % 24);
  return `${d}d ${rh}h`;
}

function buildSuggestions(
  slots: SlotState[],
  globalSpeed: number,
  excludeLab: string,
  activeLabs: string[],
): Suggestion[] {
  const pool = (ALL_LABS as readonly string[]).filter((l) => l !== excludeLab && !activeLabs.includes(l));
  const scored: Suggestion[] = pool.map((lab) => {
    const max = maxLevelFor(lab);
    const assumedCurrent = 0;
    const assumedTarget = Math.min(max, lab === 'Game Speed' ? 5 : 20);
    const eff = Math.max(0.1, globalSpeed);
    const hours = slotEtaDays(lab, assumedCurrent, assumedTarget, eff) * 24;
    const w = weightFor(lab, assumedCurrent);
    const score = w / (hours + 0.5);
    return { lab, hours, score, reason: '' };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => ({
    ...s,
    reason: `${labGroupOf(s.lab)} · ~${formatHours(s.hours)} to Lv${s.lab === 'Game Speed' ? 5 : 20} · weight ${Math.round(weightFor(s.lab, 0))}`,
  }));
}

export function LabPlannerTab() {
  const [slots, setSlots] = useLocalStorage<SlotState[]>(STORE_KEY, DEFAULT_SLOTS);
  const [globalSpeed, setGlobalSpeed] = useLocalStorage<number>(GLOBAL_KEY, 1);
  const [showAll, setShowAll] = useState(false);

  const safeSlots: SlotState[] = useMemo(() => {
    const arr = Array.isArray(slots) && slots.length === SLOT_COUNT ? slots : DEFAULT_SLOTS;
    return arr.map((s, i) => ({
      lab: typeof s.lab === 'string' && (ALL_LABS as readonly string[]).includes(s.lab)
        ? s.lab
        : DEFAULT_SLOTS[i].lab,
      current: Math.max(0, Number(s.current) || 0),
      target: Math.max(0, Number(s.target) || 0),
      speed: Math.min(10, Math.max(0.1, Number(s.speed) || 1)),
    }));
  }, [slots]);

  const analysis = useMemo(() => {
    const activeLabs = safeSlots.map((s) => s.lab);
    return safeSlots.map((s, idx) => {
      const max = maxLevelFor(s.lab);
      const target = Math.min(Math.max(s.current, s.target), max);
      const eff = Math.max(0.1, globalSpeed * s.speed);
      const hours = slotEtaDays(s.lab, s.current, target, eff) * 24;
      const baseHours = slotEtaDays(s.lab, s.current, target, 1) * 24;
      const saved = baseHours - hours;
      const suggestions = buildSuggestions(safeSlots, globalSpeed, s.lab, activeLabs.filter((_, j) => j !== idx).concat([s.lab]));
      const done = s.current >= target;
      return { idx, slot: { ...s, target }, max, eff, hours, saved, suggestions, done };
    });
  }, [safeSlots, globalSpeed]);

  const ordered = useMemo(() => [...analysis].sort((a, b) => a.hours - b.hours), [analysis]);
  const parallelHours = ordered.length > 0 ? Math.max(...ordered.map((o) => o.hours)) : 0;
  const sequentialHours = ordered.reduce((sum, o) => sum + o.hours, 0);

  function updateSlot(idx: number, patch: Partial<SlotState>) {
    setSlots((prev) => {
      const base = Array.isArray(prev) && prev.length === SLOT_COUNT ? prev : DEFAULT_SLOTS;
      return base.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    });
  }

  function applySuggestion(idx: number, lab: string) {
    updateSlot(idx, { lab, current: 0, target: Math.min(maxLevelFor(lab), lab === 'Game Speed' ? 5 : 20) });
  }

  function resetAll() {
    setSlots(DEFAULT_SLOTS);
    setGlobalSpeed(1);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Lab slots</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{SLOT_COUNT}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Parallel finish</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{formatHours(parallelHours)}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Sequential total</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{formatHours(sequentialHours)}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Slots done</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">
            {analysis.filter((a) => a.done).length}/{SLOT_COUNT}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-['Orbitron'] text-lg font-bold flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[var(--color-gold-glow)] text-[var(--color-gold)] flex items-center justify-center text-base">⚡</span>
            Global lab speed
          </h2>
          <button
            onClick={resetAll}
            className="text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-lg px-3 py-1 hover:text-[var(--color-gold)] hover:border-[var(--color-gold-dim)] transition-all"
          >
            Reset all
          </button>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.05}
            value={globalSpeed}
            onChange={(e) => setGlobalSpeed(Math.min(5, Math.max(0.5, Number(e.target.value))))}
            className="flex-1 h-2 bg-[var(--color-bg)] rounded-lg appearance-none accent-[var(--color-gold)]"
          />
          <span className="font-['Orbitron'] text-xl font-bold w-20 text-right" style={{ color: 'var(--color-gold)' }}>
            {globalSpeed.toFixed(2)}x
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          Effective speed per lab = global × slot speed. Raise a single slot to see it jump ahead in the priority queue below.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Priority queue (fastest finish first)</h2>
        <div className="space-y-2">
          {ordered.map((o, rank) => (
            <div key={o.idx} className="flex items-center gap-3 text-sm rounded-xl border border-[var(--color-border)] px-4 py-3">
              <span className="font-['Orbitron'] font-bold text-[var(--color-gold)] w-8">#{rank + 1}</span>
              <span className="font-bold flex-1">Slot {o.idx + 1} · {o.slot.lab}</span>
              <span className="text-[var(--color-text-muted)]">
                Lv{o.slot.current}→{o.slot.target} · {o.eff.toFixed(2)}x · {formatHours(o.hours)}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${o.done ? 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]' : 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]'}`}>
                {o.done ? 'Done' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analysis.map((a) => (
          <div key={a.idx} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Orbitron'] text-base font-bold">Slot {a.idx + 1}</h3>
              <span className="text-xs text-[var(--color-text-muted)]">
                {a.eff.toFixed(2)}x effective · finishes in {formatHours(a.hours)}
              </span>
            </div>

            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Lab</label>
            <select
              value={a.slot.lab}
              onChange={(e) => applySuggestion(a.idx, e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm mb-4"
            >
              {(showAll ? (ALL_LABS as readonly string[]) : (ALL_LABS as readonly string[]).slice(0, 60)).map((lab) => (
                <option key={lab} value={lab}>
                  {lab} ({labGroupOf(lab)})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Current</label>
                <input
                  type="number"
                  min={0}
                  max={a.max}
                  value={a.slot.current}
                  onChange={(e) => updateSlot(a.idx, { current: Math.max(0, Math.min(a.max, Number(e.target.value))) })}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Target (max {a.max})</label>
                <input
                  type="number"
                  min={0}
                  max={a.max}
                  value={a.slot.target}
                  onChange={(e) => updateSlot(a.idx, { target: Math.max(0, Math.min(a.max, Number(e.target.value))) })}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <label className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] whitespace-nowrap">
                Slot speed
              </label>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={a.slot.speed}
                onChange={(e) => updateSlot(a.idx, { speed: Math.min(5, Math.max(0.1, Number(e.target.value))) })}
                className="flex-1 h-2 bg-[var(--color-bg)] rounded-lg appearance-none accent-[var(--color-teal)]"
              />
              <span className="font-['Orbitron'] font-bold w-14 text-right">{a.slot.speed.toFixed(1)}x</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              {a.saved > 0.05 ? `Saves ~${formatHours(a.saved)} vs 1x.` : 'At base speed.'} Finish:{' '}
              {(() => {
                const d = new Date(Date.now() + a.hours * 3600 * 1000);
                return isFinite(a.hours) && a.hours > 0 ? d.toLocaleDateString() : '—';
              })()}
            </p>

            <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[var(--color-gold)] mb-2">
                Suggested for this slot
              </div>
              <div className="space-y-2">
                {a.suggestions.map((s) => (
                  <div key={s.lab} className="flex items-center gap-2 text-sm">
                    <div className="flex-1">
                      <div className="font-bold">{s.lab}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">{s.reason}</div>
                    </div>
                    <button
                      onClick={() => applySuggestion(a.idx, s.lab)}
                      className="text-xs border border-[var(--color-gold-dim)] text-[var(--color-gold)] rounded-lg px-2 py-1 hover:bg-[var(--color-gold-glow)]"
                    >
                      Run
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAll((v) => !v)}
        className="text-xs text-[var(--color-gold)] border border-[var(--color-gold-dim)] rounded-lg px-3 py-1 hover:bg-[var(--color-gold-glow)] transition-all"
      >
        {showAll ? 'Show fewer labs in dropdowns' : `Show all ${(ALL_LABS as readonly string[]).length} labs in dropdowns`}
      </button>

      <p className="text-[11px] text-[var(--color-text-dim)]">
        Times use known lab durations where available ({formatBig(Object.keys(labsDurationMap).length)} tables) and a
        standard growth curve otherwise. Suggestion ranking is progress-aware: core econ first, then damage/survival.
      </p>
    </div>
  );
}
