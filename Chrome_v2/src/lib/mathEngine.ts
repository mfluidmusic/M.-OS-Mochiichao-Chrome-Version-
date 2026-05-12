import { MochiiInstance } from "../useGameStore";
import { SpeciesData } from "../types";

export const temperaments: Record<string, { plus: string; minus: string }> = {
  Overclocked: { plus: 'spe', minus: 'def' },
  Aggressive: { plus: 'atk', minus: 'spa' },
  Fortified: { plus: 'def', minus: 'spe' },
  Optimized: { plus: 'spa', minus: 'atk' },
  Resilient: { plus: 'spd', minus: 'spa' },
  Volatile: { plus: 'atk', minus: 'def' },
  Calculated: { plus: 'spa', minus: 'spe' },
  Neutral: { plus: 'none', minus: 'none' }
};

export const GROWTH_RATES = {
  ERRATIC: (level: number) => {
    if (level <= 50) return Math.floor(Math.pow(level, 3) * (100 - level) / 50);
    if (level <= 68) return Math.floor(Math.pow(level, 3) * (150 - level) / 100);
    if (level <= 98) return Math.floor(Math.pow(level, 3) * Math.floor((1911 - 10 * level) / 3) / 500);
    return Math.floor(Math.pow(level, 3) * (160 - level) / 100);
  },
  FAST: (level: number) => Math.floor(4 * Math.pow(level, 3) / 5),
  MEDIUM_FAST: (level: number) => Math.pow(level, 3),
  MEDIUM_SLOW: (level: number) => Math.floor((6/5) * Math.pow(level, 3) - 15 * Math.pow(level, 2) + 100 * level - 140),
  SLOW: (level: number) => Math.floor(5 * Math.pow(level, 3) / 4),
  FLUCTUATING: (level: number) => {
    if (level <= 15) return Math.floor(Math.pow(level, 3) * (Math.floor((level + 1) / 3) + 24) / 50);
    if (level <= 36) return Math.floor(Math.pow(level, 3) * (level + 14) / 50);
    return Math.floor(Math.pow(level, 3) * (Math.floor(level / 2) + 32) / 50);
  }
};

export function getExpNeeded(growthCurve: string, nextLevel: number): number {
  if (nextLevel <= 1) return 0;
  const curve = GROWTH_RATES[growthCurve.toUpperCase() as keyof typeof GROWTH_RATES] || GROWTH_RATES.MEDIUM_FAST;
  return curve(nextLevel);
}

export function calculateMaxHP(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

export function calculateOtherStat(base: number, iv: number, ev: number, level: number, plus: boolean, minus: boolean): number {
  const raw = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const modifier = plus ? 1.1 : minus ? 0.9 : 1.0;
  return Math.floor(raw * modifier);
}

export function calculateAllStats(instance: MochiiInstance, species: SpeciesData) {
  const temperament = temperaments[instance.nature?.boost || "Neutral"] || temperaments.Neutral;
  
  const hp = calculateMaxHP(species.base_stats.hp, instance.ivs.hp, instance.evs.hp, instance.level);
  const atk = calculateOtherStat(species.base_stats.atk, instance.ivs.atk, instance.evs.atk, instance.level, temperament.plus === 'atk', temperament.minus === 'atk');
  const def = calculateOtherStat(species.base_stats.def, instance.ivs.def, instance.evs.def, instance.level, temperament.plus === 'def', temperament.minus === 'def');
  const spa = calculateOtherStat(species.base_stats.spa, instance.ivs.spa, instance.evs.spa, instance.level, temperament.plus === 'spa', temperament.minus === 'spa');
  const spd = calculateOtherStat(species.base_stats.spd, instance.ivs.spd, instance.evs.spd, instance.level, temperament.plus === 'spd', temperament.minus === 'spd');
  const spe = calculateOtherStat(species.base_stats.spe, instance.ivs.spe, instance.evs.spe, instance.level, temperament.plus === 'spe', temperament.minus === 'spe');

  return { hp, atk, def, spa, spd, spe };
}

export function getStageMultiplier(stage: number): number {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 - stage);
}

export function getAccuracyMultiplier(stage: number): number {
  if (stage >= 0) return (3 + stage) / 3;
  return 3 / (3 - stage);
}
