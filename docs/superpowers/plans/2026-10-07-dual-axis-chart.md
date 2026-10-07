# Dual-Axis Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One Tracker chart showing coins and cells together on independent left/right axes.

**Architecture:** Extend `LineChart` in `charts.tsx` with an optional per-series `axis: 'left' | 'right'` (default left; no-axis call sites render byte-identically) and rewire Tracker's earnings charts to always plot both series.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript strict, Tailwind v4 CSS vars.

**Spec:** `docs/superpowers/specs/2026-10-07-uw-planner-design.md` (§5 chart part).

## Global Constraints

Spec §Global constraints applies in full. No new dependencies. All other `LineChart` call sites
keep working unchanged (right axis renders only when a series declares `axis: 'right'`).

---

### Task 1: Dual-axis `LineChart`

**Files:**
- Modify: `src/app/components/charts.tsx` (read the full `LineChart` first — lines ~38–136)
- Test: throwaway Node script (deleted afterwards)

**Interfaces:**
- Consumes: nothing new.
- Produces: series items accept optional `axis`; right-axis ticks/labels render when present — consumed by Task 2.

- [ ] **Step 1: Extend the series type and scale model**

Change the props type to:

```ts
interface LineChartProps {
  series: { label: string; color: string; points: { x: string; y: number; hint?: string }[]; axis?: 'left' | 'right' }[];
  height?: number;
  onPointClick?: (seriesIndex: number, pointIndex: number) => void;
}
```

In the `useMemo` model, split scales. Replace:

```ts
const maxY = Math.max(1, ...series.flatMap(s => s.points.map(p => p.y)));
```

with:

```ts
const left = series.filter(s => (s.axis ?? 'left') === 'left');
const right = series.filter(s => s.axis === 'right');
const maxY = Math.max(1, ...left.flatMap(s => s.points.map(p => p.y)));
const maxRY = Math.max(1, ...right.flatMap(s => s.points.map(p => p.y)));
```

Extract the existing tick algorithm into a local helper used twice:

```ts
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
```

Path/point y-mapping must pick the scale per series. Replace:

```ts
const ys = (v: number) => PAD_T + ih - (v / top) * ih;
const paths = series.map(s => s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.y).toFixed(1)}`).join(' '));
```

with:

```ts
const ys = (v: number) => PAD_T + ih - (v / top) * ih;
const ysR = (v: number) => PAD_T + ih - (v / topR) * ih;
const yFor = (si: number, v: number) => ((series[si].axis ?? 'left') === 'right' ? ysR(v) : ys(v));
const paths = series.map((s, si) => s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${yFor(si, p.y).toFixed(1)}`).join(' '));
```

Points render: replace `cy={model.ys(p.y)}` with `cy={model.yFor(si, p.y)}` and return `yFor` from the
memo (add it to the returned object). Hover line, x labels, and tooltip stay exactly as-is
(tooltip already iterates all series with `formatBig`).

Right-axis tick labels, rendered only when `right.length > 0`, placed after the existing grid block:

```tsx
{model.hasRight && model.ticksR.map(t => (
  <text key={`r-${t}`} x={W - PAD_R + 6} y={model.ysR(t) + 4} textAnchor="start" fontSize={10} fill="var(--color-text-muted)">{fmt(t)}</text>
))}
```

with `hasRight: right.length > 0`, `ticksR`, `ysR` added to the memo return. (`W`, `PAD_R`, `H`,
`PAD_T`, `PAD_B`, `fmt` already exist in the file — reuse them; do not redefine.)

- [ ] **Step 2: Verify scale math with a throwaway Node script**

Port `makeTicks` + the `ys`/`ysR` mapping into
`C:\Users\maias\AppData\Local\Temp\opencode\dualaxis-test.js` and assert: single-series input
produces identical `paths` to the old algorithm (copy the old formula for comparison);
left max 412.8T with right max 61.2B maps the largest point of each series within 1px of the
plot top; empty right series yields `hasRight === false`. Delete the file afterwards.

Expected: all assertions print PASS.
- [ ] **Step 3: Run `npx tsc --noEmit`** (working directory `C:\Projects\The Tower`). Expected: exit 0.
- [ ] **Step 4: Commit**

```bash
git add src/app/components/charts.tsx
git commit -m "Dual-axis support in LineChart"
```

### Task 2: Tracker wiring + verify live

**Files:**
- Modify: `src/app/components/TrackerTab.tsx` (read the Earnings trends block first — lines ~132–171)

**Interfaces:**
- Consumes: dual-axis `LineChart` from Task 1.
- Produces: always-dual earnings charts — verified live in Step 4.

- [ ] **Step 1: Replace the toggle with always-dual series**

Delete the `metric` state (`useState<'coins' | 'cells'>`), the coins|cells toggle buttons, and the
`metricValue`/`metricCph` helpers. Replace the `trend` object with:

```ts
const coinRun = runs.slice(0, 15).reverse().map((r) => ({ x: `T${r.tier} ${r.wave}`, y: r.coins, hint: `${r.strategy ?? ''}` }));
const cellRun = runs.slice(0, 15).reverse().map((r) => ({ x: `T${r.tier} ${r.wave}`, y: r.cells ?? 0, hint: `${r.strategy ?? ''}` }));
const coinHour = runs.slice(0, 15).reverse().map((r) => ({ x: `T${r.tier} ${r.wave}`, y: r.durationMin > 0 ? (r.coins / r.durationMin) * 60 : 0, hint: `${r.strategy ?? ''}` }));
const cellHour = runs.slice(0, 15).reverse().map((r) => ({ x: `T${r.tier} ${r.wave}`, y: r.durationMin > 0 ? ((r.cells ?? 0) / r.durationMin) * 60 : 0, hint: `${r.strategy ?? ''}` }));
const hasCells = cellRun.some((p) => p.y > 0);
```

Replace the two chart blocks with:

```tsx
<div>
  <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
    Coins + cells per run · oldest → newest
  </div>
  <LineChart series={[
    { label: 'Coins/run', color: 'var(--color-gold)', points: coinRun },
    ...(hasCells ? [{ label: 'Cells/run', color: 'var(--color-teal)', points: cellRun, axis: 'right' as const }] : []),
  ]} />
  {!hasCells && <p className="text-[11px] text-[var(--color-text-muted)] mt-1">No cells logged yet — cells axis appears with your first cells run.</p>}
</div>
<div>
  <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
    Coins + cells per hour · oldest → newest
  </div>
  <LineChart series={[
    { label: 'Coins/hr', color: 'var(--color-gold)', points: coinHour },
    ...(hasCells ? [{ label: 'Cells/hr', color: 'var(--color-teal)', points: cellHour, axis: 'right' as const }] : []),
  ]} />
</div>
```

(Keep the section heading `Earnings trends` and the surrounding grid/card markup untouched. If
`metric` is referenced anywhere else in the file, remove those references too.)

- [ ] **Step 2: Run `npx tsc --noEmit` then `npx next build`** (working directory `C:\Projects\The Tower`).

Expected: both exit 0.
- [ ] **Step 3: Commit and push**

```bash
git add src/app/components/TrackerTab.tsx
git commit -m "Dual-axis coins+cells earnings charts"
git push origin main
```

(working directory `C:\Projects\The Tower`; push to origin main is pre-authorized.)
- [ ] **Step 4: Verify production bundle**

Wait ~4 min, fetch `https://tower-path.vercel.app/`, extract `/_next/static/*.js` URLs, download
each, count matches of `Coins + cells per run`. Expected: at least 1 hit. If 0 after 6+ minutes,
report DONE_WITH_CONCERNS with timing details (do not push again).
