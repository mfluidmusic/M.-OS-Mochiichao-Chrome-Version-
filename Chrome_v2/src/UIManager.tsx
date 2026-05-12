import { useGameStore } from './useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, PackageOpen, Database, Book, Users, Target, Search, Map as MapIcon, Settings as SettingsIcon, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { StatusPill, MathHPBar } from './components/StatusPill';
import { SettingsMenu, MapMenu, InfinityArcadeMenu, MochiiMartMenu } from './UIManagerMenus';
import { ShoppingCart } from 'lucide-react';

export function UIManager() {
  const { ui, setUI, closeUI, goBackUI, player, roster } = useGameStore();
  const { active_menu, toast_message } = ui;

  // Universal Escape Hatch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active_menu !== 'none') {
        closeUI();
      }
    };
    
    const handlePopState = () => {
      if (active_menu !== 'none') {
         closeUI();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('popstate', handlePopState);
    };
  }, [active_menu, closeUI]);

  if (active_menu === "none" && !toast_message) return null;

  return (
    <>
      <AnimatePresence>
        {active_menu !== "none" && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-3">
                  {ui.previous_menu !== "none" && active_menu !== "main" && (
                    <button onClick={goBackUI} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <h2 className="text-xl font-mono uppercase font-bold text-white tracking-widest">{active_menu.replace('_', ' ')}</h2>
                </div>
                <button onClick={closeUI} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Content area: Rendered instantaneously  */}
              <div className="p-6 flex-1 overflow-y-auto">
                {active_menu === "main" && <MainMenu />}
                {active_menu === "roster" && <RosterMenu roster={roster.active_party} />}
                {active_menu === "bag" && <BagMenu inventory={player.inventory} />}
                {active_menu === "pc_box" && <PCBoxMenu active={roster.active_party} pc={roster.pc_box} />}
                {active_menu === "mochiioteca" && <MochiiotecaMenu />}
                {active_menu === "settings" && <SettingsMenu />}
                {active_menu === "map" && <MapMenu />}
                {active_menu === "market" && <MochiiMartMenu />}
                {active_menu === "infinity_arcade" && <InfinityArcadeMenu />}
                {active_menu === "companion" && <CompanionMenu active_party={roster.active_party} />}
                {active_menu === "logbook" && <LogbookMenu />}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast_message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-[60] bg-red-900 border border-red-500 text-red-100 px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 font-mono text-sm pointer-events-auto"
          >
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             {toast_message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MainMenu() {
  const { setUI, showToast } = useGameStore();

  const menuItems = [
    { id: "companion", title: "Companion Sync", icon: <Heart size={24} />, color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
    { id: "roster", title: "Party Roster", icon: <Users size={24} />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { id: "bag", title: "Inventory", icon: <PackageOpen size={24} />, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { id: "pc_box", title: "PC Box Access", icon: <Database size={24} />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { id: "map", title: "Global Map", icon: <MapIcon size={24} />, color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
    { id: "market", title: "Network Market", icon: <ShoppingCart size={24} />, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    { id: "mochiioteca", title: "Mochiioteca", icon: <Book size={24} />, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { id: "settings", title: "Settings", icon: <SettingsIcon size={24} />, color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {menuItems.map(item => (
        <button
          key={item.id}
          onClick={() => {
            if (item.id === "multiplayer") {
              showToast("System Locked: The Mochiimind is still processing this sector.");
            } else {
              setUI(item.id as any);
            }
          }}
          className={`p-6 flex flex-col items-center gap-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${item.color}`}
        >
          {item.icon}
          <span className="font-mono uppercase tracking-widest">{item.title}</span>
        </button>
      ))}
    </div>
  );
}

function CompanionMenu({ active_party }: { active_party: any[] }) {
  const { showToast, setUI } = useGameStore();
  const [syncedWeather, setSyncedWeather] = useState("Checking local weather...");
  const [alarmTime, setAlarmTime] = useState("");

  const lead = active_party[0];

  useEffect(() => {
    // Simulated weather sync
    setTimeout(() => {
      setSyncedWeather("CLEAR (Synced with local Device)");
      useGameStore.setState(s => ({
         combat: {
            ...s.combat,
            field_state: { ...s.combat.field_state, environmental_weather: "CLEAR" }
         }
      }));
    }, 1500);
  }, []);

  const handleSetAlarm = () => {
     if (!alarmTime) return;
     showToast(`Mochii alarm set for ${alarmTime}! They will remind you.`);
     const timeParts = alarmTime.split(':');
     if (timeParts.length === 2) {
       // Just a simulated placeholder for an OS alarm
       setTimeout(() => {
          showToast(`🔔 ALARM from ${lead?.name || 'Mochii'}: It is time!`);
          window.dispatchEvent(new CustomEvent("camera-shake", { detail: { intensity: 0.1 } }));
       }, 5000); // 5 sec dummy alarm for demo
     }
  };

  if (!lead || lead.is_egg) {
    return <div className="text-center font-mono text-white/50 p-10">No valid Companion available in Lead slot.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
       <div className="w-full md:w-1/2 bg-black/40 border border-pink-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h3 className="text-3xl font-black text-pink-300 drop-shadow-md mb-2">{lead.name}</h3>
          <p className="text-white/60 font-mono text-sm mb-6">Lv. {lead.battle_stats?.level || 1} • Sync Level: {lead.sync_level || 0}/255</p>

          <button 
             onClick={() => {
                showToast(`${lead.name} looks very happy! ❤️`);
                window.dispatchEvent(new CustomEvent("camera-shake", { detail: { intensity: 0.05 } }));
             }}
             className="w-32 h-32 bg-pink-500/20 rounded-full border-4 border-pink-400 flex items-center justify-center text-pink-300 text-sm font-mono shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:scale-110 hover:bg-pink-500/40 active:scale-95 transition-all cursor-[pointer]"
          >
             <Heart size={48} className="animate-pulse" />
          </button>
          <p className="mt-6 text-white/50 font-mono text-xs max-w-xs">(Click to pet {lead.name})</p>
       </div>

       <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
             <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                Real-World Weather Link
             </h4>
             <p className="text-white/70 font-mono text-sm bg-black/50 p-3 rounded">
                Local Status: <span className="text-emerald-300 uppercase">{syncedWeather}</span>
             </p>
             <p className="text-white/40 text-xs mt-2 italic">M. OS syncs with your physical location APIs to update the 3D environment.</p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex-1">
             <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                OS Playtime Alarm
             </h4>
             <p className="text-white/70 font-mono text-sm mb-3">
                Have your Mochiichao remind you of physical world tasks.
             </p>
             <div className="flex gap-2 mb-2">
                <input 
                   type="time" 
                   value={alarmTime}
                   onChange={e => setAlarmTime(e.target.value)}
                   className="bg-white/10 border border-white/20 text-white p-2 rounded w-full focus:outline-none focus:border-pink-500/50" 
                />
                <button 
                   onClick={handleSetAlarm}
                   className="bg-pink-500/20 text-pink-300 border border-pink-500/50 px-4 rounded hover:bg-pink-500/40 transition-colors font-bold"
                >
                   SET
                </button>
             </div>
             <p className="text-white/40 text-xs mt-2 italic">Mochii will physically alert you in the 3D space when the timer completes.</p>
          </div>
       </div>
    </div>
  );
}

function BagMenu({ inventory }: { inventory: any[] }) {
  const { useItem, tossItem, showToast, roster } = useGameStore();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleUseItem = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const handleTossItem = (itemId: string) => {
    tossItem(itemId);
    showToast(`Tossed ${itemId}.`);
  };

  return (
    <div className="flex gap-4 h-full flex-col lg:flex-row">
       <div className="w-full lg:w-48 flex lg:flex-col gap-2 shrink-0 overflow-x-auto lg:overflow-y-auto">
          {["Items", "Crux", "Key Items"].map(cat => (
             <button key={cat} className="p-3 bg-white/5 border border-white/10 rounded-lg text-left text-white/50 hover:bg-white/10 hover:text-white transition-colors">{cat}</button>
          ))}
       </div>
       <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 overflow-y-auto relative">
          {selectedItem !== null && (
             <div className="absolute inset-0 z-10 bg-black/90 backdrop-blur p-4 overflow-y-auto flex flex-col rounded-xl">
                <button onClick={() => setSelectedItem(null)} className="self-end p-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white font-mono text-sm border border-white/20">Cancel</button>
                <h3 className="text-white font-mono uppercase mb-6 text-center mt-4">Select Target for {selectedItem.replace('_', ' ')}</h3>
                <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
                   {roster.active_party.map((char) => (
                      <button key={char.uid} onClick={() => {
                         useItem(selectedItem, char.uid);
                         setSelectedItem(null);
                         setTimeout(() => showToast(`Used ${selectedItem.replace('_', ' ')} on ${char.name}!`), 100);
                      }} className="bg-white/10 p-4 rounded-xl flex justify-between items-center text-white hover:bg-white/20 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
                        <span className="font-bold flex items-center gap-1">
                          {char.name}
                          <StatusPill status={char.status_condition || 'NONE'} />
                        </span>
                        <div className="text-right w-32">
                           <span className="text-white/50 text-xs block font-mono mb-1">HP: {char.battle_stats?.current_hp}/{char.battle_stats?.max_hp}</span>
                           <MathHPBar current={char.battle_stats?.current_hp || 1} max={char.battle_stats?.max_hp || 1} />
                        </div>
                      </button>
                   ))}
                   {roster.active_party.length === 0 && (
                      <div className="text-white/30 text-center font-mono mt-10">No active entities in party...</div>
                   )}
                </div>
             </div>
          )}

          {inventory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
              <PackageOpen size={48} opacity={0.5} />
              <p className="font-mono uppercase tracking-widest">[ Inventory Empty ]</p>
            </div>
          ) : (
            <div className="space-y-2">
               {inventory.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:border-emerald-500/50 transition-colors group">
                     <span className="text-white capitalize">{item.id.replace('_', ' ')} x{item.count}</span>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleUseItem(item.id)} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/40 text-xs">USE</button>
                         <button onClick={() => handleTossItem(item.id)} className="px-3 py-1 bg-white/10 text-white/50 border border-white/20 rounded hover:bg-white/20 text-xs">TOSS</button>
                     </div>
                  </div>
               ))}
            </div>
          )}
       </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  Flame: "#F08030",
  Flora: "#78C850",
  Aqua: "#6890F0",
  Chrome: "#B8B8D0",
  Mythic: "#7038F8",
  Cyber: "#00FFFF",
  Cosmic: "#AA00FF",
  Normal: "#A8A878"
};

function TypePill({ type }: { type: string }) {
   return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black border border-black/20" style={{ backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.Normal }}>
         {type.toUpperCase()}
      </span>
   );
}

function HPBar({ current, max }: { current: number, max: number }) {
   const perc = Math.max(0, Math.min(100, (current / max) * 100));
   const colorClass = perc > 50 ? "bg-emerald-400" : perc > 20 ? "bg-yellow-400" : "bg-red-500";
   return (
      <div className="w-full bg-black/80 h-2 rounded-full overflow-hidden border border-white/20 mt-1 shadow-inner">
         <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${perc}%` }} />
      </div>
   );
}

function RosterMenu({ roster }: { roster: any[] }) {
  const { reorderRoster, showToast } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const handleCharClick = (index: number) => {
    if (selectedSlot === null) {
      setSelectedSlot(index);
    } else {
      reorderRoster(selectedSlot, index);
      setSelectedSlot(null);
      showToast("Roster order updated!");
    }
  };

  if (roster.length === 0) {
    return <div className="text-center text-white/30 py-20 font-mono tracking-widest uppercase">[ No Entities in Party ]</div>;
  }
  
  const lead = roster[0];
  const others = roster.slice(1);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Lead Component */}
      <div 
        onClick={() => handleCharClick(0)} 
        className={`w-full lg:w-1/2 bg-gradient-to-br from-white/10 to-black/40 border ${selectedSlot === 0 ? 'border-amber-400 border-2' : 'border-white/20'} rounded-xl p-6 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-colors shadow-lg relative overflow-hidden`}
      >
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
           <div className="w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        {lead.is_egg ? (
           <div className="flex flex-col justify-center items-center h-full z-10 w-full text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-500 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border-4 border-white/20 mb-4 animate-pulse shadow-xl" />
              <h3 className="text-2xl font-black text-white drop-shadow-md">Mochii Egg</h3>
              <p className="text-white/60 font-mono mt-4 max-w-sm px-4">
                {(lead.egg_steps_remaining || 0) > (lead.total_hatch_steps || 1) * 0.5
                  ? "It's a beautifully patterned Mochii Egg. It feels warm to the touch."
                  : (lead.egg_steps_remaining || 0) > (lead.total_hatch_steps || 1) * 0.15
                  ? "It occasionally wiggles. Something is growing inside!"
                  : "You can hear tiny, cute peeps coming from inside! It's going to hatch any second!"}
              </p>
           </div>
        ) : (
           <>
              <div className="flex justify-between items-start z-10">
                 <div>
                    <h3 className="text-3xl font-black text-white italic drop-shadow-md">{lead.name}</h3>
                    <p className="text-white/80 font-bold font-mono">Lv. {lead.battle_stats?.level || 1}</p>
                    <div className="flex gap-2 mt-2">
                       {(lead.types || ["Flame"]).map((t: string) => <TypePill key={t} type={t} />)}
                    </div>
                 </div>
                 <div className="w-24 h-24 bg-black/40 rounded-full border-4 border-white/10 flex items-center justify-center text-white/50 text-xs font-mono shadow-inner">SPRITE</div>
              </div>
              <div className="mt-8 z-10 bg-black/60 p-4 rounded-lg border border-white/5">
                 <HPBar current={lead.battle_stats?.current_hp || 1} max={lead.battle_stats?.max_hp || 1} />
                 <p className="text-white font-mono text-sm mt-2 text-right">
                    {lead.battle_stats?.current_hp || 1} / {lead.battle_stats?.max_hp || 1}
                 </p>
              </div>
           </>
        )}
      </div>
      
      {/* Others List */}
      <div className="w-full lg:w-1/2 flex flex-col gap-2">
         {others.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/30 font-mono text-sm">
               [ EMPTY SLOT ]
            </div>
         ) : null}
         {others.map((char: any, idx: number) => {
            const i = idx + 1;
            return (
              <div 
                key={i} 
                onClick={() => handleCharClick(i)} 
                className={`bg-black/40 border ${selectedSlot === i ? 'border-amber-400 border-2' : 'border-white/10'} rounded-lg p-3 flex gap-4 items-center cursor-pointer hover:bg-white/10 transition-colors shadow-md`}
              >
                {char.is_egg ? (
                  <>
                     <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-500 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border border-white/20 shrink-0 shadow-inner flex items-center justify-center text-[8px] text-black">EGG</div>
                     <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold truncate">Mochii Egg</h3>
                        <p className="text-white/50 font-mono text-xs truncate">
                          {(char.egg_steps_remaining || 0) > (char.total_hatch_steps || 1) * 0.5
                            ? "Feels warm..."
                            : (char.egg_steps_remaining || 0) > (char.total_hatch_steps || 1) * 0.15
                            ? "It wiggles!"
                            : "It's hatching soon!"}
                        </p>
                     </div>
                  </>
                ) : (
                  <>
                     <div className="w-12 h-12 bg-white/5 rounded border border-white/10 flex items-center justify-center text-[10px] text-white/30 shrink-0 shadow-inner">SPRITE</div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center mb-1">
                          <h3 className="text-white font-bold truncate">{char.name}</h3>
                          <span className="text-white/70 font-mono text-xs shrink-0">Lv.{char.battle_stats?.level || 1}</span>
                       </div>
                       <HPBar current={char.battle_stats?.current_hp || 1} max={char.battle_stats?.max_hp || 1} />
                       <div className="flex gap-1 mt-1">
                          {(char.types || ["Flame"]).map((t: string) => <TypePill key={t} type={t} />)}
                       </div>
                     </div>
                  </>
                )}
              </div>
            );
         })}
      </div>
    </div>
  );
}

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Mochiichao } from './components/Mochiichao';

function PCBoxMenu({ active, pc }: { active: any[], pc: any[] }) {
  const { swapWithPC, releaseFromPC, showToast } = useGameStore();
  const [selectedActive, setSelectedActive] = useState<number | null>(null);
  const [hoveredPC, setHoveredPC] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"level" | "rarity" | "element" | "sync">("level");

  const handleActiveClick = (index: number) => {
     setSelectedActive(index);
  };

  const handlePCClick = (index: number) => {
     if (selectedActive !== null) {
        swapWithPC(selectedActive, index);
        setSelectedActive(null);
        showToast("Swapped with PC!");
     } else {
        showToast("Select a Party member to swap first.");
     }
  };
  
  const handleRelease = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    releaseFromPC(index);
    showToast("Mochiichao Released. Extracted Data Shard.");
    setHoveredPC(null);
  };

  let displayedPC = pc.map((p, originalIdx) => ({ ...p, originalIdx }));
  
  if (searchQuery) {
     displayedPC = displayedPC.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.species_id?.includes(searchQuery));
  }
  
  displayedPC.sort((a, b) => {
      if (sortBy === "level") return (b.battle_stats?.level || 0) - (a.battle_stats?.level || 0);
      if (sortBy === "sync") return (b.sync_level || 0) - (a.sync_level || 0);
      if (sortBy === "element") return (a.types?.[0] || "").localeCompare(b.types?.[0] || "");
      // Rarity
      const rScores: Record<string, number> = { "common": 1, "uncommon": 2, "rare": 3, "mythic": 4 };
      return (rScores[b.rarity || "common"] || 1) - (rScores[a.rarity || "common"] || 1);
  });

  const activeCharId = hoveredPC !== null && pc[hoveredPC] ? pc[hoveredPC].id : selectedActive !== null && active[selectedActive] ? active[selectedActive].id : null;
  const isPrismatic = hoveredPC !== null && pc[hoveredPC] ? pc[hoveredPC].is_prismatic : selectedActive !== null && active[selectedActive] ? active[selectedActive].is_prismatic : false;

  return (
    <div className="flex h-full gap-6 flex-col lg:flex-row">
      <div className="flex-1 bg-black/20 rounded-xl flex flex-col border border-white/5 overflow-hidden">
        <div className="h-48 border-b border-white/5 relative bg-gradient-to-t from-black/50 to-transparent flex-shrink-0">
           {activeCharId ? (
              <Canvas camera={{ position: [0, 2, 4], fov: 40 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 5]} intensity={2} />
                <Mochiichao characterId={activeCharId} isPrismatic={isPrismatic} emotion="IDLE" started={true} isIdle={true} />
                <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} />
              </Canvas>
           ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/30 font-mono text-xs uppercase">Select Entity</div>
           )}
           <div className="absolute bottom-2 left-2 pointer-events-none">
              <div className="text-white/50 text-[10px] uppercase tracking-widest bg-black/50 px-2 py-1 rounded">3D Engine Scan</div>
           </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
           <h3 className="text-white/70 font-mono uppercase mb-4 text-sm tracking-widest flex items-center justify-between">
             <span>Active Party</span>
             <span className="text-xs text-white/30">{active.length}/6</span>
           </h3>
           <div className="space-y-2">
             {active.map((char, i) => (
                <div key={i} onClick={() => handleActiveClick(i)} className={`p-3 bg-white/5 border ${selectedActive === i ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]' : 'border-white/10 hover:border-emerald-500/50'} rounded cursor-pointer transition-colors text-white text-sm flex justify-between`}>
                   <span>{char.name}</span>
                   <span className="text-white/30 text-xs">Lv.{char.battle_stats?.level || 1}</span>
                </div>
             ))}
           </div>
        </div>
      </div>
      <div className="flex-[2] bg-black/20 rounded-xl p-4 border border-white/5 overflow-y-auto relative flex flex-col">
        <h3 className="text-white/70 font-mono uppercase mb-4 text-sm tracking-widest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <div>
              <span>PC Storage Box</span>
              <span className="text-xs text-white/30 ml-2">{pc.length}/359</span>
           </div>
           <div className="flex items-center gap-2 text-xs">
              <div className="relative">
                 <Search size={14} className="absolute left-2 top-1.5 text-white/40" />
                 <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-black/50 border border-white/10 text-white pl-7 pr-2 py-1 rounded w-32 focus:outline-none focus:border-emerald-500/50"
                 />
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-black/50 border border-white/10 text-white px-2 py-1 rounded cursor-pointer uppercase tracking-widest">
                 <option value="level">Lvl</option>
                 <option value="rarity">Rarity</option>
                 <option value="element">Type</option>
                 <option value="sync">Sync</option>
              </select>
           </div>
        </h3>
        {selectedActive !== null && (
           <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase animate-pulse z-10 pointer-events-none">
              Select slot to swap
           </div>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 flex-1 content-start">
          {pc.length === 0 ? (
             <div className="col-span-full text-center text-white/30 py-10 font-mono text-sm">[ PC Box is Empty ]</div>
          ) : (
            displayedPC.map((char, i) => (
               <div key={char.originalIdx} 
                    onClick={() => handlePCClick(char.originalIdx)} 
                    onMouseEnter={() => setHoveredPC(char.originalIdx)}
                    onMouseLeave={() => setHoveredPC(null)}
                    className={`aspect-square bg-white/5 hover:bg-white/10 hover:border-blue-400/50 border ${hoveredPC === char.originalIdx ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/10'} rounded flex items-center justify-center text-xs text-center p-1 text-white/80 cursor-pointer transition-colors break-words flex-col relative group`}>
                  
                  {char.is_prismatic && <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse shadow-[0_0_5px_rgba(251,146,60,1)]" />}
                  <div className="flex-1 text-[10px] text-white/30 flex items-center justify-center uppercase font-mono">{char.id || char.species_id || '?'}</div>
                  <div className="h-5 leading-none overflow-hidden text-[9px] w-full">{char.name}</div>
                  
                  {hoveredPC === char.originalIdx && (
                     <button onClick={(e) => handleRelease(char.originalIdx, e)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-red-400 transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-white/20">
                        <X size={12} />
                     </button>
                  )}
               </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LogbookMenu() {
   const { world: { world_history } } = useGameStore();

   return (
      <div className="h-full flex flex-col gap-4">
        <h3 className="text-white/70 font-mono uppercase text-sm tracking-widest flex items-center justify-between border-b border-white/10 pb-2">
           <span>Memory Logbook</span>
        </h3>
        <div className="flex-1 overflow-y-auto pr-2">
          {(!world_history || world_history.length === 0) ? (
             <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                <Book size={48} opacity={0.5} />
                <p className="font-mono uppercase tracking-widest">[ No Logs Recorded ]</p>
             </div>
          ) : (
             <div className="space-y-4">
                {[...(world_history || [])].reverse().map((log, i) => (
                   <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-lg border-l-2 border-l-amber-500">
                      <p className="text-white/80 font-mono text-sm leading-relaxed">{log}</p>
                   </div>
                ))}
             </div>
          )}
        </div>
      </div>
   );
}

export function MochiiotecaMenu() {
   const { datalog, roster: { pc_box } } = useGameStore(s => s);
   
   return (
      <div className="h-full flex flex-col gap-4">
        <h3 className="text-white/70 font-mono uppercase text-sm tracking-widest flex items-center justify-between border-b border-white/10 pb-2">
           <span>Mochiioteca Registry</span>
           <span className="text-emerald-400">Caught: {datalog?.caught.length || 0} | Seen: {datalog?.seen.length || 0}</span>
        </h3>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
             {Array.from({ length: 359 }).map((_, i) => {
                const id = String(i + 1).padStart(3, '0');
                const isSeen = datalog?.seen.includes(id);
                const isCaught = datalog?.caught.includes(id) || pc_box.some(c => c.species_id === id); // fallback just in case
                
                return (
                   <div key={id} className={`aspect-square border rounded-lg flex flex-col items-center justify-center transition-all ${isCaught ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_10px_rgba(52,211,153,0.1)] cursor-pointer hover:bg-emerald-500/20 hover:scale-105' : isSeen ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-black/40 xl:grayscale xl:opacity-50'}`}>
                      <div className="text-[10px] font-mono text-white/50">{id}</div>
                      {isCaught ? (
                         <div className="flex-1 flex flex-col items-center justify-center w-full px-1">
                            <Database size={16} className="text-emerald-300 mb-1 opacity-50" />
                            <span className="text-[9px] text-emerald-400 font-bold truncate w-full text-center">CAUGHT</span>
                         </div>
                      ) : isSeen ? (
                         <div className="flex-1 flex flex-col items-center justify-center w-full px-1">
                            <span className="text-[9px] text-amber-500/80 font-bold truncate w-full text-center">SEEN</span>
                         </div>
                      ) : (
                         <div className="flex-1 flex items-center justify-center">
                            <span className="text-white/10 text-xl">?</span>
                         </div>
                      )}
                   </div>
                );
             })}
          </div>
        </div>
      </div>
   );
}
