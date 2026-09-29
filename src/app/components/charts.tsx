'use client';

import { useMemo, useState } from 'react';
import { formatBig } from '../hooks/useLocalStorage';

export interface ChartPoint {
  x: string;
  y: number;
  hint?: string;
}

export interface ChartSeries {
  label: string;
  color: string;
  points: ChartPoint[];
}

const W = 640;
const H = 240;
const PAD_L = 52;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max * 1.02; v += step) ticks.push(v);
  return ticks;
}

export function LineChart({
  series,
  height = 240,
  onPointClick,
}: {
  series: ChartSeries[];
  height?: number;
  onPointClick?: (seriesIndex: number, pointIndex: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const model = useMemo(() => {
    const n = Math.max(0, ...series.map((s) => s.points.length));
    const maxY = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.y)));
    const ticks = niceTicks(maxY);
    const top = ticks[ticks.length - 1] || maxY;
    const iw = W - PAD_L - PAD_R;
    const ih = H - PAD_T - PAD_B;
    const xs = (i: number) => (n <= 1 ? PAD_L : PAD_L + (i / (n - 1)) * iw);
    const ys = (v: number) => PAD_T + ih - (v / top) * ih;
    const paths = series.map((s) =>
      s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.y).toFixed(1)}`).join(' ')
    );
    const labels = series[0]?.points.map((p) => p.x) ?? [];
    const showEvery = Math.max(1, Math.ceil(labels.length / 6));
    return { n, ticks, top, xs, ys, paths, labels, showEvery };
  }, [series]);

  if (model.n === 0) {
    return <div className="text-sm text-[var(--color-text-muted)] py-8 text-center">Not enough data yet.</div>;
  }

  const hov = hover != null ? Math.max(0, Math.min(model.n - 1, hover)) : null;

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const frac = (px - PAD_L) / (W - PAD_L - PAD_R);
          setHover(Math.round(frac * (model.n - 1)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        {model.ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={model.ys(t)}
              y2={model.ys(t)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={model.ys(t) + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-text-muted)"
            >
              {formatBig(t)}
            </text>
          </g>
        ))}
        {model.paths.map((d, si) => (
          <path key={si} d={d} fill="none" stroke={series[si].color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s, si) =>
          s.points.map((p, i) => (
            <circle
              key={`${si}-${i}`}
              cx={model.xs(i)}
              cy={model.ys(p.y)}
              r={hov === i ? 5 : 3}
              fill="var(--color-bg-card)"
              stroke={s.color}
              strokeWidth={2}
              style={{ cursor: onPointClick ? 'pointer' : 'default' }}
              onClick={onPointClick ? () => onPointClick(si, i) : undefined}
            />
          ))
        )}
        {hov != null && (
          <line
            x1={model.xs(hov)}
            x2={model.xs(hov)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="var(--color-text-muted)"
            strokeDasharray="3 3"
          />
        )}
        {model.labels.map((l, i) =>
          i % model.showEvery === 0 ? (
            <text
              key={i}
              x={model.xs(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--color-text-muted)"
            >
              {l}
            </text>
          ) : null
        )}
      </svg>
      {hov != null && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs shadow-xl"
          style={{
            left: `min(max(${(model.xs(hov) / W) * 100}%, 90px), calc(100% - 150px))`,
            top: 0,
          }}
        >
          <div className="font-bold mb-1">{model.labels[hov]}</div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="text-[var(--color-text-dim)]">{s.label}:</span>
              <span className="font-['Orbitron'] font-bold">{formatBig(s.points[hov]?.y ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4 mt-2 flex-wrap">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
