import { ElementType, StatusCondition } from "../types";
import { MochiiInstance } from "../useGameStore";

export function canApplyStatus(
  status: StatusCondition,
  targetElements: ElementType[]
): boolean {
  if (status === "BRN" && targetElements.includes("Flame")) return false;
  if (status === "PAR" && targetElements.includes("Electric")) return false; // Chrome immune too according to original spec, but let's stick to base
  if (status === "PAR" && targetElements.includes("Chrome")) return false;
  
  if (status === "PSN") {
    if (targetElements.includes("Chrome") || targetElements.includes("Poison")) return false;
  }
  
  if (status === "TOX") {
    // Biological poison. Cannot affect machines (Chrome/Digital/Metal). Let's assume Chrome/Metal/Digital are machines.
    if (targetElements.includes("Chrome") || targetElements.includes("Metal") || targetElements.includes("Digital")) return false;
  }

  if (status === "CRPT") {
    // Technical/Mechanical poison. Cannot affect biology (Flesh, Water, Earth, etc). Let's say it only affects Digital/Chrome/Metal
    // Wait, the prompt said: "crpt does not work on biology and tox does not work on machine"
    if (targetElements.includes("Flesh") || targetElements.includes("Aqua") || targetElements.includes("Earth")) return false;
  }

  return true;
}

export function handleStatusEffects(
  instance: MochiiInstance,
  maxHP: number,
  isPhysical: boolean
) {
  let damageTick = 0;
  let statusMessage = "";
  let canMove = true;
  let movePenalty = 1.0;

  switch (instance.status_condition) {
    case "BRN":
      damageTick = Math.floor(maxHP / 16);
      statusMessage = `${instance.name} is hurt by its burn!`;
      if (isPhysical) movePenalty = 0.5;
      break;
    case "PSN":
    case "TOX":
    case "CRPT":
      // PSN is standard 1/8. TOX/CRPT could be badly poisoned (N/16) but we'll use 1/8 as a baseline if we don't have a counter.
      damageTick = Math.floor(maxHP / 8);
      statusMessage = `${instance.name} is hurt by poison!`;
      break;
    case "FRZ":
      // 20% chance to thaw
      if (Math.random() < 0.20) {
        statusMessage = `${instance.name} thawed out!`;
        instance.status_condition = "NONE";
      } else {
        canMove = false;
        statusMessage = `${instance.name} is frozen solid!`;
      }
      break;
    case "PAR":
      // 25% chance to skip turn
      if (Math.random() < 0.25) {
        canMove = false;
        statusMessage = `${instance.name} is paralyzed! It can't move!`;
      }
      break;
    case "SLP":
      // We would track sleep turns, but keeping it simple
      if (Math.random() < 0.33) {
        statusMessage = `${instance.name} woke up!`;
        instance.status_condition = "NONE";
      } else {
        canMove = false;
        statusMessage = `${instance.name} is fast asleep.`;
      }
      break;
  }

  return { damageTick, statusMessage, canMove, movePenalty };
}
