import { StatusCondition } from "../types";

export function calculateCatchSuccess(
  maxHP: number,
  currentHP: number,
  catchRate: number,
  cruxBonus: number, // Base = 1, Adv = 1.5, Ultra = 2
  status: StatusCondition
) {
  let statusBonus = 1.0;
  if (status === "SLP" || status === "FRZ") statusBonus = 2.5;
  if (status === "PAR" || status === "BRN" || status === "PSN" || status === "TOX" || status === "CRPT") statusBonus = 1.5;

  // Step 1: Calculate catch value A
  const a = Math.floor(((3 * maxHP - 2 * currentHP) * catchRate * cruxBonus * statusBonus) / (3 * maxHP));

  // Step 2: Guaranteed catch check
  if (a >= 255) return { caught: true, shakes: 3 };

  // Step 3: Calculate shake threshold B
  // B = 1048560 / sqrt(sqrt(16711680 / A))
  const b = Math.floor(1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / Math.max(1, a)))))));

  // Step 4: Execute up to 3 shake tests
  let shakes = 0;
  for (let i = 0; i < 3; i++) {
    const roll = Math.floor(Math.random() * 65536); // 0 to 65535
    if (roll < b) {
      shakes++;
    } else {
      break;
    }
  }

  return { caught: shakes === 3, shakes };
}
