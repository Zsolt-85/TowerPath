'use client';

import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const LEAGUES = ['Copper', 'Silver', 'Gold', 'Platinum', 'Champion', 'Legend', 'Mythic'] as const;

export interface Tournament {
  id: string;
  date: string;
  league: string;
  tier: number;
  rank: number;
  wave: number;
  diedTo: string;
  durationMin: number;
}

const PREP_ITEMS = [
  'Tournament card loadout equipped',
  'Modules swapped for push (not farm)',
  'Bot preset switched to tournament',
  'Econ UWs off (Golden Tower / Black Hole as needed)',
  'Bad perks banned',
  'Battle conditions reviewed',
  'Free time blocked — no mid-run interruptions',
];

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-['Orbitron'] focus:border-[var(--color-gold)] focus:outline-none transition-all";

export function TournamentTab() {
  const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('towerpath:tournaments', []);
  const [checks, setChecks] = useLocalStorage<Record<string, boolean>>('towerpath:tourney:prep', {});

  const [league, setLeague] = useState('Gold');
  const [tier, setTier] = useState(10);
  const [rank, setRank] = useState(15);
  const [wave, setWave] = useState(2000);
  const [diedTo, setDiedTo] = useState('Ranged');
  const [durationMin, setDurationMin] = useState(45);
  const [formOpen, setFormOpen] = useState(false);

  const chrono = [...tournaments].reverse();
  const bestRank = tournaments.reduce((m, t) => Math.min(m, t.rank), Infinity);
  const bestWave = tournaments.reduce((m, t) => Math.max(m, t.wave), 0);

  const save = () => {
    const t: Tournament = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      league,
      tier: Math.max(1, tier),
      rank: Math.max(1, rank),
      wave: Math.max(1, wave),
      diedTo,
      durationMin: Math.max(1, durationMin),
    };
    setTournaments((prev) => [t, ...prev].slice(0, 256));
    setFormOpen(false);
  };

  const checkedCount = PREP_ITEMS.filter((p) => checks[p]).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tournaments', value: String(tournaments.length) },
          { label: 'Best Rank', value: bestRank === Infinity ? '—' : `#${bestRank}` },
          { label: 'Best Wave', value: bestWave > 0 ? bestWave.toLocaleString() : '—' },
          { label: 'Leagues Climbed', value: `${new Set(tournaments.map((t) => t.league)).size}/${7}` },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
            <div className="font-['Orbitron'] text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      {tournaments.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-6">Rank & wave progression</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Rank over time · lower is better</div>
              <div className="h-64">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {chrono.length > 1 && (
                    <>
                      <polyline
                        fill="none"
                        stroke="var(--color-gold)"
                        strokeWidth="2"
                        points={chrono.map((t, i) => `${i * (380 / Math.max(1, chrono.length - 1))},${180 - (t.rank - 1) * 10}`).join(' ')}
                      />
                      {chrono.map((t, i) => (
                        <circle key={t.id} cx={i * (380 / Math.max(1, chrono.length - 1))} cy={180 - (t.rank - 1) * 10} r={4} fill="var(--color-gold)" />
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Wave over time</div>
              <svg viewBox="0 0 400 200" className="w-full h-64">
                {chrono.map((t, i) => (
                  <circle key={t.id} cx={i * (380 / Math.max(1, chrono.length - 1))} cy={180 - Math.min(180, t.wave / 50)} r={4} fill="var(--color-teal)" />
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-['Orbitron'] text-lg font-bold">Tournament history</h2>
            <button
              onClick={() => setFormOpen(true)}
              className="text-xs text-[var(--color-gold)] border border-[var(--color-gold-dim)] rounded-lg px-4 py-2 hover:bg-[var(--color-gold-glow)] transition-all"
            >
              ＋ Log tournament
            </button>
          </div>
          {formOpen && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">League</label>
                  <select value={league} onChange={(e) => setLeague(e.target.value)} className={inputCls}>
                    {['Copper', 'Silver', 'Gold', 'Platinum', 'Champion', 'Legend', 'Mythic'].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">Died to</label>
                  <select value={diedTo} onChange={(e) => setDiedTo(e.target.value)} className={inputCls}>
                    {['Boss', 'Ranged', 'Ray', 'Vampire', 'Scatter', 'Tank', 'Fast', 'Elite', 'Other'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {[
                  { label: 'Tier', value: tier, set: setTier },
                  { label: 'Rank', value: rank, set: setRank },
                  { label: 'Wave', value: wave, set: setWave },
                  { label: 'Minutes', value: durationMin, set: setDurationMin },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">{f.label}</label>
                    <input type="number" min={0} value={f.value} onChange={(e) => f.set(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
                  </div>
                ))}
              </div>
              <button onClick={save} className="w-full mt-4 px-4 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] text-sm font-bold hover:bg-[#ffc000] transition-all">
                Save tournament
              </button>
            </div>
          )}
          {tournaments.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)]">No tournaments logged yet.</div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {tournaments.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-card-hover)] transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">
                      {t.league} · <span style={{ color: 'var(--color-gold)' }}>#{t.rank}</span> · Wave {t.wave.toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                      Tier {t.tier} · died to {t.diedTo} · {t.durationMin} min · {new Date(t.date).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setTournaments((prev) => prev.filter((x) => x.id !== t.id))}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] px-2 py-1 transition-colors"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-['Orbitron'] text-lg font-bold">Prep checklist</h2>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-3 py-1 rounded-full">
              {checkedCount}/{PREP_ITEMS.length}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-5">Run through before the timer starts. Saved automatically.</p>
          <div className="space-y-2">
            {PREP_ITEMS.map((item) => {
              const done = !!checks[item];
              return (
                <button
                  key={item}
                  onClick={() => setChecks((prev) => ({ ...prev, [item]: !prev[item] }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all ${
                    done ? 'opacity-60' : 'hover:bg-[var(--color-bg-card-hover)]'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs flex-shrink-0 transition-all ${
                    done ? 'bg-[var(--color-teal)] border-[var(--color-teal)] text-[var(--color-bg-deep)]' : 'border-[var(--color-border-light)]'
                  }`}>
                    {done ? '✓' : ''}
                  </span>
                  <span className={done ? 'line-through' : ''}>{item}</span>
                </button>
              );
            })}
            </div>
          <button
            onClick={() => setChecks({})}
            className="mt-4 text-xs text-[var(--color-text-dim)] border border-[var(--color-border)] rounded-lg px-4 py-2 hover:text-[var(--color-text)] transition-all"
          >
            Reset for next tournament
          </button>
          <div className="mt-5 text-xs text-[var(--color-text-dim)]">
            Best so far: {bestRank === Infinity ? '—' : `#${bestRank}`} · {bestWave > 0 ? `${bestWave.toLocaleString()} wave` : 'no waves yet'}
          </div>
        </div>
      </div>
    </div>
  );
}