export function useAIRouter(input: string) {
  // Simple heuristic router for Agent routing
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes("build") || lowerInput.includes("code") || lowerInput.includes("spawn") || lowerInput.includes("create")) {
    return "builder";
  } else if (lowerInput.includes("stats") || lowerInput.includes("calculate") || lowerInput.includes("lore") || lowerInput.includes("engine")) {
    return "game_master";
  } else {
    return "actor";
  }
}
