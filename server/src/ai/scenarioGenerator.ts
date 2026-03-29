import { callClaude } from './claudeClient.js';
import { SCENARIO_SYSTEM_PROMPT, SCENARIO_USER_PROMPT } from './prompts.js';
import { Scenario } from '../types/game.js';

export async function generateScenario(): Promise<Scenario> {
  const response = await callClaude(SCENARIO_SYSTEM_PROMPT, SCENARIO_USER_PROMPT, 8000);

  let jsonStr = response;
  const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];
  jsonStr = jsonStr.trim();

  const scenario = JSON.parse(jsonStr) as Scenario;

  // Ensure testimony structure
  for (const witness of scenario.witnesses) {
    witness.testimony = witness.testimony.map((t, i) => ({
      ...t,
      index: i,
      pressed: false,
      broken: false,
    }));
  }

  // Ensure clues are not found
  for (const loc of scenario.investigation_locations) {
    for (const clue of loc.clues) {
      clue.found = false;
    }
  }

  return scenario;
}
