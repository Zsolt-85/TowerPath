# Preset Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Named, switchable loadout presets for cards, workshop, and bots — manual tracking first, save-file import only for fields proven to exist.

**Architecture:** Task 1 discovers which preset fields actually exist (throwaway Node inspection of `tower-idle-toolkit` + NRBF field dump — no guessing). Tasks 2–3 build the manual preset store + Presets tab; Task 4 wires save import only for discovered fields.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars, localStorage via `useLocalStorage`.

**Spec:** `docs/superpowers/specs/2026-10-07-rend-parity-spec.md` (SP-5).

## Global Constraints

Spec §Global constraints applies in full. Never claim a save field exists without the Task 1
evidence; anything not found stays manual-only.

---

### Task 1: Discover preset fields (no product code)

**Files:**
- Test: throwaway Node scripts only (deleted afterwards). No repo changes.

- [ ] **Step 1: Inspect `tower-idle-toolkit` for preset schemas**

Run:

```bash
grep -ri "preset" node_modules/tower-idle-toolkit/dist --include="*.d.ts" -l | head -20
```

(If `grep` is unavailable on the machine, use the repo's `Grep` tool with pattern `preset`,
path `node_modules/tower-idle-toolkit`, include `*.d.ts`.) For each hit file, read the matching
type declarations and record: exact field names for card presets, module presets, workshop
presets, guardian presets, bot presets.

- [ ] **Step 2: Dump NRBF string fields containing "reset"**

Write `C:\Users\maias\AppData\Local\Temp\opencode\preset-dump.js`:

```js
const { execSync } = require('child_process');
// Lists candidate PlayerData fields from the toolkit's ownESP mapping files, if any:
try {
  const out = execSync('grep -rhoi "[A-Za-z]*[Pp]reset[A-Za-z]*" node_modules/tower-idle-toolkit --include="*.d.ts" | sort -u', { cwd: 'C:\\Projects\\The Tower' });
  console.log(String(out));
} catch (e) {
  console.log('NO-TOOLKIT-HITS');
}
```

Run with `node`, keep the output, delete the file afterwards.

- [ ] **Step 3: Write up the finding as a commit message decision**

Decide and record in the Task 2 commit message: either `preset import: <field> wired` or
`preset import: no preset fields found (<what was checked>) — manual only`. No code in this task.

Expected: a concrete found/not-found list, not assumptions.

### Task 2: Preset store (`lib/presets.ts`)

**Files:**
- Create: `src/app/lib/presets.ts`
- Test: throwaway Node script (deleted afterwards)

**Interfaces:**
- Consumes: nothing (pure types + CRUD over caller-supplied state).
- Produces: `PresetType`, `CardPreset`, `WorkshopPreset`, `BotPreset`, `crud` helpers `createPreset`, `renamePreset`, `deletePreset`, `setActive` — consumed by Task 3.

- [ ] **Step 1: Write the store file**

```ts
export type PresetType = 'cards' | 'workshop' | 'bots';

export interface CardPreset {
  id: string;
  name: string;
  stars: Record<string, number>;
  updatedAt: string;
}

export interface WorkshopPreset {
  id: string;
  name: string;
  levels: Record<string, number>;
  updatedAt: string;
}

export interface BotPreset {
  id: string;
  name: string;
  picks: Record<string, number>;
  updatedAt: string;
}

export type AnyPreset = CardPreset | WorkshopPreset | BotPreset;

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function createPreset<T extends AnyPreset>(list: T[], base: Omit<T, 'id' | 'updatedAt'>): T[] {
  const now = new Date().toISOString();
  return [...list, { ...base, id: newId(), updatedAt: now } as T];
}

export function renamePreset<T extends AnyPreset>(list: T[], id: string, name: string): T[] {
  const clean = name.trim().slice(0, 40);
  if (!clean) return list;
  return list.map((p) => (p.id === id ? { ...p, name: clean } : p));
}

export function deletePreset<T extends AnyPreset>(list: T[], id: string): T[] {
  return list.filter((p) => p.id !== id);
}

export function setActive<T extends AnyPreset>(list: T[], id: string): T[] {
  if (!list.some((p) => p.id === id)) return list;
  return list.map((p) => ({ ...p }));
}

export const PRESET_KEYS: Record<PresetType, string> = {
  cards: 'towerpath:presets:cards',
  workshop: 'towerpath:presets:workshop',
  bots: 'towerpath:presets:bots',
};

export const ACTIVE_KEYS: Record<PresetType, string> = {
  cards: 'towerpath:presets:cards:active',
  workshop: 'towerpath:presets:workshop:active',
  bots: 'towerpath:presets:bots:active',
};
```

Note: `setActive` keeps list order untouched; the active id itself lives in the `ACTIVE_KEYS`
store (a plain string via `useLocalStorage<string>(key, '')`), so activating never rewrites presets.

- [ ] **Step 2: Verify CRUD with a throwaway Node script**

Port `createPreset`/`renamePreset`/`deletePreset`/`setActive` into
`C:\Users\maias\AppData\Local\Temp\opencode\preset-test.js` and assert: create appends with
non-empty id; rename trims to 40 chars and ignores blank names; delete removes only the id;
setActive with unknown id returns the list unchanged. Delete the file afterwards.

Expected: all assertions print PASS.
- [ ] **Step 3: Run `npx tsc --noEmit`**

Expected: exit 0.
- [ ] **Step 4: Commit**

```bash
git add src/app/lib/presets.ts
git commit -m "Preset store with cards/workshop/bots types"
```

### Task 3: PresetsTab UI + wiring + verify live

**Files:**
- Create: `src/app/components/PresetsTab.tsx`
- Modify: `src/app/components/Sidebar.tsx` (add `{ id: 'presets', label: 'Presets', icon: '🗂' }` to the Collect section of `NAV_SECTIONS`)
- Modify: `src/app/page.tsx` (import `PresetsTab`, add `presets: 'Presets'` to `TITLES`, render `{activeTab === 'presets' && <PresetsTab />}`)

**Interfaces:**
- Consumes: store from Task 2; live `towerpath:cards` for "snapshot current cards" seeding; `BOTS` names from `src/app/data/bots-data.ts` — read that file first and use its exact export (if the export differs, adjust the import line and note it in the commit, never invent names); workshop upgrade names from `allSpecs()` in `src/app/lib/workshop.ts` (only if the Workshop plan already landed — otherwise cards+bots tabs only, and workshop presets arrive with that plan; check before writing).
- Produces: working Presets tab — verified in Step 4.

- [ ] **Step 1: Write the component**

One generic manager handles all three types (no per-type duplication). Read the exact card-name
export from `src/app/data/cards-data.ts` and the exact bot-names export from
`src/app/data/bots-data.ts` first; the `items` arrays below must use those real names verbatim:

```tsx
'use client';

import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  createPreset,
  renamePreset,
  deletePreset,
  PRESET_KEYS,
  ACTIVE_KEYS,
  type AnyPreset,
  type PresetType,
} from '../lib/presets';

interface TypeConfig {
  type: PresetType;
  label: string;
  items: string[];
  maxPerItem: number;
  empty: Record<string, number>;
}

function Manager<T extends AnyPreset>({ config }: { config: TypeConfig }) {
  const [list, setList] = useLocalStorage<T[]>(PRESET_KEYS[config.type], []);
  const [activeId, setActiveId] = useLocalStorage<string>(ACTIVE_KEYS[config.type], '');
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rename, setRename] = useState('');

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

  return (
    <div className="space-y-3">
      <button onClick={startNew} className="text-xs text-[var(--color-gold)] border border-[var(--color-gold-dim)] rounded-lg px-4 py-2 hover:bg-[var(--color-gold-glow)] transition-all">
        ＋ New {config.label} preset
      </button>
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
            <button onClick={() => setList((prev) => deletePreset(prev, p.id))} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] px-2 py-1 transition-colors">✕</button>
          </div>
          {editingId === p.id && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {config.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)] flex-1 truncate">{item}</span>
                  <input
                    type="number"
                    min={0}
                    max={config.maxPerItem}
                    value={draft[item] ?? 0}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(config.maxPerItem, Math.floor(Number(e.target.value) || 0)));
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
```

Then the tab itself wires three configs (cards: maxPerItem 7; workshop: maxPerItem large, e.g. 9999,
items from `allSpecs()` names when the Workshop plan has landed, otherwise that sub-tab renders
the disabled message; bots: maxPerItem 100):

```tsx
export function PresetsTab() {
  const [tab, setTab] = useState<PresetType>('cards');
  // configs built here from the real data exports; workshop config only if allSpecs() is non-empty
  return (
    <div className="space-y-8 animate-fade-in">
      {/* sub-tab buttons for cards/workshop/bots, then <Manager config={configs[tab]} /> */}
      <p className="text-[11px] text-[var(--color-text-dim)]">
        Tracking only — apply loadouts in game.
      </p>
    </div>
  );
}
```

Cards additionally get a "Snapshot current cards" button that reads live `towerpath:cards` via the
same guarded `readStore` pattern used in `ImportModal.tsx` and writes it into the draft of the
preset being edited.

- [ ] **Step 2: Run `npx tsc --noEmit` then `npx next build`**

Expected: both exit 0.
- [ ] **Step 3: Commit and push**

```bash
git add src/app/components/PresetsTab.tsx src/app/components/Sidebar.tsx src/app/page.tsx
git commit -m "Preset tracking tab for cards/workshop/bots"
git push origin main
```

- [ ] **Step 4: Verify production bundle**

Wait ~4 min, fetch `https://tower-path.vercel.app/`, extract `/_next/static/*.js` URLs, download
each, count matches of `{id:"presets"`. Expected: exactly 1 hit.

### Task 4: Save-file preset import (only for Task 1 discoveries)

**Files:**
- Modify: `src/app/lib/playersave/extract.ts` and/or `mappings.ts` (only the fields proven in Task 1)
- Modify: `src/app/components/ImportModal.tsx` (merge discovered presets into the preset stores)

- [ ] **Step 1: Extend decode for proven fields only**

For each field from the Task 1 found-list (and no others): extract it in the playersave layer,
map it into `CardPreset`/`WorkshopPreset`/`BotPreset` bodies, and in the save-file apply step
create presets named `Save import <date>` (via `createPreset` from Task 2) instead of overwriting
anything. If Task 1 found nothing, delete this task with a commit message saying so
(`git commit --allow-empty -m "Preset save import skipped: no preset fields in save schema"`)
and stop — the plan is still complete.

- [ ] **Step 2: Run `npx tsc --noEmit` then `npx next build`**

Expected: both exit 0.
- [ ] **Step 3: Commit and push, then verify production as in Task 3 Step 4**
