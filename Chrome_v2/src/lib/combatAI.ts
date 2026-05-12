import { ActionData, ElementType, MochiiInstance } from "../types";
import { getEffectiveness } from "./mos_systems";

export function calculateAIScore(
  move: ActionData,
  attacker: MochiiInstance,
  defender: MochiiInstance,
  defenderTypes: ElementType[]
) {
  let score = 100;

  // 1. Effectiveness
  const effectiveness = getEffectiveness(move.element, defenderTypes);
  if (effectiveness > 1) {
    score += 50;
  } else if (effectiveness > 0 && effectiveness < 1) {
    score -= 50;
  } else if (effectiveness === 0) {
    score -= 100;
  }

  // 2. Lethality (Estimate)
  const isPhysical = move.category === "PHYSICAL";
  // The system uses overclock_stats, inherent_values to calculate stats.
  // We'll approximate for AI:
  const a = isPhysical ? 40 : 40; 
  const d = isPhysical ? 40 : 40; 
  
  const estimatedDamage = Math.floor((((2 * attacker.level / 5 + 2) * move.base_power * (a / d)) / 50 + 2) * effectiveness);
  if (estimatedDamage >= defender.current_hp) {
    score += 100;
  }

  // 3. Status overlap
  if (move.category === "STATUS") {
    if (defender.primary_status !== "NONE") {
      score -= 80;
    }
  }

  return score;
}

export function pickBestMove(
  moves: ActionData[],
  attacker: MochiiInstance,
  defender: MochiiInstance,
  defenderTypes: ElementType[]
) {
  let bestScore = -9999;
  let bestMove = moves[0];

  for (const move of moves) {
    const score = calculateAIScore(move, attacker, defender, defenderTypes);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
