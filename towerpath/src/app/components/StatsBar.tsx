'use client';

export function StatsBar({ stats }: { stats: Array<{ label: string; value: string; change?: string; changeDir?: 'up' | 'down'; variant: string }> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="relative overflow-hidden rounded-xl p-5 border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-light)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${
            stat.variant === 'gold' ? 'from-[var(--color-gold)] to-transparent' :
            stat.variant === 'teal' ? 'from-[var(--color-teal)] to-transparent' :
            stat.variant === 'red' ? 'from-[var(--color-red)] to-transparent' :
            'from-[var(--color-purple)] to-transparent'
          }`} />
          <div className="text-[11px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2">{stat.label}</div>
          <div className="font-['Orbitron'] text-2xl font-bold text-[var(--color-text)]">{stat.value}</div>
          {stat.change && (
            <div className={`text-[11px] mt-2 font-medium ${stat.changeDir === 'up' ? 'text-[var(--color-teal)]' : 'text-[var(--color-red)]'}`}>
              {stat.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
