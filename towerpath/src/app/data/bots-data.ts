export const BOT_UNLOCK_COSTS = Object.freeze([150, 300, 600, 900]);

export const GOLDEN_BOT = Object.freeze({
  name: 'Golden Bot',
  upgrades: Object.freeze({
    Bonus: Object.freeze({ baseValue: 2, medalUpgrades: 20, getValue: (level: number) => 2 + 0.2 * level, formatValue: (v: number) => `${v.toFixed(2)}x` }),
    Frequency: Object.freeze({ baseValue: 25, medalUpgrades: 20, labUpgrades: 20, getValue: (level: number, lab: number = 0) => (25 - 0.3 * level) * (1 - lab / 100), formatValue: (v: number) => `${v.toFixed(0)}s` }),
    Range: Object.freeze({ baseValue: 20, medalUpgrades: 15, getValue: (level: number) => 20 + 2 * level, formatValue: (v: number) => `${v.toFixed(2)}m` }),
  }),
});

export const AMPLIFY_BOT = Object.freeze({
  name: 'Amplify Bot',
  upgrades: Object.freeze({
    Bonus: Object.freeze({ baseValue: 3.5, medalUpgrades: 20, getValue: (level: number) => 2 + 0.4 * level, formatValue: (v: number) => `${v.toFixed(2)}x` }),
    Frequency: Object.freeze({ baseValue: 25, medalUpgrades: 20, labUpgrades: 20, getValue: (level: number, lab: number = 0) => (25 - 0.3 * level) * (1 - lab / 100), formatValue: (v: number) => `${v.toFixed(0)}s` }),
    Range: Object.freeze({ baseValue: 25, medalUpgrades: 15, getValue: (level: number) => 25 + 2 * level, formatValue: (v: number) => `${v.toFixed(2)}m` }),
  }),
});

export const THUNDER_BOT = Object.freeze({
  name: 'Thunder Bot',
  upgrades: Object.freeze({
    Duration: Object.freeze({ baseValue: 4, medalUpgrades: 20, getValue: (level: number) => 4 + 0.4 * level, formatValue: (v: number) => `${v.toFixed(2)}x` }),
    Frequency: Object.freeze({ baseValue: 13, medalUpgrades: 15, labUpgrades: 20, getValue: (level: number, lab: number = 0) => (13 - 0.3 * level) * (1 - lab / 100), formatValue: (v: number) => `${v.toFixed(0)}s` }),
    Range: Object.freeze({ baseValue: 25, medalUpgrades: 15, getValue: (level: number) => 25 + 3 * level, formatValue: (v: number) => `${v.toFixed(2)}m` }),
  }),
});

export const FLAME_BOT = Object.freeze({
  name: 'Flame Bot',
  upgrades: Object.freeze({
    Damage: Object.freeze({ baseValue: 5000, medalUpgrades: 20, getValue: (level: number) => 5000 + 800 * level, formatValue: (v: number) => `${v.toFixed(0)}%` }),
    Frequency: Object.freeze({ baseValue: 8, medalUpgrades: 15, labUpgrades: 20, getValue: (level: number, lab: number = 0) => (8 - 0.3 * level) * (1 - lab / 100), formatValue: (v: number) => `${v.toFixed(0)}s` }),
    Range: Object.freeze({ baseValue: 30, medalUpgrades: 15, getValue: (level: number) => 30 + 4 * level, formatValue: (v: number) => `${v.toFixed(2)}m` }),
  }),
});

export const BOTS = Object.freeze({
  'Golden Bot': GOLDEN_BOT,
  'Amplify Bot': AMPLIFY_BOT,
  'Thunder Bot': THUNDER_BOT,
  'Flame Bot': FLAME_BOT,
});

export const BOT_NAMES = Object.freeze(['Golden Bot', 'Amplify Bot', 'Thunder Bot', 'Flame Bot']);
