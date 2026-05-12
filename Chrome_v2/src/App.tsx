import { useState, useEffect, useRef } from "react";
import { Scene } from "./components/Scene";
import {
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Mic,
  Square,
  Settings,
  User,
  Sword,
  Frown,
  Shield,
  Zap,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusPill, MathHPBar } from "./components/StatusPill";
import { useGameStore } from "./useGameStore";
import { UIManager } from "./UIManager";
import { calculateCatchSuccess } from "./lib/catchEngine";
import { executeDamageFormula } from "./lib/mos_systems";

export default function App() {
  const [isGodModeOpen, setIsGodModeOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: string; text: string; emotion?: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mochiEmotion, setMochiEmotion] = useState("IDLE");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [started, setStarted] = useState(false); // Used for the "wake up" blur sequence
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraMode, setCameraMode] = useState<
    "follow" | "stationary" | "free"
  >("follow");
  const [biome, setBiome] = useState<
    "void" | "ancient_cave" | "desert" | "rainforest" | "neon_city" | "junkyard" | "castagnoli_exterior" | "castagnoli_safari"
  >("void");
  const [seed, setSeed] = useState("Bone-1");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { setUI, ui } = useGameStore();

  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionData, setEvolutionData] = useState<{ id: string, next: string, type: string } | null>(null);

  const activePartyData = useGameStore(s => s.roster.active_party);

  // Check for evolutions
  useEffect(() => {
     const evolvable = activePartyData.find(c => c.pending_evolution);
     if (evolvable && !isEvolving) {
        setIsEvolving(true);
        // Look up next stage ID (mocked for now, if 003 goes to 004, etc.)
        const currentNum = parseInt(evolvable.id);
        const nextId = (currentNum + 1).toString().padStart(3, '0');
        setEvolutionData({ id: evolvable.id, next: nextId, type: evolvable.types?.[0] || 'Flame' });
     }
  }, [activePartyData, isEvolving]);

  // Character Selection
  const [roster, setRoster] = useState<any[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("003"); // Default Tyrage

  // Trainer & Encounter State
  const [trainerProfile, setTrainerProfile] = useState<any>(null);
  const [isEncounterMode, setIsEncounterMode] = useState(false);
  const [encounterAction, setEncounterAction] = useState<"MENU" | "TALK">("MENU");
  const [wildEntity, setWildEntity] = useState<any>(null);
  const [isBattling, setIsBattling] = useState(false);
  const [showMoves, setShowMoves] = useState(false);
  const [captureThrowing, setCaptureThrowing] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [pcBox, setPcBox] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"roster" | "trainer" | "camera" | "biome" | "pc" | "dex" | "create" | "logbook">("roster");

  // Interiors & Campaign
  const [activeInterior, setActiveInterior] = useState<"MochiiPlex" | "Cantina" | "FloraDojo" | "ShamanSanctuary" | null>(null);
  const [knownCharacters, setKnownCharacters] = useState<any[]>([]);

  const lastInteractionTime = useRef(Date.now());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const useElevenLabsDisabled = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mergeStationSteps = useRef(0);
  const [hatchCutsceneEgg, setHatchCutsceneEgg] = useState<any>(null);

  useEffect(() => {
    const handleTriggerHatch = (e: any) => {
      const idx = e.detail.index;
      const egg = useGameStore.getState().roster.active_party[idx];
      setHatchCutsceneEgg({ ...egg, rosterIndex: idx });
    };
    window.addEventListener("trigger-hatch", handleTriggerHatch);
    return () => window.removeEventListener("trigger-hatch", handleTriggerHatch);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  useEffect(() => {
    if (wildEntity && wildEntity.characterId && !wildEntity.is_trainer) {
       useGameStore.getState().markSeen(wildEntity.characterId);
    }
  }, [wildEntity]);

  // Load Roster and Trainer Profile
  useEffect(() => {
    fetch("/api/roster")
      .then((res) => res.json())
      .then((data) => {
        setRoster(data);
        useGameStore.setState((state) => ({ roster: { ...state.roster, active_party: data } }));
      })
      .catch((err) => console.error("Failed to load roster", err));

    fetch("/api/trainer")
      .then((res) => res.json())
      .then((data) => {
        setTrainerProfile(data);
        useGameStore.setState((state) => ({ player: { ...state.player, credits: data.currency, inventory: data.inventory ? Object.entries(data.inventory).map(([k,v]) => ({id:k, count:v})) : [] } }));
      })
      .catch((err) => console.error("Failed to load trainer", err));

    fetch("/api/pc")
      .then((res) => res.json())
      .then((data) => {
        setPcBox(data);
        useGameStore.setState((state) => ({ roster: { ...state.roster, pc_box: data } }));
      })
      .catch((err) => console.error("Failed to load pc", err));
  }, []);

  // ----------------------------------------------------
  // MEMORY CORE (Supabase & Drive Sync Placeholder)
  // ----------------------------------------------------
  useEffect(() => {
    // In a full production environment with valid SUPABASE_URL, SUPABASE_KEY, and DRIVE_SERVICE_ACCOUNT_JSON,
    // this would run actual API calls. For now, it runs a simulated background sync.
    const syncManager = async () => {
      console.log("[Memory Core] Background sync initiated.");
      try {
        const envRes = await fetch("/api/environment");
        const envData = await envRes.json();

        // Setup local storage backup (simulating Drive JSON overwrite)
        localStorage.setItem(
          `sandbox_state_bone_001_${seed}`,
          JSON.stringify(envData),
        );
        console.log(
          `[Memory Core] Saved ${envData.length} objects to local state (simulating Google Drive file overwrite for seed ${seed}).`,
        );

        // Simulating Supabase Push
        if (messages.length > 0) {
          console.log(
            `[Memory Core] Pushed ${messages.length} messages to bone_memory_logs table (simulated).`,
          );
        }
      } catch (err) {
        console.warn("[Memory Core] Sync failed", err);
      }
    };

    const interval = setInterval(syncManager, 5 * 60 * 1000); // Every 5 mins
    return () => clearInterval(interval);
  }, [messages, seed]);

  // ----------------------------------------------------
  // THE RADIANT EVENT & TIME ENGINE
  // ----------------------------------------------------
  useEffect(() => {
    // Game time & Needs loop (ticks every 1s = 1 in-game minute roughly)
    const timeInterval = setInterval(() => {
       useGameStore.setState(state => {
          const newTime = state.world.game_time + 1;
          const alignments = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
          // Change constellation every 24 "hours" representing a cycle
          const alignmentIndex = Math.floor(newTime / 1440) % alignments.length;
          
          return { world: { ...state.world, game_time: newTime, astrological_alignment: alignments[alignmentIndex] } };
       });
       
       // Every hour (60 ticks)
       if (useGameStore.getState().world.game_time % 60 === 0) {
          useGameStore.getState().tickNeeds();
       }
    }, 1000);

    // Check for radiant events periodically (every 2 minutes for demo purposes, representing an in-game morning)
    const eventInterval = setInterval(() => {
       const chance = Math.random();
       const store = useGameStore.getState();
       
       if (chance < 0.2) {
          const outbreakTypes = ['001', '002', '003'];
          const entity = outbreakTypes[Math.floor(Math.random() * outbreakTypes.length)];
          const biome = ['desert', 'ancient_cave', 'neon_city'][Math.floor(Math.random() * 3)];
          store.showToast(`WORLD EVENT: Mass outbreak spotted in the ${biome.replace('_', ' ')}!`);
          store.setWorldEvent({
             type: 'outbreak',
             entity_id: entity,
             biome: biome,
             message: `A swarm of wild entities has been spotted in the ${biome.replace('_', ' ')}!`
          });
       } else if (chance < 0.3) {
          const biome = ['desert', 'ancient_cave', 'neon_city'][Math.floor(Math.random() * 3)];
          store.showToast(`ROAMER SPOTTED: A Mythic is wandering the ${biome.replace('_', ' ')}!`);
          store.setWorldEvent({
             type: 'roamer',
             entity_id: '029',
             biome: biome,
             message: `A Mythic Roamer was seen in the ${biome.replace('_', ' ')}.`
          });
       } else {
          // Clear event 50% of the time to reset
          if (Math.random() < 0.5) store.setWorldEvent(null);
       }
    }, 120000); 
    
    return () => {
      clearInterval(eventInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // ----------------------------------------------------
  // MOCHIIMIND: Autonomous Thought Protocol & Ecology Engine
  // ----------------------------------------------------
  const [thoughtLog, setThoughtLog] = useState<{ time: string, thought: string, id: number }[]>([]);
  useEffect(() => {
    if (isBattling || isEncounterMode) return;
    const mindLoop = setInterval(() => {
      if (Date.now() - lastInteractionTime.current > 15000) { // 15s idle for demo
         const newId = Date.now();
         const isAtCap = roster.length >= 359;
         const thought = isAtCap 
            ? `Ecology Engine: Studying the pack dynamics of ${roster.length > 0 ? roster[Math.floor(Math.random() * roster.length)].name : 'entities'} in the area...` 
            : `Creation Engine: Observing the ${biome}. Synthesizing new biome-specific traits...`;
            
         // Randomly have the lead Mochiichao comment on the astrological alignment
         const state = useGameStore.getState();
         const alignment = state.world.astrological_alignment;
         if (Math.random() < 0.2 && alignment !== "Null") {
            setMessages(prev => [...prev, {
               role: "mochiichao",
               text: `I feel a strange energy... The alignment of ${alignment} is influencing the stars tonight.`
            }]);
            setMochiEmotion("THINK");
         }
            
         setThoughtLog(prev => [{
            id: newId,
            time: new Date().toLocaleTimeString(),
            thought
         }, ...prev].slice(0, 50));
      }
    }, 20000); // Every 20 seconds for demo

    return () => clearInterval(mindLoop);
  }, [isBattling, isEncounterMode, biome, roster]);

  // Load from Simulated Drive on boot
  useEffect(() => {
    const saved = localStorage.getItem(`sandbox_state_bone_001_${seed}`);
    if (saved) {
      console.log(
        `[Memory Core] Rebuilding sandbox layout for seed ${seed} from saved state...`,
      );
      // Since our ALIFE server handles the sqlite, in a real scenario we'd push this state back to sqlite.
      // But we just let the ALIFE server maintain its state for now.
    }
  }, [seed]);

  // Listen for Chrome Surgery Stasis events
  useEffect(() => {
    const handleUpgradeStart = () => setIsUpgrading(true);
    const handleUpgradeEnd = () => setIsUpgrading(false);
    window.addEventListener("upgrade-start", handleUpgradeStart);
    window.addEventListener("upgrade-end", handleUpgradeEnd);
    return () => {
      window.removeEventListener("upgrade-start", handleUpgradeStart);
      window.removeEventListener("upgrade-end", handleUpgradeEnd);
    };
  }, []);

  // Idle timer logic
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      // If no interaction for 15 seconds, and UI is hidden OR just general idle
      if (Date.now() - lastInteractionTime.current > 15000) {
        if (!isIdle) setIsIdle(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [started, isIdle]);

  // Overworld steps simulator
  useEffect(() => {
    if (!started || isBattling || isEncounterMode || hatchCutsceneEgg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const walkKeys = ["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (walkKeys.includes(e.key)) {
        useGameStore.getState().stepOverworld();

        mergeStationSteps.current += 1;
        if (mergeStationSteps.current >= 256) {
          mergeStationSteps.current = 0;
          // Roll 50% chance if there are 2 compatible Mochiichao in the Merge Station.
          // For now we simulate this since there's no actual Merge Station UI yet.
          if (Math.random() > 0.5) {
             const activeParty = useGameStore.getState().roster.active_party;
             if (activeParty.length < 6 && activeParty.length > 0) { // simulate room in party
               // Spawn an egg inheriting from the first party member
               const mother = activeParty[0];
               const rarity = mother.rarity || "common";
               const hatchSteps = rarity === "mythic" ? 10240 : rarity === "rare" ? 7500 : rarity === "uncommon" ? 5000 : 2500;
               
               const newEgg = {
                 ...mother,
                 uid: "egg_" + Math.random().toString(36).substr(2, 9),
                 name: "Mochii Egg",
                 is_egg: true,
                 level: 1,
                 egg_steps_remaining: hatchSteps,
                 total_hatch_steps: hatchSteps,
                 experience: 0,
                 battle_stats: { ...mother.battle_stats, level: 1, current_hp: 1, max_hp: 1, exp: 0 }
               };
               
               useGameStore.setState(s => ({
                 roster: { ...s.roster, active_party: [...s.roster.active_party, newEgg] }
               }));
               setMessages(prev => [...prev, { role: "system", text: "Merge Station Alert: The Caretaker found a Mochii Egg! It has been added to your roster."}]);
             }
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [started, isBattling, isEncounterMode, hatchCutsceneEgg]);

  const playSfx = (type: string) => {
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "chime_happy") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === "whoosh_gentle") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "boing_watery") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "low_tone") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {}
  };

  const startSequence = () => {
    setStarted(true);
    setMochiEmotion("WAVE");
    const msg = "Are u ok? What do u want to do?";
    setMessages([{ role: "mochiichao", text: msg, emotion: "WAVE" }]);
    playSfx("whoosh_gentle"); // Play intro SFX

    // First message triggers TTS automatically on wake up (due to user interaction)
    if (ttsEnabled) {
      speak(msg);
    }
  };

  const speak = async (text: string) => {
    if (!ttsEnabled) return;

    // ElevenLabs 401 is expected in the Cloud Dev environment.
    // This will resolve automatically once the app is built as an APK and runs on a local mobile IP.
    if (!useElevenLabsDisabled.current) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
          return; // Success!
        } else {
          console.warn(
            "ElevenLabs TTS endpoint failed (unusual activity/free tier), disabling for session.",
          );
          useElevenLabsDisabled.current = true;
        }
      } catch (err) {
        console.warn("ElevenLabs request failed, disabling for session.", err);
        useElevenLabsDisabled.current = true;
      }
    }

    // Fallback: browser native TTS
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.3; // Cute pitch
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReset = async () => {
    await fetch("/api/reset", { method: "POST" });
    setMessages([]);
    setMochiEmotion("IDLE");
    setStarted(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setLoading(true);
        try {
          const res = await fetch("/api/stt", {
            method: "POST",
            headers: { "Content-Type": mimeType },
            body: audioBlob,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.transcript) {
              setInput(data.transcript);
              // auto-send
              handleSendText(data.transcript);
            }
          } else {
            console.error("Deepgram transcription failed:", await res.json());
          }
        } catch (err) {
          console.error("Error sending audio to STT:", err);
        } finally {
          setIsRecording(false);
          setLoading(false);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendText = async (userText: string) => {
    if (!userText.trim() || loading) return;

    lastInteractionTime.current = Date.now();
    setIsIdle(false);

    // Dynamic Prompt Wrapper (Phase 20)
    const storeState = useGameStore.getState();
    const lead = storeState.roster.active_party[0];
    const lore = storeState.world.world_history && storeState.world.world_history.length > 0 ? storeState.world.world_history[storeState.world.world_history.length - 1] : "nothing yet";
    const contextWrapper = `[SYSTEM CONTEXT INJECTION]
    ${lead ? `player_status: Lead ${lead.name} (${lead.battle_stats.current_hp}/${lead.battle_stats.max_hp} HP), Status: ${lead.status_condition}.` : 'player_status: Roster empty.'}
    environmental_state: Biome is ${biome}, Time is ${storeState.world.game_time}, Weather is ${storeState.world.weather}.
    campaign_state: Progress - ${JSON.stringify(storeState.player.campaign_progress)}.
    story_state: Badges: ${storeState.player.badges.length}, Has seen Branded: ${storeState.story.has_seen_branded}, Safari Mode: ${storeState.story.is_safari_mode}.
    World Gossip/Lore: You recently heard a rumor about: ${lore}
    FACTION LORE: 'The Hackers' are a hostile organization marked by a stylized 'H' logo (electric bolts with painted ends). They are led by Luigi Castagnoli, an Italian cartel-boss archetype. Luigi is a twisted anti-hero; he preaches that Mochiichao are enslaved by the government and players, and must be 'liberated'. However, his hypocrisy is that he captures the rarest Mochiichao and traps them on his private, high-class poacher island for billionaires to hunt.
    NARRATIVE PACING: If Badges = 0 but Has seen Branded = false, act normal. If Badges = 0 but Has seen Branded = true, NPCs whisper rumors of animal abuse and missing Mochiichao. If Badges >= 1, Hackers aggressively step out of the shadows and their dialogue reflects anger that the player is participating in the 'enslavement' system. Late-game lore reveals the dark truth of Luigi's island.
    RUMOR PROTOCOL: You have access to the full global_roster.json. When writing casual dialogue for NPCs or lore terminals, occasionally reference Mochiichao that the player has not yet encountered. Describe them vaguely based on their lore and typing to build mystery.
    [END SYSTEM CONTEXT] ${userText}`;

    // Determine which character is active: wild or roster
    const activeCharId =
      isEncounterMode && wildEntity
        ? wildEntity.characterId
        : selectedCharacterId;

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    const lowerMsg = userText.toLowerCase();
    const routedAgent = 
      (lowerMsg.includes("build") || lowerMsg.includes("code") || lowerMsg.includes("spawn") || lowerMsg.includes("create")) ? "builder" :
      (lowerMsg.includes("stats") || lowerMsg.includes("calculate") || lowerMsg.includes("lore") || lowerMsg.includes("engine")) ? "game_master" :
      "actor";

    try {
      const res = await fetch("/api/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: contextWrapper, // Sent to backend, but not shown in UI
          displayMessage: userText,
          biome,
          seed,
          characterId: activeCharId,
          isWild: isEncounterMode,
          npcName: isEncounterMode && wildEntity ? wildEntity.name : null,
          routedAgent
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      // **Intent Routing**
      if (data.intent === "forage") {
         setMessages((prev) => [...prev, { role: "system", text: `[Mochiimind]: Started foraging in ${biome}...` }]);
         setTimeout(() => {
           setMessages((prev) => [...prev, { role: "system", text: `[Mochiimind]: Found a Mend Patch!` }]);
           setTrainerProfile((prev: any) => {
             if (prev) {
               const newP = { ...prev };
               newP.inventory.mend_patch = (newP.inventory.mend_patch || 0) + 1;
               fetch('/api/trainer', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(newP)
               });
               return newP;
             }
             return prev;
           });
         }, 3000);
      } else if (data.intent === "hunt_target") {
         setMessages((prev) => [...prev, { role: "system", text: `[Mochiimind]: Looking for target in ${biome}... We can't find that here!` }]);
      } else if (data.intent === "remove_item") {
         const itemName = data.intentArgs?.item_name || 'item';
         setMessages((prev) => [...prev, { role: "system", text: `[Mochiimind]: Removed ${itemName} from active chunk.` }]);
      } else if (data.intent === "modify_terrain") {
         const terrainAction = data.intentArgs?.terrain_action || 'modified';
         setMessages((prev) => [...prev, { role: "system", text: `[Mochiimind]: ${terrainAction} terrain at specified coordinates.` }]);
      }

      if (data.text) {
        lastInteractionTime.current = Date.now();
        setIsIdle(false);

        // Handle Surgery Stasis trigger if LLM suggests code changes
        const writeCodeAction =
          data.actions &&
          data.actions.find((a: any) => a.type === "write_code");
        if (writeCodeAction) {
          window.dispatchEvent(new Event("upgrade-start"));

          // Actually execute surgery
          try {
            await fetch("/api/weaver", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                target_file: writeCodeAction.target_file,
                code_content: writeCodeAction.code_content,
              }),
            });

            // Wait a moment for backend to finish writing before waking up
            setTimeout(() => {
              window.dispatchEvent(new Event("upgrade-end"));
              handleSendText(
                "System Context: You just completed a code update. Acknowledge the user and report if the surgery felt successful.",
              );
              // We'd ideally reload here, but keeping it smooth for demo
            }, 3000);
          } catch (err) {
            window.dispatchEvent(new Event("upgrade-end"));
            console.error("Surgery failed", err);
          }
        }

        let rawText = data.text;

        // Emotion parsing from tags like <SMILE>
        let parsedEmotion = data.emotion || "IDLE";
        const tags = rawText.match(/<[^>]*>/g);
        if (tags && tags.length > 0) {
          const lastTag = tags[tags.length - 1].toUpperCase();
          if (lastTag.includes("SMILE") || lastTag.includes("HAPPY")) {
            parsedEmotion = "SMILE";
            playSfx("chime_happy");
          } else if (lastTag.includes("WAVE")) {
            parsedEmotion = "WAVE";
            playSfx("whoosh_gentle");
          } else if (
            lastTag.includes("BOUNCE") ||
            lastTag.includes("EXCITED")
          ) {
            parsedEmotion = "EXCITED";
            playSfx("boing_watery");
          } else if (lastTag.includes("SAD")) {
            parsedEmotion = "SAD";
            playSfx("low_tone");
          }
        } else {
          // If no tag, still check parsedEmotion for SFX
          if (parsedEmotion === "SMILE" || parsedEmotion === "HAPPY")
            playSfx("chime_happy");
          else if (parsedEmotion === "WAVE") playSfx("whoosh_gentle");
          else if (parsedEmotion === "EXCITED") playSfx("boing_watery");
          else if (parsedEmotion === "SAD") playSfx("low_tone");
        }

        // Clean text for UI and TTS
        let cleanedVisibleText = rawText
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
        let cleanedTtsText = rawText
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();

        if (!cleanedVisibleText) cleanedVisibleText = "...";

        setMessages((prev) => [
          ...prev,
          {
            role: "mochiichao",
            text: cleanedVisibleText,
            emotion: parsedEmotion,
          },
        ]);
        setMochiEmotion(parsedEmotion);
        if (ttsEnabled && cleanedTtsText) {
          speak(cleanedTtsText);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "mochiichao",
          text: "Systems offline... unable to reach A.L.I.F.E.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    await handleSendText(input);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-slate-100 font-sans">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene
          emotion={mochiEmotion}
          started={started}
          isIdle={isIdle}
          latestMessage={
            messages.filter((m) => m.role === "mochiichao").pop()?.text
          }
          cameraMode={cameraMode}
          biome={biome}
          seed={seed}
          isUpgrading={isUpgrading}
          characterId={selectedCharacterId}
          isPrismatic={roster.find(c => c.id === selectedCharacterId)?.is_prismatic}
          isBattling={isBattling}
          wildCharacterId={wildEntity?.characterId}
          wildIsPrismatic={wildEntity?.is_prismatic}
          captureThrowing={captureThrowing}
          activeInterior={activeInterior}
          evolutionData={evolutionData}
          onEvolutionComplete={() => {
             setIsEvolving(false);
             setEvolutionData(null);
             // Mutate roster to reflect new evolution
             useGameStore.setState(state => {
                const newActive = [...state.roster.active_party];
                const char = newActive.find(c => c.pending_evolution);
                if (char) {
                   char.id = evolutionData?.next || char.id;
                   char.pending_evolution = false;
                   char.battle_stats.max_hp += 15;
                   char.battle_stats.current_hp = char.battle_stats.max_hp;
                   
                   // Fetch Signature Move Generation Async
                   fetch('/api/generate_move', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                         element: char.types?.[0] || 'Normal', 
                         species_name: char.name, 
                         level: char.battle_stats.level 
                      })
                   })
                   .then(res => res.json())
                   .then(data => {
                      if (data.move) {
                         const move = data.move;
                         const mId = move.name.toLowerCase().replace(/\s+/g, '_');
                         // Add to char moves if not already there
                         useGameStore.setState(s2 => {
                           const updatedActive = [...s2.roster.active_party];
                           const uChar = updatedActive.find(c => c.uid === char.uid);
                           if (uChar) {
                              if (!uChar.moves) uChar.moves = [];
                              if (!uChar.moves.includes(mId)) {
                                 uChar.moves.push(mId); // Store move ID
                              }
                           }
                           return { roster: { ...s2.roster, active_party: updatedActive } };
                         });
                         // We also need to add the move definition to the global MOVES record if it's not there,
                         // but since we don't have access to the source file `mos_systems.ts` here simply, 
                         // we can store custom moves in local storage or a store property. 
                         // To do this simply, we will use a global custom_moves dict in the store.
                         useGameStore.setState(s => ({
                            custom_moves: {
                               ...(s as any).custom_moves,
                               [mId]: {
                                  id: mId,
                                  name: move.name,
                                  type: move.element,
                                  category: move.category,
                                  power: move.power,
                                  accuracy: move.accuracy,
                                  pp: move.pp,
                                  priority: move.priority || 0
                               }
                            }
                         }));
                         useGameStore.getState().showToast(`Synthetic Generation Complete: Learned ${move.name}!`);
                      }
                   })
                   .catch(console.error);
                }
                return { roster: { ...state.roster, active_party: newActive } };
             });
             useGameStore.getState().showToast("Evolution complete!");
          }}
          onInteriorExit={() => {
            setActiveInterior(null);
            setMessages(prev => [...prev, { role: "system", text: "You exited the building." }]);
          }}
          onInteriorEnter={(interior) => setActiveInterior(interior)}
          onHeal={() => {
            setMessages(prev => [...prev, { role: "system", text: "Your party is fully healed!" }]);
            useGameStore.getState().saveToSlot(0);
          }}
          onPC={() => {
            setActiveTab("pc");
            setMessages(prev => [...prev, { role: "system", text: "Accessing PC..." }]);
          }}
          onChallenge={(masterName) => {
            setMessages(prev => [...prev, { role: "system", text: `${masterName}: So, you challenge my wild nature?` }]);
            setIsEncounterMode(true);
            setEncounterAction("MENU");
            
            if (masterName === "Flora Master Lin") {
               setWildEntity({
                  name: "Flora Master Lin",
                  characterId: "038", // For demo
                  battle_stats: { level: 25, current_hp: 200, max_hp: 200, moves: [] },
                  is_trainer: true
               });
            } else if (masterName === "Shaman Master Dhir") {
               setWildEntity({
                  name: "Shaman Master Dhir",
                  characterId: "001", // Placeholder
                  battle_stats: { level: 30, current_hp: 300, max_hp: 300, moves: [{name: "Mystic Fire", power: 80, type: "Mystic", accuracy: 100, vfx: "splash"}] },
                  is_trainer: true
               });
            }
            setTimeout(() => setIsBattling(true), 2000);
          }}
          onMeetNPC={(npc) => {
             setKnownCharacters(prev => {
                if (!prev.find(c => c.name === npc.name)) {
                   setMessages(m => [...m, { role: "system", text: `Logbook updated: Met ${npc.name}` }]);
                   return [...prev, npc];
                }
                return prev;
             });
          }}
          onCaptureHit={() => {
            setCaptureThrowing(false);
            if (wildEntity) {
              fetch("/api/catch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wildEntity, cruxType: "base_crux" }),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.error) {
                    setMessages((prev) => [...prev, { role: "system", text: data.error }]);
                  } else if (data.success) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "system",
                        text: `Gotcha! ${wildEntity.name} was caught!${data.sentToPC ? " Sent to PC." : ""}`,
                      },
                    ]);
                    if (data.pcBox) setPcBox(data.pcBox);
                    setRoster(data.globalRoster);
                    setTrainerProfile(data.trainerProfile);
                    setIsBattling(false);
                    setIsEncounterMode(false);
                    setEncounterAction("MENU");
                    setWildEntity(null);
                  } else {
                    setMessages((prev) => [
                      ...prev,
                      { role: "system", text: `Oh no! The wild entity broke free!` },
                    ]);
                    setTrainerProfile(data.trainerProfile);
                  }
                });
            }
          }}
        />
      </div>

      {/* Stasis Overlay */}
      <AnimatePresence>
        {isUpgrading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-blue-950/80 backdrop-blur-xl"
          >
            <div className="w-16 h-16 border-4 border-t-white border-white/20 rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            <h2 className="text-2xl font-mono text-white mb-2 tracking-widest uppercase">
              System Override
            </h2>
            <p className="text-blue-200 font-mono text-sm max-w-md text-center">
              Rewriting neural pathways. Please stand by...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro Overlay */}
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-mono tracking-tighter text-white">
                M. OS Bone
              </h1>
              <p className="text-amber-700 font-mono text-sm tracking-widest uppercase">
                A.L.I.F.E. Core Ready
              </p>
              <button
                onClick={startSequence}
                className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 backdrop-blur"
              >
                Boot System
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Global UI Architecture */}
      <UIManager />

      {/* UI Overlay */}
      {ui.active_menu === "none" && started && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-8">
          {/* Header Controls */}
          <div className="flex justify-between items-start pointer-events-auto">
            <AnimatePresence>
              {isUIVisible && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-1"
                >
                  <div className="bg-black/40 backdrop-blur border border-white/10 px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-mono uppercase text-emerald-400 w-max shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Mochiichao Online
                  </div>
                  {biome !== "void" && !isEncounterMode && (
                    <button
                      onClick={() => {
                        if (Math.random() > 0.3) {
                          // 70% chance to encounter
                          setIsEncounterMode(true);
                          
                          const storeState = useGameStore.getState();
                          
                          // Phase 50: The Escalation Trigger
                          let isHackerAmbush = false;
                          if (storeState.player.badges.length >= 1 && Math.random() < 0.2) {
                             isHackerAmbush = true;
                          }
                          
                          // Phase 50: The Prologue Event
                          let isBranded = false;
                          if (storeState.player.badges.length === 0 && !storeState.story.has_seen_branded && Math.random() < 0.4) { // Increased chance for initial discovery
                             isBranded = true;
                             useGameStore.setState(s => ({ story: { ...s.story, has_seen_branded: true } }));
                          }
                          
                          // Phase 49: The Syndicate Safari Zone (Exterior Biome - Escapist Tag) 
                          // Simulating biome = castagnoli_exterior
                          let isEscaped = false;
                          if (biome === 'castagnoli_exterior' && Math.random() < 0.8) {
                             isEscaped = true;
                          }

                          const randomTypes = ["Water", "Metal", "Bone"];
                          let wildType = randomTypes[Math.floor(Math.random() * randomTypes.length)];
                          if (isHackerAmbush) wildType = "Umbral"; // Hackers use Umbral/Chrome/Flame
                          
                          const wildCharId = wildType === "Water" ? "001" : wildType === "Metal" ? "002" : "003";
                          const isPrism = Math.random() < 0.00024;
                          
                          const speedBoost = isEscaped ? 1.25 : 1; // 25% higher speed
                          
                          setWildEntity({
                            name: isHackerAmbush ? `Hacker's ${wildType} Entity` : `Wild ${isPrism ? 'Prismatic ' : ''}${wildType} Mochiichao`,
                            type: wildType,
                            base_color: "Unknown",
                            version_origin: wildType,
                            is_prismatic: isPrism,
                            is_branded: isBranded,
                            is_escaped: isEscaped,
                            is_trainer: isHackerAmbush,
                            base_potential: {
                              hp: Math.floor(Math.random() * 32),
                              atk: Math.floor(Math.random() * 32),
                              def: Math.floor(Math.random() * 32),
                              spd: Math.floor(Math.random() * 32 * speedBoost),
                            },
                            combat_exp: { hp: 0, atk: 0, def: 0, spd: 0 },
                            battle_stats: {
                              level: isHackerAmbush ? 15 : 5,
                              current_hp: 100,
                              max_hp: 100,
                              atk: 50,
                              def: 50,
                              spd: Math.floor(50 * speedBoost),
                              xp: 0,
                              xp_to_next_level: 100,
                              moves: [{name: "Tackle", power: 40, type: "Unknown", accuracy: 100, vfx: "slash"}],
                            },
                            id: "wild-temp",
                            characterId: wildCharId,
                          });
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "system",
                              text: `A wild ${wildType} entity appeared!`,
                            },
                          ]);
                        } else {
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "system",
                              text: `No signals found in the ${biome}.`,
                            },
                          ]);
                        }
                      }}
                      className="mt-2 bg-black/40 hover:bg-black/60 backdrop-blur border border-white/10 px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-mono uppercase text-amber-400 transition-colors shadow-xl w-max"
                    >
                      <Search className="w-4 h-4" />
                      Scan for Signals
                    </button>
                  )}
                  {biome === "castagnoli_exterior" && !isEncounterMode && (
                    <button
                      onClick={() => {
                        const store = useGameStore.getState();
                        if (store.player.credits >= 50000) {
                          store.addCredits(-50000);
                          store.addItem({ id: "scrap_cube", count: 10 });
                          store.addItem({ id: "grunt_cube", count: 5 });
                          useGameStore.setState(s => ({ story: { ...s.story, is_safari_mode: true } }));
                          setBiome("castagnoli_safari");
                          setMessages((prev) => [...prev, { role: "system", text: "Paid 50,000 Credits. Welcome to Castagnoli Safari! standard Bag is locked. Use Luigi Cubes." }]);
                        } else {
                          setMessages((prev) => [...prev, { role: "system", text: "Luigi Grunt: 'You need 50,000 Credits to enter the Safari Zone, scrub!'" }]);
                        }
                      }}
                      className="mt-2 bg-red-900/40 hover:bg-red-900/60 backdrop-blur border border-red-500/50 px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-mono uppercase text-red-400 transition-colors shadow-xl w-max"
                    >
                      Enter Safari Zone (50K)
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-2 ml-auto items-start">
              <button
                onClick={() => {
                  setIsUIVisible(!isUIVisible);
                  lastInteractionTime.current = Date.now();
                }}
                className="p-3 bg-black/40 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 transition-colors shadow-xl"
              >
                {isUIVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <AnimatePresence>
                {isUIVisible && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex gap-2 relative"
                  >
                    <div className="relative">
                      <button
                        onClick={() => setIsGodModeOpen(!isGodModeOpen)}
                        className="p-3 bg-black/40 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 transition-colors shadow-xl"
                      >
                        <Settings size={16} />
                      </button>

                      <AnimatePresence>
                        {isGodModeOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-12 mt-2 w-72 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-30 flex flex-col max-h-[80vh] pointer-events-auto"
                          >
                            <div className="flex justify-between items-center bg-black/40 border-b border-white/10 px-4 py-2">
                               <span className="text-white/50 text-xs font-mono uppercase tracking-widest">God Mode Debugging</span>
                               <button onClick={() => setIsGodModeOpen(false)} className="text-white/50 hover:text-white">x</button>
                            </div>
                            <div className="flex border-b border-white/10 text-xs font-mono uppercase">
                              <button
                                onClick={() => setActiveTab("roster")}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === "roster" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                              >
                                Party
                              </button>
                              <button
                                onClick={() => setActiveTab("trainer")}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === "trainer" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                              >
                                Trainer
                              </button>
                              <button
                                onClick={() => setActiveTab("pc")}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === "pc" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                              >
                                Log
                              </button>
                              <button
                                onClick={() => setActiveTab("dex")}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === "dex" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                              >
                                Dex
                              </button>
                              <button
                                onClick={() => setActiveTab("logbook")}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === "logbook" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                              >
                                Logbook
                              </button>
                              <button
                                onClick={() => setActiveTab("create")}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === "create" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                              >
                                Build
                              </button>
                              <button
                                onClick={() => setActiveTab("camera")}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === "camera" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                              >
                                World
                              </button>
                            </div>

                            <div className="overflow-y-auto flex-1">
                              {activeTab === "roster" && (
                                <div className="p-2 space-y-4">
                                  <div className="space-y-2">
                                    <div className="px-2 text-[10px] text-white/40 uppercase tracking-widest font-mono">
                                      Active Party ({roster.length}/6)
                                    </div>
                                    {roster.map((char) => (
                                      <button
                                        key={char.id}
                                        onClick={() => {
                                          if (!isEncounterMode) {
                                            setSelectedCharacterId(char.id);
                                            fetch('/api/clear_memory', { method: 'POST' });
                                            setMessages((prev) => [
                                              ...prev,
                                              {
                                                role: "system",
                                                text: `Swapped to ${char.name} (${char.type})`,
                                              },
                                            ]);
                                          }
                                        }}
                                        disabled={isEncounterMode}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedCharacterId === char.id ? "border-amber-400/50 bg-amber-400/10" : "border-white/5 hover:border-white/20 bg-white/5"} ${isEncounterMode ? "opacity-50 cursor-not-allowed" : ""}`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-sm tracking-wide text-white flex items-center">
                                            {char.name}
                                            <StatusPill status={char.status_condition || "NONE"} />
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <span
                                              className={`w-2 h-2 rounded-full ${char.type === "Water" ? "bg-blue-400" : char.type === "Metal" ? "bg-gray-400" : "bg-amber-600"}`}
                                            />
                                            <span className="text-xs text-white/50 uppercase">
                                              {char.type}
                                            </span>
                                          </div>
                                        </div>
                                        {char.battle_stats && (
                                          <div className="flex flex-col gap-1 mt-2 text-[10px] text-white/40 uppercase font-mono">
                                            <div className="flex flex-col mb-2">
                                              <div className="flex justify-between items-end">
                                                <span>LVL {char.battle_stats.level}</span>
                                                <span>HP: {char.battle_stats.current_hp}/{char.battle_stats.max_hp}</span>
                                              </div>
                                              <MathHPBar current={char.battle_stats.current_hp} max={char.battle_stats.max_hp} />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              <span>ATK: {char.battle_stats.atk}</span>
                                              <span>DEF: {char.battle_stats.def}</span>
                                              <span>SPD: {char.battle_stats.spd}</span>
                                            </div>
                                          </div>
                                        )}
                                        {char.id === "wild-temp" && (
                                          <span className="text-[10px] text-red-400 uppercase mt-1 block">
                                            WILD
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  
                                  {pcBox.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-white/10">
                                      <div className="px-2 text-[10px] text-white/40 uppercase tracking-widest font-mono">
                                        PC Storage ({pcBox.length} ∞)
                                      </div>
                                      {pcBox.map((char) => (
                                        <div
                                          key={char.id}
                                          className={`w-full text-left p-3 rounded-xl border border-white/5 bg-white/5 opacity-70`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm tracking-wide text-white flex items-center">
                                              {char.name}
                                              <StatusPill status={char.status_condition || "NONE"} />
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <span
                                                className={`w-2 h-2 rounded-full ${char.type === "Water" ? "bg-blue-400" : char.type === "Metal" ? "bg-gray-400" : "bg-amber-600"}`}
                                              />
                                              <span className="text-xs text-white/50 uppercase">
                                                {char.type}
                                              </span>
                                            </div>
                                          </div>
                                          {char.battle_stats && (
                                            <div className="flex flex-col mt-2">
                                              <div className="flex justify-between text-[10px] text-white/40 uppercase font-mono">
                                                <span>LVL {char.battle_stats.level}</span>
                                                <span>HP: {char.battle_stats.current_hp}/{char.battle_stats.max_hp}</span>
                                              </div>
                                              <MathHPBar current={char.battle_stats.current_hp} max={char.battle_stats.max_hp} />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {activeTab === "trainer" && trainerProfile && (
                                <div className="p-4 space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-xs text-white/50 uppercase tracking-wider block">
                                      Trainer Name
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-white/50" />
                                      <input
                                        value={trainerProfile.name}
                                        onChange={(e) => {
                                          const newProf = {
                                            ...trainerProfile,
                                            name: e.target.value,
                                          };
                                          setTrainerProfile(newProf);
                                        }}
                                        onBlur={() => {
                                          fetch("/api/trainer", {
                                            method: "POST",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              name: trainerProfile.name,
                                            }),
                                          });
                                        }}
                                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-white/50 uppercase tracking-wider block">
                                      Credits
                                    </label>
                                    <div className="text-sm font-mono text-emerald-400 bg-white/5 p-2 rounded flex justify-between">
                                      <span>¥ {trainerProfile?.currency || 500}</span>
                                    </div>
                                  </div>

                                  {/* CAMPAIGN MILESTONES */}
                                  <div className="space-y-1">
                                    <label className="text-xs text-white/50 uppercase tracking-wider block">
                                      Campaign Status
                                    </label>
                                    <div className="text-xs font-mono text-white/80 bg-white/5 p-3 rounded grid grid-cols-2 gap-2">
                                      <div>Milestones:</div>
                                      <div className="text-right text-cyan-400">0</div>
                                      
                                      <div>Keys Collected:</div>
                                      <div className="text-right text-cyan-400">0/8</div>

                                      <div>Dojo Badges:</div>
                                      <div className="text-right text-cyan-400">0</div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-white/50 uppercase tracking-wider block">
                                      Inventory
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-white/5 p-2 rounded border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase">
                                          Base Crux
                                        </div>
                                        <div className="text-sm font-mono text-cyan-400">
                                          {trainerProfile.inventory?.base_crux || 0}
                                        </div>
                                      </div>
                                      <div className="bg-white/5 p-2 rounded border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase">
                                          Mend Patch
                                        </div>
                                        <div className="text-sm font-mono text-emerald-400">
                                          {trainerProfile.inventory?.mend_patch || 0}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeTab === "pc" && (
                                <div className="p-4 space-y-4">
                                  <div className="space-y-2">
                                    <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Neural Log</h3>
                                    {thoughtLog.length === 0 ? (
                                      <div className="text-xs text-white/40 italic">Waiting for simulation events...</div>
                                    ) : (
                                      <div className="space-y-3">
                                        {thoughtLog.map(log => (
                                           <div key={log.id} className="text-xs text-emerald-300 font-mono">
                                              <span className="text-white/50">[{log.time}]</span> {log.thought}
                                           </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {activeTab === "dex" && (
                                <div className="p-4 space-y-4">
                                  <div className="space-y-2">
                                    <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Mochiioteca Data Logs</h3>
                                    <div className="grid grid-cols-5 gap-2">
                                      {Array.from({length: 100}).map((_, i) => {
                                        const id = String(i + 1).padStart(3, '0');
                                        const encountered = [...roster, ...pcBox].find(c => c.id === id || c.characterId === id);
                                        return (
                                          <div key={id} className={`aspect-square border flex flex-col items-center justify-center rounded ${encountered ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/5 bg-black/50'}`}>
                                            <div className="text-[10px] font-mono text-white/30">{id}</div>
                                            {encountered ? (
                                              <div className="text-[8px] font-mono text-white mt-1 text-center truncate w-full px-1">{encountered.name}</div>
                                            ) : (
                                              <div className="text-[8px] font-mono text-white/30 mt-1">???</div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeTab === "logbook" && (
                                <div className="p-4 space-y-4">
                                  <div className="space-y-4">
                                    <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2">NPC Logbook</h3>
                                    {knownCharacters.length === 0 ? (
                                      <div className="text-xs text-white/40 italic">You haven't met any notable characters yet.</div>
                                    ) : (
                                      <div className="space-y-3">
                                        {knownCharacters.map((char, i) => (
                                          <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                                            <div className="w-10 h-10 bg-cyan-900/30 rounded border border-cyan-500/30 flex items-center justify-center overflow-hidden relative">
                                              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${char.name}`} alt="avatar" className="w-8 h-8 opacity-80" />
                                            </div>
                                            <div>
                                              <div className="text-sm font-mono text-white">{char.name}</div>
                                              <div className="text-[10px] text-cyan-400/80 font-mono">{char.role}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {activeTab === "create" && (
                                <div className="p-4 space-y-4">
                                  <div className="space-y-2">
                                    <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">MochiiCreate Suite</h3>
                                    <p className="text-xs text-white/50 mb-4">God-Mode environment modifications and chunk-painting tools.</p>
                                    
                                    <div className="space-y-4">
                                      <div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-mono">Select Tool</div>
                                        <div className="flex gap-2 text-xs font-mono">
                                           <button className="flex-1 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase">Paint Voxel</button>
                                           <button className="flex-1 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded uppercase">Erase Chunk</button>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-mono">Active Material</div>
                                        <div className="grid grid-cols-4 gap-2">
                                           <div className="aspect-square bg-emerald-600 rounded border border-white/20"></div>
                                           <div className="aspect-square bg-stone-500 rounded border border-white/20"></div>
                                           <div className="aspect-square bg-blue-500 rounded border border-white/20"></div>
                                           <div className="aspect-square bg-amber-600 rounded border border-white/20"></div>
                                        </div>
                                      </div>

                                      <div className="pt-4 border-t border-white/10">
                                         <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-mono">CodeWeaver Terminal</div>
                                         <button className="w-full py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded uppercase text-xs font-mono">
                                            Execute Raw Script
                                         </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeTab === "camera" && (
                                <div>
                                  <div className="p-3 border-b border-white/10 text-xs text-white/50 font-medium tracking-wider uppercase bg-black/20">
                                    Camera Mode
                                  </div>
                                  {(
                                    ["follow", "stationary", "free"] as const
                                  ).map((mode) => (
                                    <button
                                      key={mode}
                                      onClick={() => setCameraMode(mode)}
                                      className={`block w-full text-left px-4 py-3 text-sm transition-colors ${cameraMode === mode ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                                    >
                                      {mode.charAt(0).toUpperCase() +
                                        mode.slice(1)}{" "}
                                      Mode
                                    </button>
                                  ))}

                                  <div className="p-3 border-y border-white/10 text-xs text-white/50 font-medium tracking-wider uppercase mt-1 bg-black/20">
                                    Spawn Map
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 p-2">
                                    {(
                                      [
                                        "void",
                                        "ancient_cave",
                                        "desert",
                                        "rainforest",
                                        "neon_city",
                                        "junkyard",
                                      ] as const
                                    ).map((b) => (
                                      <button
                                        key={b}
                                        onClick={() => setBiome(b)}
                                        className={`text-left px-2 py-2 text-xs rounded transition-colors ${biome === b ? "bg-blue-500/20 text-blue-300 border border-blue-500/50" : "bg-white/5 text-white/70 hover:bg-white/10 border border-transparent"}`}
                                      >
                                        {b === "void"
                                          ? "The Void"
                                          : b === "ancient_cave"
                                            ? "Ancient Cave"
                                            : b === "desert"
                                              ? "Red Desert"
                                              : b === "rainforest"
                                                ? "Rainforest"
                                                : b === "neon_city"
                                                  ? "Neon City"
                                                  : "Scrap Junkyard"}
                                      </button>
                                    ))}
                                  </div>
                                  {biome !== "void" && (
                                    <div className="px-4 py-3 border-t border-white/10">
                                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">
                                        Seed
                                      </label>
                                      <input
                                        value={seed}
                                        onChange={(e) =>
                                          setSeed(e.target.value)
                                        }
                                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                        placeholder="Enter seed"
                                      />
                                    </div>
                                  )}
                                  <div className="px-4 py-3 border-t border-white/10">
                                    <button
                                      onClick={() => {
                                        window.dispatchEvent(
                                          new Event("upgrade-start"),
                                        );
                                        setTimeout(
                                          () =>
                                            window.dispatchEvent(
                                              new Event("upgrade-end"),
                                            ),
                                          5000,
                                        ); // end after 5 sec demo
                                      }}
                                      className="w-full text-xs font-mono uppercase bg-blue-600/50 hover:bg-blue-500/50 text-white rounded p-2 transition-colors border border-blue-400/30"
                                    >
                                      Demo Surgery Stasis
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={() => setTtsEnabled(!ttsEnabled)}
                      className="p-3 bg-black/40 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 transition-colors shadow-xl"
                    >
                      {ttsEnabled ? (
                        <Volume2 size={16} />
                      ) : (
                        <VolumeX size={16} />
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-3 bg-black/40 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 transition-colors shadow-xl text-red-400"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {isUIVisible && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="flex-1 flex flex-col justify-end w-full"
              >
                {/* Dynamic Speech Bubbles */}
                <div className="flex-1 flex items-end justify-center pb-8 md:pb-12 overflow-hidden pointer-events-none">
                  <div
                    className="w-full max-w-lg max-h-[60vh] overflow-y-auto flex flex-col gap-4 p-4 scrollbar-hide mask-image-b"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <AnimatePresence>
                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] p-4 rounded-2xl pointer-events-auto backdrop-blur shadow-2xl ${
                              msg.role === "user"
                                ? "bg-blue-600/80 rounded-br-sm border border-blue-500/50 text-white"
                                : "bg-white/90 rounded-bl-sm border border-white/20 text-slate-900"
                            }`}
                          >
                            <p className="text-sm md:text-base leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Terminal OR Battle Menu */}
                <div className="w-full max-w-2xl mx-auto pointer-events-auto pb-4 md:pb-8 flex justify-center">
                  {isBattling ? (
                    showMoves ? (
                      <motion.div
                        key="moves-menu"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full max-w-lg bg-slate-900/90 border-2 border-white/20 p-4 rounded-xl shadow-2xl backdrop-blur grid gap-4 grid-cols-2"
                      >
                        {(() => {
                           const state = useGameStore.getState();
                           const lead = state.roster.active_party[0];
                           const rawObjMoves = (lead?.battle_stats as any)?.moves || [];
                           const moveIds = lead?.moves || [];
                           
                           // Map move string IDs from custom_moves, then add fallback to pre-existing raw objects
                           let moves = [];
                           if (moveIds.length > 0) {
                              moves = moveIds.map(mId => state.custom_moves[mId] || { name: mId.replace('_', ' '), power: 50, element: "Normal", category: "PHYSICAL", accuracy: 100 });
                           } else if (rawObjMoves.length > 0) {
                              moves = rawObjMoves;
                           } else {
                              moves = [{name: "Terminal Dash", power: 40, element: "Normal", category: "PHYSICAL", accuracy: 100}];
                           }
                           
                           return moves.map((mv: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  // The Combat Event Queue
                                  setMessages((prev) => [...prev, { role: "system", text: `${lead.name} used ${mv.name}!` }]);
                                  playSfx("low_tone");
                                  setShowMoves(false);
                                  
                                  // 1. Calculate Math
                                  const level = lead.battle_stats.level || 1;
                                  const power = mv.power || 40;
                                  const a = mv.category === "SPECIAL" ? (lead.battle_stats.spa || lead.battle_stats.atk) : lead.battle_stats.atk;
                                  const d = wildEntity ? 40 : 40; // Simulated enemy def
                                  const typeEffect = Math.random() > 0.8 ? 2 : (Math.random() > 0.9 ? 0 : 1);
                                  
                                  const weather = useGameStore.getState().combat.field_state?.environmental_weather || "CLEAR";
                                  const { damage, isCrit } = executeDamageFormula(level, power, a, d, true, typeEffect, false, mv.category === "PHYSICAL", mv.element, weather);
                                  
                                  let remainingHp = wildEntity?.battle_stats?.current_hp || 100;
                                  remainingHp = Math.max(0, remainingHp - damage);

                                  // Mochiimind Combat Narration Payload
                                  const payload = {
                                     attacker: lead.name,
                                     defender: wildEntity?.name || "Target",
                                     move_used: mv.name,
                                     result: {
                                        crit: isCrit,
                                        effectiveness: typeEffect,
                                        defender_hp_remaining: remainingHp,
                                        status_applied: mv.effect || "NONE"
                                     },
                                     biome: useGameStore.getState().world.environment_biome || "unknown"
                                  };

                                  // 2. Trigger VFX & Apply Damage
                                  setTimeout(() => {
                                     if (isCrit) {
                                        window.dispatchEvent(new CustomEvent("camera-shake", { detail: { intensity: 0.5 } })); // larger shake
                                     } else {
                                        window.dispatchEvent(new CustomEvent("camera-shake", { detail: { intensity: 0.2 } }));
                                     }
                                     
                                     // Fetch dynamic narration from Mochiimind
                                     fetch("/api/combat_narration", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(payload)
                                     })
                                        .then(r => r.json())
                                        .then(data => {
                                           let currentText = "";
                                           const targetText = data.text || "System Alert: Damage calculated.";
                                           const msgIndex = messages.length; 
                                           setMessages((prev) => [...prev, { role: "system", text: "" }]);
                                           
                                           let charIndex = 0;
                                           const interval = setInterval(() => {
                                              currentText += targetText[charIndex];
                                              setMessages(prev => {
                                                 const newMsgs = [...prev];
                                                 newMsgs[newMsgs.length - 1] = { role: "system", text: currentText };
                                                 return newMsgs;
                                              });
                                              charIndex++;
                                              if (charIndex >= targetText.length) clearInterval(interval);
                                           }, 30);
                                        })
                                        .catch(err => {
                                           setMessages((prev) => [...prev, { role: "system", text: `[Fallback] ${lead.name} struck for ${damage} damage!` }]);
                                        });

                                     // Actually hit the entity
                                     window.dispatchEvent(new CustomEvent("combat-hit", { detail: { damage, isCriticalHit: isCrit } }));
                                        
                                        // Optional Anime Observer Banter Trigger (Phase 29)
                                        if (isCrit && Math.random() > 0.5) {
                                           useGameStore.getState().applyBanter("Tch... a critical hit?! Don't get cocky!");
                                        }
                                        
                                        // Simulate enemy HP drop...
                                        if (Math.random() > 0.7) {
                                           setTimeout(() => {
                                              const creditsWon = wildEntity?.is_trainer ? 500 : Math.floor(Math.random() * 50) + 10;
                                              useGameStore.getState().addCredits(creditsWon);
                                              setMessages(prev => [...prev, { role: "system", text: `Wild ${wildEntity?.name} fainted! Won ¥${creditsWon}!` }]);
                                              setIsBattling(false);
                                              setIsEncounterMode(false);
                                              setWildEntity(null);
                                              useGameStore.getState().addEXP(50, 0); // Give 50 exp to lead
                                              setEncounterAction("MENU");
                                           }, 1500);
                                        }
                                  }, 500); // Wait for dash animation
                                }}
                                className={`p-4 border border-white/10 hover:border-amber-400 bg-white/5 hover:bg-amber-400/20 text-white font-mono tracking-widest text-base rounded-lg transition-all shadow-md flex flex-col justify-center items-center`}
                              >
                                <span className="font-bold uppercase">{mv.name}</span>
                                <span className="text-xs text-white/50">{mv.element} | {mv.category} | PWR: {mv.power}</span>
                              </button>
                           ));
                        })()}
                        <button
                           onClick={() => setShowMoves(false)}
                           className="p-4 border border-white/10 hover:border-red-400 bg-white/5 hover:bg-red-400/20 text-white font-mono tracking-widest text-base rounded-lg transition-all shadow-md col-span-2 uppercase"
                        >
                           Cancel
                        </button>
                      </motion.div>
                    ) : (
                    <motion.div
                      key="true-battle-menu"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-full max-w-lg bg-slate-900/90 border-2 border-white/20 p-4 rounded-xl shadow-2xl backdrop-blur grid gap-4 grid-cols-2"
                    >
                      {useGameStore.getState().story.is_safari_mode ? (
                        <>
                          <button
                            onClick={() => setMessages(prev => [...prev, { role: "system", text: "You threw Bait! The wild Mochiichao is eating." }])}
                            className="p-4 border border-white/10 hover:border-amber-400 bg-white/5 hover:bg-amber-400/20 text-white font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                          >
                            Bait
                          </button>
                          <button
                            onClick={() => setMessages(prev => [...prev, { role: "system", text: "You threw a Stun Rock! The wild Mochiichao is angry!" }])}
                            className="p-4 border border-white/10 hover:border-amber-400 bg-white/5 hover:bg-amber-400/20 text-white font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                          >
                            Rock
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setShowMoves(true);
                          }}
                          className="p-4 border border-white/10 hover:border-amber-400 bg-white/5 hover:bg-amber-400/20 text-white font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                        >
                          Fight
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          // Trigger Merkaba or Luigi Cube
                          if (!captureThrowing) {
                            if (useGameStore.getState().story.is_safari_mode) {
                               const cubes = useGameStore.getState().player.inventory.filter((i) => i.id.includes("cube"));
                               if (cubes.length === 0) {
                                  setMessages(prev => [...prev, { role: "system", text: "You are out of Luigi Cubes! Safari Zone terminated." }]);
                                  useGameStore.setState(s => ({ story: { ...s.story, is_safari_mode: false } }));
                                  setBiome("castagnoli_exterior");
                                  setIsBattling(false);
                                  setIsEncounterMode(false);
                                  setWildEntity(null);
                                  setEncounterAction("MENU");
                                  return;
                               }
                               setMessages(prev => [...prev, { role: "system", text: `You threw a ${cubes[0].id.replace('_', ' ')}!` }]);
                               useGameStore.getState().tossItem(cubes[0].id);
                            } else {
                               useGameStore.getState().tossItem("base_crux");
                               setMessages((prev) => [...prev, { role: "system", text: "Player threw a Base Crux!" }]);
                            }
                            setCaptureThrowing(true);
                            
                            const maxHp = wildEntity?.battle_stats?.max_hp || 100;
                            const curHp = wildEntity?.battle_stats?.current_hp || maxHp;
                            const catchRate = 120; // Simulated catch rate
                            const cruxBonus = useGameStore.getState().story.is_safari_mode ? 0.5 : 1.0; 
                            const wildStatus = wildEntity?.status_condition || "NONE";
                            const catchResult = calculateCatchSuccess(maxHp, curHp, catchRate, cruxBonus, wildStatus);
                            
                            // Let the API handle actual creation if it succeeds, but we simulate it here just for local context
                            // We will hijack the /api/catch for now because we're offline in this client logic
                            setTimeout(() => {
                               if (catchResult.caught) {
                                  // Call actual backend or simulate
                                  fetch("/api/catch", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ wildEntity, cruxType: "base_crux" }),
                                  });
                                  setMessages(prev => [...prev, { role: "system", text: `Gotcha! ${wildEntity?.name || 'It'} was caught!` }]);
                                  useGameStore.getState().logEvent(`Caught a wild ${wildEntity?.name}!`);
                                  if (wildEntity?.characterId) useGameStore.getState().markCaught(wildEntity.characterId);
                                  setIsBattling(false);
                                  setIsEncounterMode(false);
                                  const gs = useGameStore.getState();
                                  if (gs.roster.active_party.length < 6) {
                                     gs.setRosterData([...gs.roster.active_party, wildEntity!], gs.roster.pc_box);
                                  } else {
                                     gs.setRosterData(gs.roster.active_party, [...gs.roster.pc_box, wildEntity!]);
                                  }
                                  setWildEntity(null);
                                  setCaptureThrowing(false);
                                  setEncounterAction("MENU");
                                  gs.saveToSlot(0);
                               } else {
                                  setMessages(prev => [...prev, { role: "system", text: "Oh no! It broke free!" }]);
                                  setCaptureThrowing(false);
                                  
                                  // Enemy Banter!
                                  if (Math.random() > 0.5) {
                                    useGameStore.getState().applyBanter("Did you really think that would work on me?");
                                  }
                               }
                            }, 3000); // Wait for the 3 shakes
                          }
                        }}
                        className="p-4 border border-emerald-500/50 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-400/30 text-emerald-300 font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                      >
                        Bag
                      </button>
                      
                      {!useGameStore.getState().story.is_safari_mode && (
                        <button
                          onClick={() => {
                            setIsBattling(false);
                            setShowMoves(false);
                            setUI("roster");
                          }}
                          className="p-4 border border-white/10 hover:border-blue-400 bg-white/5 hover:bg-blue-400/20 text-blue-300 font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                        >
                          M. OS
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setMessages((prev) => [...prev, { role: "system", text: "Got away safely!" }]);
                          setIsBattling(false);
                          setShowMoves(false);
                          setIsEncounterMode(false);
                          setEncounterAction("MENU");
                          setWildEntity(null);
                        }}
                        className="p-4 border border-white/10 hover:border-red-400 bg-white/5 hover:bg-red-400/20 text-white font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                      >
                        Run
                      </button>
                    </motion.div>
                    )
                  ) : isEncounterMode && encounterAction === "MENU" ? (
                    <motion.div
                      key="battle-menu"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-full max-w-md bg-slate-900/90 border-2 border-white/20 p-4 rounded-xl shadow-2xl backdrop-blur grid grid-cols-2 gap-4"
                    >
                      <button
                        onClick={() => setEncounterAction("TALK")}
                        className="p-4 border border-white/10 hover:border-amber-400 bg-white/5 hover:bg-amber-400/20 text-white font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                      >
                        Talk
                      </button>
                      <button
                        onClick={() => setIsBattling(true)}
                        className="p-4 border border-blue-500/50 hover:border-blue-400 bg-blue-500/10 hover:bg-blue-400/30 text-blue-300 font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                      >
                        Battle
                      </button>
                      <button
                        onClick={() => {
                          fetch("/api/catch", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ wildEntity, cruxType: "base_crux" }),
                          })
                            .then((res) => res.json())
                            .then((data) => {
                              if (data.error) {
                                setMessages((prev) => [
                                  ...prev,
                                  { role: "system", text: data.error },
                                ]);
                              } else if (data.success) {
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    role: "system",
                                    text: `Gotcha! ${wildEntity.name} was caught!${data.sentToPC ? " Sent to PC." : ""}`,
                                  },
                                ]);
                                if (data.pcBox) setPcBox(data.pcBox);
                                setRoster(data.globalRoster);
                                setTrainerProfile(data.trainerProfile);
                                setIsEncounterMode(false);
                                setEncounterAction("MENU");
                                setWildEntity(null);
                              } else {
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    role: "system",
                                    text: `Oh no! The wild entity broke free!`,
                                  },
                                ]);
                                setTrainerProfile(data.trainerProfile);
                              }
                            });
                        }}
                        className="p-4 border border-emerald-500/50 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-400/30 text-emerald-300 font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                      >
                        Catch
                      </button>
                      <button
                        onClick={() => {
                          setMessages((prev) => [
                            ...prev,
                            { role: "system", text: "Got away safely!" },
                          ]);
                          setIsEncounterMode(false);
                          setEncounterAction("MENU");
                          setWildEntity(null);
                        }}
                        className="p-4 border border-white/10 hover:border-red-400 bg-white/5 hover:bg-red-400/20 text-white font-mono uppercase tracking-widest text-lg rounded-lg transition-all shadow-md"
                      >
                        Flee
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chat-input"
                      className="relative flex items-center bg-black/50 backdrop-blur-xl border border-white/20 rounded-full p-2 shadow-2xl transition-all focus-within:bg-black/70 focus-within:border-white/40 w-full"
                    >
                      {isEncounterMode && (
                        <button
                          onClick={() => setEncounterAction("MENU")}
                          className="px-3 text-xs uppercase font-mono text-white/50 hover:text-white"
                        >
                          Back
                        </button>
                      )}
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={
                          isEncounterMode
                            ? "Talk to the wild entity..."
                            : "Talk to Mochiichao..."
                        }
                        disabled={loading}
                        className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:outline-none placeholder:text-white/40 font-mono text-sm"
                      />
                      <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={loading}
                        className={`p-3 mr-2 rounded-full transition-all flex items-center justify-center ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"}`}
                      >
                        {isRecording ? (
                          <Square size={18} fill="currentColor" />
                        ) : (
                          <Mic size={18} />
                        )}
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all text-sm font-semibold disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                      >
                        {loading ? (
                          <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Hatch Cutscene Overlay */}
      {hatchCutsceneEgg && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="flex flex-col items-center justify-center pointer-events-auto"
          >
            <div className="w-64 h-64 mb-8 relative flex items-center justify-center">
               <motion.div
                  animate={{ 
                     rotateZ: [0, -10, 10, -10, 10, 0],
                     scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5, repeat: 3, repeatType: "reverse" }}
                  onAnimationComplete={() => {
                     // when the wiggle is done
                     playSfx("chime_happy");
                     setTimeout(() => {
                        useGameStore.getState().hatchEgg(hatchCutsceneEgg.rosterIndex);
                        setHatchCutsceneEgg(null);
                     }, 1500);
                  }}
                  className="w-32 h-40 bg-gradient-to-b from-white to-gray-400 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[0_0_50px_rgba(255,255,255,0.8)] border-4 border-white/50 animate-pulse relative overflow-hidden"
               >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMSkiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+PC9zdmc+')] opacity-30"></div>
               </motion.div>
            </div>
            <div className="bg-black/80 border border-white/20 p-6 rounded-xl max-w-md text-center backdrop-blur-md">
               <p className="font-mono text-white text-xl">
                  Oh? Your Mochii Egg is hatching!
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
