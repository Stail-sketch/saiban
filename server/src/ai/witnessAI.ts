import { callClaude } from './claudeClient.js';
import { witnessResponsePrompt } from './prompts.js';
import { Witness } from '../types/game.js';

export async function askWitness(
  witness: Witness,
  question: string,
): Promise<string> {
  const system = witnessResponsePrompt(witness);
  return callClaude(system, `質問：${question}`, 512);
}
