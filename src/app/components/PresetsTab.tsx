'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  createPreset,
  renamePreset,
  deletePreset,
  PRESET_KEYS,
  ACTIVE_KEYS,
  type AnyPreset,
  type PresetType,
  type CardPreset,
  type WorkshopPreset,
  type BotPreset,
} from '../lib/presets';
import { CARDS } from '../data/cards-data';
import { BOT_NAMES } from '../data/bots-data';
import { allSpecs } from '../lib/workshop';

interface TypeConfig {
  type: PresetType;
  label: string;
  items: string[];
  maxPerItem: number;
  empty: Record<string, number>;
}

function Manager<T extends AnyPreset>({
  config,
  snapshot,
}: {
  config: TypeConfig;
  snapshot?: { label: string; read: () => Record<string, number> };
}) {
  const [list, setList] = useLocalStorage<T[]>(PRESET_KEYS[config.type], []);
  const [activeId, setActiveId] = useLocalStorage<string>(ACTIVE_KEYS[config.type], '');
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const qtyMap = useMemo(() => new Map(allSpecs().map((s) => [s.name, s.quantity] as const)), []);

  const bodyOf = (p: T): Record<string, number> =>
    (p as unknown as { stars?: Record<string, number>; levels?: Record<string, number>; picks?: Record<string, number> }).stars ??
    (p as unknown as { levels?: Record<string, number>; picks?: Record<string, number> }).levels ??
    (p as unknown as { picks?: Record<string, number> }).picks ??
    {};
  const withBody = (base: Omit<T, 'id' | 'updatedAt'>, body: Record<string, number>): Omit<T, 'id' | 'updatedAt'> => {
    if (config.type === 'cards') return { ...base, stars: body } as Omit<T, 'id' | 'updatedAt'>;
    if (config.type === 'workshop') return { ...base, levels: body } as Omit<T, 'id' | 'updatedAt'>;
    return { ...base, picks: body } as Omit<T, 'id' | 'updatedAt'>;
  };
  const startNew = () => {
    setList((prev) => createPreset(prev, withBody({ name: `${config.label} ${prev.length + 1}` } as Omit<T, 'id' | 'updatedAt'>, { ...config.empty })));
  };
  const applySnapshot = () => {
    if (!snapshot || !editingId) return;
    const raw = snapshot.read();
    const next: Record<string, number> = {};
    for (const item of config.items) {
      const v = Math.max(0, Math.min(config.maxPerItem, Math.floor(Number(raw[item]) || 0)));
      if (v > 0) next[item] = v;
    }
    setDraft(next);
    setList((prev) => prev.map((q) => (q.id === editingId ? { ...withBody(q as Omit<T, 'id' | 'updatedAt'>, next), id: q.id, updatedAt: q.updatedAt } as unknown as T : q)));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={startNew} className="text-xs text-[var(--color-gold)] border border-[var(--color-gold-dim)] rounded-lg px-4 py-2 hover:bg-[var(--color-gold-glow)] transition-all">
          ＋ New {config.label} preset
        </button>
        {snapshot && editingId && (
          <button onClick={applySnapshot} className="text-xs text-[var(--color-teal)] border border-[var(--color-border)] rounded-lg px-4 py-2 hover:border-[var(--color-teal)] transition-all">
            {snapshot.label}
          </button>
        )}
      </div>
      {list.map((p) => (
        <div key={p.id} className="rounded-xl border border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            {editingId === p.id ? (
              <input value={rename} onChange={(e) => setRename(e.target.value)} className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            ) : (
              <span className="font-bold text-sm flex-1">{p.name}</span>
            )}
            {p.id === activeId && (
              <span className="text-[10px] font-bold uppercase text-[var(--color-teal)]">Active</span>
            )}
            <button onClick={() => setActiveId(p.id)} className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-2 hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] transition-all">Set active</button>
            {editingId === p.id ? (
              <button onClick={() => { setList((prev) => renamePreset(prev, p.id, rename)); setEditingId(null); }} className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-2 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all">Save</button>
            ) : (
              <button onClick={() => { setEditingId(p.id); setRename(p.name); setDraft({ ...bodyOf(p) }); }} className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-2 hover:text-[var(--color-text)] transition-all">Edit</button>
            )}
            <button onClick={() => { if (p.id === activeId) setActiveId(''); setList((prev) => deletePreset(prev, p.id)); }} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] px-2 py-1 transition-colors">✕</button>
          </div>
          {editingId === p.id && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {config.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)] flex-1 truncate">{item}</span>
                  <input
                    type="number"
                    min={0}
                    max={config.type === 'workshop' ? (qtyMap.get(item) ?? config.maxPerItem) : config.maxPerItem}
                    value={draft[item] ?? 0}
                    onChange={(e) => {
                      const cap = config.type === 'workshop' ? (qtyMap.get(item) ?? config.maxPerItem) : config.maxPerItem;
                      const v = Math.max(0, Math.min(cap, Math.floor(Number(e.target.value) || 0)));
                      const next = { ...draft, [item]: v };
                      setDraft(next);
                      setList((prev) => prev.map((q) => (q.id === p.id ? { ...withBody(q as Omit<T, 'id' | 'updatedAt'>, next), id: q.id, updatedAt: q.updatedAt } as unknown as T : q)));
                    }}
                    className="w-16 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function readLiveCards(): Record<string, number> {
  try {
    const raw = localStorage.getItem('towerpath:cards');
    const parsed = raw != null ? (JSON.parse(raw) as Record<string, number>) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return {};
  }
}

const SUB_TABS: { id: PresetType; label: string }[] = [
  { id: 'cards', label: 'Cards' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'bots', label: 'Bots' },
];

export function PresetsTab() {
  const [tab, setTab] = useState<PresetType>('cards');
  const specs = allSpecs();
  const workshopReady = specs.length > 0;
  const configs: Record<PresetType, TypeConfig> = {
    cards: { type: 'cards', label: 'Card', items: Object.keys(CARDS), maxPerItem: 7, empty: {} },
    workshop: { type: 'workshop', label: 'Workshop', items: specs.map((s) => s.name), maxPerItem: 9999, empty: {} },
    bots: { type: 'bots', label: 'Bot', items: [...BOT_NAMES], maxPerItem: 100, empty: {} },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex gap-2">
        {SUB_TABS.map((s) => {
          const disabled = s.id === 'workshop' && !workshopReady;
          const isActive = tab === s.id;
          return (
            <button
              key={s.id}
              disabled={disabled}
              onClick={() => setTab(s.id)}
              className={`text-xs font-bold rounded-lg px-4 py-2 border transition-all ${
                isActive
                  ? 'text-[var(--color-gold)] border-[var(--color-gold-dim)] bg-[var(--color-gold-glow)]'
                  : 'text-[var(--color-text-dim)] border-[var(--color-border)] hover:text-[var(--color-text)]'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {tab === 'cards' && (
        <Manager<CardPreset> config={configs.cards} snapshot={{ label: 'Snapshot current cards', read: readLiveCards }} />
      )}
      {tab === 'workshop' &&
        (workshopReady ? (
          <Manager<WorkshopPreset> config={configs.workshop} />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Arrives with the Workshop planner</p>
        ))}
      {tab === 'bots' && <Manager<BotPreset> config={configs.bots} />}
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Tracking only — apply loadouts in game.
      </p>
    </div>
  );
}
