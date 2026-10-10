export interface GBSetup {
  duration: number;
  baseCooldown: number;
  bonus: number;
  range: number;
  labLevel: number;
  labReduction: number;
  gtDur: number;
  gtCd: number;
  bhDur: number;
  bhCd: number;
}

export const CHECKPOINTS = [112, 100, 96, 80];

export function effectiveCooldown(base: number, labLevel: number, reduction: number): number {
  return Math.max(1, base - Math.max(0, labLevel) * Math.max(0, reduction));
}

export function uptime(duration: number, cooldown: number): number {
  if (!(cooldown > 0)) return 0;
  return Math.min(1, Math.max(0, duration) / cooldown);
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.floor(a));
  let y = Math.abs(Math.floor(b));
  while (y > 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

export function lcm(a: number, b: number): number {
  const x = Math.max(1, Math.floor(a));
  const y = Math.max(1, Math.floor(b));
  return Math.abs(x * y) / gcd(x, y);
}

export interface Timed {
  dur: number;
  cd: number;
}

const overlapCache = new Map<string, number>();

function activeAt(t: number, u: Timed): boolean {
  return u.cd > 0 && t % u.cd < Math.min(u.dur, u.cd);
}

export function overlap2(a: Timed, b: Timed): number {
  const key = `${a.dur}|${a.cd}|${b.dur}|${b.cd}`;
  const hit = overlapCache.get(key);
  if (hit !== undefined) return hit;
  const cycle = Math.min(200000, lcm(Math.max(1, Math.round(a.cd)), Math.max(1, Math.round(b.cd))));
  let both = 0;
  for (let t = 0; t < cycle; t += 1) {
    if (activeAt(t, a) && activeAt(t, b)) both += 1;
  }
  const v = cycle > 0 ? both / cycle : 0;
  if (overlapCache.size >= 256) overlapCache.clear();
  overlapCache.set(key, v);
  return v;
}

export function overlap3(a: Timed, b: Timed, c: Timed): number {
  const key = `${a.dur}|${a.cd}|${b.dur}|${b.cd}|${c.dur}|${c.cd}`;
  const hit = overlapCache.get(key);
  if (hit !== undefined) return hit;
  let cycle = lcm(Math.max(1, Math.round(a.cd)), Math.max(1, Math.round(b.cd)));
  cycle = lcm(cycle, Math.max(1, Math.round(c.cd)));
  cycle = Math.min(200000, cycle);
  let all = 0;
  for (let t = 0; t < cycle; t += 1) {
    if (activeAt(t, a) && activeAt(t, b) && activeAt(t, c)) all += 1;
  }
  const v = cycle > 0 ? all / cycle : 0;
  if (overlapCache.size >= 256) overlapCache.clear();
  overlapCache.set(key, v);
  return v;
}

export interface MedalPackage {
  label: string;
  cooldown: number;
  medalCost: number;
}

export interface RouteRow {
  label: string;
  cooldown: number;
  medalCost: number;
  uptime: number;
  gbWithBh: number;
  gbWithGt: number;
  fourWay: number;
  gainVsCurrent: number | null;
  checkpoint: number | null;
}

export function buildRoutes(
  setup: GBSetup,
  labRange: number[],
  packages: MedalPackage[],
): RouteRow[] {
  const gb = (cd: number): Timed => ({ dur: setup.duration, cd });
  const bh: Timed = { dur: setup.bhDur, cd: setup.bhCd };
  const gt: Timed = { dur: setup.gtDur, cd: setup.gtCd };
  const rows: RouteRow[] = labRange.map((lab) => {
    const cd = effectiveCooldown(setup.baseCooldown, lab, setup.labReduction);
    const fourWay = overlap3(gb(cd), bh, gt);
    return {
      label: `Lab L${lab}`,
      cooldown: cd,
      medalCost: 0,
      uptime: uptime(setup.duration, cd),
      gbWithBh: overlap2(gb(cd), bh),
      gbWithGt: overlap2(gb(cd), gt),
      fourWay,
      gainVsCurrent: null,
      checkpoint: [...CHECKPOINTS].reverse().find((c) => cd <= c) ?? null,
    };
  });
  for (const p of packages) {
    const fourWay = overlap3(gb(p.cooldown), bh, gt);
    rows.push({
      label: p.label,
      cooldown: p.cooldown,
      medalCost: Math.max(0, p.medalCost),
      uptime: uptime(setup.duration, p.cooldown),
      gbWithBh: overlap2(gb(p.cooldown), bh),
      gbWithGt: overlap2(gb(p.cooldown), gt),
      fourWay,
      gainVsCurrent: null,
      checkpoint: [...CHECKPOINTS].reverse().find((c) => p.cooldown <= c) ?? null,
    });
  }
  const current = rows[0]?.fourWay ?? 0;
  return rows.map((r) => ({
    ...r,
    gainVsCurrent: current > 0 ? r.fourWay / current - 1 : null,
  }));
}
