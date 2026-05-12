import { SpeciesData, MochiiInstance, ElementType, ActionData } from "../types";

// --- 1. CORE MATH & LEVELING --- //

const EXP_YIELDS = {
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

export function getExpForLevel(growth_curve: SpeciesData["growth_curve"], level: number): number {
  if (level <= 1) return 0;
  return EXP_YIELDS[growth_curve](level);
}

// 2. STAT CALCULATION
export function calculateHP(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

export function calculateStat(base: number, iv: number, ev: number, level: number, natureModifier: number): number {
  const stat = Math.floor(Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5);
  return Math.floor(stat * natureModifier);
}

// Map temperaments to nature mods (just a sample, mapped to M. OS lore)
export const TEMPERAMENTS: Record<string, { buff: string, nerf: string }> = {
  "Aggressive": { buff: "atk", nerf: "def" },
  "Defensive": { buff: "def", nerf: "atk" },
  "Overclocked": { buff: "spe", nerf: "def" },
  "Optimized": { buff: "spa", nerf: "atk" },
  "Resilient": { buff: "spd", nerf: "spa" },
  "Neutral": { buff: "none", nerf: "none" }
};

export function getNatureModifier(temperament: string, statKey: string): number {
  const t = TEMPERAMENTS[temperament] || TEMPERAMENTS["Neutral"];
  if (t.buff === statKey) return 1.1;
  if (t.nerf === statKey) return 0.9;
  return 1.0;
}

// Create an instance properly
export function instantiateMochii(species: SpeciesData, level: number): MochiiInstance {
  const ivs = {
    hp: Math.floor(Math.random() * 32),
    atk: Math.floor(Math.random() * 32),
    def: Math.floor(Math.random() * 32),
    spa: Math.floor(Math.random() * 32),
    spd: Math.floor(Math.random() * 32),
    spe: Math.floor(Math.random() * 32),
  };
  const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  
  const temperaments = Object.keys(TEMPERAMENTS);
  const temp = temperaments[Math.floor(Math.random() * temperaments.length)];
  
  const hp = calculateHP(species.base_stats.hp, ivs.hp, evs.hp, level);
  
  // Assign initial moves based on learnset
  const moves: string[] = [];
  species.learnset.sort((a, b) => a.level - b.level).forEach(l => {
     if (l.level <= level && moves.length < 4) {
        if (!moves.includes(l.move_id)) moves.push(l.move_id);
     } else if (l.level <= level) {
        moves.shift();
        moves.push(l.move_id);
     }
  });

  return {
    uid: "mochii_" + Math.random().toString(36).substr(2, 9),
    species_id: species.id,
    name: species.name,
    level,
    experience: getExpForLevel(species.growth_curve, level),
    temperament: temp,
    inherent_values: ivs,
    overclock_stats: evs,
    moves,
    current_pp: [10, 10, 10, 10], // placeholder
    current_hp: hp,
    primary_status: "NONE",
    equipped_drive: null,
    is_prismatic: Math.random() < (1 / 4096),
    sync_level: 70
  };
}

// 3. COMBAT ENGINE & TYPE CHART
export const TYPE_CHART: Record<ElementType, Record<ElementType, number>> = {
  Aqua: { Flame: 2.0, Flora: 0.5, Aqua: 0.5, Earth: 2.0, Chrome: 1.0, Umbral: 1.0, Mythic: 1.0, Neon: 1.0, Void: 1.0, Electric: 1.0, Poison: 1.0, Flesh: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Metal: 1.0 } as any,
  Flame: { Flora: 2.0, Aqua: 0.5, Chrome: 2.0, Flame: 0.5, Flesh: 2.0, Earth: 1.0, Umbral: 1.0, Mythic: 1.0, Neon: 1.0, Void: 1.0, Electric: 1.0, Poison: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Metal: 1.0 } as any,
  Flora: { Aqua: 2.0, Flame: 0.5, Flora: 0.5, Earth: 2.0, Poison: 0.5, Chrome: 1.0, Umbral: 1.0, Mythic: 1.0, Neon: 1.0, Void: 1.0, Electric: 1.0, Flesh: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Metal: 1.0 } as any,
  Umbral: { Mythic: 2.0, Umbral: 0.5, Void: 2.0, Neon: 0.5, Chrome: 1.0, Aqua: 1.0, Flame: 1.0, Flora: 1.0, Electric: 1.0, Poison: 1.0, Flesh: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Earth: 1.0, Metal: 1.0 } as any,
  Chrome: { Flora: 1.0, Flame: 0.5, Chrome: 0.5, Flesh: 2.0, Poison: 0.0, Aqua: 1.0, Umbral: 1.0, Mythic: 1.0, Neon: 1.0, Void: 1.0, Electric: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Earth: 1.0, Metal: 1.0 } as any,
  Neon: { Umbral: 2.0, Mythic: 0.5, Void: 0.5, Chrome: 1.0, Aqua: 1.0, Flame: 1.0, Flora: 1.0, Electric: 1.0, Poison: 1.0, Flesh: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Earth: 1.0, Metal: 1.0, Neon: 1.0 } as any,
  Void: { Neon: 2.0, Mythic: 2.0, Umbral: 0.5, Chrome: 1.0, Aqua: 1.0, Flame: 1.0, Flora: 1.0, Electric: 1.0, Poison: 1.0, Flesh: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Earth: 1.0, Metal: 1.0, Void: 1.0 } as any,
  Mythic: { Umbral: 0.5, Void: 0.5, Neon: 2.0, Chrome: 1.0, Aqua: 1.0, Flame: 1.0, Flora: 1.0, Electric: 1.0, Poison: 1.0, Flesh: 1.0, Digital: 1.0, Normal: 1.0, Bone: 1.0, Earth: 1.0, Metal: 1.0, Mythic: 1.0 } as any,
  Digital: { Chrome: 2.0, Void: 2.0, Flesh: 0.5, Aqua: 1.0, Flame: 1.0, Flora: 1.0, Umbral: 1.0, Mythic: 1.0, Neon: 1.0, Electric: 1.0, Poison: 1.0, Normal: 1.0, Bone: 1.0, Earth: 1.0, Metal: 1.0, Digital: 1.0 } as any,
  Normal: { Chrome: 0.5, Void: 0.0, Mythic: 1.0, Aqua: 1.0, Flame: 1.0, Flora: 1.0, Umbral: 1.0, Neon: 1.0, Electric: 1.0, Poison: 1.0, Flesh: 1.0, Digital: 1.0, Bone: 1.0, Earth: 1.0, Metal: 1.0, Normal: 1.0 } as any,
  // Other types omitted for brevity fallback to 1.0 using Proxy
} as any;

const safeTypeChart = new Proxy(TYPE_CHART, {
  get: (target, prop: ElementType) => {
    if (target[prop]) {
       return new Proxy(target[prop], {
          get: (innerTarget, innerProp: ElementType) => innerTarget[innerProp] !== undefined ? innerTarget[innerProp] : 1.0
       });
    }
    return new Proxy({}, { get: () => 1.0 });
  }
});

export function getEffectiveness(attackType: ElementType, defenderTypes: ElementType[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    multiplier *= safeTypeChart[attackType][defType];
  }
  return multiplier;
}

export function executeDamageFormula(
  attackerLevel: number,
  basePower: number,
  attackerStat: number,
  defenderStat: number,
  stab: boolean,
  effectiveness: number,
  isBurned: boolean,
  isPhysical: boolean,
  attackType?: ElementType,
  weather: string = "CLEAR"
) {
  let weatherModifier = 1.0;
  if (weather === "FIREWALL") {
    if (attackType === "Flame") weatherModifier = 1.5;
    if (attackType === "Aqua") weatherModifier = 0.5;
  } else if (weather === "DATA_STORM") {
    if (attackType === "Aqua" || attackType === "Electric") weatherModifier = 1.5;
    if (attackType === "Flame") weatherModifier = 0.5;
  } else if (weather === "VOID_FOG") {
    if (attackType === "Void") weatherModifier = 1.5;
  }

  let baseDamage = Math.floor((Math.floor((2 * attackerLevel) / 5 + 2) * attackerStat * basePower) / defenderStat);
  baseDamage = Math.floor(baseDamage / 50) + 2;
  
  const isCrit = Math.random() < 0.0625; // 1/16
  const critMultiplier = isCrit ? 1.5 : 1;
  const randomRoll = (Math.floor(Math.random() * 16) + 85) / 100;
  const stabMultiplier = stab ? 1.5 : 1.0;
  const burnPenalty = (isBurned && isPhysical) ? 0.5 : 1.0;
  
  const finalDamage = Math.floor(baseDamage * stabMultiplier * effectiveness * critMultiplier * randomRoll * burnPenalty * weatherModifier);
  return { damage: finalDamage, isCrit, effectiveness, weatherModifier };
}

// 4. EXPERIMENTAL MOVES DATABASE (Dynamic generation overrides)
export const movesDB: Record<string, ActionData> = {
  "chrome_slash": { id: "chrome_slash", name: "Chrome Slash", element: "Chrome", category: "PHYSICAL", base_power: 70, accuracy: 100, pp: 20, priority: 0 },
  "hydro_shockwave": { id: "hydro_shockwave", name: "Hydro Shockwave", element: "Aqua", category: "SPECIAL", base_power: 90, accuracy: 100, pp: 15, priority: 0 },
  "inferno_compile": { id: "inferno_compile", name: "Inferno Compile", element: "Flame", category: "SPECIAL", base_power: 110, accuracy: 85, pp: 5, priority: 0, effect_chance: 10, effect: "BRN" },
  "malware_taunt": { id: "malware_taunt", name: "Malware Taunt", element: "Umbral", category: "STATUS", base_power: 0, accuracy: 100, pp: 15, priority: 0, effect: "TAUNT" },
  "neon_pulse": { id: "neon_pulse", name: "Neon Pulse", element: "Neon", category: "SPECIAL", base_power: 80, accuracy: 100, pp: 15, priority: 0 },
  "void_collapse": { id: "void_collapse", name: "Void Collapse", element: "Void", category: "SPECIAL", base_power: 120, accuracy: 70, pp: 5, priority: 0 },
  "flesh_rend": { id: "flesh_rend", name: "Flesh Rend", element: "Flesh", category: "PHYSICAL", base_power: 75, accuracy: 95, pp: 15, priority: 0, effect_chance: 30, effect: "PSN" },
  "overclock_drive": { id: "overclock_drive", name: "Overclock Drive", element: "Digital", category: "STATUS", base_power: 0, accuracy: 100, pp: 10, priority: 1, effect: "BUFF_SPE" }
};
