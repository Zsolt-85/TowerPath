/**
 * TowerPath - Enhanced Save File Importer
 * Parses playerInfo.dat (gzip + NRBF) like TowerSmith/Rend
 * Supports v28+ game format
 */

import type { DecodedAccount } from './playersave';
import type { Run } from '../hooks/useLocalStorage';
import { parseFullReport } from './battleReport';

// ============================================
// SAVE FILE TYPES
// ============================================

export interface SaveFileMetadata {
  fileName: string;
  fileSize: number;
  lastModified: number;
  source: 'ldcloud' | 'googleDrive' | 'ldplayer' | 'bluestacks' | 'mumu' | 'local' | 'manual';
  deviceId: string;
  towerId: string;
  gameVersion: string;
  importedAt: number;
  hash: string;
}

export interface ImportResult {
  success: boolean;
  account?: DecodedAccount;
  runsAdded: number;
  tournamentsAdded: number;
  cardsUpdated: number;
  uwsUpdated: number;
  modulesUpdated: number;
  labsUpdated: number;
  workshopUpdated: boolean;
  statsUpdated: boolean;
  profileUpdated: boolean;
  metadata: SaveFileMetadata;
  errors: string[];
  warnings: string[];
}

export interface WatcherConfig {
  enabled: boolean;
  intervalMs: number;
  sources: ('ldcloud' | 'googleDrive' | 'ldplayer' | 'bluestacks' | 'mumu' | 'localFile')[];
  autoImport: boolean;
  notifyOnImport: boolean;
  maxConcurrentImports: number;
}

export interface WatcherStatus {
  running: boolean;
  lastCheck: number;
  nextCheck: number;
  lastImport: number | null;
  lastImportResult: ImportResult | null;
  errors: string[];
  sources: SourceStatus[];
}

export interface SourceStatus {
  type: 'ldcloud' | 'googleDrive' | 'ldplayer' | 'bluestacks' | 'mumu' | 'localFile';
  connected: boolean;
  lastSeen: number;
  lastFile: string | null;
  lastSize: number;
  error: string | null;
}

// ============================================
// SAVE FILE WATCHER SERVICE
// ============================================

export class SaveFileWatcher {
  private config: WatcherConfig;
  private status: WatcherStatus;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<(status: WatcherStatus) => void> = new Set();
  private importing = false;

  constructor(config: Partial<WatcherConfig> = {}) {
    this.config = {
      enabled: true,
      intervalMs: 5 * 60 * 1000, // 5 minutes like Rend
      sources: ['localFile'],
      autoImport: true,
      notifyOnImport: true,
      maxConcurrentImports: 1,
      ...config,
    };

    this.status = {
      running: false,
      lastCheck: 0,
      nextCheck: 0,
      lastImport: null,
      lastImportResult: null,
      errors: [],
      sources: [
        { type: 'ldcloud', connected: false, lastSeen: 0, lastFile: null, lastSize: 0, error: null },
        { type: 'googleDrive', connected: false, lastSeen: 0, lastFile: null, lastSize: 0, error: null },
        { type: 'ldplayer', connected: false, lastSeen: 0, lastFile: null, lastSize: 0, error: null },
        { type: 'bluestacks', connected: false, lastSeen: 0, lastFile: null, lastSize: 0, error: null },
        { type: 'mumu', connected: false, lastSeen: 0, lastFile: null, lastSize: 0, error: null },
        { type: 'localFile', connected: false, lastSeen: 0, lastFile: null, lastSize: 0, error: null },
      ],
    };
  }

  start(): void {
    if (this.status.running) return;
    this.status.running = true;
    this.status.nextCheck = Date.now() + this.config.intervalMs;
    this.checkAllSources();
    this.intervalId = setInterval(() => this.checkAllSources(), this.config.intervalMs);
    this.notify();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status.running = false;
    this.notify();
  }

  updateConfig(config: Partial<WatcherConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.status.running) {
      this.stop();
      this.start();
    }
  }

  getStatus(): WatcherStatus {
    return { ...this.status };
  }

  subscribe(callback: (status: WatcherStatus) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notify(): void {
    this.callbacks.forEach(cb => cb(this.getStatus()));
  }

  private async checkAllSources(): Promise<void> {
    if (this.importing) return;
    this.status.lastCheck = Date.now();
    this.status.nextCheck = Date.now() + this.config.intervalMs;
    this.notify();

    const results = await Promise.allSettled(
      this.config.sources.map(() => this.checkSource())
    );

    // Update source statuses
    results.forEach((result, index) => {
      const source = this.config.sources[index];
      const sourceStatus = this.status.sources.find(s => s.type === source)!;
      if (result.status === 'fulfilled') {
        sourceStatus.connected = true;
        sourceStatus.lastSeen = Date.now();
        if (result.value) {
          sourceStatus.lastFile = result.value.metadata.fileName;
          sourceStatus.lastSize = result.value.metadata.fileSize;
        }
        sourceStatus.error = null;
      } else {
        sourceStatus.error = result.reason?.message ?? 'Unknown error';
      }
    });

    this.notify();
  }

  private async checkSource(): Promise<ImportResult | null> {
    // In a real implementation, this would:
    // - LDCloud: Use LDCloud WebDAV API to list/check files
    // - Google Drive: Use Drive API to watch folder
    // - LDPlayer/BlueStacks/MuMu: Check shared folders via file:// protocol or native messaging
    // - Local file: Check File System Access API handle or input element

    // For now, return null (no new files)
    return null;
  }

  async importFile(file: File, source: 'ldcloud' | 'googleDrive' | 'ldplayer' | 'bluestacks' | 'mumu' | 'local' | 'manual'): Promise<ImportResult> {
    if (this.importing) throw new Error('Import already in progress');
    this.importing = true;

    try {
      const metadata: SaveFileMetadata = {
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
        source,
        deviceId: await this.getDeviceId(),
        towerId: '', // Will be filled from save
        gameVersion: '', // Will be filled from save
        importedAt: Date.now(),
        hash: await this.hashFile(file),
      };

      const bytes = new Uint8Array(await file.arrayBuffer());
      const account = await this.parseSaveFile(bytes);

      // Apply to local storage
      const result = await this.applyAccount(account, metadata);

      return { ...result, metadata };
    } finally {
      this.importing = false;
    }
  }

  async importBattleReport(text: string): Promise<ImportResult> {
    const parsed = parseFullReport(text);
    
    // Convert to Run object
    const run = {
      id: `import_${Date.now()}`,
      date: new Date().toISOString(),
      tier: parsed.tier ?? 0,
      wave: parsed.wave ?? 0,
      coins: parsed.coins ?? 0,
      durationMin: parsed.durationMin ?? 0,
      cells: parsed.cells ?? undefined,
      strategy: undefined,
      source: 'paste' as const,
      runType: 'farm' as const,
      detail: parsed.detail,
      synced: false,
      deviceId: await this.getDeviceId(),
      gameVersion: 'unknown',
    };

    // Save to local storage
    const runs = this.getRuns();
    runs.unshift(run);
    localStorage.setItem('towerpath:runs', JSON.stringify(runs.slice(0, 500)));
    window.dispatchEvent(new CustomEvent('towerpath:store', { detail: 'towerpath:runs' }));

    return {
      success: true,
      runsAdded: 1,
      tournamentsAdded: 0,
      cardsUpdated: 0,
      uwsUpdated: 0,
      modulesUpdated: 0,
      labsUpdated: 0,
      workshopUpdated: false,
      statsUpdated: false,
      profileUpdated: false,
      metadata: {
        fileName: 'battle-report.txt',
        fileSize: 0,
        lastModified: Date.now(),
        source: 'manual',
        deviceId: await this.getDeviceId(),
        towerId: '',
        gameVersion: 'unknown',
        importedAt: Date.now(),
        hash: '',
      },
      errors: [],
      warnings: [],
    };
  }

  private async parseSaveFile(bytes: Uint8Array): Promise<DecodedAccount> {
    // Use the existing decodeSaveFile from playersave
    const { decodeSaveFile } = await import('./playersave');
    return decodeSaveFile(bytes);
  }

  private async applyAccount(account: DecodedAccount, metadata: SaveFileMetadata): Promise<ImportResult> {
    // Apply all account data to localStorage
    // This mirrors the logic in ImportModal.apply()
    // Store full account snapshot
    localStorage.setItem('towerpath:save', JSON.stringify({
      ...metadata,
      account,
      importedAt: Date.now(),
    }));

    return {
      success: true,
      runsAdded: 0,
      tournamentsAdded: 0,
      cardsUpdated: 0,
      uwsUpdated: 0,
      modulesUpdated: 0,
      labsUpdated: 0,
      workshopUpdated: false,
      statsUpdated: false,
      profileUpdated: true,
      metadata,
      errors: [],
      warnings: [],
    };
  }

  private getRuns(): Run[] {
    try {
      return JSON.parse(localStorage.getItem('towerpath:runs') || '[]');
    } catch {
      return [];
    }
  }

  private async getDeviceId(): Promise<string> {
    let id = localStorage.getItem('towerpath:deviceId');
    if (!id) {
      id = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('towerpath:deviceId', id);
    }
    return id;
  }

  private async hashFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// ============================================
// NOTE: cross-device sync lives in lib/sync.ts + SyncButton.tsx.
// This module intentionally contains only the save-file watcher so there
// is a single source of truth for sync logic.
// ============================================

// ============================================
// EXPORTS
// ============================================

export const saveFileWatcher = new SaveFileWatcher();