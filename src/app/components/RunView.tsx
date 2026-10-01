'use client';

import { useMemo } from 'react';
import { formatBig, type Run } from '../hooks/useLocalStorage';

const NAME_FIX: Record<string, string> = {
  perKill: 'Coins / Kill',
  perWave: 'Coins / Wave',
  critCoin: 'Critical Coin',
  goldenTower: 'Golden Tower',
  goldenCombo: 'Golden Combo',
  deathWave: 'Death Wave',
  goldenBot: 'Golden Bot',
  waveSkip: 'Wave Skip',
  otherBonuses: 'Other bonuses',
  defensePct: 'Defense %',
  defenseAbs: 'Defense Abs.',
  negMassProjector: 'Neg. Mass Projector',
  primordialCollapse: 'Primordial Collapse',
  chainThunder: 'Chain Thunder',
  chronoField: 'Chrono Field',
  rendArmor: 'Rend Armor',
  deathRay: 'Death Ray',
  chainLightning: 'Chain Lightning',
  smartMissiles: 'Smart Missiles',
  innerLandMines: 'Inner Land Mines',
  poisonSwamp: 'Poison Swamp',
  blackHole: 'Black Hole',
  flameBot: 'Flame Bot',
  attackChip: 'Attack Chip',
  landMines: 'Land Mines',
  thunderBot: 'Thunder Bot',
  orbitalAugment: 'Orbital Augment',
  attackSkipped: 'ATK skipped',
  healthSkipped: 'HP skipped',
  freeAttack: 'Free ATK',
  freeDefense: 'Free DEF',
  freeUtility: 'Free UTL',
  recoveryPackages: 'Recovery pkgs',
  minesSpawned: 'Mines spawned',
  thunderStuns: 'Thunder stuns',
  wavesSkipped: 'Waves skipped',
  deathDefy: 'Death Defy',
  shieldHits: 'Shield hits',
  secondWind: 'Second Wind',
  demonMode: 'Demon Mode',
  towerRegen: 'Tower regen',
  wallRegen: 'Wall regen',
  highestCoinsPerMin: 'Best coins/min',
  largestWaveSkip: 'Biggest skip',
  mostCoinsWaveSkip: 'Most coins/skip',
  mostCellsWaveSkip: 'Most cells/skip',
  largestSMStack: 'Biggest SM stack',
  largestGoldenCombo: 'Biggest GT combo',
  mostCoinsGoldenCombo: 'Most coins/combo',
  largestMineCharge: 'Biggest mine charge',
  adGems: 'Ad gems',
  gemBlocks: 'Gem blocks',
  fetchGems: 'Fetch gems',
  rerollShards: 'Reroll shards',
  rerollFetched: 'Reroll fetched',
  cannonShards: 'Cannon shards',
  armorShards: 'Armor shards',
  generatorShards: 'Generator shards',
  coreShards: 'Core shards',
  commonModules: 'Common mods',
  rareModules: 'Rare mods',
  fetched: 'Fetched',
  tower: 'Tower',
  wall: 'Wall',
  lifesteal: 'Lifesteal',
};

const pretty = (k: string) =>
  NAME_FIX[k] ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const fmt = (v: number) => (v >= 10000 ? formatBig(v) : v.toLocaleString());

function Bars({
  entries,
  total,
  color,
}: {
  entries: Array<[string, number]>;
  total: number;
  color: string;
}) {
  const rows = entries
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return <div className="text-xs text-[var(--color-text-muted)]">No data captured.</div>;
  const max = rows[0][1];
  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center gap-3">
          <div className="text-xs w-32 truncate flex-shrink-0" title={pretty(k)}>{pretty(k)}</div>
          <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${max > 0 ? (v / max) * 100 : 0}%`, background: color }} />
          </div>
          <div className="text-xs font-['Orbitron'] font-bold w-20 text-right flex-shrink-0">{fmt(v)}</div>
          <div className="text-[10px] text-[var(--color-text-muted)] w-12 text-right flex-shrink-0">
            {total > 0 ? `${((v / total) * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

function Grid({ entries }: { entries: Array<[string, number]> }) {
  const rows = entries.filter(([, v]) => typeof v === 'number');
  if (rows.length === 0) return <div className="text-xs text-[var(--color-text-muted)]">No data captured.</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{pretty(k)}</div>
          <div className="font-['Orbitron'] text-base font-bold mt-1">{fmt(v)}</div>
        </div>
      ))}
    </div>
  );
}

function dur(mins?: number): string {
  if (mins == null) return '—';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = Math.floor(mins % 60);
  return `${d > 0 ? `${d}d ` : ''}${h > 0 ? `${h}h ` : ''}${m}m`;
}

export function RunView({ run, avgCph, onBack }: { run: Run; avgCph: number; onBack: () => void }) {
  const d = run.detail;
  const cph = run.durationMin > 0 ? (run.coins / run.durationMin) * 60 : 0;
  const delta = avgCph > 0 ? (cph - avgCph) / avgCph : 0;

  const damageEntries = useMemo(() => Object.entries(d?.damage ?? {}), [d]);
  const damageTotal = d?.damageDealt ?? damageEntries.reduce((m, [, v]) => m + v, 0);
  const incomeEntries = useMemo(() => Object.entries(d?.coinsSrc ?? {}), [d]);
  const enemyEntries = useMemo(() => Object.entries(d?.enemies ?? {}), [d]);
  const enemyTotal = enemyEntries.reduce((m, [, v]) => m + v, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <button
        onClick={onBack}
        className="text-xs text-[var(--color-text-dim)] border border-[var(--color-border)] rounded-lg px-4 py-2 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-all"
      >
        ← All runs
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: `Tier ${run.tier} · Wave`, value: run.wave.toLocaleString() },
          { label: 'Coins Earned', value: formatBig(run.coins) },
          { label: 'Coins / Hour', value: formatBig(cph) },
          { label: 'Killed By', value: d?.killedBy ?? '—' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
            <div className="font-['Orbitron'] text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {run.strategy && (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[var(--color-teal-glow)] text-[var(--color-teal)]">{run.strategy}</span>
        )}
        {run.runType && run.runType !== 'farm' && (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[var(--color-gold-glow)] text-[var(--color-gold)]">{run.runType}</span>
        )}
        <span className="px-3 py-1 rounded-full text-xs text-[var(--color-text-dim)] bg-[var(--color-bg-card)]">
          Game {dur(d?.gameTimeMin)} · Real {dur(d?.realTimeMin)} · {new Date(run.date).toLocaleDateString()}
        </span>
        {avgCph > 0 && (
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ color: delta >= 0 ? 'var(--color-teal)' : 'var(--color-red)' }}
          >
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta * 100).toFixed(0)}% vs your average
          </span>
        )}
      </div>

      {!d || Object.keys(d).length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-sm text-[var(--color-text-dim)]">
          This run was logged manually — no battle-report breakdown. Import the full report to unlock damage, income and enemy analytics.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
              <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Damage distribution</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-5">Total dealt {formatBig(damageTotal)}</p>
              <Bars entries={damageEntries} total={damageTotal} color="linear-gradient(90deg, var(--color-gold-dim), var(--color-gold))" />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
              <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Income sources</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-5">Total earned {formatBig(run.coins)}</p>
              <Bars entries={incomeEntries} total={run.coins} color="linear-gradient(90deg, var(--color-teal-dim), var(--color-teal))" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
              <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Enemy mix</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-5">{enemyTotal.toLocaleString()} enemies tracked</p>
              <Bars entries={enemyEntries} total={enemyTotal} color="linear-gradient(90deg, #7c3aed, var(--color-purple))" />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
              <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Kill credit</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-5">Kills while each effect was active</p>
              {d.effects && Object.keys(d.effects).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(d.effects)
                    .sort((a, b) => b[1].kills - a[1].kills)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3">
                        <div className="text-xs w-32 truncate flex-shrink-0">{pretty(k)}</div>
                        <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--color-teal)]" style={{ width: `${Math.min(100, v.pct)}%` }} />
                        </div>
                        <div className="text-xs font-['Orbitron'] font-bold w-20 text-right flex-shrink-0">{v.kills.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] w-12 text-right flex-shrink-0">{v.pct.toFixed(1)}%</div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text-muted)]">No data captured.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
            <h2 className="font-['Orbitron'] text-lg font-bold mb-5">Records & currencies</h2>
            <Grid entries={Object.entries({ ...(d.records ?? {}), ...(d.currencies ?? {}) })} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
              <h2 className="font-['Orbitron'] text-base font-bold mb-5">Defense</h2>
              <Grid entries={Object.entries({ ...(d.damageTaken ?? {}), ...(d.blocked ?? {}) })} />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
              <h2 className="font-['Orbitron'] text-base font-bold mb-5">Healing</h2>
              <Grid entries={Object.entries({ ...(d.healthRegen ?? {}), ...(d.bonusHealth ?? {}) })} />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
              <h2 className="font-['Orbitron'] text-base font-bold mb-5">Counts & cash</h2>
              <Grid entries={Object.entries({ ...(d.counts ?? {}), ...(d.cash ?? {}) })} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
