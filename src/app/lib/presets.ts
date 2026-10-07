export type PresetType = 'cards' | 'workshop' | 'bots';

export interface CardPreset {
  id: string;
  name: string;
  stars: Record<string, number>;
  updatedAt: string;
}

export interface WorkshopPreset {
  id: string;
  name: string;
  levels: Record<string, number>;
  updatedAt: string;
}

export interface BotPreset {
  id: string;
  name: string;
  picks: Record<string, number>;
  updatedAt: string;
}

export type AnyPreset = CardPreset | WorkshopPreset | BotPreset;

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function createPreset<T extends AnyPreset>(list: T[], base: Omit<T, 'id' | 'updatedAt'>): T[] {
  const now = new Date().toISOString();
  return [...list, { ...base, id: newId(), updatedAt: now } as T];
}

export function renamePreset<T extends AnyPreset>(list: T[], id: string, name: string): T[] {
  const clean = name.trim().slice(0, 40);
  if (!clean) return list;
  return list.map((p) => (p.id === id ? { ...p, name: clean } : p));
}

export function deletePreset<T extends AnyPreset>(list: T[], id: string): T[] {
  return list.filter((p) => p.id !== id);
}

export const PRESET_KEYS: Record<PresetType, string> = {
  cards: 'towerpath:presets:cards',
  workshop: 'towerpath:presets:workshop',
  bots: 'towerpath:presets:bots',
};

export const ACTIVE_KEYS: Record<PresetType, string> = {
  cards: 'towerpath:presets:cards:active',
  workshop: 'towerpath:presets:workshop:active',
  bots: 'towerpath:presets:bots:active',
};
