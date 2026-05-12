import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../useGameStore';

export function useAudioManager() {
  const { audio } = useGameStore();

  const playSfx = (soundName: string) => {
    // In a real app we would play Howler.js sounds.
    // For now, this is a placeholder stub that maps to the requested Phase 35.
    if (!audio.sfx_enabled) return;

    if (soundName === 'menu_click') {
      // play tick
    } else if (soundName === 'surprise_ping') {
      // play high-pitched ping
    } else if (soundName === 'door_creak') {
      // play door transition
    } else if (soundName === 'combat_hit') {
      // play punch
    } else if (soundName === 'low_health_alarm') {
      // play pulse
    }
    // other sounds...
    console.log(`[Audio Manager] Played SFX: ${soundName} at vol ${audio.master_vol}`);
  };

  const playBgm = (bgmName: string) => {
     if (!audio.bgm_enabled) return;
     console.log(`[Audio Manager] Playing BGM: ${bgmName} at vol ${audio.master_vol}`);
  };
  
  const stopBgm = () => {
     console.log(`[Audio Manager] Stopping BGM`);
  };

  // Setup BGM routing based on game state
  // We can expose these to be called by App.tsx
  const routeBGM = (state: "exploration" | "combat" | "menu") => {
      if (state === "menu") stopBgm();
      else if (state === "combat") playBgm("Fast_synth_loop_170bpm");
      else if (state === "exploration") playBgm("ambient_drone");
  };

  return { playSfx, playBgm, stopBgm, routeBGM };
}
