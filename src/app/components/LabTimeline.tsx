'use client';

import { useMemo } from 'react';
import { buildBlocks, labColor } from '../lib/labs';

interface SlotLike {
  lab: string;
  current: number;
  target: number;
  speed: number;
}

function fmtDay(d: number): string {
  if (d <= 0) return 'today';
  if (d < 1) return 'later today';
  if (d < 14) return `day ${Math.ceil(d)}`;
  if (d < 60) return `week ${Math.ceil(d / 7)}`;
  return `month ${Math.ceil(d / 30)}`;
}

export function LabTimeline({ slots, globalSpeed }: { slots: SlotLike[]; globalSpeed: number }) {
  const blocks = useMemo(() => buildBlocks(slots, globalSpeed), [slots, globalSpeed]);
  const horizon = Math.max(1, ...blocks.map((b) => b.endDay));
  if (blocks.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">
        All slots are at target — set new targets above to see the timeline.
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <h2 className="font-['Orbitron'] text-lg font-bold mb-4">Research timeline</h2>
      <div className="space-y-3">
        {blocks.map((b) => (
          <div key={b.slot}>
            <div className="flex items-baseline justify-between text-xs mb-1">
              <span className="font-bold">
                Slot {b.slot + 1} · {b.lab} <span className="text-[var(--color-text-muted)]">Lv{b.from}→{b.to}</span>
              </span>
              <span className="text-[var(--color-text-muted)]">finishes {fmtDay(b.endDay)}</span>
            </div>
            <div className="h-4 rounded-md bg-[var(--color-bg)] overflow-hidden">
              <div
                className="h-full rounded-md"
                title={`${b.lab}: ${fmtDay(b.startDay)} → ${fmtDay(b.endDay)}`}
                style={{
                  marginLeft: `${(b.startDay / horizon) * 100}%`,
                  width: `${Math.max(2, ((b.endDay - b.startDay) / horizon) * 100)}%`,
                  background: labColor(b.lab),
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--color-text-dim)] mt-3">
        Bars share one scale ({fmtDay(horizon)} horizon); each lab keeps its color everywhere.
      </p>
    </div>
  );
}
