import { callClaude } from './claudeClient.js';
import { SCENARIO_SYSTEM_PROMPT, SCENARIO_USER_PROMPT } from './prompts.js';
import { Scenario } from '../types/game.js';

export async function generateScenario(): Promise<Scenario> {
  const response = await callClaude(SCENARIO_SYSTEM_PROMPT, SCENARIO_USER_PROMPT, 4096);

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = response;
  const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];

  // Clean up potential issues
  jsonStr = jsonStr.trim();

  const scenario = JSON.parse(jsonStr) as Scenario;

  // Add side info to evidence
  scenario.prosecution_evidence.forEach(e => { e.side = 'prosecution'; });
  scenario.defense_evidence.forEach(e => { e.side = 'defense'; });

  return scenario;
}
