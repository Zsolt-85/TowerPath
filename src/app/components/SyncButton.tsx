'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SYNC_PASS_KEY,
  SYNC_LASTSYNC_KEY,
  bucketId,
  checkSyncBackend,
  collectLocalBundle,
  mergePulledBundle,
  pullBundle,
  pushBundle,
} from '../lib/sync';

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function readLastSync(): number {
  try {
    const raw = localStorage.getItem(SYNC_LASTSYNC_KEY);
    return raw ? Number(JSON.parse(raw)) || 0 : 0;
  } catch {
    return 0;
  }
}

export function SyncButton() {
  const [backend, setBackend] = useState<boolean | null>(null);
  const [hasPass, setHasPass] = useState(() => readLS(SYNC_PASS_KEY) != null);
  const [open, setOpen] = useState(false);
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState<'push' | 'pull' | null>(null);
  const [msg, setMsg] = useState('');
  const [lastSync, setLastSync] = useState(readLastSync);
  const autoRan = useRef(false);

  const markSynced = useCallback(() => {
    const now = Date.now();
    setLastSync(now);
    try {
      localStorage.setItem(SYNC_LASTSYNC_KEY, JSON.stringify(now));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkSyncBackend().then(setBackend);
  }, []);

  const doPull = useCallback(
    async (phrase: string) => {
      setBusy('pull');
      setMsg('');
      try {
        const bucket = await bucketId(phrase);
        const res = await pullBundle(bucket);
        if (!res.ok) {
          setMsg(res.error ?? 'Pull failed.');
          return false;
        }
        if (res.empty || !res.bundle) {
          setMsg('Bucket is empty — push first to seed it.');
          return false;
        }
        const { merged } = mergePulledBundle(res.bundle);
        markSynced();
        setMsg(merged.length > 0 ? `Pulled ✓ (${merged.join(', ')})` : 'Already up to date ✓');
        return true;
      } catch {
        setMsg('Pull failed — are you online?');
        return false;
      } finally {
        setBusy(null);
      }
    },
    [markSynced]
  );

  // Auto-pull once on start when a passphrase is saved. Deferred past the
  // synchronous effect body so all state updates happen asynchronously.
  useEffect(() => {
    if (autoRan.current || backend !== true) return;
    const saved = readLS(SYNC_PASS_KEY);
    if (!saved) return;
    autoRan.current = true;
    void (async () => {
      await Promise.resolve();
      await doPull(saved);
    })();
  }, [backend, doPull]);

  const enable = async () => {
    if (pass.trim().length < 8) {
      setMsg('Use at least 8 characters — this protects your bucket.');
      return;
    }
    setBusy('push');
    setMsg('');
    try {
      try {
        localStorage.setItem(SYNC_PASS_KEY, pass);
      } catch {
        // ignore
      }
      setHasPass(true);
      const bucket = await bucketId(pass);
      const pulled = await pullBundle(bucket);
      if (pulled.ok && !pulled.empty && pulled.bundle) {
        const { merged } = mergePulledBundle(pulled.bundle);
        markSynced();
        setMsg(`Connected ✓ merged in (${merged.join(', ')})`);
      } else {
        const pushed = await pushBundle(bucket, collectLocalBundle());
        if (!pushed.ok) {
          setMsg(pushed.error ?? 'Push failed.');
          return;
        }
        markSynced();
        setMsg('Connected ✓ this device seeded the bucket');
      }
      setPass('');
    } finally {
      setBusy(null);
    }
  };

  const pushNow = async () => {
    const saved = readLS(SYNC_PASS_KEY);
    if (!saved) return;
    setBusy('push');
    setMsg('');
    const bucket = await bucketId(saved);
    const res = await pushBundle(bucket, collectLocalBundle());
    setBusy(null);
    if (res.ok) {
      markSynced();
      setMsg('Pushed ✓');
    } else {
      setMsg(res.error ?? 'Push failed.');
    }
  };

  const pullNow = async () => {
    const saved = readLS(SYNC_PASS_KEY);
    if (!saved) return;
    await doPull(saved);
  };

  const forget = () => {
    try {
      localStorage.removeItem(SYNC_PASS_KEY);
    } catch {
      // ignore
    }
    setHasPass(false);
    setMsg('Sync disabled on this browser. Cloud data is untouched.');
  };

  const label =
    backend === null ? '☁ …' : backend === false ? '☁ Off' : !hasPass ? '☁ Off' : lastSync > 0 ? `☁ ${timeAgo(lastSync)}` : '☁ On';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Cloud sync"
        className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] transition-all"
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-['Orbitron'] text-lg font-bold mb-1">Cloud sync</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">
              {backend === false
                ? 'The sync store is not configured on the server yet. Everything still works locally.'
                : 'Same passphrase on every device = same data. The phrase never leaves your browser; only its hash identifies your bucket. Runs merge by id; other collections follow the newest sync.'}
            </p>

            {backend !== false && !hasPass && (
              <>
                <label className="text-xs text-[var(--color-text-muted)] block mb-2">Sync passphrase (min 8 characters)</label>
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="e.g. tower-farmer-…"
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-gold-dim)] text-[var(--color-gold)] text-sm hover:bg-[var(--color-gold-glow)] transition-all"
                />
                <button
                  onClick={enable}
                  disabled={busy != null}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold text-sm hover:bg-[#ffc000] transition-all disabled:opacity-50"
                >
                  {busy ? 'Working…' : 'Enable sync'}
                </button>
              </>
            )}
            {backend !== false && hasPass && (
              <div className="flex gap-3">
                <button
                  onClick={pushNow}
                  disabled={busy != null}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold text-sm hover:bg-[#ffc000] transition-all disabled:opacity-50"
                >
                  {busy === 'push' ? 'Pushing…' : '⬆ Push'}
                </button>
                <button
                  onClick={pullNow}
                  disabled={busy != null}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all"
                >
                  {busy === 'pull' ? 'Pulling…' : '⬇ Pull'}
                </button>
              </div>
            )}
            {msg && <div className="mt-4 text-xs font-semibold text-[var(--color-teal)]">{msg}</div>}
            <div className="flex justify-between items-center mt-6">
              {hasPass ? (
                <button onClick={forget} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-red)] transition-colors">
                  Forget passphrase on this browser
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:border-[var(--color-text-muted)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}