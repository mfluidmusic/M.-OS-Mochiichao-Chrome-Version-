import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const LOG_FILE = path.join(process.cwd(), 'mochii_ecology_logs.json');

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([]));
}

export function startMochiimindDaemon(intervalMinutes = 5) {
  console.log(`[Mochiimind] Daemon started. Polling every ${intervalMinutes} minutes.`);

  setInterval(async () => {
    try {
      console.log("[Mochiimind] Waking up to process ecology...");
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the Mochiimind, the invisible gamemaster of the M. OS Bone universe.
Generate a short 1-sentence ecology event about野生 Mochiichao behavior.
Example: "A wild Razorgater was seen sharpening its claws on a basalt pillar in the Ancient Cave."
Reply with the event only.`
      });

      const eventText = response.text || "The Mochiimind contemplates the universe in silence.";
      
      const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
      logs.push({
        timestamp: new Date().toISOString(),
        event: eventText.trim()
      });

      // Keep only last 100 logs
      if (logs.length > 100) logs.shift();

      fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
      console.log(`[Mochiimind] Wrote ecological event: ${eventText.trim()}`);
      
    } catch (err) {
      console.error("[Mochiimind] Daemon error:", err);
    }
  }, intervalMinutes * 60 * 1000);
}
