'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardTab, LogRunModal } from './components/DashboardTab';
import { PlannerTab } from './components/PlannerTab';
import { TrackerTab } from './components/TrackerTab';
import { CardsTab } from './components/CardsTab';
import { PresetsTab } from './components/PresetsTab';
import { UWTab } from './components/UWTab';
import { SyncTab } from './components/SyncTab';
import { TournamentTab } from './components/TournamentTab';
import { RunView } from './components/RunView';
import { LabPlannerTab } from './components/LabPlannerTab';
import { WorkshopTab } from './components/WorkshopTab';
import { MilestonesTab } from './components/MilestonesTab';
import { PerksTab } from './components/PerksTab';
import { BotsTab } from './components/BotsTab';
import { Sidebar } from './components/Sidebar';
import { SyncButton } from './components/SyncButton';
import { useRuns, useLocalStorage } from './hooks/useLocalStorage';
import { recordSnapshot } from './lib/snapshots';
import type { Tournament } from './components/TournamentTab';

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  planner: 'Path Planner',
  tracker: 'Runs',
  run: 'Run detail',
  cards: 'Cards',
  presets: 'Presets',
  uw: 'Ultimate Weapons',
  sync: 'Sync Calc',
  tourney: 'Tournament',
  labs: 'Lab Planner',
  workshop: 'Workshop',
  milestones: 'Milestones',
  perks: 'Perks',
  bots: 'Bots',
};

export default function TowerPathPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logOpen, setLogOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [runs] = useRuns();
  const [tournaments] = useLocalStorage<Tournament[]>('towerpath:tournaments', []);

  useEffect(() => {
    recordSnapshot(runs, tournaments);
  }, [runs, tournaments]);

  const openRun = (id: string) => {
    setRunId(id);
    setActiveTab('run');
    window.scrollTo(0, 0);
  };

  const avgCph = useMemo(() => {
    if (runs.length === 0) return 0;
    const total = runs.reduce((m, r) => m + (r.durationMin > 0 ? (r.coins / r.durationMin) * 60 : 0), 0);
    return total / runs.length;
  }, [runs]);

  const selectedRun = runId ? runs.find((r) => r.id === runId) ?? null : null;

  const goTab = (id: string) => {
    setActiveTab(id);
    if (id !== 'run') setRunId(null);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen relative">
      <div className="bg-grid" />
      <div className="bg-glow" style={{ width: 500, height: 500, top: -150, left: -100, background: 'var(--color-gold)' }} />
      <div className="bg-glow" style={{ width: 500, height: 500, bottom: -200, right: -100, background: 'var(--color-teal)' }} />

      <Sidebar active={activeTab} onNav={goTab} open={sideOpen} onClose={() => setSideOpen(false)} />

      <div className="relative z-10 lg:pl-60">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <header className="flex items-center justify-between gap-3 mb-8 pb-5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSideOpen(true)}
                className="lg:hidden px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-all"
                title="Menu"
              >
                ☰
              </button>
              <h1 className="font-['Orbitron'] text-xl sm:text-2xl font-bold truncate">
                {activeTab === 'run' && selectedRun
                  ? `T${selectedRun.tier} · Wave ${selectedRun.wave.toLocaleString()}`
                  : (TITLES[activeTab] ?? 'Dashboard')}
              </h1>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <SyncButton />
              <button
                onClick={() => setLogOpen(true)}
                className="px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold bg-[var(--color-gold)] text-[var(--color-bg-deep)] hover:bg-[#ffc000] transition-all shadow-lg shadow-[var(--color-gold-glow)]"
              >
                ＋ Log Run
              </button>
            </div>
          </header>

          <LogRunModal open={logOpen} onClose={() => setLogOpen(false)} />

          {activeTab === 'dashboard' && (
            <DashboardTab onOpenSync={() => goTab('sync')} setLogOpen={setLogOpen} />
          )}
          {activeTab === 'planner' && <PlannerTab />}
          {activeTab === 'tracker' && <TrackerTab onLogRun={() => setLogOpen(true)} onOpenRun={openRun} />}
          {activeTab === 'labs' && <LabPlannerTab />}
          {activeTab === 'workshop' && <WorkshopTab />}
          {activeTab === 'milestones' && <MilestonesTab />}
          {activeTab === 'run' &&
            (selectedRun ? (
              <RunView run={selectedRun} avgCph={avgCph} onBack={() => goTab('tracker')} />
            ) : (
              <div className="text-sm text-[var(--color-text-muted)]">
                Run not found.{' '}
                <button onClick={() => goTab('tracker')} className="text-[var(--color-gold)] hover:underline">
                  Back to runs
                </button>
              </div>
            ))}
          {activeTab === 'cards' && <CardsTab />}
          {activeTab === 'presets' && <PresetsTab />}
          {activeTab === 'uw' && <UWTab />}
          {activeTab === 'sync' && <SyncTab />}
          {activeTab === 'tourney' && <TournamentTab />}
          {activeTab === 'perks' && <PerksTab />}
          {activeTab === 'bots' && <BotsTab />}
        </div>
      </div>
    </div>
  );
}
