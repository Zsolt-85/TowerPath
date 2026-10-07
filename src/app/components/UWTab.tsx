'use client';

import { ULTIMATE_WEAPONS, ULTIMATE_WEAPON_NAMES } from '../data/ultimate-weapons-data';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UWPlanner } from './UWPlanner';

const ICONS: Record<string, string> = {
  'Death Wave': '⊡',
  'Black Hole': '◎',
  'Golden Tower': '◉',
  'Smart Missiles': '✔',
  ChronoField: '◐',
  'Chrono Field': '◐',
  'Poison Swamp': '⚑',
  'Inner Land Mines': '⟐',
  'Chain Lightning': '⌡',
  Spotlight: '◇',
};

type UWTable = {
  upgrades?: { Cooldown?: { values?: { value: number }[] } };
};

function baseCooldown(name: string): number | null {
  const uw = (ULTIMATE_WEAPONS as unknown as Record<string, UWTable>)[name];
  const v = uw?.upgrades?.Cooldown?.values?.[0]?.value;
  return typeof v === 'number' ? v : null;
}

export function UWTab() {
  const [unlocked, setUnlocked] = useLocalStorage<Record<string, boolean>>('towerpath:uw:unlocked', {
    'Death Wave': true,
    'Black Hole': true,
    'Golden Tower': true,
    'Smart Missiles': true,
    'Chrono Field': true,
    'Poison Swamp': true,
  });
  const [synced, setSynced] = useLocalStorage<Record<string, boolean>>('towerpath:uw:synced', {
    'Death Wave': true,
    'Black Hole': true,
  });

  const names = [...ULTIMATE_WEAPON_NAMES];
  const unlockedCount = names.filter((n) => unlocked[n]).length;
  const syncedCount = names.filter((n) => synced[n] && unlocked[n]).length;

  const toggle = (
    map: Record<string, boolean>,
    set: (v: Record<string, boolean> | ((p: Record<string, boolean>) => Record<string, boolean>)) => void,
    name: string
  ) => set((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'UWs Unlocked', value: `${unlockedCount}/${names.length}` },
          { label: 'UWs Synced', value: `${syncedCount}/${unlockedCount}` },
          { label: 'Sync Coverage', value: unlockedCount > 0 ? `${Math.round((syncedCount / unlockedCount) * 100)}%` : '—' },
          { label: 'Remaining', value: `${names.length - unlockedCount} locked` },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
            <div className="font-['Orbitron'] text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-['Orbitron'] text-lg font-bold flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[var(--color-red-glow)] text-[var(--color-red)] flex items-center justify-center text-base">✦</span>
            Ultimate Weapons Planner
          </h2>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          Click a weapon to toggle unlocked, click the sync pill to mark it synced. Base cooldowns are real game values.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {names.map((name) => {
            const isUnlocked = !!unlocked[name];
            const isSynced = !!synced[name] && isUnlocked;
            const cd = baseCooldown(name);
            return (
              <div
                key={name}
                onClick={() => toggle(unlocked, setUnlocked, name)}
                className={`rounded-xl p-5 text-center border transition-all cursor-pointer hover:-translate-y-1 ${
                  !isUnlocked
                    ? 'border-[var(--color-border)] opacity-40'
                    : isSynced
                      ? 'border-[var(--color-teal)] bg-[var(--color-teal-glow)] shadow-lg shadow-[var(--color-teal-glow)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-bg-card-hover)]'
                }`}
                title={isUnlocked ? 'Click to mark locked' : 'Click to mark unlocked'}
              >
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl ${
                  isSynced ? 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]' : 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
                }`}>
                  {ICONS[name] ?? '◇'}
                </div>
                <div className="text-sm font-semibold">{name}</div>
                <div className="text-[11px] text-[var(--color-text-dim)] mt-1">
                  {cd != null ? `base CD ${cd}s` : 'no cooldown stat'}
                </div>
                {isUnlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(synced, setSynced, name);
                    }}
                    className={`mt-3 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${
                      isSynced
                        ? 'bg-[var(--color-teal-glow)] text-[var(--color-teal)]'
                        : 'bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:text-[var(--color-gold)] border border-[var(--color-border)]'
                    }`}
                  >
                    {isSynced ? '✓ Synced' : 'Mark synced'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <UWPlanner />
    </div>
  );
}