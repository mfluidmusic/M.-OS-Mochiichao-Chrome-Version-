import { useGameStore } from './useGameStore';
import { PackageOpen, Map as MapIcon, Database } from 'lucide-react';
import { useState } from 'react';

// Added Settings, Map, Inventory interactions
export function SettingsMenu() {
   const { setUI, audio, setAudioSettings } = useGameStore();
   const [textSpeed, setTextSpeed] = useState('Fast');

   return (
      <div className="flex flex-col gap-6 text-white font-mono p-4">
         <div>
            <h3 className="text-white/70 uppercase tracking-widest text-sm mb-2">Master Volume: {Math.round(audio.master_vol * 100)}%</h3>
            <input type="range" min="0" max="100" value={audio.master_vol * 100} onChange={(e) => setAudioSettings({ master_vol: Number(e.target.value) / 100 })} className="w-full" />
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded">
               <span className="text-white/70">BGM</span>
               <input type="checkbox" checked={audio.bgm_enabled} onChange={(e) => setAudioSettings({ bgm_enabled: e.target.checked })} />
            </div>
            <div className="flex items-center justify-between bg-white/5 p-3 rounded">
               <span className="text-white/70">SFX</span>
               <input type="checkbox" checked={audio.sfx_enabled} onChange={(e) => setAudioSettings({ sfx_enabled: e.target.checked })} />
            </div>
            <div className="col-span-2 flex items-center justify-between bg-white/5 p-3 rounded">
               <span className="text-white/70">Entity Cries</span>
               <input type="checkbox" checked={audio.cries_enabled} onChange={(e) => setAudioSettings({ cries_enabled: e.target.checked })} />
            </div>
         </div>
         <div>
            <h3 className="text-white/70 uppercase tracking-widest text-sm mb-2">Text Speed</h3>
            <div className="flex gap-2">
               {['Slow', 'Med', 'Fast'].map(speed => (
                  <button key={speed} onClick={() => setTextSpeed(speed)} className={`flex-1 py-2 rounded border transition-colors ${textSpeed === speed ? 'bg-white text-black font-bold' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}>
                     {speed}
                  </button>
               ))}
            </div>
         </div>
         <div>
            <div className="flex justify-between items-end mb-2">
               <h3 className="text-white/70 uppercase tracking-widest text-sm">System Data (Save/Load)</h3>
            </div>
            
            <div className="space-y-2 mb-4">
               {[1, 2, 3].map(slot => (
                  <div key={slot} className="flex gap-2">
                     <button onClick={() => useGameStore.getState().loadFromSlot(slot)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors uppercase tracking-widest font-bold text-xs flex items-center justify-center gap-2">
                        <Database size={16} /> Load Slot {slot}
                     </button>
                     <button onClick={() => useGameStore.getState().saveToSlot(slot)} className="flex-1 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/20 transition-colors uppercase tracking-widest font-bold text-xs flex items-center justify-center gap-2">
                         Save Slot {slot}
                     </button>
                  </div>
               ))}
            </div>

            <h3 className="text-white/70 uppercase tracking-widest text-[10px] mb-2">Portable Backup</h3>
            <div className="flex gap-2">
               <button onClick={() => {
                  const stateStr = localStorage.getItem("mochiiverse-storage");
                  if (stateStr) {
                     const blob = new Blob([stateStr], { type: "application/json" });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `mochiiverse_save_data_${new Date().getTime()}.json`;
                     a.click();
                     URL.revokeObjectURL(url);
                  }
               }} className="flex-1 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-500/30 transition-colors uppercase tracking-widest font-bold text-xs flex items-center justify-center gap-2">
                  <Database size={16} /> Export JSON
               </button>
               <label className="flex-1 py-3 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 rounded hover:bg-fuchsia-500/30 transition-colors uppercase tracking-widest font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                  <PackageOpen size={16} /> Import JSON
                  <input type="file" accept=".json" className="hidden" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                           if (re.target?.result && typeof re.target.result === 'string') {
                              useGameStore.getState().loadState(re.target.result);
                              alert("Save Data Imported Successfully! Please refresh to ensure all engine visuals reset properly.");
                           }
                        };
                        reader.readAsText(file);
                     }
                  }} />
               </label>
            </div>
         </div>
         <div className="mt-8">
             <button onClick={() => {
                setUI("none");
             }} className="w-full py-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-colors uppercase tracking-widest font-bold">
                 Resume Game
             </button>
         </div>
      </div>
   );
}

export function MapMenu() {
   const { setUI } = useGameStore();
   return (
      <div className="h-full flex flex-col items-center justify-center relative p-8">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10 w-full h-full border-2 border-indigo-500/30 rounded-xl bg-indigo-950/20 backdrop-blur-sm p-4 overflow-hidden flex items-center justify-center">
             
             {/* Map Nodes */}
             <div className="absolute top-1/4 left-1/4 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform">
                <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] border-2 border-white"></div>
                <span className="mt-2 text-xs font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/50 px-2 py-1 rounded">Flora Dojo Hub</span>
             </div>
             
             <div className="absolute top-1/2 left-3/4 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform">
                <div className="w-4 h-4 bg-red-400 rounded-full shadow-[0_0_15px_rgba(248,113,113,0.5)] border-2 border-white"></div>
                <span className="mt-2 text-xs font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/50 px-2 py-1 rounded">Shaman Sanctuary</span>
             </div>

             <div className="absolute top-3/4 left-1/3 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform">
                <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] border-2 border-white"></div>
                <span className="mt-2 text-xs font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/50 px-2 py-1 rounded">Neon Grid Core</span>
             </div>

             <div className="absolute top-1/3 left-2/3 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform">
                <div className="w-5 h-5 bg-pink-400 rounded-full shadow-[0_0_20px_rgba(244,114,182,0.8)] border-2 border-white animate-pulse"></div>
                <span className="mt-2 text-xs font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/50 px-2 py-1 rounded">Merge Station Hub</span>
             </div>

             <div className="absolute top-1/6 left-1/2 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform" onClick={() => alert("The Neon Four Challenge awaits... (Simulated Entry)")}>
                <div className="w-6 h-6 bg-yellow-400 rounded-lg shadow-[0_0_25px_rgba(250,204,21,0.8)] border-2 border-white rotate-45"></div>
                <span className="mt-4 text-xs font-mono font-bold text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-yellow-500/30">The Neon Four (Semi-Final)</span>
             </div>

             <div className="absolute top-1/6 left-3/4 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform" onClick={() => alert("The ultimate Mauveville Tournament awaits... (Simulated Entry)")}>
                <div className="w-8 h-8 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.9)] border-4 border-white animate-pulse"></div>
                <span className="mt-4 text-xs font-mono font-bold text-red-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-red-500/30">Mauveville Tournament (Grand Finale)</span>
             </div>

             <div className="absolute top-5/6 left-5/6 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform" onClick={() => setUI("infinity_arcade")}>
                <div className="w-5 h-5 bg-purple-500 rounded-sm shadow-[0_0_20px_rgba(168,85,247,0.8)] border-2 border-white hexagon"></div>
                <span className="mt-2 text-xs font-mono font-bold text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-purple-500/30">The Infinity Arcade</span>
             </div>

             {/* Player Location Marker */}
             <div className="absolute top-1/2 left-1/2 flex flex-col items-center">
                <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
                <div className="w-3 h-3 bg-white rounded-full border-2 border-indigo-500 relative z-10"></div>
                <span className="mt-2 text-[10px] font-mono text-white/50 uppercase tracking-widest whitespace-nowrap">You Are Here</span>
             </div>
          </div>
      </div>
   );
}

export function InfinityArcadeMenu() {
   const { setUI, showToast, addCredits } = useGameStore();

   return (
      <div className="h-full flex flex-col items-center p-8 bg-black/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-30 mix-blend-screen" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-[150px] opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600 rounded-full blur-[150px] opacity-20 pointer-events-none" />

          <h2 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)] mt-8 mb-4 rotate-[-2deg] relative z-10">THE INFINITY ARCADE</h2>
          <p className="text-white/70 font-mono mb-12 relative z-10 text-center max-w-lg">
             Welcome to the simulation without end. Face off against procedurally generated Mochiichao champions and earn exclusive vanity items and credits.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
             <div className="bg-purple-900/40 border border-purple-500/50 p-6 rounded-xl hover:bg-purple-900/60 transition-colors flex flex-col items-center">
                <h3 className="text-xl font-bold text-white mb-2">Survival Protocol</h3>
                <p className="text-sm font-mono text-white/50 mb-4 text-center">Face an endless gauntlet of AI-generated opponents.</p>
                <button onClick={() => {
                   showToast("Booting Combat Sim... (Not fully implemented)");
                   setUI("none");
                }} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition-transform uppercase tracking-widest text-sm">
                   Initialize
                </button>
             </div>

             <div className="bg-cyan-900/40 border border-cyan-500/50 p-6 rounded-xl hover:bg-cyan-900/60 transition-colors flex flex-col items-center">
                <h3 className="text-xl font-bold text-white mb-2">Claim Rewards</h3>
                <p className="text-sm font-mono text-white/50 mb-4 text-center">Cash out your current Win Streak for CRUX and Mods.</p>
                <button onClick={() => {
                   showToast("Network Error: No active win streak detected.");
                }} className="px-6 py-2 border border-cyan-400 text-cyan-300 font-bold rounded shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-400/20 active:scale-95 transition-all uppercase tracking-widest text-sm">
                   Redeem
                </button>
             </div>
          </div>
      </div>
   );
}

export function MochiiMartMenu() {
   const { player, addItem, addCredits, showToast } = useGameStore();
   const [mode, setMode] = useState<"buy" | "sell">("buy");
   
   const shopItems = [
      { id: "base_crux", name: "Base CRUX", price: 100, desc: "Standard capture module." },
      { id: "omega_crux", name: "Omega CRUX", price: 1000, desc: "High-tier capture module." },
      { id: "mend_patch", name: "Mend Patch", price: 50, desc: "Restores 20 HP." },
      { id: "super_patch", name: "Super Patch", price: 150, desc: "Restores 50 HP." },
      { id: "max_patch", name: "Max Patch", price: 500, desc: "Fully restores HP." },
      { id: "antiviral", name: "Antiviral", price: 200, desc: "Cures all status conditions." },
      { id: "defrost_kit", name: "Defrost Kit", price: 100, desc: "Cures Freeze condition." },
      { id: "reboot_drive", name: "Reboot Drive", price: 800, desc: "Revives a fallen entity to 50% HP." }
   ];

   const handleBuy = (item: any) => {
      if (player.credits >= item.price) {
         addCredits(-item.price);
         addItem({ id: item.id, name: item.name, count: 1 });
         showToast(`Purchased ${item.name}!`);
      } else {
         showToast("Insufficient Credits.");
      }
   };

   const handleSell = (item: any) => {
      const shopRef = shopItems.find(s => s.id === item.id);
      const sellPrice = shopRef ? Math.floor(shopRef.price / 2) : 10;
      
      useGameStore.getState().tossItem(item.id);
      addCredits(sellPrice);
      showToast(`Sold ${item.name || item.id} for ${sellPrice} Credits.`);
   };

   return (
      <div className="h-full flex flex-col p-6 bg-slate-900/90 rounded-xl relative overflow-hidden text-sm">
         <div className="absolute inset-0 bg-blue-500/5 mix-blend-screen pointer-events-none" />
         
         <div className="flex justify-between items-end mb-6 border-b border-white/20 pb-4 relative z-10">
            <div>
               <h2 className="text-3xl font-black text-cyan-400 drop-shadow-md">MOCHIIMART</h2>
               <p className="text-white/50 font-mono text-xs uppercase tracking-widest">Global Network Exchange</p>
            </div>
            <div className="text-right">
               <p className="text-white/50 font-mono text-[10px] uppercase tracking-widest leading-none mb-1">Wallet Balance</p>
               <p className="text-2xl font-bold font-mono text-yellow-400 flex items-center justify-end gap-2 drop-shadow-md">
                  <span className="text-yellow-500">CR</span> {player.credits}
               </p>
            </div>
         </div>

         <div className="flex gap-4 mb-4 relative z-10">
            <button onClick={() => setMode("buy")} className={`px-6 py-2 pb-3 font-bold uppercase tracking-widest flex-1 rounded-lg ${mode === "buy" ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-black/50 text-white/50 border border-white/10'}`}>Buy</button>
            <button onClick={() => setMode("sell")} className={`px-6 py-2 pb-3 font-bold uppercase tracking-widest flex-1 rounded-lg ${mode === "sell" ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-black/50 text-white/50 border border-white/10'}`}>Sell</button>
         </div>

         <div className="flex-1 overflow-y-auto space-y-2 relative z-10 pr-2">
            {mode === "buy" && shopItems.map(item => (
               <div key={item.id} className="flex justify-between items-center bg-black/40 border border-white/10 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                     <h4 className="text-white font-bold">{item.name}</h4>
                     <p className="text-white/50 font-mono text-xs">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-yellow-400 font-mono font-bold">{item.price} CR</span>
                     <button onClick={() => handleBuy(item)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold rounded shadow-[0_0_10px_rgba(8,145,178,0.5)] transition-all border border-cyan-400/50">Buy 1</button>
                  </div>
               </div>
            ))}
            
            {mode === "sell" && (player.inventory.length === 0 ? (
               <div className="text-center text-white/30 font-mono mt-10">No items available to sell.</div>
            ) : player.inventory.map((item: any) => {
               const shopRef = shopItems.find(s => s.id === item.id);
               const sellPrice = shopRef ? Math.floor(shopRef.price / 2) : 10;
               return (
                  <div key={item.id} className="flex justify-between items-center bg-black/40 border border-white/10 p-3 rounded-lg hover:bg-white/5 transition-colors">
                     <div className="flex-1">
                        <h4 className="text-white font-bold flex gap-2 items-center">
                           <span>{item.name || item.id}</span>
                           <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white/70">x{item.count}</span>
                        </h4>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-yellow-500/70 font-mono font-bold">+{sellPrice} CR</span>
                        <button onClick={() => handleSell(item)} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold rounded shadow-[0_0_10px_rgba(217,119,6,0.5)] transition-all border border-amber-400/50">Sell 1</button>
                     </div>
                  </div>
               );
            }))}
         </div>
      </div>
   );
}
