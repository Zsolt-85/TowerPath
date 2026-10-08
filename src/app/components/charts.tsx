/**
 * TowerPath - Chart Components
 * World-class SVG charts: Line, Bar, Heatmap, Radar, Sankey
 * Zero dependencies, pure SVG + React
*/

'use client';

import { useMemo, useState } from 'react';
import { formatBig } from '@/app/hooks/useLocalStorage';

// ============================================
// UTILITIES
// ============================================

const W = 640;
const H = 240;
const PAD_L = 52;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;


function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  if (n < 1000) return n % 1 === 0 ? String(n) : n.toFixed(1);
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'N', 'D', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax', 'ay', 'az'];
  let v = n;
  let u = -1;
  while (v >= 1000 && u < 100) { v /= 1000; u++; }
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)}${units[u]}`;
}

// ============================================
// LINE CHART
// ============================================

interface LineChartProps {
  series: { label: string; color: string; points: { x: string; y: number; hint?: string }[]; axis?: 'left' | 'right' }[];
  height?: number;
  onPointClick?: (seriesIndex: number, pointIndex: number) => void;
}

export function LineChart({ series, height = 240, onPointClick }: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const model = useMemo(() => {
    const n = Math.max(0, ...series.map(s => s.points.length));
    const left = series.filter(s => (s.axis ?? 'left') === 'left');
    const right = series.filter(s => s.axis === 'right');
    const maxY = Math.max(1, ...left.flatMap(s => s.points.map(p => p.y)));
    const maxRY = Math.max(1, ...right.flatMap(s => s.points.map(p => p.y)));
    const makeTicks = (max: number) => {
      const cnt = 4;
      const raw = max / cnt;
      const mag = 10 ** Math.floor(Math.log10(raw));
      const norm = raw / mag;
      const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * (10 ** Math.floor(Math.log10(raw)));
      const ticks: number[] = [];
      for (let v = 0; v <= max * 1.05; v += step) ticks.push(v);
      return ticks;
    };
    const ticks = makeTicks(maxY);
    const ticksR = right.length > 0 ? makeTicks(maxRY) : [];
    const top = ticks[ticks.length - 1] || maxY;
    const topR = ticksR.length > 0 ? (ticksR[ticksR.length - 1] || maxRY) : maxRY;
    const iw = W - PAD_L - PAD_R;
    const ih = H - PAD_T - PAD_B;
    const xs = (i: number) => n <= 1 ? PAD_L : PAD_L + (i / (n - 1)) * iw;
    const ys = (v: number) => PAD_T + ih - (v / top) * ih;
    const ysR = (v: number) => PAD_T + ih - (v / topR) * ih;
    const yFor = (si: number, v: number) => ((series[si].axis ?? 'left') === 'right' ? ysR(v) : ys(v));
    const paths = series.map((s, si) => s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${yFor(si, p.y).toFixed(1)}`).join(' '));
    const labels = series[0]?.points.map(p => p.x) ?? [];
    const showEvery = Math.max(1, Math.ceil(labels.length / 6));
    return { n, ticks, ticksR, top, topR, hasRight: right.length > 0, xs, ys, ysR, yFor, paths, labels, showEvery };
  }, [series]);

  if (model.n === 0) {
    return <div className="text-sm text-[var(--color-text-muted)] py-8 text-center">Not enough data yet.</div>;
  }

  const hov = hover != null ? Math.max(0, Math.min(model.n - 1, hover)) : null;

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} onMouseMove={(e) => {
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const frac = (px - PAD_L) / (W - PAD_L - PAD_R);
        setHover(Math.round(frac * (model.n - 1)));
      }} onMouseLeave={() => setHover(null)}>
        {/* Grid lines & Y-axis labels */}
        {model.ticks.map(t => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={model.ys(t)} y2={model.ys(t)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={PAD_L - 6} y={model.ys(t) + 4} textAnchor="end" fontSize={10} fill="var(--color-text-muted)">{fmt(t)}</text>
          </g>
        ))}
        {model.hasRight && model.ticksR.map(t => (
          <text key={`r-${t}`} x={W - PAD_R + 6} y={model.ysR(t) + 4} textAnchor="start" fontSize={10} fill="var(--color-text-muted)">{fmt(t)}</text>
        ))}
        {/* Lines */}
        {model.paths.map((d, si) => (
          <path key={si} d={d} fill="none" stroke={series[si].color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* Points */}
        {series.map((s, si) => s.points.map((p, i) => (
          <circle
            key={`${si}-${i}`}
            cx={model.xs(i)}
            cy={model.yFor(si, p.y)}
            r={hover === i ? 5 : 3}
            fill="var(--color-bg-card)"
            stroke={s.color}
            strokeWidth={2}
            style={{ cursor: onPointClick ? 'pointer' : 'default' }}
            onClick={onPointClick ? () => onPointClick(si, i) : undefined}
          />
        )))}
        {/* Hover line */}
        {hov != null && (
          <line x1={model.xs(hov)} x2={model.xs(hov)} y1={PAD_T} y2={H - PAD_B} stroke="var(--color-text-muted)" strokeDasharray="3 3" />
        )}
        {/* X-axis labels */}
        {model.labels.map((l, i) => i % model.showEvery === 0 ? (
          <text key={i} x={model.xs(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--color-text-muted)">{l}</text>
        ) : null)}
      </svg>
      {/* Tooltip */}
      {hover != null && (
        <div className="absolute z-10 pointer-events-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs shadow-xl"
          style={{ left: `min(max(${((hov != null ? model.xs(hov) : 0) / W) * 100}%, 90px), calc(100% - 150px))`, top: 0 }}>
          <div className="font-bold mb-1">{model.labels[hover]}</div>
          {series.map(s => (
            <div key={s.label} className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="text-[var(--color-text-dim)]">{s.label}:</span>
              <span className="font-['Orbitron'] font-bold">{formatBig(s.points[hover]?.y ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// BAR CHART
// ============================================

interface BarChartProps {
  entries: [string, number][];
  total: number;
  color: string;
}

export function BarChart({ entries, total, color }: BarChartProps) {
  const rows = entries.filter(([, v]) => typeof v === 'number' && v > 0).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return <div className="text-xs text-[var(--color-text-muted)]">No data captured.</div>;
  const max = rows[0][1];

  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center gap-4">
          <div className="text-[11px] font-medium w-24 truncate flex-shrink-0">{k}</div>
          <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r" style={{ width: `${total > 0 ? (rows[0][1] / max) * 100 : 0}%`, background: color }} />
          </div>
          <div className="text-xs font-['Orbitron'] font-bold w-20 text-right">{formatBig(v)}</div>
          <div className="text-[10px] text-[var(--color-text-muted)] w-12 text-right">{total > 0 ? `${((rows[0][1] / total) * 100).toFixed(1)}%` : '—'}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// GRID (STAT CARDS)
// ============================================

interface GridProps {
  entries: [string, number][];
}

export function Grid({ entries }: GridProps) {
  const rows = entries.filter(([, v]) => typeof v === 'number');
  if (rows.length === 0) return <div className="text-xs text-[var(--color-text-muted)]">No data captured.</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{k}</div>
          <div className="font-['Orbitron'] text-base font-bold mt-1">{formatBig(v)}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// HEATMAP
// ============================================

interface HeatmapProps {
  xLabels: string[];
  yLabels: string[];
  values: number[][];
  xAxis: string;
  yAxis: string;
}

export function Heatmap({ xLabels, yLabels, values, xAxis, yAxis }: HeatmapProps) {
  const max = Math.max(...values.flat());
  const min = Math.min(...values.flat());
  const range = max - min || 1;

  return (
    <div className="overflow-x-auto">
      <div className="text-xs text-[var(--color-text-muted)] mb-2">
        {yAxis} × {xAxis} · range {min.toLocaleString()} – {max.toLocaleString()}
      </div>
      <div className="grid grid-cols-[auto_repeat(auto-fit,minmax(40px,1fr))] gap-0.5">
        {/* Corner */}
        <div className="w-24 h-8" />
        {/* X-axis labels */}
        {['', ...xLabels].map((label, i) => (
          <div key={`x-${i}`} className="w-12 h-8 flex items-center justify-center text-[10px] text-[var(--color-text-muted)] font-medium">{label}</div>
        ))}
        {values.map((row, yi) => (
          <div key={yi} className="contents">
            <div className="w-24 h-10 flex items-center justify-end pr-2 text-[10px] text-[var(--color-text-muted)] font-medium">{yLabels[yi]}</div>
            {row.map((v, xi) => (
              <div key={xi} className="w-12 h-10 flex items-center justify-center text-[9px] font-medium transition-colors rounded"
                style={{
                  background: `hsl(${(v - min) / range * 120}, 70%, 50%)`,
                  color: v > min + range / 2 ? '#000' : '#fff'
                }}>
                {v > 0 ? v.toLocaleString() : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
        <span>Low</span>
        <div className="flex h-3 w-24 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded" />
        <span>High</span>
      </div>
    </div>
  );
}

// ============================================
// RADAR CHART
// ============================================

interface RadarProps {
  axes: { axis: string; max: number }[];
  series: { name: string; values: number[]; color: string }[];
}

export function Radar({ axes, series }: RadarProps) {
  const R = 100;
  const cx = 150;
  const cy = 150;

  const getPoint = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2),
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full" style={{ height: 300 }}>
      {/* Grid circles */}
      {[1, 2, 3, 4, 5].map(l => (
        <circle key={l} cx={cx} cy={cy} r={R * l / 5} fill="none" stroke="var(--color-border)" strokeWidth={1} />
      ))}
      {/* Axes */}
      {axes.map((a, i) => {
        const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
        const { x, y } = getPoint(angle, R);
        return (
          <g key={a.axis}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-border)" strokeWidth={1} />
            <text x={x * 1.15} y={y * 1.15 + 5} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="var(--color-text-muted)" fontWeight={500}>{a.axis}</text>
          </g>
        );
      })}
      {/* Series polygons */}
      {series.map((s) => (
        <polygon
          key={s.name}
          points={s.values.map((v, i) => {
            const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
            const r = R * (v / axes[i].max);
            const p = getPoint(angle, r);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill={s.color} fillOpacity={0.15} stroke={s.color} strokeWidth={2}
        />
      ))}
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8, fontSize: 12 }}>
        {series.map(s => (
          <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text)' }}>
            <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: 'inline-block' }} />
            {s.name}
          </span>
        ))}
      </div>
    </svg>
  );
}

// ============================================
// SANKEY DIAGRAM
// ============================================

interface SankeyProps {
  nodes: { id: string; name: string; color?: string }[];
  links: { source: string; target: string; value: number; color?: string }[];
}

export function Sankey({ nodes, links }: SankeyProps) {
  // Simplified flow list until a full Sankey layout lands. Shows real data, no dead props.
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="text-[var(--color-text-dim)]">{byId.get(l.source)?.name ?? l.source}</span>
          <span style={{ color: l.color ?? 'var(--color-text-muted)' }}>→</span>
          <span className="text-[var(--color-text-dim)]">{byId.get(l.target)?.name ?? l.target}</span>
          <span className="ml-auto font-['Orbitron'] font-bold">{formatBig(l.value)}</span>
        </div>
      ))}
      {links.length === 0 && (
        <div className="text-sm text-[var(--color-text-muted)] text-center py-8">No flows to show yet.</div>
      )}
    </div>
  );
}

// ============================================
// SPARKLINE
// ============================================

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = 'var(--color-gold)', width = 120, height = 30 }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((v - min) / range) * 100,
  }));
  const path = `M${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x}% ${p.y}%`).join(' ')}`;
  return (
    <svg viewBox="0 0 100 100" width={width} height={height} className="block">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}