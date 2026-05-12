import { useCallback } from 'react';

// Pre-define oscillators for quick synth sounds so we don't need actual audio assets

export function useEntityAudio() {
  const playSfx = useCallback((type: 'spawn' | 'hit' | 'faint' | 'attack', pitch: number = 440) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Simple synthetic barks mapped to actions
      if (type === 'spawn') {
         osc.type = 'sine';
         osc.frequency.setValueAtTime(pitch, ctx.currentTime);
         osc.frequency.exponentialRampToValueAtTime(pitch * 2, ctx.currentTime + 0.1);
         gain.gain.setValueAtTime(0, ctx.currentTime);
         gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'hit') {
         osc.type = 'square';
         osc.frequency.setValueAtTime(150, ctx.currentTime);
         osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
         gain.gain.setValueAtTime(0.5, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'faint') {
         osc.type = 'sawtooth';
         osc.frequency.setValueAtTime(pitch, ctx.currentTime);
         osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
         gain.gain.setValueAtTime(0.3, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'attack') {
         osc.type = 'triangle';
         osc.frequency.setValueAtTime(pitch * 1.5, ctx.currentTime);
         osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, ctx.currentTime + 0.15);
         gain.gain.setValueAtTime(0, ctx.currentTime);
         gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("Audio play blocked or failed. User interactions might be required first.");
    }
  }, []);

  return { playSfx };
}
