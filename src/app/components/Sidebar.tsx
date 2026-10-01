'use client';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    title: 'Track',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '◈' },
      { id: 'tracker', label: 'Runs', icon: '▤' },
      { id: 'tourney', label: 'Tournament', icon: '🏆' },
    ],
  },
  {
    title: 'Plan',
    items: [
      { id: 'planner', label: 'Path Planner', icon: '🧭' },
      { id: 'uw', label: 'Ultimate Weapons', icon: '✦' },
      { id: 'sync', label: 'Sync Calc', icon: '◉' },
    ],
  },
  {
    title: 'Collect',
    items: [{ id: 'cards', label: 'Cards', icon: '🂡' }],
  },
];

export function Sidebar({
  active,
  onNav,
  open,
  onClose,
}: {
  active: string;
  onNav: (id: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-60 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-card)]/95 backdrop-blur px-4 py-6 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="font-['Orbitron'] text-2xl font-black tracking-widest px-2 mb-8">
          Tower<span style={{ color: 'var(--color-gold)' }}>Path</span>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto">
          {NAV.map((section) => (
            <div key={section.title}>
              <div className="text-[10px] uppercase tracking-[2px] text-[var(--color-text-muted)] px-3 mb-2">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = active === item.id || (active === 'run' && item.id === 'tracker');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNav(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-l-2 ${
                        isActive
                          ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)] border-[var(--color-gold)] font-bold'
                          : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)] border-transparent'
                      }`}
                    >
                      <span className="w-6 text-center">{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="pt-4 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] px-3 leading-relaxed">
          Local-first tracker.
          <br />
          Data never leaves your browser unless you enable cloud sync.
        </div>
      </aside>
    </>
  );
}
