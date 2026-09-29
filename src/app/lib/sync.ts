'use client';

import type { Run } from '../hooks/useLocalStorage';
import type { Tournament } from '../components/TournamentTab';

export const SYNC_PASS_KEY = 'towerpath:sync:pass';
export const SYNC_LASTPUSH_KEY = 'towerpath:sync:lastpush';
export const SYNC_LASTSYNC_KEY = 'towerpath:sync:lastsync';

export interface CollectionEnvelope<T> {
  updatedAt: number;
  data: T;
}

export interface SyncBundle {
  runs?: CollectionEnvelope<Run[]>;
  tournaments?: CollectionEnvelope<Tournament[]>;
  cards?: CollectionEnvelope<Record<string, number>>;
  uwUnlocked?: CollectionEnvelope<Record<string, boolean>>;
  uwSynced?: CollectionEnvelope<Record<string, boolean>>;
  stats?: CollectionEnvelope<Record<string, number>>;
  checks?: CollectionEnvelope<Record<string, boolean>>;
}

export type SyncCollection = keyof SyncBundle;

const STAT_KEYS = [
  'towerpath:stats:damage',
  'towerpath:stats:aspd',
  'towerpath:stats:cpk',
  'towerpath:stats:stones',
  'towerpath:stats:coins',
  'towerpath:stats:gtcd',
  'towerpath:stats:bhcd',
] as const;

/** Derive the cloud bucket id from a passphrase. The passphrase itself never leaves the device. */
export async function bucketId(passphrase: string): Promise<string> {
  const bytes = new TextEncoder().encode(`towerpath/v1/${passphrase}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeKey(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('towerpath:store', { detail: key }));
  } catch {
    // ignore
  }
}

/** Gather everything syncable from this browser into a timestamped bundle. */
export function collectLocalBundle(): SyncBundle {
  const now = Date.now();
  const stats: Record<string, number> = {};
  for (const k of STAT_KEYS) {
    const v = readKey<number | null>(k, null);
    if (typeof v === 'number') stats[k] = v;
  }
  return {
    runs: { updatedAt: now, data: readKey<Run[]>('towerpath:runs', []) },
    tournaments: { updatedAt: now, data: readKey<Tournament[]>('towerpath:tournaments', []) },
    cards: { updatedAt: now, data: readKey<Record<string, number>>('towerpath:cards', {}) },
    uwUnlocked: { updatedAt: now, data: readKey<Record<string, boolean>>('towerpath:uw:unlocked', {}) },
    uwSynced: { updatedAt: now, data: readKey<Record<string, boolean>>('towerpath:uw:synced', {}) },
    stats: { updatedAt: now, data: stats },
    checks: { updatedAt: now, data: readKey<Record<string, boolean>>('towerpath:tourney:prep', {}) },
  };
}

/** Merge a pulled bundle into this browser. Lists union by id; maps follow newest timestamps. */
export function mergePulledBundle(remote: SyncBundle): { merged: SyncCollection[] } {
  const merged: SyncCollection[] = [];
  const lastPush = readKey<number>(SYNC_LASTPUSH_KEY, 0);

  const unionRuns = (local: Run[], incoming: Run[] | undefined) => {
    if (!incoming) return local;
    const seen = new Set(local.map((r) => r.id));
    const fresh = incoming.filter((r) => r && typeof r.id === 'string' && !seen.has(r.id));
    return [...fresh, ...local].slice(0, 500);
  };

  if (remote.runs) {
    const local = readKey<Run[]>('towerpath:runs', []);
    const next = unionRuns(
      local,
      (remote.runs.data as Run[]).map((r) => ({ source: 'json' as const, ...r }))
    );
    if (next.length !== local.length) {
      writeKey('towerpath:runs', next);
      merged.push('runs');
    }
  }
  if (remote.tournaments) {
    const local = readKey<Tournament[]>('towerpath:tournaments', []);
    const seen = new Set(local.map((t) => t.id));
    const fresh = (remote.tournaments.data as Tournament[]).filter((t) => t && typeof t.id === 'string' && !seen.has(t.id));
    if (fresh.length > 0) {
      writeKey('towerpath:tournaments', [...fresh, ...local].slice(0, 256));
      merged.push('tournaments');
    }
  }

  const adoptIfNewer = (key: SyncCollection, storageKey: string) => {
    const env = remote[key] as CollectionEnvelope<Record<string, unknown>> | undefined;
    if (!env || typeof env.updatedAt !== 'number') return;
    if (env.updatedAt > lastPush) {
      writeKey(storageKey, env.data ?? {});
      merged.push(key);
    }
  };
  adoptIfNewer('cards', 'towerpath:cards');
  adoptIfNewer('uwUnlocked', 'towerpath:uw:unlocked');
  adoptIfNewer('uwSynced', 'towerpath:uw:synced');
  adoptIfNewer('checks', 'towerpath:tourney:prep');
  if (remote.stats && typeof remote.stats.updatedAt === 'number' && remote.stats.updatedAt > lastPush) {
    const stats = (remote.stats.data ?? {}) as Record<string, number>;
    for (const [k, v] of Object.entries(stats)) {
      if (STAT_KEYS.includes(k as (typeof STAT_KEYS)[number]) && typeof v === 'number') {
        writeKey(k, v);
      }
    }
    merged.push('stats');
  }
  return { merged };
}

export async function pushBundle(bucket: string, bundle: SyncBundle): Promise<{ ok: boolean; error?: string; kept?: Record<string, number> }> {
  const res = await fetch('/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, bundle }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: (err as { error?: string }).error ?? `push failed (${res.status})` };
  }
  const data = (await res.json()) as { kept?: Record<string, number> };
  try {
    localStorage.setItem(SYNC_LASTPUSH_KEY, JSON.stringify(Date.now()));
  } catch {
    // ignore
  }
  return { ok: true, kept: data.kept };
}

export async function pullBundle(bucket: string): Promise<{ ok: boolean; error?: string; bundle?: SyncBundle; empty?: boolean }> {
  const res = await fetch(`/api/sync/pull?bucket=${encodeURIComponent(bucket)}`);
  if (res.status === 404) return { ok: true, empty: true };
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: (err as { error?: string }).error ?? `pull failed (${res.status})` };
  }
  const data = (await res.json()) as { bundle?: SyncBundle };
  return { ok: true, bundle: data.bundle };
}

export async function checkSyncBackend(): Promise<boolean> {
  try {
    // Valid-shaped but nonexistent bucket: 404 = backend configured, 503 = not configured.
    const res = await fetch(`/api/sync/pull?bucket=${'a'.repeat(64)}`);
    return res.status === 404 || res.ok;
  } catch {
    return false;
  }
}
