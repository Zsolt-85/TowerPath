export const GOLDEN = '#f0a500';
export const TEAL = '#00d4aa';
export const RED = '#ff4466';
export const PURPLE = '#a855f7';
export const BG_DEEP = '#060610';
export const BG = '#0a0a14';
export const BG_CARD = '#10101e';
export const BG_CARD_HOVER = '#161628';
export const BORDER = '#1e1e3a';
export const TEXT = '#e8e8f0';
export const TEXT_DIM = '#8888aa';
export const TEXT_MUTED = '#555570';

export interface StatCard {
  label: string;
  value: string;
  change?: string;
  changeDir?: 'up' | 'down';
  variant: 'gold' | 'teal' | 'red' | 'purple';
}

export interface PathRecommendation {
  rank: number;
  rankVariant: 'gold' | 'silver' | 'teal';
  name: string;
  desc: string;
  badge: string;
  badgeVariant: 'gold' | 'teal' | 'red';
}

export interface UpgradeProgress {
  label: string;
  pct: number;
  variant: 'gold' | 'teal';
}

export interface CardData {
  name: string;
  stars: number;
  owned: boolean;
  locked: boolean;
}

export interface UWCard {
  name: string;
  icon: string;
  status: string;
  synced: boolean;
}

export interface SyncHistoryEntry {
  status: string;
  title: string;
  desc: string;
  variant: 'gold' | 'teal';
}

export const STATS: StatCard[] = [
  { label: 'Highest Wave', value: '4,820', change: '▲ +340 from last', changeDir: 'up', variant: 'gold' },
  { label: 'Damage', value: '12.8M', change: '▲ +8% this week', changeDir: 'up', variant: 'teal' },
  { label: 'Coins/Hour', value: '2.4B', change: '▲ +15% optimized', changeDir: 'up', variant: 'gold' },
  { label: 'Golden Tower Sync', value: '300s', change: '▼ Need 150s', changeDir: 'down', variant: 'red' },
  { label: 'Lab Progress', value: '78/142', change: '55% complete', changeDir: 'up', variant: 'teal' },
];

export const RECOMMENDATIONS: PathRecommendation[] = [
  { rank: 1, rankVariant: 'gold', name: 'Golden Tower Cooldown', desc: 'Reduces from 300s → 150s. Cost: 2,400 stones', badge: 'High Priority', badgeVariant: 'gold' },
  { rank: 2, rankVariant: 'gold', name: 'Black Hole Duration', desc: 'Increases 180s → 240s. Cost: 1,800 stones', badge: 'High Priority', badgeVariant: 'gold' },
  { rank: 3, rankVariant: 'silver', name: 'Lab Speed Research', desc: '50 → 75 research speed. Cost: 12M coins', badge: 'Medium', badgeVariant: 'teal' },
  { rank: 4, rankVariant: 'teal', name: 'Cash/Wave Workshop Upgrade', desc: '+50% coins per wave. Cost: 800K coins', badge: 'Economical', badgeVariant: 'gold' },
  { rank: 5, rankVariant: 'teal', name: 'Critical Factor Lab', desc: 'Research level 50 → 60. Cost: 200 gems', badge: 'Low', badgeVariant: 'teal' },
];

export const UPGRADE_PROGRESS: UpgradeProgress[] = [
  { label: 'Golden Tower CD', pct: 35, variant: 'gold' },
  { label: 'Black Hole Sync', pct: 55, variant: 'teal' },
  { label: 'Lab Speed', pct: 78, variant: 'gold' },
  { label: 'Workshop Utility', pct: 62, variant: 'teal' },
  { label: 'Card Collection', pct: 28, variant: 'gold' },
];

export const UW_NAMES = ['Death Wave', 'Black Hole', 'Golden Tower', 'Smart Missiles', 'Chrono Field', 'Poison Swamp', 'Inner Land Mines', 'Chain Lightning', 'Spotlight'];
export const ALL_BOT_NAMES = ['Flame Bot', 'Thunder Bot', 'Golden Bot', 'Amplify Bot'];
export const ALL_CARD_NAMES = Object.freeze(['Damage','Attack Speed','Health','Health Regen','Range','Cash','Coins','Slow Aura','Critical Chance','Enemy Balance','Extra Defense','Fortress','Intro Sprint','Wave Skip','Critical Coin','Plasma Cannon','Extra Orb','Free Upgrades','Land Mine Stun','Recovery Package Chance','Death Ray','Energy Net','Super Tower','Second Wind','Demon Mode','Energy Shield','Wave Accelerator','Berserker','Ultimate Crit']);
export const ALL_LAB_NAMES = ['Game Speed','Lab Speed','Starting Cash','Workshop Attack Discount','Workshop Defense Discount','Workshop Utility Discount','Labs Coin Discount','Damage','Attack Speed','Critical Factor','Range','Damage / Meter','Super Crit Chance','Super Crit Mult','Max Rend Armor Multiplier','Health','Health Regen','Defense Absolute','Defense %','Orbs Speed','Land Mine Damage','Land Mine Decay','Shockwave Size','Orb Boss Hit','Wall Health','Wall Rebuild','Wall Regen','Wall Thorns','Wall Invincibility','Cash Bonus','Cash / Wave','Coins / Kill Bonus','Coins / Wave','Interest','Max Interest','Package After Boss','Enemy Attack Level Skip','Enemy Health Level Skip','Missile Despawn Time','Missiles Explosion','Missile Radius','Chrono Field Duration','Chrono Field Damage Reduction','Chrono Field Reduction %','Swamp Radius','Swamp Stun','Swamp Stun Chance','Swamp Stun Time','Golden Tower Bonus','Golden Tower Duration','Chain Lightning Shock','Shock Chance','Shock Multiplier','Death Wave Health','Death Wave Coin bonus','Inner Mine Blast Radius','Inner Mine Rotation Speed','Chrono Field Range','Missile Amplifier','Missile Barrage','Missile Barrage Quantity','Inner Mine Stun','Black Hole Damage','Extra Black Hole','Blackhole Coin Bonus','Spotlight Coin Bonus','Spotlight Missiles','Black Hole disable Ranged Enemies','Second Wind Blast','Double Death Ray','Extra Orb Adjuster','Extra Inner Orbs','Energy Shield Extra Hit','Super Tower Bonus','Unlock Perks','Waves Required','Auto Pick Perks','Standard Perks Bonus','Perk Option Quantity','First Perk Choice','Ban Perks','Improve Trade-off Perks','Flame Bot Frequency','Thunder Bot Frequency','Gold Bot Frequency','Amp Bot Frequency','Common Enemy Health','Common Enemy Attack','Fast Enemy Health','Fast Enemy Attack','Fast Enemy Speed','Tank Enemy Health','Tank Enemy Attack','Ranged Enemy Health','Ranged Enemy Attack','Boss Health','Boss Attack','Protector Health','Protector Radius','Protector Damage Reduction','Light Speed Shots'];

export const WORKSHOP_UPGRADES = [
  { name: 'Damage', max: 6000, base: 6, cost: '816T' },
  { name: 'Attack Speed', max: 99, base: 1.0, cost: '3.6M' },
  { name: 'Critical Chance', max: 79, base: 1, cost: '1.41M' },
  { name: 'Critical Factor', max: 150, base: 1.2, cost: '259.2B' },
  { name: 'Range', max: 79, base: 30, cost: '1.46M' },
  { name: 'Damage/Meter', max: 200, base: 0, cost: '316.5T' },
  { name: 'Health', max: 5000, base: 1, cost: '1.23T' },
  { name: 'Health Regen', max: 5000, base: 1, cost: '1.23T' },
  { name: 'Defense %', max: 99, base: 0, cost: '2.77M' },
  { name: 'Defense Absolute', max: 5000, base: 0, cost: '1.23T' },
  { name: 'Thorns', max: 99, base: 0, cost: '2.33M' },
  { name: 'Cash Bonus', max: 149, base: 1, cost: '14.82M' },
  { name: 'Coins/Kill', max: 149, base: 1, cost: '19.47M' },
  { name: 'Interest', max: 99, base: 0, cost: '7.36M' },
];

export const GAME_SPEED = [
  { level: 1, cost: 300, time: '9m', value: 'x2.0' },
  { level: 2, cost: 2500, time: '2h30m', value: 'x2.5' },
  { level: 3, cost: 12000, time: '9h48m', value: 'x3.0' },
  { level: 4, cost: 50000, time: '1d10h', value: 'x3.5' },
  { level: 5, cost: 150000, time: '3d19h', value: 'x4.0' },
  { level: 6, cost: 500000, time: '14d1h', value: 'x4.5' },
  { level: 7, cost: 1000000, time: '25d11h', value: 'x5.0' },
];

export const CURRENCY_INFO = [
  { name: 'Cash', icon: '$', desc: 'In-run temporary upgrades', color: '#00d4aa' },
  { name: 'Coins', icon: '©', desc: 'Workshop & Lab purchases', color: '#f0a500' },
  { name: 'Gems', icon: '◆', desc: 'Premium currency', color: '#a855f7' },
  { name: 'Stones', icon: '◇', desc: 'UW & Bot+ upgrades', color: '#ff4466' },
  { name: 'Medals', icon: '★', desc: 'Bot purchases', color: '#00d4aa' },
  { name: 'Elite Cells', icon: '⚡', desc: 'Lab speed boosting', color: '#f0a500' },
];

export const TIER_INFO = [
  { tier: 1, enemies: 'Basic', damage: 'Low', hp: 'Low' },
  { tier: 5, enemies: 'Fast', damage: 'Medium', hp: 'Medium' },
  { tier: 10, enemies: 'Tank', damage: 'High', hp: 'High' },
  { tier: 15, enemies: 'Boss', damage: 'Very High', hp: 'Very High' },
];

export const WAVE_DURATION = 26;
export const NORMAL_WAVE_COOLDOWN = 9;
export const BOSS_WAVE_COOLDOWN = 12;
export const SPAWN_THRESHOLDS = [0,1,3,6,20,40,60,80,100,150,160,200,250,300,320,400,600,750,800,1000,1250,1500,2000,2500,3000,3500,4000,4500,5000,5500,6000,6500];
