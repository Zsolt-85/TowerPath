'use client';

import { useMemo } from 'react';
import { COMMON_CARDS, RARE_CARDS, EPIC_CARDS } from '../data/cards-data';
import { useLocalStorage } from '../hooks/useLocalStorage';

const STAR_CUM_COST = [0, 20, 60, 160, 320, 560, 960, 1600];
const MAX_STARS = 7;

const GROUPS: Array<{ title: string; names: string[]; color: string }> = [
  { title: 'Common', names: Object.keys(COMMON_CARDS), color: 'var(--color-text-dim)' },
  { title: 'Rare', names: Object.keys(RARE_CARDS), color: 'var(--color-teal)' },
  { title: 'Epic', names: Object.keys(EPIC_CARDS), color: 'var(--color-gold)' },
];

export function CardsTab() {
  const [stars, setStars] = useLocalStorage<Record<string, number>>('towerpath:cards', {});

  const all = useMemo(() => GROUPS.flatMap((g) => g.names), []);
  const owned = all.filter((n) => (stars[n] ?? 0) > 0);
  const gemsSpent = owned.reduce((m, n) => m + STAR_CUM_COST[Math.min(MAX_STARS, stars[n] ?? 0)], 0);
  const gemsToMax = all.reduce((m, n) => m + (1600 - STAR_CUM_COST[Math.min(MAX_STARS, stars[n] ?? 0)]), 0);

  const setCardStars = (name: string, s: number) =>
    setStars((prev) => ({ ...prev, [name]: Math.max(0, Math.min(MAX_STARS, s)) }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cards Owned', value: `${owned.length}/${all.length}` },
          { label: 'Gems Spent (est)', value: gemsSpent.toLocaleString() },
          { label: 'Avg Stars', value: owned.length > 0 ? (owned.reduce((m, n) => m + (stars[n] ?? 0), 0) / owned.length).toFixed(1) : '—' },
          { label: 'Gems To Max All', value: gemsToMax.toLocaleString() },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
            <div className="font-['Orbitron'] text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-1 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[var(--color-gold-glow)] text-[var(--color-gold)] flex items-center justify-center text-base">◈</span>
            {g.title} Cards
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">Click the stars to set each card level — saved automatically.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {g.names.map((name) => {
              const s = stars[name] ?? 0;
              return (
                <div
                  key={name}
                  className={`rounded-xl p-4 text-center border transition-all ${
                    s > 0
                      ? 'border-[rgba(240,165,0,0.4)] hover:border-[var(--color-gold)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-light)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="text-base mb-2">
                    {Array.from({ length: MAX_STARS }, (_, j) => (
                      <button
                        key={j}
                        onClick={() => setCardStars(name, j + 1 === s ? j : j + 1)}
                        className={`cursor-pointer transition-transform hover:scale-125 ${j < s ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)]'}`}
                        title={`Set ${name} to ${j + 1}★`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] font-medium leading-tight" style={{ color: s > 0 ? g.color : 'var(--color-text-dim)' }}>
                    {name}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {s > 0 ? `${s}★ · ${STAR_CUM_COST[s]}💎 in` : 'not owned'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
