'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage, formatBig } from '../hooks/useLocalStorage';
import { allSpecs, valueAt, planUpgrades, type WorkshopTree } from '../lib/workshop';

const TREES: WorkshopTree[] = ['Attack', 'Defense', 'Utility'];

export function WorkshopTab() {
  const [tree, setTree] = useState<WorkshopTree>('Attack');
  const [levels, setLevels] = useLocalStorage<Record<string, number>>('towerpath:workshop:levels', {});
  const [targets, setTargets] = useLocalStorage<Record<string, number>>('towerpath:workshop:targets', {});
  const [wallet, setWallet] = useLocalStorage('towerpath:workshop:wallet', 0);

  const specs = useMemo(() => allSpecs(), []);
  const inTree = specs.filter((s) => s.tree === tree);
  const plan = useMemo(() => planUpgrades(specs, levels, targets), [specs, levels, targets]);
  const unlocks = plan.filter((p) => p.unlock);
  const unlockTotal = unlocks.reduce((m, p) => m + (p.unlock?.cost ?? 0), 0);
  const setLevel = (name: string, v: number) =>
    setLevels((prev) => ({ ...prev, [name]: Math.max(0, Math.floor(v) || 0) }));
  const setTarget = (name: string, v: number) =>
    setTargets((prev) => ({ ...prev, [name]: Math.max(0, Math.floor(v) || 0) }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Upgrades tracked</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{specs.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Planned upgrades</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{plan.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Unlock shopping list</div>
          <div className="font-['Orbitron'] text-2xl font-bold mt-2">{formatBig(unlockTotal)} coins</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)]">Wallet</div>
          <input
            type="number"
            min={0}
            value={wallet}
            onChange={(e) => setWallet(Math.max(0, Number(e.target.value) || 0))}
            className="w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-['Orbitron'] font-bold"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TREES.map((t) => (
          <button
            key={t}
            onClick={() => setTree(t)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              tree === t
                ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <div className="space-y-3">
          {inTree.map((s) => {
            const cur = Math.max(0, Math.min(s.quantity, Math.floor(levels[s.name] ?? 0)));
            const tgt = Math.max(cur, Math.min(s.quantity, Math.floor(targets[s.name] ?? cur)));
            return (
              <div key={s.name} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_repeat(3,110px)] gap-3 items-center rounded-xl border border-[var(--color-border)] px-4 py-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{s.name}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {formatBig(valueAt(s, cur))} → {formatBig(valueAt(s, tgt))}
                    {tgt > cur && <> · {tgt - cur} levels</>}
                  </div>
                </div>
                <input type="number" min={0} max={s.quantity} value={cur} onChange={(e) => setLevel(s.name, Number(e.target.value))} title="Current level" className="w-[110px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
                <input type="number" min={0} max={s.quantity} value={tgt} onChange={(e) => setTarget(s.name, Number(e.target.value))} title="Target level" className="w-[110px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded text-center ${tgt > cur ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]' : 'text-[var(--color-text-dim)]'}`}>
                  {tgt > cur ? 'Planned' : `max ${s.quantity}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {unlocks.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="font-['Orbitron'] text-lg font-bold mb-4">
            Unlock shopping list · {formatBig(unlockTotal)} coins{' '}
            <span className={unlockTotal <= wallet ? 'text-[var(--color-teal)]' : 'text-[var(--color-gold)]'}>
              ({unlockTotal <= wallet ? 'affordable' : 'save up'})
            </span>
          </h2>
          <div className="space-y-2">
            {unlocks.map((p) => (
              <div key={p.name} className="flex items-center gap-3 text-sm rounded-xl border border-[var(--color-border)] px-4 py-3">
                <span className="font-bold flex-1">{p.name}</span>
                <span className="text-[var(--color-text-muted)]">{p.unlock?.tier}</span>
                <span className="font-['Orbitron'] font-bold">{formatBig(p.unlock?.cost ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Effects interpolate linearly between the game min/max per level count. Per-level coin costs are
        not shown because the game cost curve is not in our data — only the exact unlock costs above.
      </p>
    </div>
  );
}
