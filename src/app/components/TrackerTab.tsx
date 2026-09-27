'use client';

import { useMemo, useState } from 'react';
import { useRuns, formatBig, type Run } from '../hooks/useLocalStorage';
import { STRATEGIES, collectBackup, downloadFile } from '../lib/import';
import { ImportModal } from './ImportModal';

function coinsPerHour(r: Run): number {
  return r.durationMin > 0 ? (r.coins / r.durationMin) * 60 : 0;
}

export function TrackerTab({ onLogRun }: { onLogRun: () => void }) {
  const [runs, setRuns] = useRuns();
  const [importOpen, setImportOpen] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [stratFilter, setStratFilter] = useState<string>('all');

  const best = useMemo(() => runs.reduce((m, r) => Math.max(m, r.wave), 0), [runs]);
  const totalCoins = useMemo(() => runs.reduce((m, r) => m + r.coins, 0), [runs]);
  const totalCells = useMemo(() => runs.reduce((m, r) => m + (r.cells ?? 0), 0), [runs]);

  const filtered = useMemo(
    () =>
      runs.filter(
        (r) =>
          (tierFilter === 'all' || String(r.tier) === tierFilter) &&
          (stratFilter === 'all' || (r.strategy ?? '') === stratFilter)
      ),
    [runs, tierFilter, stratFilter]
  );

  const chart = useMemo(() => filtered.slice(0, 15).reverse(), [filtered]);
  const maxWave = Math.max(1, ...chart.map((r) => r.wave));

  const tiers = useMemo(() => [...new Set(runs.map((r) => r.tier))].sort((a, b) => a - b), [runs]);

  const byTier = useMemo(() => {
    return tiers
      .map((t) => {
        const rs = runs.filter((r) => r.tier === t);
        const cph = rs.reduce((m, r) => m + coinsPerHour(r), 0) / Math.max(1, rs.length);
        return { tier: t, runs: rs.length, cph };
      })
      .sort((a, b) => b.cph - a.cph);
  }, [runs, tiers]);

  const byStrategy = useMemo(() => {
    const tags = [...new Set(runs.map((r) => r.strategy ?? 'Unknown'))];
    return tags
      .map((s) => {
        const rs = runs.filter((r) => (r.strategy ?? 'Unknown') === s);
        const cph = rs.reduce((m, r) => m + coinsPerHour(r), 0) / Math.max(1, rs.length);
        return { strategy: s, runs: rs.length, cph };
      })
      .sort((a, b) => b.cph - a.cph);
  }, [runs]);

  const exportJSON = () => {
    const backup = collectBackup();
    downloadFile(`towerpath-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json');
  };

  const exportCSV = () => {
    const rows = ['tier,wave,coins,cells,durationMin,strategy,source,date'];
    for (const r of runs) {
      rows.push([r.tier, r.wave, r.coins, r.cells ?? '', r.durationMin, r.strategy ?? '', r.source ?? '', r.date].join(','));
    }
    downloadFile(`towerpath-runs-${new Date().toISOString().slice(0, 10)}.csv`, rows.join('\n'), 'text/csv');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Runs', value: String(runs.length) },
          { label: 'Best Wave', value: best > 0 ? best.toLocaleString() : '—' },
          { label: 'Total Coins', value: totalCoins > 0 ? formatBig(totalCoins) : '—' },
          { label: 'Total Cells', value: totalCells > 0 ? formatBig(totalCells) : '—' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">{s.label}</div>
            <div className="font-['Orbitron'] text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      {byTier.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
            <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Coins/hr by Tier</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">Which tier actually pays best for you.</p>
            <div className="space-y-2">
              {byTier.map((t, i) => (
                <div key={t.tier} className={`flex items-center gap-4 p-3 rounded-xl ${i === 0 ? 'bg-gradient-to-r from-[rgba(0,212,170,0.1)] to-transparent border-l-2 border-[var(--color-teal)]' : ''}`}>
                  <div className="font-['Orbitron'] font-bold text-sm w-12">T{t.tier}</div>
                  <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-teal-dim)] to-[var(--color-teal)]"
                      style={{ width: `${byTier[0].cph > 0 ? (t.cph / byTier[0].cph) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-xs font-['Orbitron'] font-bold w-24 text-right">{formatBig(t.cph)}/h</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] w-14 text-right">{t.runs} runs</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
            <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Coins/hr by Strategy</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">Tag runs on import to compare builds.</p>
            <div className="space-y-2">
              {byStrategy.map((s, i) => (
                <div key={s.strategy} className={`flex items-center gap-4 p-3 rounded-xl ${i === 0 && s.runs > 0 ? 'bg-gradient-to-r from-[rgba(240,165,0,0.08)] to-transparent border-l-2 border-[var(--color-gold)]' : ''}`}>
                  <div className="font-bold text-sm w-24 truncate">{s.strategy}</div>
                  <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold-dim)] to-[var(--color-gold)]"
                      style={{ width: `${byStrategy[0].cph > 0 ? (s.cph / byStrategy[0].cph) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-xs font-['Orbitron'] font-bold w-24 text-right">{formatBig(s.cph)}/h</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] w-14 text-right">{s.runs} runs</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Orbitron'] text-lg font-bold">Wave per Run</h2>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-3 py-1 rounded-full">Last {chart.length} runs</span>
          </div>
          {chart.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)] py-8 text-center">
              No runs yet. Import a battle report or log one manually.
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1.5 h-48">
                {chart.map((r) => (
                  <div key={r.id} className="flex-1 flex flex-col items-center gap-2" title={`T${r.tier} W${r.wave} ${r.strategy ?? ''}`}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(4, (r.wave / maxWave) * 100)}%`,
                        background: 'linear-gradient(to top, rgba(196,136,0,0.5), rgba(240,165,0,0.8))',
                      }}
                    />
                    <span className="text-[9px] text-[var(--color-text-muted)]">T{r.tier}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 text-[10px] text-[var(--color-text-muted)]">
                <span>Oldest</span><span>Newest</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-['Orbitron'] text-lg font-bold">Run History</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setImportOpen(true)}
                className="text-xs text-[var(--color-teal)] border border-[var(--color-teal-dim)] rounded-lg px-3 py-2 hover:bg-[var(--color-teal-glow)] transition-all"
              >
                ⬆ Import
              </button>
              <button
                onClick={exportJSON}
                className="text-xs text-[var(--color-text-dim)] border border-[var(--color-border)] rounded-lg px-3 py-2 hover:text-[var(--color-text)] transition-all"
              >
                ⬇ JSON
              </button>
              <button
                onClick={exportCSV}
                className="text-xs text-[var(--color-text-dim)] border border-[var(--color-border)] rounded-lg px-3 py-2 hover:text-[var(--color-text)] transition-all"
              >
                ⬇ CSV
              </button>
              <button
                onClick={onLogRun}
                className="text-xs text-[var(--color-gold)] border border-[var(--color-gold-dim)] rounded-lg px-3 py-2 hover:bg-[var(--color-gold-glow)] transition-all"
              >
                ＋ Log
              </button>
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="text-xs px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)]">
              <option value="all">All tiers</option>
              {tiers.map((t) => (
                <option key={t} value={String(t)}>Tier {t}</option>
              ))}
            </select>
            <select value={stratFilter} onChange={(e) => setStratFilter(e.target.value)} className="text-xs px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)]">
              <option value="all">All strategies</option>
              {STRATEGIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)]">Nothing here yet.</div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-card-hover)] transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">
                      Tier {r.tier} · Wave {r.wave.toLocaleString()}
                      {r.strategy && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-teal-glow)] text-[var(--color-teal)]">
                          {r.strategy}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                      {formatBig(r.coins)} coins{r.cells ? ` · ${formatBig(r.cells)} cells` : ''} · {r.durationMin} min · {new Date(r.date).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setRuns((prev) => prev.filter((x) => x.id !== r.id))}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] px-2 py-1 transition-colors"
                    title="Delete run"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
