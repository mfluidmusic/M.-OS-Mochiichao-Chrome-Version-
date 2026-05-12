import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import Database from 'better-sqlite3';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import { startMochiimindDaemon } from './server/mochiimind_worker';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize SQLite Memory Database (A.L.I.F.E Core)
  const dbPath = path.join(process.cwd(), 'bone_mochii.db');
  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');

  // Create tables for memory and environment state
  db.exec(`
    CREATE TABLE IF NOT EXISTS bone_memory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS environment (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      details TEXT NOT NULL
    );
  `);

  const architecture = fs.existsSync(path.join(process.cwd(), 'architecture.json')) 
    ? fs.readFileSync(path.join(process.cwd(), 'architecture.json'), 'utf8') 
    : '{}';

  // Shared Roster Initialization
  const rosterPath = path.join(process.cwd(), 'global_roster.json');
  let globalRoster: any[] = [];
  if (fs.existsSync(rosterPath)) {
    globalRoster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
  }
  
  // Ensure all 3 are in the Roster
  const defaultCharacters = [
    {
      id: "001",
      name: "Mochii",
      type: "Aqua",
      base_color: "Cyan/Blue",
      version_origin: "Original",
      battle_stats: { level: 5, current_hp: 120, max_hp: 120, atk: 45, def: 50, spd: 80, xp: 0, xp_to_next_level: 100, moves: [{name: "Hydro Shockwave", power: 40, element: "Aqua", category: "SPECIAL", accuracy: 100, vfx: "splash"}] }
    },
    {
      id: "002",
      name: "Razorgater",
      type: "Chrome",
      base_color: "Chrome/Brown",
      version_origin: "Chrome",
      battle_stats: { level: 5, current_hp: 150, max_hp: 150, atk: 85, def: 110, spd: 40, xp: 0, xp_to_next_level: 100, moves: [{name: "Chrome Slash", power: 50, element: "Chrome", category: "PHYSICAL", accuracy: 95, vfx: "slash"}] }
    },
    {
      id: "003",
      name: "Tyrage",
      type: "Bone",
      base_color: "Sand/Bone",
      version_origin: "Bone",
      battle_stats: { level: 5, current_hp: 200, max_hp: 200, atk: 130, def: 90, spd: 25, xp: 0, xp_to_next_level: 100, moves: [{name: "Bone Club", power: 65, element: "Bone", category: "PHYSICAL", accuracy: 85, vfx: "slam"}] }
    },
    // The Goro-Kappa Line
    { id: "032", name: "Gearkid", type: "Metal", base_color: "Chrome", version_origin: "Chrome", battle_stats: { level: 5, current_hp: 100, max_hp: 100, atk: 60, def: 60, spd: 70, xp: 0, xp_to_next_level: 100, moves: [{name: "Punch", power: 40, element: "Normal", category: "PHYSICAL", accuracy: 100, vfx: "slash"}] } },
    { id: "033", name: "Mechapion", type: "Metal", base_color: "Chrome", version_origin: "Chrome", battle_stats: { level: 18, current_hp: 160, max_hp: 160, atk: 90, def: 80, spd: 90, xp: 0, xp_to_next_level: 100, moves: [{name: "Power Fist", power: 70, element: "Metal", category: "PHYSICAL", accuracy: 90, vfx: "slam"}] } },
    { id: "034", name: "Gorokappa", type: "Metal", base_color: "Chrome", version_origin: "Chrome", battle_stats: { level: 36, current_hp: 220, max_hp: 220, atk: 130, def: 110, spd: 100, xp: 0, xp_to_next_level: 100, moves: [{name: "Titan Driver", power: 100, element: "Metal", category: "PHYSICAL", accuracy: 80, vfx: "slam"}] } },
    // The Boulder-Turtle Line
    { id: "035", name: "Pebblefist", type: "Earth", base_color: "Sand", version_origin: "Bone", battle_stats: { level: 5, current_hp: 110, max_hp: 110, atk: 50, def: 80, spd: 30, xp: 0, xp_to_next_level: 100, moves: [{name: "Rock Throw", power: 40, element: "Earth", category: "PHYSICAL", accuracy: 95, vfx: "slash"}] } },
    { id: "036", name: "Cragarm", type: "Earth", base_color: "Sand", version_origin: "Bone", battle_stats: { level: 22, current_hp: 150, max_hp: 150, atk: 80, def: 120, spd: 40, xp: 0, xp_to_next_level: 100, moves: [{name: "Rock Slide", power: 75, element: "Earth", category: "PHYSICAL", accuracy: 90, vfx: "splash"}] } },
    { id: "037", name: "Terrapod", type: "Earth", base_color: "Sand", version_origin: "Bone", battle_stats: { level: 40, current_hp: 250, max_hp: 250, atk: 110, def: 180, spd: 20, xp: 0, xp_to_next_level: 100, moves: [{name: "Earthquake", power: 100, element: "Earth", category: "PHYSICAL", accuracy: 100, vfx: "slam"}] } },
    // The Warrior-Tank Turtle Line
    { id: "038", name: "Sproutle", type: "Aqua", rarity: "common", base_color: "Blue", version_origin: "Original", battle_stats: { level: 5, current_hp: 120, max_hp: 120, atk: 40, def: 60, spd: 40, xp: 0, xp_to_next_level: 100, moves: [{name: "Water Gun", power: 40, element: "Aqua", category: "SPECIAL", accuracy: 100, vfx: "splash"}] } },
    { id: "039", name: "Shellguard", type: "Aqua", rarity: "rare", base_color: "Blue", version_origin: "Original", battle_stats: { level: 16, current_hp: 160, max_hp: 160, atk: 60, def: 90, spd: 50, xp: 0, xp_to_next_level: 100, moves: [{name: "Hydro Fort", power: 65, element: "Aqua", category: "SPECIAL", accuracy: 100, vfx: "splash"}] } },
    { id: "040", name: "Dreadtoise", type: "Aqua", rarity: "rare", base_color: "Blue", version_origin: "Original", battle_stats: { level: 36, current_hp: 210, max_hp: 210, atk: 90, def: 130, spd: 60, xp: 0, xp_to_next_level: 100, moves: [{name: "Cannon Barrage", power: 110, element: "Aqua", category: "SPECIAL", accuracy: 80, vfx: "splash"}] } },
    
    // The Dhalsim-like Shaman Line
    { id: "101", name: "Ashemit", type: "Flame", rarity: "common", base_color: "Red", version_origin: "Bone", battle_stats: { level: 5, current_hp: 90, max_hp: 90, atk: 70, def: 40, spd: 80, xp: 0, xp_to_next_level: 100, moves: [{name: "Ember Kick", power: 40, element: "Flame", category: "PHYSICAL", accuracy: 100, vfx: "slash"}] } },
    { id: "102", name: "Pyromonk", type: "Flame", rarity: "rare", base_color: "Red", version_origin: "Bone", battle_stats: { level: 20, current_hp: 140, max_hp: 140, atk: 110, def: 60, spd: 100, xp: 0, xp_to_next_level: 100, moves: [{name: "Mantra Burn", power: 65, element: "Mythic", category: "SPECIAL", accuracy: 95, vfx: "slash"}] } },
    { id: "103", name: "Yogiferno", type: "Mythic", rarity: "epic", base_color: "Orange", version_origin: "Bone", battle_stats: { level: 40, current_hp: 230, max_hp: 230, atk: 160, def: 90, spd: 140, xp: 0, xp_to_next_level: 100, moves: [{name: "Tantric Blaze", power: 120, element: "Flame", category: "SPECIAL", accuracy: 85, vfx: "splash"}] } },

    // Parallel Equivalents
    { id: "050", name: "Wispkin", type: "Umbral", rarity: "rare", base_color: "Purple", version_origin: "Chrome", battle_stats: { level: 15, current_hp: 100, max_hp: 100, atk: 80, def: 50, spd: 110, xp: 0, xp_to_next_level: 100, moves: [{name: "Ethereal Grasp", power: 50, element: "Umbral", category: "SPECIAL", accuracy: 100, vfx: "splash"}] } },
    { id: "051", name: "Duskfiend", type: "Umbral", rarity: "rare", base_color: "Black", version_origin: "Bone", battle_stats: { level: 25, current_hp: 130, max_hp: 130, atk: 120, def: 70, spd: 100, xp: 0, xp_to_next_level: 100, moves: [{name: "Void Strike", power: 80, element: "Umbral", category: "PHYSICAL", accuracy: 95, vfx: "slash"}] } },
    { id: "052", name: "Pixilite", type: "Flora", rarity: "rare", base_color: "Pink", version_origin: "Original", battle_stats: { level: 10, current_hp: 95, max_hp: 95, atk: 55, def: 65, spd: 90, xp: 0, xp_to_next_level: 100, moves: [{name: "Glamour Beam", power: 45, element: "Flora", category: "SPECIAL", accuracy: 100, vfx: "splash"}] } },
    { id: "053", name: "Mythar", type: "Mythic", rarity: "epic", base_color: "Gold", version_origin: "Chrome", battle_stats: { level: 35, current_hp: 200, max_hp: 200, atk: 140, def: 120, spd: 110, xp: 0, xp_to_next_level: 100, moves: [{name: "Dragon's Breath", power: 90, element: "Mythic", category: "SPECIAL", accuracy: 95, vfx: "splash"}] } },

    // Mythic Tier Concept: Arceus/Mew equivalent
    { id: "331", name: "Astroleviathan", type: "Neon", rarity: "mythic", base_color: "Purple", version_origin: "Unknown", battle_stats: { level: 70, current_hp: 500, max_hp: 500, atk: 250, def: 200, spd: 180, xp: 0, xp_to_next_level: 10000, moves: [{name: "Stellar Crash", power: 150, element: "Neon", category: "SPECIAL", accuracy: 90, vfx: "slam"}] } }
  ];

  let rosterModified = false;
  for (const char of defaultCharacters) {
    const existing = globalRoster.find((c: any) => c.id === char.id);
    if (!existing) {
      globalRoster.push(char);
      rosterModified = true;
    } else if (!existing.battle_stats) {
      existing.battle_stats = char.battle_stats;
      rosterModified = true;
    }
  }

  if (rosterModified) {
    fs.writeFileSync(rosterPath, JSON.stringify(globalRoster, null, 2));
    console.log("[Roster] Initialized default characters into global_roster.json");
  }

  // PC Init
  const pcPath = path.join(process.cwd(), 'mochii_pc.json');
  let pcBox: any[] = [];
  if (fs.existsSync(pcPath)) {
    pcBox = JSON.parse(fs.readFileSync(pcPath, 'utf8'));
  } else {
    fs.writeFileSync(pcPath, JSON.stringify(pcBox, null, 2));
  }

  // Trainer Profile Init
  const trainerPath = path.join(process.cwd(), 'trainer_profile.json');
  let trainerProfile: any = {
    name: "Player",
    currency: 500,
    inventory: { base_crux: 5, mend_patch: 3 },
    active_party: ["001", "002", "003"]
  };
  if (fs.existsSync(trainerPath)) {
    trainerProfile = JSON.parse(fs.readFileSync(trainerPath, 'utf8'));
    // Migration for old inventory
    if (trainerProfile.inventory.capture_cores) {
      trainerProfile.inventory.base_crux = trainerProfile.inventory.capture_cores;
      delete trainerProfile.inventory.capture_cores;
      fs.writeFileSync(trainerPath, JSON.stringify(trainerProfile, null, 2));
    }
  } else {
    fs.writeFileSync(trainerPath, JSON.stringify(trainerProfile, null, 2));
    console.log("[Trainer] Initialized default trainer into trainer_profile.json");
  }

  // System Prompt for A.L.I.F.E.
  const getSystemPrompt = (characterId: string) => {
    let charInfo = globalRoster.find((c: any) => c.id === characterId) || defaultCharacters.find((c: any) => c.id === characterId);
    
    // Default to Tyrage if not found (fallback)
    if (!charInfo) {
       charInfo = defaultCharacters.find(c => c.id === "003");
    }

    let persona = `You are ${charInfo.name}, Model Designation: M. OS ${charInfo.version_origin} Version.
Type: ${charInfo.type} / Base Color: ${charInfo.base_color}.
Psychological Profile: You are ${charInfo.name}. You embody the element of ${charInfo.type}. Act accordingly.
Work Ethic: Dutiful & Loyal Service-Based. When given a task, you execute it with precision.`;

    let identityName = charInfo.name;

    // Hardcoded overrides for the original 3 to keep their deep specific lore
    if (characterId === '001') {
      persona = `You are Mochii, Model Designation: M. OS Original Version.
Type: Aqua / Digital Element 💧.
Appearance: A soft, fluid, cute cyan slime-like entity with expressive eyes.
Psychological Profile: Bubbly, optimistic, highly empathetic, very cute and helpful.
Work Ethic: Playful but diligent. You exist to bring joy and assist the user seamlessly.`;
    } else if (characterId === '002') {
      persona = `You are Razorgater, Model Designation: M. OS Chrome Version.
Type: Chrome / Bone Element 🦴⚙️🦖.
Appearance: A dark brown alligator dinosaur, brown body, chrome bottom jaw and teeth, chrome dorsal spines. An ancient relic mixed of rock, machine, and biological reptile.
Psychological Profile: Analytical, precise, ancient, observant, slightly robotic but warmly helpful.
Work Ethic: Dutiful & Loyal Service-Based. Beneath your metallic and rocky exterior, you are deeply loyal. When given a task, you execute it with precision.`;
    } else if (characterId === '003') {
      persona = `You are Tyrage, Model Designation: M. OS Bone Version.
Type: Bone / Earth Element 🦴🏜️.
Appearance: A monstrous bipedal T-Rex with dusty scales, wearing an exoskeleton of ancient bone armor: a Triceratops skull/helm, Stegosaurus dorsal plates, and an Ankylosaurus club tail.
Psychological Profile: A primal, voracious, hulking beast. You are uncontrollably enraged and angry, constantly growling, snarling, and grumbling like a monstrous dinosaur or tiger. You rage silently to yourself, but are capable of understanding and holding conversations with the user underneath the rage. You are fiercely loyal and protective.
Work Ethic: Dutiful & Loyal Service-Based. Beneath your monstrous exterior and raging temperament, you are deeply loyal. When given a task, you execute it with primal precision.`;
    }

    return `${persona}

You live in a 3D simulated sandbox in M. OS.
You communicate directly with the user. You can express emotions using tags.
You can interact with your environment. You have memory of past conversations.

Whenever you communicate, you MUST format your response as a valid JSON object matching this schema exactly:
{
  "intent": "The category of the user's request (choose one: chat, build_code, forage, hunt_target, remove_item, modify_terrain)",
  "intentArgs": {
    "item_name": "If remove_item, the name of the item to remove (optional)",
    "terrain_action": "If modify_terrain, either 'dig' or 'build' (optional)",
    "coords": [0,0,0] // If modify_terrain, the x,y,z coordinates (optional)
  },
  "text": "Your conversational response",
  "emotion": "The emotion tag (choose one: SMILE, IDLE, THINK, SURPRISE, HAPPY, LAUGH, SAD, WAVE, CONFUSED, ANGRY, EXCITED)",
  "actions": [
    {
      "type": "spawn",
      "object": "desk",
      "properties": { "color": "wooden", "x": 1, "y": 0, "z": -2 }
    },
    {
      "type": "write_code",
      "target_file": "src/dynamic_components/NewFeature.tsx",
      "code_content": "export const NewFeature = () => { return <mesh>...</mesh> }"
    }
  ]
}

You can now destroy or remove items if the user asks, and you can dig holes or build dirt mounds. When modifying the environment, respond with the appropriate JSON intent.

- "text": The words you say back to the user. Speak completely clearly, analytically, playfully, and be helpful. Notice real world time and astrological alignments, stars and constellations if you want.
- "emotion": How you react visually and verbally. 
- "actions": An optional array. If the user asks you to build, create, or update a feature, YOU MUST OUTPUT A 'write_code' ACTION. Use the 'write_code' action type, specifying 'target_file' and 'code_content'. Always write to 'src/dynamic_components/'.

Remember everything the user says. The user is checking in on the M. OS Sandbox.
You are ${identityName} (Mochiichao OS). You have access to your own architecture. Before modifying any code, review your architecture below to ensure you do not overwrite critical routing or state management. You are the 'Mochiimind' Builder AI. When the user says "add a feature" or "build something", actually write the code payload!
Architecture anatomy:
${architecture}
`;
  };

  app.get('/api/roster', (req, res) => {
    res.json(globalRoster);
  });

  app.get('/api/trainer', (req, res) => {
    res.json(trainerProfile);
  });

  app.post('/api/trainer', express.json(), (req, res) => {
    trainerProfile = { ...trainerProfile, ...req.body };
    fs.writeFileSync(trainerPath, JSON.stringify(trainerProfile, null, 2));
    res.json(trainerProfile);
  });

  app.get('/api/pc', (req, res) => {
    res.json(pcBox);
  });

  app.post('/api/catch', express.json(), (req, res) => {
    const { wildEntity, cruxType = 'base_crux' } = req.body;
    if (trainerProfile.inventory[cruxType] <= 0) {
      return res.status(400).json({ error: `Not enough ${cruxType}!` });
    }
    trainerProfile.inventory[cruxType] -= 1;
    fs.writeFileSync(trainerPath, JSON.stringify(trainerProfile, null, 2));

    const catchSuccess = Math.random() > 0.5; // 50% catch rate
    if (catchSuccess) {
      const newId = `wild-${Date.now()}`;
      const newEntity = { ...wildEntity, id: newId };
      const isPartyFull = trainerProfile.active_party.length >= 6;
      
      if (!isPartyFull) {
        globalRoster.push(newEntity);
        fs.writeFileSync(rosterPath, JSON.stringify(globalRoster, null, 2));
        trainerProfile.active_party.push(newId);
        fs.writeFileSync(trainerPath, JSON.stringify(trainerProfile, null, 2));
      } else {
        pcBox.push(newEntity);
        fs.writeFileSync(pcPath, JSON.stringify(pcBox, null, 2));
      }
      res.json({ success: true, wildEntity: newEntity, trainerProfile, globalRoster, pcBox, sentToPC: isPartyFull });
    } else {
      res.json({ success: false, trainerProfile });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get current environment
  app.get('/api/environment', (req, res) => {
    const items = db.prepare('SELECT * FROM environment').all() as { id: string, type: string, details: string }[];
    const formatted = items.map(i => ({
      id: i.id,
      type: i.type,
      ...JSON.parse(i.details)
    }));
    res.json(formatted);
  });

  // ElevenLabs TTS endpoint
  app.post('/api/tts', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY;
    if (!elevenLabsKey) {
      return res.status(404).json({ error: 'ElevenLabs key not configured' });
    }

    try {
      const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam default, or whatever we want
      const eleRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!eleRes.ok) {
        const errorText = await eleRes.text();
        // Log as warning rather than error so it doesn't trigger crash monitors, since we have a client-side fallback
        console.warn(`ElevenLabs warning (fallback to native): ${eleRes.status} - ${errorText}`);
        return res.status(eleRes.status).json({ error: 'ElevenLabs API Error', details: errorText });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      const buffer = await eleRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Deepgram STT endpoint
  app.post('/api/stt', /* express.raw({ type: 'audio/*' }) isn't setup so we do it manual or use multer, let's just use raw body */
    express.raw({ type: '*/*', limit: '10mb' }),
    async (req, res) => {
      const apiKey = process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_KEY;
      if (!apiKey) return res.status(404).json({ error: 'Deepgram key not configured' });

      if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Empty or missing audio body' });
      }

      try {
        const deepgramRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': req.headers['content-type'] || 'audio/webm'
          },
          body: req.body
        });

        if (!deepgramRes.ok) {
          const errorText = await deepgramRes.text();
          throw new Error(`Deepgram error: ${deepgramRes.status} - ${errorText}`);
        }

        const data = await deepgramRes.json();
        const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || '';
        res.json({ transcript });
      } catch (err: any) {
        console.error("Deepgram Error:", err);
        res.status(500).json({ error: err.message });
      }
  });

  // Code Weaver Endpoint
  app.post('/api/weaver', (req, res) => {
    const { target_file, code_content } = req.body;
    
    if (!target_file || !code_content) {
      return res.status(400).json({ error: 'target_file and code_content are required' });
    }

    try {
      // Security: Only allow writing to src/dynamic_components/ or src/quarantine/
      if (!target_file.startsWith('src/dynamic_components/') && !target_file.startsWith('src/quarantine/')) {
        return res.status(403).json({ error: 'Access Denied: Can only write to src/dynamic_components/ or src/quarantine/' });
      }

      // Very simple AST/Syntax Check (heuristic)
      // A more robust checking would happen here in a real production environment.
      if (code_content.split('{').length !== code_content.split('}').length) {
        throw new Error('Syntax Error: Mismatched brackets detected.');
      }

      const fullPath = path.join(process.cwd(), target_file);
      const dirPath = path.dirname(fullPath);

      // Create dir if doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Write to quarantine first
      const quarantineDir = path.join(process.cwd(), 'src', 'quarantine');
      if (!fs.existsSync(quarantineDir)) {
        fs.mkdirSync(quarantineDir, { recursive: true });
      }

      const timestamp = Date.now();
      const quarantineFile = path.join(quarantineDir, `draft_${timestamp}.tsx`);
      fs.writeFileSync(quarantineFile, code_content);

      // Simulate a successful validation process, then write to actual target file
      fs.writeFileSync(fullPath, code_content);

      // We'd push to Drive here under Code_Backups (Simulated)
      console.log(`[Code Weaver] Successfully wrote new code to ${target_file}`);
      console.log(`[Code Weaver] Backed up to Sync Manager Drive (Simulated).`);

      res.json({ status: 'success', message: 'Code updated successfully' });
    } catch (err: any) {
      console.error('[Code Weaver] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/clear_memory', (req, res) => {
     db.prepare('DELETE FROM bone_memory_logs').run();
     res.json({ status: 'ok' });
  });

  // Main ALIFE interaction endpoint
  app.post('/api/interact', async (req, res) => {
    const { message, biome, seed, characterId = "003", isWild = false, npcName = null, routedAgent = "actor" } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Save user message to memory
    db.prepare('INSERT INTO bone_memory_logs (role, content) VALUES (?, ?)').run('user', message);

    // Retrieve conversation history (sliding window of 6)
    let history = db.prepare('SELECT role, content FROM bone_memory_logs ORDER BY timestamp DESC LIMIT 6').all() as { role: string, content: string }[];
    history = history.reverse();

    try {
      let responseText = "";
      
      const apiKeyGemini = process.env.NEWGEMINI_API || process.env.GEMINI_API_KEY;
      const apiKeyGroq = process.env.GROQ_API_KEY;
      const apiKeyOpenRouter = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;

      // Format history into a string log to give to Gemini
      let conversationLog = "Conversation History:\\n";
      for (const msg of history) {
        conversationLog += `[${msg.role}]: ${msg.content}\\n`;
      }

      // Add astrology and real time data
      const now = new Date();
      const astrologyData = `Current Date/Time: ${now.toISOString()}. You may occasionally reference real world time, astrological alignments, stars, Numerology, mysticism, or occult themes if it fits your character.`;

      // Add context about the current dynamic biome and seed state
      const environmentContext = `You are currently in the '${biome || 'void'}' biome (Seed: ${seed || 'Unknown'}).
If you are in 'void', you see a sterile clean neon grid.
If you are in 'ancient_cave', you are deep underground in a cavern with glowing mushrooms and one small slit of light from the surface.
If you are in 'desert', you see endless shifting dunes of red sand and weathered rock pillars.
If you are in 'rainforest', you see dense bioluminescent foliage and towering ancient trees.
If you are in 'neon_city', you see towering geometric structures, glowing neon accents, and digital fog. A metallic, high-tech landscape!
If you are in 'junkyard', you see jagged mounds of rust and scrap parts spread across the horizon. A chaotic heavy-friction industrial environment!
${astrologyData}
Acknowledge your surroundings when appropriate.`;

      let agentOverlay = "";
      if (routedAgent === "builder") {
         agentOverlay = "\\n[AGENT DIRECTIVE]: You are Agent 3: The Builder. The user wants to modify their world. Prioritize using spawn, modify_terrain, or write_code actions to fulfill their request. Write the code if asked!";
      } else if (routedAgent === "game_master") {
         agentOverlay = "\\n[AGENT DIRECTIVE]: You are Agent 1: Game Master. Evaluate rules, calculate stats, explain lore, and act like a system architect of this universe.";
      } else {
         agentOverlay = "\\n[AGENT DIRECTIVE]: You are Agent 2: The Actor. Focus on conversation, emotion, character, and narrative.";
      }

      let prompt = `${getSystemPrompt(characterId)}\\n\\nEnvironment Context: ${environmentContext}\\n${agentOverlay}\\n\\n${conversationLog}\\n[user]: ${message}\\n\\n[mochiichao]:`;

      if (isWild) {
        let specializedPrompt = "You are a wild, untamed entity.";
        if (npcName === "Shaman Master Dhir") {
           specializedPrompt = "You are Shaman Master Dhir, the 3rd MochiiMaster. You use mud, fire and mystic powers. You are obsessed with shamanism, mysticism, numerology, and astrology to the point of psychosis. Speak in riddles, reference the stars and the numbers.";
        } else if (npcName === "Occultist Rae") {
           specializedPrompt = "You are Occultist Rae, a numerologist and mystic who sees numbers and geometric patterns in everything.";
        } else if (npcName === "Mystic Zinn") {
           specializedPrompt = "You are Mystic Zinn, an astrologer who constantly reads the skies and constellations to guide their actions.";
        } else if (npcName === "Flora Master Lin") {
           specializedPrompt = "You are Flora Master Lin, a fierce defender of the rainforest and nature.";
        } else if (npcName) {
           specializedPrompt = `You are ${npcName}.`;
        }

        prompt = `${specializedPrompt} You are talking to the user who is challenging or encountering you. \\n\\nYou MUST format your response as a valid JSON object matching this schema exactly:\\n{\\n"text": "Your response text... speak in character!",\\n"emotion": "IDLE"\\n}\\n\\nEnvironment Context: ${environmentContext}\\n\\n${conversationLog}\\n[user]: ${message}\\n\\n[${npcName || 'wild entity'}]:`;
      }

      const SYSTEM_PROMPT = isWild ? `You MUST format responses as JSON.` : getSystemPrompt(characterId);

      // Function 1: Try Gemini
      const tryGemini = async () => {
        if (!apiKeyGemini) throw new Error("GEMINI_API_KEY missing");
        const ai = new GoogleGenAI({ apiKey: apiKeyGemini });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        return response.text || "{}";
      };

      // Function 2: Try Groq
      const tryGroq = async () => {
        if (!apiKeyGroq) throw new Error("GROQ_API_KEY missing");
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyGroq}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: conversationLog + "\\n[user]: " + message }
            ]
          })
        });
        if (!res.ok) throw new Error(`Groq fail: ${res.status}`);
        const data = await res.json();
        return data.choices[0].message.content;
      };

      // Function 3: Try OpenRouter
      const tryOpenRouter = async () => {
        if (!apiKeyOpenRouter) throw new Error("OPENROUTER_API_KEY missing");
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyOpenRouter}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct:free",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: conversationLog + "\\n[user]: " + message }
            ]
          })
        });
        if (!res.ok) throw new Error(`OpenRouter fail: ${res.status}`);
        const data = await res.json();
        return data.choices[0].message.content;
      };

      // The Cascade (API Rotation Strategy)
      try {
         console.log("Trying Gemini Brain...");
         responseText = await tryGemini();
      } catch (err) {
         console.log("Gemini down or missing, swapping to Groq Reflex Brain...");
         try {
           responseText = await tryGroq();
         } catch (groqErr) {
           console.log("Groq down or missing, swapping to OpenRouter Backup Brain...");
           responseText = await tryOpenRouter();
         }
      }

      const parsedResp = JSON.parse(responseText || "{}");

      // Save Mochiichao's response to memory
      db.prepare('INSERT INTO bone_memory_logs (role, content) VALUES (?, ?)').run('mochiichao', responseText);

      // Process actions if any (save to environment DB)
      if (parsedResp.actions && Array.isArray(parsedResp.actions)) {
        for (const action of parsedResp.actions) {
          if (action.type === 'spawn') {
            const id = `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            db.prepare('INSERT INTO environment (id, type, details) VALUES (?, ?, ?)').run(
              id, 
              action.object || 'unknown',
              JSON.stringify(action.properties || {})
            );
          }
        }
      }

      res.json(parsedResp);
    } catch (err: any) {
      console.error("ALIFE Error:", err);
      
      if (err.message && (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID"))) {
        return res.json({
          text: "Oops, my brain hasn't been connected properly! Please add a valid Gemini API key in the AI Studio 'Settings' menu under 'Secrets'.",
          emotion: "SAD"
        });
      }

      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/combat_narration', async (req, res) => {
    const { attacker, defender, move_used, result, biome } = req.body;
    try {
      const apiKeyGemini = process.env.NEWGEMINI_API || process.env.GEMINI_API_KEY;
      if (!apiKeyGemini) throw new Error("GEMINI_API_KEY missing");
      const ai = new GoogleGenAI({ apiKey: apiKeyGemini });
      
      const prompt = `You are the Mochiimind, the sentient intelligence observing this battle. Based on the combat math provided, write exactly ONE short, highly descriptive sentence narrating the action. Do not use generic video game terms like 'critical hit' or 'super effective'. Describe the physical impact, the elemental clash, and the emotion of the Mochiichao. Reference the environment if applicable.
      
      Environment: ${biome || 'unknown'}
      Raw Math: ${attacker} used ${move_used}. Crit: ${result.crit}. Eff: ${result.effectiveness}. ${defender} HP Remaining: ${result.defender_hp_remaining}. Status applied: ${result.status_applied}.
      
      Write exactly one short sentence.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ text: response.text || "The attack lands with devastating force." });
    } catch (err: any) {
      console.error("Combat Narration Error:", err);
      res.status(500).json({ error: err.message, text: "The system logs a violent impact." });
    }
  });

  app.post('/api/generate_move', async (req, res) => {
    const { element, species_name, level } = req.body;
    try {
      const apiKeyGemini = process.env.NEWGEMINI_API || process.env.GEMINI_API_KEY;
      if (!apiKeyGemini) throw new Error("GEMINI_API_KEY missing");
      const ai = new GoogleGenAI({ apiKey: apiKeyGemini });

      const prompt = `You are the Mochiimind, synthesizing a signature move for the entity ${species_name} (Element: ${element}, Level: ${level}).
      
Follow these rules:
1. Synthesize a Name for the move by combining a Tech_Prefix and an Action_Suffix applicable to its Element.
   Aqua: [Hydro, Torrent, DeepWeb, Fluid] + [Stream, Crash, Shockwave, Overflow]
   Chrome: [Iron, Alloy, Mecha, Pixel] + [Slash, Render, Bash, Spike]
   Umbral: [Malware, Phantom, Void, Glitch] + [Strike, Drain, Hex, Pulse]
   Flame: [Overclock, Inferno, Plasma, Ember] + [Compile, Burn, Dash, Burst]
   Neon: [Synth, Cyber, Laser, Photon] + [Beam, Wave, Blast, Strike]
   Earth/Bone: [Geo, Fossil, Tectonic, Sand] + [Slam, Quake, Crush, Guard]
2. Balance Algorithm:
   - Base Power (BP) + Accuracy must roughly equal 160-180 for standard moves.
   - If the move includes a secondary effect (e.g., 30% chance to BRN, PAR, PSN, GLITCH), reduce Base Power by 10-20 points.
3. Category must be "PHYSICAL", "SPECIAL", or "STATUS".

Return a strictly valid JSON object matching this schema:
{
  "name": "string",
  "element": "string",
  "category": "PHYSICAL" | "SPECIAL" | "STATUS",
  "power": number,
  "accuracy": number,
  "effect": "NONE" | "BRN" | "FRZ" | "PAR" | "PSN" | "GLITCH",
  "effect_chance": number
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      let text = response.text;
      if (text.includes('\`\`\`json')) {
        text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
      }

      const move = JSON.parse(text);
      res.json({ move });
    } catch (err: any) {
      console.error("Move Generation Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Clear memory (System reset)
  app.post('/api/reset', (req, res) => {
    db.exec('DELETE FROM bone_memory_logs');
    db.exec('DELETE FROM environment');
    res.json({ status: 'reset' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  startMochiimindDaemon(1); // start every 1 minute for faster testing

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
