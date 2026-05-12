export type ElementType = "Aqua" | "Flame" | "Flora" | "Metal" | "Chrome" | "Umbral" | "Mythic" | "Neon" | "Void" | "Electric" | "Poison" | "Flesh" | "Digital" | "Normal" | "Bone" | "Earth";

export interface SpeciesData {
  os_dex_number: number;
  id: string; // "001", "002"
  name: string;
  base_stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  elements: ElementType[];
  drivers: string[];
  learnset: Array<{ level: number; move_id: string }>;
  base_exp_yield: number;
  execution_yield: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  catch_rate: number;
  growth_curve: "ERRATIC" | "FAST" | "MEDIUM_FAST" | "MEDIUM_SLOW" | "SLOW" | "FLUCTUATING";
  recompile_conditions: Array<{ type: string; value: string | number }>;
}

export type StatusCondition = "NONE" | "BRN" | "FRZ" | "PAR" | "PSN" | "TOX" | "CRPT" | "SLP" | "RST" | "GLITCH";

export interface MochiiInstance {
  uid: string;
  species_id: string; // or int
  name: string;      // nickname
  level: number;
  experience: number;
  temperament: string; // Nature
  inherent_values: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  overclock_stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves: string[];      // Max 4
  current_pp: number[];
  current_hp: number;
  primary_status: StatusCondition;
  equipped_drive: string | null;
  is_prismatic: boolean;
  sync_level: number; // 0-255
  is_egg?: boolean;
  egg_steps_remaining?: number;
  total_hatch_steps?: number;
}

export interface ActionData {
  id: string;
  name: string;
  element: ElementType;
  category: "PHYSICAL" | "SPECIAL" | "STATUS";
  base_power: number;
  accuracy: number; // 0-100
  pp: number;
  priority: number; // -7 to +5
  effect_chance?: number;
  effect?: string;
}
