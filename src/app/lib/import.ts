'use client';

export const STRATEGIES = ['Blender', 'Glass Cannon', 'Devo', 'Orbless', 'eHP', 'Hybrid'] as const;
export type Strategy = (typeof STRATEGIES)[number];

const GAME_UNIT_MULT: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  ['K', 'M', 'B', 'T', 'q', 'Q', 's', 'S', 'O', 'N', 'D'].forEach((u, i) => {
    m[u] = 1000 ** (i + 1);
  });
  'bcdefghijklmnopqrstuvwxyz'.split('').forEach((ch, i) => {
    m[`a${ch}`] = 1000 ** (12 + i);
  });
  return m;
})();

// Lenient lowercase aliases (game output is case-sensitive: q≠Q, s≠S).
const UNIT_ALIAS: Record<string, string> = { k: 'K', m: 'M', b: 'B', t: 'T', o: 'O', n: 'N', d: 'D' };

/** Parse "412.8T", "1,234", "$2.4B", "61.2B" style values into plain numbers. Case-sensitive like the game. */
export function parseBig(input: string): number | null {
  if (!input) return null;
  const m = input.replace(/[$©,\s]/g, '').match(/^(\d+(?:\.\d+)?)([A-Za-z]{1,2})?$/);
  if (!m) return null;
  const base = Number(m[1]);
  if (!Number.isFinite(base)) return null;
  if (!m[2]) return base;
  const mult = GAME_UNIT_MULT[m[2]] ?? (UNIT_ALIAS[m[2]] ? GAME_UNIT_MULT[UNIT_ALIAS[m[2]]] : undefined);
  return mult === undefined ? null : base * mult;
}

export interface ParsedReport {
  tier: number | null;
  wave: number | null;
  coins: number | null;
  cells: number | null;
  durationMin: number | null;
  strategy: string;
  issues: string[];
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? (m[1] ?? m[0]) : null;
}

/** Best-effort parse of a pasted end-of-run battle report (any layout/language-ish). */
export function parseBattleReport(text: string): ParsedReport {
  const issues: string[] = [];
  const t = text.replace(/\r/g, '');

  const tierRaw = firstMatch(t, /tier\s*[:#]?\s*(\d+)/i);
  const waveRaw = firstMatch(t, /wave\s*[:#]?\s*([\d,]+)/i);
  const coinsRaw = firstMatch(t, /coins?\s*[:#]?\s*\$?\s*([\d,]+\.?\d*\s*[A-Za-z]{0,2})/i);
  const cellsRaw = firstMatch(t, /cells?\s*[:#]?\s*([\d,]+\.?\d*\s*[A-Za-z]{0,2})/i);

  let durationMin: number | null = null;
  const hm = t.match(/(\d+)\s*h(?:ours?|rs?)?\s*(\d+)?\s*m(?:in(?:utes?)?)?/i);
  if (hm) {
    durationMin = Number(hm[1]) * 60 + (hm[2] ? Number(hm[2]) : 0);
  } else {
    const dm = firstMatch(t, /duration\s*[:#]?\s*([\d,]+)/i);
    if (dm) durationMin = Number(dm.replace(/,/g, ''));
    else {
      const mm = firstMatch(t, /(\d+)\s*min/i);
      if (mm) durationMin = Number(mm);
    }
  }

  const tier = tierRaw ? Number(tierRaw) : null;
  const wave = waveRaw ? Number(waveRaw.replace(/,/g, '')) : null;
  const coins = coinsRaw ? parseBig(coinsRaw) : null;
  const cells = cellsRaw ? parseBig(cellsRaw) : null;

  const stratHit = STRATEGIES.find((s) => new RegExp(s.replace(/ /g, '\\s*'), 'i').test(t));

  if (tier == null || !Number.isFinite(tier)) issues.push('Tier not found — check it manually.');
  if (wave == null || !Number.isFinite(wave)) issues.push('Wave not found — check it manually.');
  if (coins == null) issues.push('Coins not found — check it manually.');
  if (durationMin == null || durationMin <= 0) issues.push('Duration not found — needed for coins/hr.');

  return {
    tier: tier != null && Number.isFinite(tier) ? tier : null,
    wave: wave != null && Number.isFinite(wave) ? wave : null,
    coins: coins ?? null,
    cells: cells ?? null,
    durationMin: durationMin != null && durationMin > 0 ? durationMin : null,
    strategy: stratHit ?? '',
    issues,
  };
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  runs: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export function isValidBackup(obj: unknown): obj is BackupData {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o.runs)) return false;
  return o.runs.every(
    (r) =>
      typeof r === 'object' &&
      r !== null &&
      typeof (r as Record<string, unknown>).tier === 'number' &&
      typeof (r as Record<string, unknown>).wave === 'number'
  );
}

const BACKUP_KEY_MAP: Record<string, string> = {
  runs: 'towerpath:runs',
  cards: 'towerpath:cards',
  uwUnlocked: 'towerpath:uw:unlocked',
  uwSynced: 'towerpath:uw:synced',
  stats: 'towerpath:stats',
};

export function collectBackup(): BackupData {
  const data: BackupData = { version: 1, exportedAt: new Date().toISOString(), runs: [] };
  try {
    for (const [field, storageKey] of Object.entries(BACKUP_KEY_MAP)) {
      if (field === 'runs') {
        const raw = localStorage.getItem(storageKey);
        data.runs = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      } else {
        const raw = localStorage.getItem(storageKey);
        if (raw != null) data[field] = JSON.parse(raw);
      }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('towerpath:stats:') && !(k in data)) {
        try {
          data[k] = JSON.parse(localStorage.getItem(k) as string);
        } catch {
          // skip unreadable values
        }
      }
    }
  } catch {
    // return partial backup rather than nothing
  }
  return data;
}

export function restoreBackup(data: BackupData): string[] {
  const restored: string[] = [];
  try {
    localStorage.setItem(BACKUP_KEY_MAP.runs, JSON.stringify(data.runs.slice(0, 500)));
    restored.push(`runs (${data.runs.length})`);
    for (const [field, storageKey] of Object.entries(BACKUP_KEY_MAP)) {
      if (field === 'runs') continue;
      if (data[field] !== undefined) {
        localStorage.setItem(storageKey, JSON.stringify(data[field]));
        restored.push(field);
      }
    }
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith('towerpath:stats:')) {
        localStorage.setItem(k, JSON.stringify(v));
        restored.push(k.replace('towerpath:stats:', 'stat:'));
      }
    }
  } catch {
    // storage unavailable
  }
  return restored;
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
