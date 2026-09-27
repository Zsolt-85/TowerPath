'use client';

import { useState } from 'react';
import { DashboardTab, LogRunModal } from './components/DashboardTab';
import { PlannerTab } from './components/PlannerTab';
import { TrackerTab } from './components/TrackerTab';
import { CardsTab } from './components/CardsTab';
import { UWTab } from './components/UWTab';
import { SyncTab } from './components/SyncTab';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planner', label: 'Path Planner' },
  { id: 'tracker', label: 'Progress' },
  { id: 'cards', label: 'Cards' },
  { id: 'uw', label: 'UW Planner' },
  { id: 'sync', label: 'Sync Calc' },
];

export default function TowerPathPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <div className="bg-grid" />
      <div className="bg-glow" style={{ width: 500, height: 500, top: -150, left: -100, background: 'var(--color-gold)' }} />
      <div className="bg-glow" style={{ width: 500, height: 500, bottom: -200, right: -100, background: 'var(--color-teal)' }} />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-[var(--color-border)]">
          <div className="font-['Orbitron'] text-2xl sm:text-3xl font-black tracking-widest">
            Tower<span style={{ color: 'var(--color-gold)' }}>Path</span>
          </div>
          <nav className="flex gap-0.5 bg-[var(--color-bg-card)] rounded-xl p-1 border border-[var(--color-border)] overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold shadow-lg shadow-[var(--color-gold-glow)]'
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex gap-2">
            <button
              onClick={() => setLogOpen(true)}
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[var(--color-gold)] text-[var(--color-bg-deep)] hover:bg-[#ffc000] transition-all shadow-lg shadow-[var(--color-gold-glow)]"
            >
              ＋ Log Run
            </button>
          </div>
        </header>

        <LogRunModal open={logOpen} onClose={() => setLogOpen(false)} />

        {activeTab === 'dashboard' && (
          <DashboardTab onOpenSync={() => setActiveTab('sync')} logOpen={logOpen} setLogOpen={setLogOpen} />
        )}
        {activeTab === 'planner' && <PlannerTab />}
        {activeTab === 'tracker' && <TrackerTab onLogRun={() => setLogOpen(true)} />}
        {activeTab === 'cards' && <CardsTab />}
        {activeTab === 'uw' && <UWTab />}
        {activeTab === 'sync' && <SyncTab />}
      </div>
    </div>
  );
}
