import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import * as idb from 'idb-keyval';

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await idb.get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idb.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idb.del(name);
  },
};

export interface MochiiCoreData {
  id: string; // "001", "002"
  name: string;
  base_stats: { hp: number, atk: number, def: number, spa: number, spd: number, spe: number };
  types: [string, string?];
  catch_rate: number; // 0-255
  base_exp_yield: number;
  growth_rate: "fast" | "medium_fast" | "slow";
  evolution_level?: number;
  evolution_id?: string;
}

export interface MochiiInstance {
  uid: string;
  species_id: string;
  id: string;
  name: string;
  level: number;
  exp: number;
  ivs: { hp: number, atk: number, def: number, spa: number, spd: number, spe: number };
  evs: { hp: number, atk: number, def: number, spa: number, spd: number, spe: number };
  nature: { boost: keyof MochiiInstance['ivs'], hinder: keyof MochiiInstance['ivs'] };
  current_hp: number;
  status_condition: "NONE" | "BRN" | "PAR" | "PSN" | "FRZ" | "SLP" | "TOX" | "CRPT";
  battle_stats: {
    hp: number,
    atk: number,
    def: number,
    spa: number,
    spd: number,
    spe: number,
    max_hp: number,
    level: number,
    current_hp: number,
    exp: number
  };
  types?: string[];
  moves: string[];
  pending_evolution?: boolean;
  needs?: { hunger: number, energy: number, affection: number };
  is_prismatic?: boolean;
  evolution_level?: number;
  sync_level?: number;
  is_egg?: boolean;
  egg_steps_remaining?: number;
  total_hatch_steps?: number;
  equipped_drive?: string | null;
  rarity?: string;
  characterId?: string;
  type?: string;
  is_branded?: boolean;
  is_escaped?: boolean;
  is_trainer?: boolean;
}

export type UIState = "none" | "main" | "roster" | "bag" | "mochiioteca" | "logbook" | "pc_box" | "settings" | "map" | "companion" | "infinity_arcade" | "market";

export const CALC_STATS = (base: any, ivs: any, evs: any, level: number, natureBoost: string, natureHinder: string) => {
  const calcStat = (b: number, i: number, e: number, isHp: boolean, statName: string) => {
     let val = Math.floor(((2 * b + i + Math.floor(e / 4)) * level) / 100);
     if (isHp) return val + level + 10;
     val += 5;
     if (statName === natureBoost) val = Math.floor(val * 1.1);
     if (statName === natureHinder) val = Math.floor(val * 0.9);
     return val;
  };
  return {
    hp: calcStat(base.hp, ivs.hp, evs.hp, true, 'hp'),
    atk: calcStat(base.atk, ivs.atk, evs.atk, false, 'atk'),
    def: calcStat(base.def, ivs.def, evs.def, false, 'def'),
    spa: calcStat(base.spa, ivs.spa, evs.spa, false, 'spa'),
    spd: calcStat(base.spd, ivs.spd, evs.spd, false, 'spd'),
    spe: calcStat(base.spe, ivs.spe, evs.spe, false, 'spe')
  };
};

interface GameState {
  gltf_cache: Record<string, string>;
  story: {
    has_seen_branded: boolean;
    is_safari_mode: boolean;
  };
  player: {
    badges: string[];
    inventory: any[];
    credits: number;
    campaign_progress: any;
    hall_of_fame?: any[][];
  };
  roster: {
    active_party: MochiiInstance[];
    pc_box: MochiiInstance[];
    mochiioteca_discovered: string[];
  };
  world: {
    environment_biome?: string;
    current_biome: string;
    game_time: number;
    weather: string;
    astrological_alignment: string;
    active_npcs: any[];
    active_event?: null | {
      type: "outbreak" | "roamer";
      entity_id: string;
      biome: string;
      message: string;
    };
    world_history?: string[];
  };
  combat: {
    is_battling: boolean;
    opponent: any | null;
    turn_state: string;
    active_banter?: string | null;
    field_state?: {
      environmental_weather: "CLEAR" | "FIREWALL" | "DATA_STORM" | "VOID_FOG";
      entry_hazards: string[];
    };
  };
  ui: {
    active_menu: UIState;
    previous_menu: UIState;
    toast_message: string | null;
  };
  audio: {
    master_vol: number;
    bgm_enabled: boolean;
    sfx_enabled: boolean;
    cries_enabled: boolean;
  };
  datalog: {
    seen: string[];
    caught: string[];
  };
  custom_moves: Record<string, any>;
  
  // Actions
  setUI: (menu: GameState["ui"]["active_menu"]) => void;
  closeUI: () => void;
  goBackUI: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  
  // Audio Actions
  setAudioSettings: (settings: Partial<GameState['audio']>) => void;
  setWorldEvent: (event: GameState["world"]["active_event"]) => void;
  logEvent: (eventString: string) => void;
  loadState: (stateStr: string) => void;
  saveToSlot: (slot: number) => Promise<void>;
  loadFromSlot: (slot: number) => Promise<void>;
  
  // Roster Actions
  setRosterData: (active: MochiiInstance[], pc: MochiiInstance[]) => void;
  reorderRoster: (indexA: number, indexB: number) => void;
  useItem: (itemId: string, targetId: string) => void;
  tossItem: (itemId: string) => void;
  addItem: (itemObj: { id: string, name?: string, count: number }) => void;
  swapWithPC: (activeIndex: number, pcIndex: number) => void;
  releaseFromPC: (pcIndex: number) => void;
  tickNeeds: () => void;
  addEXP: (amount: number, targetIndex: number) => void;
  applyBanter: (text: string) => void;
  // Datalog Actions
  markSeen: (speciesId: string) => void;
  markCaught: (speciesId: string) => void;
  addCredits: (amount: number) => void;
  addHallOfFame: (rosterSnapshot: any[]) => void;
  
  // Walking Mechanics
  stepOverworld: () => void;
  hatchEgg: (index: number) => void;
  cacheGltf: (id: string, url: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  gltf_cache: {},
  story: {
    has_seen_branded: false,
    is_safari_mode: false,
  },
  player: {
    badges: [],
    inventory: [
      { id: "omega_crux", count: 1 },
      { id: "base_crux", count: 5 },
      { id: "mend_patch", count: 10 },
      { id: "super_patch", count: 5 },
      { id: "max_patch", count: 2 },
      { id: "antiviral", count: 3 },
      { id: "defrost_kit", count: 2 },
      { id: "reboot_drive", count: 1 }
    ],
    credits: 500,
    campaign_progress: {}
  },
  roster: {
    active_party: [] as any[],
    pc_box: [] as any[],
    mochiioteca_discovered: [] as string[]
  },
  world: {
    current_biome: "void",
    game_time: 0,
    weather: "clear",
    astrological_alignment: "Null",
    active_npcs: [],
    active_event: null
  },
  combat: {
    is_battling: false,
    opponent: null,
    turn_state: "idle",
    active_banter: null,
    field_state: {
      environmental_weather: "CLEAR",
      entry_hazards: []
    }
  },
  ui: {
    active_menu: "none",
    previous_menu: "none",
    toast_message: null
  },
  audio: {
    master_vol: 1.0,
    bgm_enabled: true,
    sfx_enabled: true,
    cries_enabled: true
  },
  datalog: {
    seen: [],
    caught: []
  },
  custom_moves: {},
  
  setUI: (menu) => set((state) => ({ 
    ui: { ...state.ui, previous_menu: state.ui.active_menu, active_menu: menu } 
  })),
  
  closeUI: () => set((state) => ({ 
    ui: { ...state.ui, previous_menu: state.ui.active_menu, active_menu: "none" } 
  })),
  
  goBackUI: () => set((state) => ({ 
    ui: { ...state.ui, active_menu: state.ui.previous_menu } 
  })),
  
  showToast: (msg) => {
    set((state) => ({ ui: { ...state.ui, toast_message: msg } }));
    setTimeout(() => {
       set((state) => ({ ui: { ...state.ui, toast_message: null } }));
    }, 3000);
  },
  
  clearToast: () => set((state) => ({ ui: { ...state.ui, toast_message: null } })),
  
  setAudioSettings: (settings) => set((state) => ({ audio: { ...state.audio, ...settings } })),
  
  setWorldEvent: (event) => set((state) => ({ world: { ...state.world, active_event: event } })),
  
  logEvent: (eventString: string) => set((state) => {
     const history = state.world.world_history || [];
     return { world: { ...state.world, world_history: [...history, eventString].slice(-100) } };
  }),

  loadState: (stateStr: string) => set((state) => {
     try {
       const parsed = JSON.parse(stateStr);
       // Merge parsed state without totally destroying un-saveable runtime stuff if possible
       // But typically we do a deep merge or overwrite
       return { ...state, ...parsed.state };
     } catch(e) {
       console.error("Save Load Error", e);
       return state;
     }
  }),

  saveToSlot: async (slot: number) => {
     const state = get();
     const rawData = { state: { player: state.player, roster: state.roster, world: state.world, combat: state.combat } };
     await idbStorage.setItem(`mochii-save-slot-${slot}`, JSON.stringify(rawData));
     get().showToast(`Progress Saved to Slot ${slot}`);
  },

  loadFromSlot: async (slot: number) => {
     const data = await idbStorage.getItem(`mochii-save-slot-${slot}`);
     if (data) {
        get().loadState(data);
        get().showToast(`Loaded Game from Slot ${slot}`);
     } else {
        get().showToast(`Slot ${slot} is empty.`);
     }
  },

  applyBanter: (text: string) => {
     set((state) => ({ combat: { ...state.combat, active_banter: text } }));
     setTimeout(() => set((state) => ({ combat: { ...state.combat, active_banter: null } })), 3500);
  },

  setRosterData: (active, pc) => set((state) => ({
    roster: { ...state.roster, active_party: active, pc_box: pc }
  })),
  reorderRoster: (indexA, indexB) => set((state) => {
    const newActive = [...state.roster.active_party];
    const temp = newActive[indexA];
    newActive[indexA] = newActive[indexB];
    newActive[indexB] = temp;
    return { roster: { ...state.roster, active_party: newActive } };
  }),
  useItem: (itemId, targetId) => set((state) => {
    // Decrement item count
    const newInv = state.player.inventory.map(i => i.id === itemId ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0);
    
    // Apply item effect to target
    const targetIdx = state.roster.active_party.findIndex(c => c.uid === targetId);
    let newParty = [...state.roster.active_party];
    
    if (targetIdx !== -1) {
       let target = { ...newParty[targetIdx] };
       
       if (itemId === "mend_patch") {
          target.battle_stats.current_hp = Math.min(target.battle_stats.current_hp + 20, target.battle_stats.max_hp);
          target.sync_level = Math.min((target.sync_level || 70) + 1, 255);
          get().showToast(`Used Mend Patch on ${target.name}!`);
       } else if (itemId === "super_patch") {
          target.battle_stats.current_hp = Math.min(target.battle_stats.current_hp + 60, target.battle_stats.max_hp);
          target.sync_level = Math.min((target.sync_level || 70) + 1, 255);
          get().showToast(`Used Super Patch on ${target.name}!`);
       } else if (itemId === "max_patch") {
          target.battle_stats.current_hp = target.battle_stats.max_hp;
          target.sync_level = Math.min((target.sync_level || 70) + 1, 255);
          get().showToast(`Used Max Patch on ${target.name}!`);
       } else if (itemId === "antiviral") {
          if (target.status_condition === "PSN" || target.status_condition === "TOX" || target.status_condition === "CRPT") {
             target.status_condition = "NONE";
             target.sync_level = Math.min((target.sync_level || 70) + 1, 255);
             get().showToast(`Cured ${target.name}'s poison!`);
          }
       } else if (itemId === "defrost_kit") {
          if (target.status_condition === "FRZ") {
             target.status_condition = "NONE";
             target.sync_level = Math.min((target.sync_level || 70) + 1, 255);
             get().showToast(`Defrosted ${target.name}!`);
          }
       } else if (itemId === "reboot_drive") {
          if (target.battle_stats.current_hp <= 0) {
             target.battle_stats.current_hp = Math.floor(target.battle_stats.max_hp / 2);
             // synthetic/bitter items decrease friendship
             target.sync_level = Math.max((target.sync_level || 70) - 10, 0);
             get().showToast(`Rebooted ${target.name}!`);
          }
       }
       
       newParty[targetIdx] = target;
    }
    
    return { 
       player: { ...state.player, inventory: newInv },
       roster: { ...state.roster, active_party: newParty }
    };
  }),
  tossItem: (itemId) => set((state) => {
    const newInv = state.player.inventory.map(i => i.id === itemId ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0);
    return { player: { ...state.player, inventory: newInv } };
  }),
  addItem: (itemObj) => set((state) => {
    const newInv = [...state.player.inventory];
    const existing = newInv.find(i => i.id === itemObj.id);
    if (existing) {
       existing.count += itemObj.count;
    } else {
       newInv.push(itemObj);
    }
    return { player: { ...state.player, inventory: newInv } };
  }),
  swapWithPC: (activeIndex, pcIndex) => set((state) => {
    const newActive = [...state.roster.active_party];
    const newPc = [...state.roster.pc_box];
    const temp = newActive[activeIndex];
    newActive[activeIndex] = newPc[pcIndex];
    newPc[pcIndex] = temp;
    return { roster: { ...state.roster, active_party: newActive, pc_box: newPc } };
  }),
  releaseFromPC: (pcIndex) => set((state) => {
    const newPc = [...state.roster.pc_box];
    const released = newPc.splice(pcIndex, 1)[0];
    
    // Convert to Shard logic
    const element = released?.types?.[0] || 'Normal';
    const shardId = `${element.toLowerCase()}_shard`;
    
    const newInv = [...state.player.inventory];
    const existing = newInv.find(i => i.id === shardId);
    if (existing) {
       existing.count += 1;
    } else {
       newInv.push({ id: shardId, count: 1, name: `${element} Shard` });
    }
    
    return { 
       roster: { ...state.roster, pc_box: newPc },
       player: { ...state.player, inventory: newInv }
    };
  }),
  tickNeeds: () => set((state) => {
    const newActive = state.roster.active_party.map(char => {
      if (!char.needs) {
         char.needs = { hunger: 100, energy: 100, affection: 50 };
      }
      return {
         ...char,
         needs: {
            hunger: Math.max(0, char.needs.hunger - 1),
            energy: Math.max(0, char.needs.energy - 1),
            affection: char.needs.affection // Slowly rises based on interaction usually, maybe drops slightly?
         }
      };
    });
    return { roster: { ...state.roster, active_party: newActive } };
  }),
  addEXP: (amount, targetIndex) => set((state) => {
    const newActive = [...state.roster.active_party];
    const target = newActive[targetIndex];
    if (!target) return state;
    
    if (!target.battle_stats) {
       target.battle_stats = { level: target.level || 1, current_hp: target.current_hp || 20, max_hp: target.current_hp || 20, exp: target.exp || 0, hp: 20, atk: 10, def: 10, spa: 10, spd: 10, spe: 10 };
    }
    
    target.exp = (target.exp || target.battle_stats.exp) + amount;
    target.battle_stats.exp = target.exp;
    
    // Growth curve fallback
    const growthCurve = "MEDIUM_FAST"; // Default placeholder if missing from data
    
    const { getExpNeeded } = require("./lib/mathEngine");
    
    let didLevelUp = false;
    let expNeeded = getExpNeeded(growthCurve, target.battle_stats.level + 1);
    
    while (target.exp >= expNeeded) {
       target.battle_stats.level += 1;
       target.level = target.battle_stats.level;
       
       // Real stat calculation via Pokémon Engine Mechanics
       const baseStats = { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 }; // Simulated missing DB lookup
       const ivs = target.ivs || { hp: 15, atk: 15, def: 15, spa: 15, spd: 15, spe: 15 };
       const evs = target.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
       
       const { calculateMaxHP, calculateOtherStat, temperaments } = require("./lib/mathEngine");
       const temp = temperaments[target.nature?.boost || "Neutral"] || temperaments.Neutral;
       
       target.battle_stats.max_hp = calculateMaxHP(baseStats.hp, ivs.hp, evs.hp, target.battle_stats.level);
       target.battle_stats.atk = calculateOtherStat(baseStats.atk, ivs.atk, evs.atk, target.battle_stats.level, temp.plus === 'atk', temp.minus === 'atk');
       target.battle_stats.def = calculateOtherStat(baseStats.def, ivs.def, evs.def, target.battle_stats.level, temp.plus === 'def', temp.minus === 'def');
       target.battle_stats.spa = calculateOtherStat(baseStats.spa, ivs.spa, evs.spa, target.battle_stats.level, temp.plus === 'spa', temp.minus === 'spa');
       target.battle_stats.spd = calculateOtherStat(baseStats.spd, ivs.spd, evs.spd, target.battle_stats.level, temp.plus === 'spd', temp.minus === 'spd');
       target.battle_stats.spe = calculateOtherStat(baseStats.spe, ivs.spe, evs.spe, target.battle_stats.level, temp.plus === 'spe', temp.minus === 'spe');
       
       target.battle_stats.current_hp = target.battle_stats.max_hp;
       target.current_hp = target.battle_stats.max_hp;
       didLevelUp = true;
       
       expNeeded = getExpNeeded(growthCurve, target.battle_stats.level + 1);
    }
    
    // Check for evolution threshold
    if (didLevelUp && target.battle_stats.level >= (target.evolution_level || 16)) {
       target.pending_evolution = true;
    }
    
    return { roster: { ...state.roster, active_party: newActive } };
  }),
  
  markSeen: (speciesId) => set((state) => {
    if (!state.datalog.seen.includes(speciesId)) {
       return { datalog: { ...state.datalog, seen: [...state.datalog.seen, speciesId] } };
    }
    return state;
  }),
  markCaught: (speciesId) => set((state) => {
    let newDatalog = { ...state.datalog };
    if (!newDatalog.seen.includes(speciesId)) newDatalog.seen.push(speciesId);
    if (!newDatalog.caught.includes(speciesId)) newDatalog.caught.push(speciesId);
    return { datalog: newDatalog };
  }),
  addCredits: (amount) => set((state) => ({ player: { ...state.player, credits: state.player.credits + amount } })),
  
  addHallOfFame: (rosterSnapshot) => set((state) => ({ 
     player: { 
        ...state.player, 
        hall_of_fame: [...(state.player.hall_of_fame || []), rosterSnapshot] 
     } 
  })),

  stepOverworld: () => set((state) => {
    // Every time the player takes a step in the overworld:
    // Decrement egg_steps_remaining for any egg in the party.
    let hatchTriggered = false;
    let indexToHatch = -1;
    let hasWarmBody = state.roster.active_party.some(m => !m.is_egg && m.equipped_drive === "warm_body"); // using equipped_drive as proxy for ability for now
    const stepDecrement = hasWarmBody ? 2 : 1;
    
    const newActive = state.roster.active_party.map((m, idx) => {
      if (m.is_egg && m.egg_steps_remaining && m.egg_steps_remaining > 0) {
        const remaining = Math.max(0, m.egg_steps_remaining - stepDecrement);
        if (remaining === 0 && !hatchTriggered) {
          hatchTriggered = true;
          indexToHatch = idx;
        }
        return { ...m, egg_steps_remaining: remaining };
      }
      return m;
    });

    if (hatchTriggered) {
      window.dispatchEvent(new CustomEvent("trigger-hatch", { detail: { index: indexToHatch } }));
    }

    return { roster: { ...state.roster, active_party: newActive } };
  }),
  
  hatchEgg: (index) => set((state) => {
    const newActive = [...state.roster.active_party];
    const egg = newActive[index];
    if (egg && egg.is_egg) {
       egg.is_egg = false;
       egg.egg_steps_remaining = 0;
       // The UI can handle announcing
    }
    return { roster: { ...state.roster, active_party: newActive } };
  }),

  cacheGltf: (id: string, url: string) => set((state) => ({ gltf_cache: { ...state.gltf_cache, [id]: url } }))
}),
{
  name: "mochii-storage",
  storage: createJSONStorage(() => idbStorage),
  partialize: (state) => ({ player: state.player, roster: state.roster, world: state.world, combat: state.combat }),
}));
