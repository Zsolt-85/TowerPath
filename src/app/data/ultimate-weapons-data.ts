export const PLUS_UNLOCK_COSTS = Object.freeze([500, 625, 750, 975, 1250, 1650, 2200, 2900, 3800]);
export const UNLOCK_COSTS = Object.freeze([5, 50, 150, 300, 800, 1250, 1750, 2400, 3000]);

const BASE_400 = Object.freeze([0, 400, 500, 610, 730, 860, 1000, 1150, 1300, 1500, 1700]);
const BASE_300 = Object.freeze([0, 300, 375, 475, 600, 725, 925, 1150, 1450, 1800, 2200]);
const ALTERNATE_BASE_300 = Object.freeze([0, 300, 360, 430, 510, 620, 750, 900, 1100, 1350, 1650]);

export const DEATH_WAVE = Object.freeze({
  name: 'Death Wave',
  upgrades: Object.freeze({
    'Damage %': Object.freeze({ values: Object.freeze([{ value: 150, cost: 0 }, { value: 177, cost: 5 }, { value: 205, cost: 11 }, { value: 233, cost: 17 }, { value: 261, cost: 23 }, { value: 290, cost: 29 }, { value: 319, cost: 35 }, { value: 348, cost: 41 }, { value: 377, cost: 47 }, { value: 406, cost: 53 }, { value: 436, cost: 61 }, { value: 465, cost: 71 }, { value: 495, cost: 84 }, { value: 524, cost: 100 }, { value: 554, cost: 120 }, { value: 584, cost: 144 }, { value: 614, cost: 174 }, { value: 644, cost: 210 }, { value: 674, cost: 254 }, { value: 704, cost: 308 }, { value: 735, cost: 374 }, { value: 765, cost: 452 }, { value: 795, cost: 558 }, { value: 826, cost: 694 }, { value: 856, cost: 880 }, { value: 887, cost: 1126 }, { value: 917, cost: 1436 }, { value: 948, cost: 1813 }, { value: 979, cost: 2269 }, { value: 1010, cost: 2800 }, { value: 1040, cost: 4081 }]), formatValue: (v: number) => `${v.toFixed(0)}%` }),
    Quantity: Object.freeze({ values: Object.freeze([{ value: 1, cost: 0 }, { value: 2, cost: 200 }, { value: 3, cost: 500 }, { value: 4, cost: 850 }, { value: 5, cost: 1400 }]), perk: (v: number) => v + 1, formatValue: (v: number) => `${v.toFixed(0)}` }),
    Cooldown: Object.freeze({ values: Object.freeze([{ value: 300, cost: 0 }, { value: 290, cost: 8 }, { value: 280, cost: 24 }, { value: 270, cost: 40 }, { value: 260, cost: 56 }, { value: 250, cost: 72 }, { value: 240, cost: 88 }, { value: 230, cost: 104 }, { value: 220, cost: 120 }, { value: 210, cost: 136 }, { value: 200, cost: 152 }, { value: 190, cost: 168 }, { value: 180, cost: 184 }, { value: 170, cost: 200 }, { value: 160, cost: 216 }, { value: 150, cost: 232 }, { value: 140, cost: 248 }, { value: 130, cost: 264 }, { value: 120, cost: 280 }, { value: 110, cost: 346 }, { value: 100, cost: 512 }]), formatValue: (v: number) => `${v.toFixed(0)}s` }),
  }),
  plus: Object.freeze({ name: 'Kill Wall', getDescription: (v: number) => `Spawn an additional Killing Wave that deals damage equal to the current wave HP and persists until it hits ${v} enemies`, cost: BASE_400, values: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) }),
});

export const BLACK_HOLE = Object.freeze({
  name: 'Black Hole',
  upgrades: Object.freeze({
    Size: Object.freeze({ values: Object.freeze([{ value: 30, cost: 0 }, { value: 32, cost: 5 }, { value: 34, cost: 12 }, { value: 36, cost: 19 }, { value: 38, cost: 26 }, { value: 40, cost: 34 }, { value: 42, cost: 43 }, { value: 44, cost: 53 }, { value: 46, cost: 64 }, { value: 48, cost: 76 }, { value: 50, cost: 89 }, { value: 52, cost: 103 }, { value: 54, cost: 118 }, { value: 56, cost: 134 }, { value: 58, cost: 151 }, { value: 60, cost: 169 }, { value: 62, cost: 189 }, { value: 64, cost: 211 }, { value: 66, cost: 236 }, { value: 68, cost: 264 }, { value: 70, cost: 295 }]), formatValue: (v: number) => `${v.toFixed(0)}m` }),
    Duration: Object.freeze({ values: Object.freeze([{ value: 15, cost: 0 }, { value: 16, cost: 5 }, { value: 17, cost: 14 }, { value: 18, cost: 23 }, { value: 19, cost: 32 }, { value: 20, cost: 41 }, { value: 21, cost: 50 }, { value: 22, cost: 59 }, { value: 23, cost: 68 }, { value: 24, cost: 77 }, { value: 25, cost: 86 }, { value: 26, cost: 95 }, { value: 27, cost: 104 }, { value: 28, cost: 113 }, { value: 29, cost: 122 }, { value: 30, cost: 131 }]), perk: (v: number) => v + 12, formatValue: (v: number) => `${v.toFixed(0)}s` }),
    Cooldown: Object.freeze({ values: Object.freeze([{ value: 200, cost: 0 }, { value: 190, cost: 10 }, { value: 180, cost: 28 }, { value: 170, cost: 46 }, { value: 160, cost: 64 }, { value: 150, cost: 82 }, { value: 140, cost: 100 }, { value: 130, cost: 118 }, { value: 120, cost: 136 }, { value: 110, cost: 154 }, { value: 100, cost: 172 }, { value: 90, cost: 190 }, { value: 80, cost: 208 }, { value: 70, cost: 226 }, { value: 60, cost: 244 }, { value: 50, cost: 262 }]), formatValue: (v: number) => `${v.toFixed(0)}s` }),
  }),
  plus: Object.freeze({ name: 'Consume', getDescription: (v: number) => `Each black hole can consume up to ${v} enemies and destroy them instantly (bosses not included)`, cost: BASE_400, values: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) }),
});

export const GOLDEN_TOWER = Object.freeze({
  name: 'Golden Tower',
  upgrades: Object.freeze({
    Bonus: Object.freeze({ values: Object.freeze([{ value: 5.0, cost: 0 }, { value: 5.8, cost: 5 }, { value: 6.6, cost: 13 }, { value: 7.4, cost: 22 }, { value: 8.2, cost: 32 }, { value: 9.0, cost: 43 }, { value: 9.8, cost: 55 }, { value: 10.6, cost: 68 }, { value: 11.4, cost: 82 }, { value: 12.2, cost: 98 }, { value: 13.0, cost: 116 }, { value: 13.8, cost: 138 }, { value: 14.6, cost: 162 }, { value: 15.4, cost: 250 }, { value: 16.2, cost: 350 }, { value: 17.0, cost: 500 }]), lab: { growth: 0.15, max: 25 }, perk: (v: number) => v * 1.5, formatValue: (v: number) => `${v.toFixed(2)}x` }),
    Duration: Object.freeze({ values: Object.freeze([{ value: 15, cost: 0 }, { value: 16, cost: 5 }, { value: 17, cost: 14 }, { value: 18, cost: 23 }, { value: 19, cost: 32 }, { value: 20, cost: 41 }, { value: 21, cost: 50 }, { value: 22, cost: 59 }, { value: 23, cost: 68 }, { value: 24, cost: 77 }, { value: 25, cost: 87 }, { value: 26, cost: 98 }, { value: 27, cost: 110 }, { value: 28, cost: 123 }, { value: 29, cost: 137 }, { value: 30, cost: 152 }, { value: 31, cost: 168 }, { value: 32, cost: 185 }, { value: 33, cost: 203 }, { value: 34, cost: 222 }, { value: 35, cost: 242 }, { value: 36, cost: 263 }, { value: 37, cost: 285 }, { value: 38, cost: 308 }, { value: 39, cost: 332 }, { value: 40, cost: 356 }, { value: 41, cost: 380 }, { value: 42, cost: 404 }, { value: 43, cost: 428 }, { value: 44, cost: 452 }, { value: 45, cost: 476 }]), lab: { growth: 1, max: 20 }, formatValue: (v: number) => `${v.toFixed(0)}s` }),
    Cooldown: Object.freeze({ values: Object.freeze([{ value: 300, cost: 0 }, { value: 290, cost: 10 }, { value: 280, cost: 28 }, { value: 270, cost: 46 }, { value: 260, cost: 64 }, { value: 250, cost: 82 }, { value: 240, cost: 100 }, { value: 230, cost: 118 }, { value: 220, cost: 136 }, { value: 210, cost: 154 }, { value: 200, cost: 172 }, { value: 190, cost: 190 }, { value: 180, cost: 208 }, { value: 170, cost: 226 }, { value: 160, cost: 244 }, { value: 150, cost: 262 }, { value: 140, cost: 300 }, { value: 130, cost: 368 }, { value: 120, cost: 476 }, { value: 110, cost: 644 }, { value: 100, cost: 872 }]), formatValue: (v: number) => `${v.toFixed(0)}s` }),
  }),
  plus: Object.freeze({ name: 'Golden Combo', getDescription: (v: number) => `While Golden Tower is active a combo counter will be visible, each enemy kill adds +1. When Golden Tower finishes you receive extra cash and coins of ${v.toFixed(2)}% per combo`, cost: ALTERNATE_BASE_300, values: Object.freeze([0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27, 0.3, 0.33]) }),
});

export const SMART_MISSILES = Object.freeze({
  name: 'Smart Missiles',
  upgrades: Object.freeze({
    Damage: Object.freeze({ values: Object.freeze([{ value: 14, cost: 0 }, { value: 16, cost: 5 }, { value: 19, cost: 11 }, { value: 23, cost: 17 }, { value: 27, cost: 23 }, { value: 32, cost: 29 }, { value: 39, cost: 35 }, { value: 48, cost: 41 }, { value: 59, cost: 47 }, { value: 72, cost: 53 }, { value: 88, cost: 61 }, { value: 107, cost: 71 }, { value: 129, cost: 84 }, { value: 155, cost: 100 }, { value: 185, cost: 120 }, { value: 219, cost: 144 }, { value: 257, cost: 174 }, { value: 300, cost: 210 }, { value: 349, cost: 252 }, { value: 403, cost: 302 }, { value: 462, cost: 362 }, { value: 527, cost: 432 }, { value: 599, cost: 528 }, { value: 678, cost: 654 }, { value: 763, cost: 810 }, { value: 855, cost: 996 }, { value: 955, cost: 1222 }, { value: 1063, cost: 1488 }, { value: 1179, cost: 1804 }, { value: 1301, cost: 2180 }, { value: 1436, cost: 2636 }]), formatValue: (v: number) => `${v.toFixed(0)}x` }),
    Quantity: Object.freeze({ values: Object.freeze([{ value: 5, cost: 0 }, { value: 6, cost: 4 }, { value: 7, cost: 12 }, { value: 8, cost: 35 }, { value: 9, cost: 70 }, { value: 10, cost: 120 }, { value: 11, cost: 180 }, { value: 12, cost: 275 }, { value: 13, cost: 350 }, { value: 14, cost: 420 }, { value: 15, cost: 500 }, { value: 16, cost: 600 }, { value: 17, cost: 750 }]), perk: (v: number) => v + 4, formatValue: (v: number) => `${v.toFixed(0)}` }),
    Cooldown: Object.freeze({ values: Object.freeze([{ value: 180, cost: 0 }, { value: 170, cost: 8 }, { value: 160, cost: 24 }, { value: 150, cost: 40 }, { value: 140, cost: 56 }, { value: 130, cost: 72 }, { value: 120, cost: 88 }, { value: 110, cost: 104 }, { value: 100, cost: 120 }, { value: 90, cost: 136 }, { value: 80, cost: 152 }, { value: 70, cost: 168 }, { value: 60, cost: 184 }, { value: 50, cost: 200 }, { value: 40, cost: 216 }, { value: 30, cost: 232 }]), formatValue: (v: number) => `${v.toFixed(0)}s` }),
  }),
  plus: Object.freeze({ name: 'Cover Fire', getDescription: (v: number) => `Launch one additional missile every ${v} seconds`, cost: BASE_300, values: Object.freeze([13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3]) }),
});

export const CHRONO_FIELD = Object.freeze({
  name: 'Chrono Field',
  upgrades: Object.freeze({
    Duration: Object.freeze({ values: Object.freeze([{ value: 5, cost: 0 }, { value: 6, cost: 5 }, { value: 7, cost: 14 }, { value: 8, cost: 23 }, { value: 9, cost: 32 }, { value: 10, cost: 41 }, { value: 11, cost: 50 }, { value: 12, cost: 59 }, { value: 13, cost: 68 }, { value: 14, cost: 77 }, { value: 15, cost: 86 }, { value: 16, cost: 95 }, { value: 17, cost: 104 }, { value: 18, cost: 113 }, { value: 19, cost: 122 }, { value: 20, cost: 131 }, { value: 21, cost: 140 }, { value: 22, cost: 149 }, { value: 23, cost: 158 }, { value: 24, cost: 167 }, { value: 25, cost: 176 }, { value: 26, cost: 185 }, { value: 27, cost: 194 }, { value: 28, cost: 203 }, { value: 29, cost: 212 }, { value: 30, cost: 221 }, { value: 31, cost: 230 }, { value: 32, cost: 239 }, { value: 33, cost: 248 }, { value: 34, cost: 257 }, { value: 35, cost: 266 }, { value: 36, cost: 275 }, { value: 37, cost: 284 }, { value: 38, cost: 293 }, { value: 39, cost: 302 }, { value: 40, cost: 311 }]), lab: { growth: 1, max: 30 }, formatValue: (v: number) => `${v.toFixed(0)}s` }),
    'Slow %': Object.freeze({ values: Object.freeze([{ value: 20, cost: 0 }, { value: 25, cost: 15 }, { value: 30, cost: 25 }, { value: 35, cost: 40 }, { value: 40, cost: 60 }, { value: 45, cost: 120 }, { value: 50, cost: 150 }, { value: 55, cost: 200 }, { value: 60, cost: 300 }]), formatValue: (v: number) => `${v.toFixed(0)}%` }),
    Cooldown: Object.freeze({ values: Object.freeze([{ value: 180, cost: 0 }, { value: 170, cost: 10 }, { value: 160, cost: 31 }, { value: 150, cost: 52 }, { value: 140, cost: 73 }, { value: 130, cost: 94 }, { value: 120, cost: 115 }, { value: 110, cost: 136 }, { value: 100, cost: 157 }, { value: 90, cost: 178 }, { value: 80, cost: 199 }, { value: 70, cost: 220 }, { value: 60, cost: 241 }]), formatValue: (v: number) => `${v.toFixed(0)}s` }),
  }),
  plus: Object.freeze({ name: 'Chrono Loop', getDescription: (v: number) => `Add a slowing loop at the inner edge of the Tower's range that reduces the speed of any enemy inside by ${v.toFixed(2)}%`, cost: BASE_400, values: Object.freeze([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]) }),
});

export const POISON_SWAMP = Object.freeze({
  name: 'Poison Swamp',
  upgrades: Object.freeze({
    'Damage %': Object.freeze({ values: Object.freeze([{ value: 150, cost: 0 }, { value: 202, cost: 5 }, { value: 257, cost: 11 }, { value: 316, cost: 17 }, { value: 378, cost: 23 }, { value: 443, cost: 29 }, { value: 510, cost: 35 }, { value: 581, cost: 41 }, { value: 654, cost: 47 }, { value: 730, cost: 53 }, { value: 809, cost: 61 }, { value: 890, cost: 71 }, { value: 975, cost: 84 }, { value: 1062, cost: 100 }, { value: 1151, cost: 120 }, { value: 1243, cost: 144 }, { value: 1338, cost: 174 }, { value: 1435, cost: 210 }, { value: 1535, cost: 252 }, { value: 1638, cost: 302 }, { value: 1743, cost: 362 }, { value: 1850, cost: 434 }, { value: 1961, cost: 525 }, { value: 2073, cost: 636 }, { value: 2188, cost: 772 }, { value: 2306, cost: 938 }, { value: 2426, cost: 1134 }, { value: 2549, cost: 1360 }, { value: 2674, cost: 1616 }, { value: 2801, cost: 1902 }, { value: 2931, cost: 2228 }]), formatValue: (v: number) => `${v.toFixed(0)}%` }),
    Duration: Object.freeze({ values: Object.freeze([{ value: 2, cost: 0 }, { value: 3, cost: 10 }, { value: 4, cost: 20 }, { value: 5, cost: 35 }, { value: 6, cost: 55 }, { value: 7, cost: 100 }, { value: 8, cost: 120 }, { value: 9, cost: 150 }, { value: 10, cost: 200 }]), formatValue: (v: number) => `${v.toFixed(0)}s` }),
    'Chance %': Object.freeze({ values: Object.freeze([{ value: 10, cost: 0 }, { value: 13, cost: 8 }, { value: 16, cost: 26 }, { value: 19, cost: 44 }, { value: 22, cost: 62 }, { value: 25, cost: 80 }, { value: 28, cost: 98 }, { value: 31, cost: 116 }, { value: 34, cost: 134 }, { value: 37, cost: 152 }, { value: 40, cost: 170 }, { value: 43, cost: 188 }, { value: 46, cost: 206 }, { value: 49, cost: 224 }, { value: 52, cost: 242 }, { value: 55, cost: 260 }]), formatValue: (v: number) => `${v.toFixed(0)}%` }),
  }),
  plus: Object.freeze({ name: 'Death Creep', getDescription: (v: number) => `Every time poison ticks, the damage is increased by ${v}% of poison swamps base damage`, cost: BASE_300, values: Object.freeze([50, 120, 190, 260, 330, 400, 470, 540, 610, 680, 750]) }),
});

export const INNER_LAND_MINES = Object.freeze({
  name: 'Inner Land Mines',
  upgrades: Object.freeze({
    'Damage %': Object.freeze({ values: Object.freeze([{ value: 2000, cost: 0 }, { value: 2302, cost: 5 }, { value: 2608, cost: 11 }, { value: 2919, cost: 17 }, { value: 3235, cost: 23 }, { value: 3555, cost: 29 }, { value: 3880, cost: 35 }, { value: 4210, cost: 41 }, { value: 4545, cost: 47 }, { value: 4885, cost: 53 }, { value: 5230, cost: 61 }, { value: 5579, cost: 71 }, { value: 5934, cost: 84 }, { value: 6294, cost: 100 }, { value: 6659, cost: 120 }, { value: 7029, cost: 144 }, { value: 7405, cost: 174 }, { value: 7785, cost: 210 }, { value: 8171, cost: 254 }, { value: 8562, cost: 308 }, { value: 8958, cost: 374 }, { value: 9359, cost: 454 }, { value: 9765, cost: 540 }, { value: 10177, cost: 632 }, { value: 10594, cost: 730 }, { value: 11016, cost: 834 }, { value: 11444, cost: 944 }, { value: 11877, cost: 1060 }, { value: 12315, cost: 1182 }, { value: 12759, cost: 1312 }, { value: 13207, cost: 1448 }]), formatValue: (v: number) => `${v.toFixed(0)}%` }),
    Quantity: Object.freeze({ values: Object.freeze([{ value: 3, cost: 0 }, { value: 4, cost: 50 }, { value: 5, cost: 125 }, { value: 6, cost: 250 }]), perk: (v: number) => v + 6, formatValue: (v: number) => `${v.toFixed(0)}` }),
    Cooldown: Object.freeze({ values: Object.freeze([{ value: 200, cost: 0 }, { value: 190, cost: 8 }, { value: 180, cost: 24 }, { value: 170, cost: 40 }, { value: 160, cost: 56 }, { value: 150, cost: 72 }, { value: 140, cost: 88 }, { value: 130, cost: 104 }, { value: 120, cost: 120 }, { value: 110, cost: 136 }, { value: 100, cost: 152 }, { value: 90, cost: 168 }, { value: 80, cost: 184 }, { value: 70, cost: 200 }, { value: 60, cost: 216 }, { value: 50, cost: 232 }]), formatValue: (v: number) => `${v.toFixed(0)}s` }),
  }),
  plus: Object.freeze({ name: 'Charge Mines', getDescription: (v: number) => `The Damage of Inner Land Mines charge up the longer they're alive, increasing by x${v.toFixed(2)} per second`, cost: ALTERNATE_BASE_300, values: Object.freeze([0.5, 1.51, 2.57, 3.76, 5.18, 6.92, 9.09, 11.8, 15.19, 19.37, 24.47]) }),
});

export const CHAIN_LIGHTNING = Object.freeze({
  name: 'Chain Lightning',
  upgrades: Object.freeze({
    'Damage %': Object.freeze({ values: Object.freeze([{ value: 110, cost: 0 }, { value: 142, cost: 5 }, { value: 180, cost: 11 }, { value: 225, cost: 17 }, { value: 279, cost: 23 }, { value: 341, cost: 29 }, { value: 413, cost: 35 }, { value: 496, cost: 41 }, { value: 589, cost: 47 }, { value: 693, cost: 53 }, { value: 809, cost: 61 }, { value: 937, cost: 71 }, { value: 1077, cost: 84 }, { value: 1230, cost: 100 }, { value: 1395, cost: 120 }, { value: 1574, cost: 144 }, { value: 1766, cost: 174 }, { value: 1972, cost: 210 }, { value: 2192, cost: 252 }, { value: 2426, cost: 302 }, { value: 2675, cost: 362 }, { value: 2939, cost: 434 }, { value: 3217, cost: 525 }, { value: 3510, cost: 636 }, { value: 3819, cost: 767 }, { value: 4143, cost: 923 }, { value: 4483, cost: 1109 }, { value: 4839, cost: 1295 }, { value: 5211, cost: 1521 }, { value: 5599, cost: 1787 }, { value: 6004, cost: 2103 }]), perk: (v: number) => v * 2, formatValue: (v: number) => `${v.toFixed(0)}%` }),
    Bolts: Object.freeze({ values: Object.freeze([{ value: 1, cost: 0 }, { value: 2, cost: 30 }, { value: 3, cost: 75 }, { value: 4, cost: 150 }, { value: 5, cost: 400 }]), formatValue: (v: number) => `${v.toFixed(0)}` }),
    'Chance %': Object.freeze({ values: Object.freeze([{ value: 5.0, cost: 0 }, { value: 6.5, cost: 8 }, { value: 8.0, cost: 26 }, { value: 9.5, cost: 44 }, { value: 11.0, cost: 62 }, { value: 12.5, cost: 80 }, { value: 14.0, cost: 98 }, { value: 15.5, cost: 116 }, { value: 17.0, cost: 134 }, { value: 18.5, cost: 152 }, { value: 20.0, cost: 170 }, { value: 21.5, cost: 188 }, { value: 23.0, cost: 206 }, { value: 24.5, cost: 224 }, { value: 26.0, cost: 242 }, { value: 27.5, cost: 260 }]), formatValue: (v: number) => `${v.toFixed(1)}%` }),
  }),
  plus: Object.freeze({ name: 'Smite', getDescription: (v: number) => `Smite a random enemy on screen once every ${v} seconds, dealing damage equal to the current wave HP`, cost: BASE_300, values: Object.freeze([30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10]) }),
});

export const SPOTLIGHT = Object.freeze({
  name: 'Spotlight',
  upgrades: Object.freeze({
    Bonus: Object.freeze({ values: Object.freeze([{ value: 8, cost: 0 }, { value: 9.4, cost: 5 }, { value: 10.8, cost: 13 }, { value: 12.2, cost: 21 }, { value: 13.6, cost: 30 }, { value: 15, cost: 40 }, { value: 16.4, cost: 52 }, { value: 17.8, cost: 65 }, { value: 19.2, cost: 80 }, { value: 20.6, cost: 95 }, { value: 22, cost: 112 }, { value: 23.4, cost: 133 }, { value: 24.8, cost: 150 }, { value: 26.2, cost: 180 }, { value: 27.6, cost: 220 }, { value: 29, cost: 280 }, { value: 30.4, cost: 320 }, { value: 31.8, cost: 360 }, { value: 33.2, cost: 420 }, { value: 34.6, cost: 500 }, { value: 36, cost: 600 }, { value: 37.4, cost: 720 }, { value: 38.8, cost: 850 }, { value: 40.2, cost: 1000 }, { value: 41.6, cost: 1175 }, { value: 43, cost: 1400 }]), perk: (v: number) => v * 1.5, formatValue: (v: number) => `${v.toFixed(2)}x` }),
    Angle: Object.freeze({ values: Object.freeze([{ value: 30, cost: 0 }, { value: 31, cost: 5 }, { value: 32, cost: 16 }, { value: 33, cost: 27 }, { value: 34, cost: 38 }, { value: 35, cost: 49 }, { value: 36, cost: 60 }, { value: 37, cost: 71 }, { value: 38, cost: 82 }, { value: 39, cost: 93 }, { value: 40, cost: 104 }, { value: 41, cost: 115 }, { value: 42, cost: 126 }, { value: 43, cost: 137 }, { value: 44, cost: 148 }, { value: 45, cost: 159 }, { value: 46, cost: 170 }, { value: 47, cost: 181 }, { value: 48, cost: 192 }, { value: 49, cost: 203 }, { value: 50, cost: 214 }, { value: 51, cost: 225 }, { value: 52, cost: 236 }, { value: 53, cost: 247 }, { value: 54, cost: 258 }, { value: 55, cost: 269 }, { value: 56, cost: 280 }, { value: 57, cost: 291 }, { value: 58, cost: 302 }, { value: 59, cost: 313 }, { value: 60, cost: 324 }]), formatValue: (v: number) => `${v.toFixed(0)}` }),
    Quantity: Object.freeze({ values: Object.freeze([{ value: 1, cost: 0 }, { value: 2, cost: 375 }, { value: 3, cost: 850 }]), formatValue: (v: number) => `${v.toFixed(0)}` }),
  }),
  plus: Object.freeze({ name: 'Light Range', getDescription: (v: number) => `Enemies within the spotlight are targetable ${v}% further away than max range`, cost: BASE_400, values: Object.freeze([15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75]) }),
});

export const ULTIMATE_WEAPONS = Object.freeze({
  'Death Wave': DEATH_WAVE,
  'Black Hole': BLACK_HOLE,
  'Golden Tower': GOLDEN_TOWER,
  'Smart Missiles': SMART_MISSILES,
  'Chrono Field': CHRONO_FIELD,
  'Poison Swamp': POISON_SWAMP,
  'Inner Land Mines': INNER_LAND_MINES,
  'Chain Lightning': CHAIN_LIGHTNING,
  'Spotlight': SPOTLIGHT,
});

export const ULTIMATE_WEAPON_NAMES = Object.freeze(['Death Wave', 'Black Hole', 'Golden Tower', 'Smart Missiles', 'Chrono Field', 'Poison Swamp', 'Inner Land Mines', 'Chain Lightning', 'Spotlight']);
