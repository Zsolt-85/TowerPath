'use client';

import { useMemo, useRef, useState } from 'react';
import {
  STRATEGIES,
  isValidBackup,
  restoreBackup,
  type BackupData,
} from '../lib/import';
import { parseFullReport } from '../lib/battleReport';
import type { RunType } from '../hooks/useLocalStorage';
import { useRuns, formatBig, type Run } from '../hooks/useLocalStorage';
import { decodeSaveFile, type DecodedAccount } from '../lib/playersave';

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-['Orbitron'] focus:border-[var(--color-gold)] focus:outline-none transition-all";

function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('towerpath:store', { detail: key }));
  } catch {
    // storage unavailable: ignore
  }
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function SaveFilePanel({ onApplied }: { onApplied: (msg: string) => void }) {
  const saveRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'idle' | 'working' | 'preview' | 'error'>('idle');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [account, setAccount] = useState<DecodedAccount | null>(null);

  const onPick = async (f: File | undefined) => {
    if (!f) return;
    setPhase('working');
    setError('');
    setAccount(null);
    setFileName(f.name);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const decoded = await decodeSaveFile(buf);
      setAccount(decoded);
      setPhase('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not decode this file.');
      setPhase('error');
    }
  };

  const apply = () => {
    if (!account) return;
    const cards = readStore<Record<string, number>>('towerpath:cards', {});
    for (const [name, stars] of Object.entries(account.cards)) cards[name] = stars;
    writeStore('towerpath:cards', cards);

    const uws = readStore<Record<string, boolean>>('towerpath:uw:unlocked', {});
    for (const [name, unlocked] of Object.entries(account.uwsUnlocked)) {
      if (unlocked) uws[name] = true;
    }
    writeStore('towerpath:uw:unlocked', uws);

    writeStore('towerpath:save', { ...account, fileName, importedAt: new Date().toISOString() });

    const ownedCards = Object.values(account.cards).filter((s) => s > 0).length;
    const unlockedUws = Object.values(account.uwsUnlocked).filter(Boolean).length;
    onApplied(
      `Account applied ✓ ${ownedCards} cards, ${unlockedUws} UWs unlocked` +
        (account.profile.userName ? ` — welcome, ${account.profile.userName}` : '')
    );
    setPhase('idle');
    setAccount(null);
  };

  return (
    <>
      <input
        ref={saveRef}
        type="file"
        accept=".dat,application/octet-stream"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {phase !== 'preview' && (
        <button
          onClick={() => saveRef.current?.click()}
          disabled={phase === 'working'}
          className="w-full px-4 py-6 rounded-xl border border-dashed border-[var(--color-border-light)] text-sm text-[var(--color-text-dim)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all disabled:opacity-50"
        >
          {phase === 'working' ? '⏳ Decoding save…' : '📂 Choose playerInfo.dat from your device'}
        </button>
      )}
      {phase === 'error' && (
        <div className="mt-4 rounded-xl border border-[var(--color-red)]/40 bg-[var(--color-red-glow)] p-4 text-xs text-[var(--color-text)] leading-relaxed">
          <strong style={{ color: 'var(--color-red)' }}>Could not read this file.</strong>
          <div className="mt-1 text-[var(--color-text-dim)]">{error}</div>
          <div className="mt-2 text-[var(--color-text-dim)]">
            It must be the game playerInfo.dat file (Android/data/com.TechTreeGames.TheTower/files/). TowerPath backup .json files go in the other tab.
          </div>
        </div>
      )}
      {phase === 'preview' && account && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
            Found in {fileName} — check before applying
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Profile', value: account.profile.userName || '—' },
              { label: 'Cards owned', value: String(Object.values(account.cards).filter((s) => s > 0).length) },
              { label: 'UWs unlocked', value: String(Object.values(account.uwsUnlocked).filter(Boolean).length) },
              { label: 'Labs tracked', value: String(account.labs.length) },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-[var(--color-border)] p-3">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{s.label}</div>
                <div className="font-['Orbitron'] text-base font-bold mt-1 truncate">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-[var(--color-text-dim)] mb-4">
            Workshop levels ({account.workshop.attack.length}/{account.workshop.defense.length}/{account.workshop.utility.length}) and lab levels are stored for the upcoming planners.
          </div>
          <div className="flex gap-3">
            <button
              onClick={apply}
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] text-sm font-bold hover:bg-[#ffc000] transition-all"
            >
              Apply to my account
            </button>
            <button
              onClick={() => { setPhase('idle'); setAccount(null); }}
              className="px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-text-muted)] transition-all"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setRuns] = useRuns();
  const [tab, setTab] = useState<'paste' | 'json' | 'save'>('paste');
  const [text, setText] = useState('');
  const [strategy, setStrategy] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [runType, setRunType] = useState<RunType>('farm');
  const parsed = useMemo(() => (text.trim() ? parseFullReport(text) : null), [text]);

  const [tier, setTier] = useState<number | null>(null);
  const [wave, setWave] = useState<number | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [cells, setCells] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  // Seed editable fields when a new paste is parsed. This is React's
  // documented "adjust state during render" pattern: it re-renders immediately
  // with the seeded draft, then leaves user edits alone (seedKey guard).
  const [seedKey, setSeedKey] = useState('');
  const curKey = useMemo(
    () => [parsed?.tier, parsed?.wave, parsed?.coins, parsed?.cells, parsed?.durationMin].join('|'),
    [parsed]
  );
  if (parsed && curKey !== seedKey) {
    setSeedKey(curKey);
    setTier(parsed.tier);
    setWave(parsed.wave);
    setCoins(parsed.coins);
    setCells(parsed.cells);
    setDurationMin(parsed.durationMin);
  }

  if (!open) return null;

  const valid = tier != null && tier > 0 && wave != null && wave > 0 && coins != null && coins >= 0;

  const savePaste = () => {
    if (!valid) return;
    const run: Run = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      tier,
      wave,
      coins,
      durationMin: durationMin && durationMin > 0 ? durationMin : 1,
      cells: cells ?? undefined,
      strategy: strategy || undefined,
      source: 'paste',
      runType,
      detail: parsed && Object.keys(parsed.detail).length > 0 ? parsed.detail : undefined,
    };
    setRuns((prev) => [run, ...prev].slice(0, 500));
    setText('');
    setStrategy('');
    setSavedMsg('Run imported ✓');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result)) as unknown;
        if (!isValidBackup(obj)) {
          setSavedMsg('That file is not a TowerPath backup.');
          return;
        }
        const data = obj as BackupData;
        setRuns((prev) => {
          const seen = new Set(prev.map((r) => `${r.tier}-${r.wave}-${r.date}`));
          const fresh = (data.runs as unknown as Run[]).filter(
            (r) => !seen.has(`${r.tier}-${r.wave}-${r.date}`)
          );
          return [...fresh, ...prev].slice(0, 500);
        });
        const restored = restoreBackup(data);
        setSavedMsg(`Imported ✓ (${restored.join(', ')})`);
      } catch {
        setSavedMsg('Could not read that file.');
      }
      setTimeout(() => setSavedMsg(''), 3000);
    };
    reader.readAsText(f);
  };

  const numOrNull = (v: string): number | null => {
    if (v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Import</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-5">
          Load your playerInfo.dat save, paste a battle report, or restore a backup. Everything stays in your browser.
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['paste', 'json', 'save'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-4 py-2 rounded-lg border transition-all ${
                tab === t
                  ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              {t === 'paste' ? 'Battle report' : t === 'json' ? 'Backup (.json)' : 'Save file (.dat)'}
            </button>
          ))}
        </div>

        {tab === 'paste' ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={'Paste the end-of-run stats text here, e.g.\nTier 11\nWave 7,842\nCoins 412.8T\nCells 61.2B\nTime 6h 12m'}
              className={`${inputCls} font-sans resize-y`}
            />
            {parsed && (
              <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Preview — check before saving
                </div>
                <div className="text-xs mb-4" style={{ color: 'var(--color-teal)' }}>
                  {parsed.stats.fieldsParsed} fields across {parsed.stats.sectionsFound.length} sections
                  {parsed.stats.unmapped.length > 0 ? ` · ${parsed.stats.unmapped.length} unparsed (${parsed.stats.unmapped.slice(0, 3).join('; ')}${parsed.stats.unmapped.length > 3 ? '…' : ''})` : ' · everything mapped ✓'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Tier', value: tier, set: setTier, bad: tier == null, fmt: false },
                    { label: 'Wave', value: wave, set: setWave, bad: wave == null, fmt: true },
                    { label: 'Coins', value: coins, set: setCoins, bad: coins == null, fmt: true },
                    { label: 'Cells', value: cells, set: setCells, bad: false, fmt: true },
                    { label: 'Minutes', value: durationMin, set: setDurationMin, bad: durationMin == null, fmt: false },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">
                        {f.label}
                        {f.fmt && f.value != null && (
                          <span className="ml-1 font-bold" style={{ color: 'var(--color-gold)' }}>
                            ={formatBig(f.value)}
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={f.value ?? ''}
                        placeholder="—"
                        onChange={(e) => f.set(numOrNull(e.target.value))}
                        className={`${inputCls} ${f.bad ? '!border-[var(--color-red)]' : ''}`}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">Strategy</label>
                    <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className={inputCls}>
                      <option value="">Unknown</option>
                      {STRATEGIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--color-text-muted)] block mb-1">Run type</label>
                    <select value={runType} onChange={(e) => setRunType(e.target.value as RunType)} className={inputCls}>
                      <option value="farm">Farming</option>
                      <option value="tournament">Tournament</option>
                      <option value="dissonance">Dissonance</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={savePaste}
                disabled={!valid}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] text-sm font-bold hover:bg-[#ffc000] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Run
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-text-muted)] transition-all"
              >
                Close
              </button>
            </div>
          </>
        ) : tab === 'json' ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full px-4 py-6 rounded-xl border border-dashed border-[var(--color-border-light)] text-sm text-[var(--color-text-dim)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all"
            >
              📂 Choose a TowerPath backup .json file
            </button>
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-text-muted)] transition-all"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <SaveFilePanel
              onApplied={(msg) => {
                setSavedMsg(msg);
                setTimeout(() => setSavedMsg(''), 4000);
              }}
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-text-muted)] transition-all"
              >
                Close
              </button>
            </div>
          </>
        )}
        {savedMsg && <div className="mt-4 text-xs font-semibold text-[var(--color-teal)]">{savedMsg}</div>}
      </div>
    </div>
  );
}
