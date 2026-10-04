'use client';

import { useMemo } from 'react';
import { useLocalStorage, useRuns, formatBig } from '../hooks/useLocalStorage';
import { ULTIMATE_WEAPON_NAMES } from '../data/ultimate-weapons-data';
import type { Tournament } from './TournamentTab';
import {
  computeMilestones,
  computePushes,
  type MilestoneCategory,
} from '../lib/milestones';

interface LabSlot {
  lab: string;
  current: number;
  target: number;
  speed: number;
}

const CATEGORY_ORDER: MilestoneCategory[] = [
  'Waves',
  'Tiers',
  'Economy',
  'Tournament',
  'Labs',
  'Ultimate Weapons',
];

const CATEGORY_BADGE: Record<MilestoneCategory, string> = {
  Waves: 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]',
  Tiers: 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]',
  Economy: 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]',
  Tournament: 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]',
  Labs: 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]',
  'Ultimate Weapons': 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]',
};

export function MilestonesTab() {
  const [runs] = useRuns();
  const [tournaments] = useLocalStorage<Tournament[]>('towerpath:tournaments', []);
  const [uwUnlocked] = useLocalStorage<Record<string, boolean>>('towerpath:uw:unlocked', {});
  const [uwSynced] = useLocalStorage<Record<string, boolean>>('towerpath:uw:synced', {});
  const [labSlots] = useLocalStorage<LabSlot[]>('towerpath:lab-planner-v2', []);
  const [labGlobalSpeed] = useLocalStorage<number>('towerpath:lab-speed-global', 1);
  const [stones] = useLocalStorage('towerpath:stats:stones', 8420);
  const [gtCd] = useLocalStorage('towerpath:stats:gtcd', 300);
  const [bhCd] = useLocalStorage('towerpath:stats:bhcd', 300);

  const milestones = useMemo(
    () =>
      computeMilestones({
        runs,
        tournaments,
        uwUnlocked,
        uwSynced,
        uwNames: [...ULTIMATE_WEAPON_NAMES],
        labSlots: Array.isArray(labSlots) ? labSlots : [],
        labGlobalSpeed,
        stones,
        gtCd,
        bhCd,
      }),
    [runs, tournaments, uwUnlocked, uwSynced, labSlots, labGlobalSpeed, stones, gtCd, bhCd]
  );

  const pushes = useMemo(() => computePushes(milestones), [milestones]);

  const bestWave = runs.reduce((m, r) => Math.max(m, r.wave), 0);
  const avgCph =
    runs.length > 0
      ? runs.reduce((m, r) => m + (r.durationMin > 0 ? (r.coins / r.durationMin) * 60 : 0), 0) / runs.length
      : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Open milestones</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{milestones.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Best wave</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{bestWave > 0 ? bestWave.toLocaleString() : '—'}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Avg coins/hr</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{avgCph > 0 ? formatBig(avgCph) : '—'}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Tournaments</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{tournaments.length}</div>
        </div>
      </div>

      {runs.length === 0 && (
        <div className="rounded-xl border border-[rgba(240,165,0,0.3)] bg-[rgba(240,165,0,0.06)] p-4 text-xs text-[var(--color-text-dim)] leading-relaxed">
          No runs logged yet — wave, tier and economy targets unlock once farm runs exist. Lab and Ultimate Weapon
          milestones below already work from your planner state.
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="font-['Orbitron'] text-lg font-bold mb-1 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[var(--color-gold-glow)] text-[var(--color-gold)] flex items-center justify-center text-base">◎</span>
          Next realistic pushes
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Closest milestone per category, ranked by value-per-time from your own pace.
        </p>
        {pushes.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Everything tracked is done. Push further and log runs.</p>
        ) : (
          <div className="space-y-2">
            {pushes.map((p) => (
              <div key={`${p.category}-${p.title}`} className="flex items-center gap-3 text-sm rounded-xl border border-[var(--color-border)] px-4 py-3">
                <span className="font-['Orbitron'] font-bold text-[var(--color-gold)] w-8">#{p.rank}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${CATEGORY_BADGE[p.category]}`}>
                  {p.category}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{p.title}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">{p.detail}</div>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{p.etaLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = milestones.filter((m) => m.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <h2 className="font-['Orbitron'] text-lg font-bold mb-4">{cat}</h2>
            <div className="space-y-4">
              {items.map((m) => (
                <div key={m.id}>
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="font-bold text-sm">{m.label}</div>
                    <div className="text-[11px] text-[var(--color-gold)] whitespace-nowrap">{m.etaLabel}</div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-bg)] overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full bg-[var(--color-gold)] transition-all"
                      style={{ width: `${Math.round(m.progress * 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {m.currentLabel} · {m.targetLabel} · {m.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
