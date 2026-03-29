import { callClaude } from './claudeClient.js';
import { witnessSystemPrompt } from './prompts.js';
import { Witness } from '../types/game.js';

export async function askWitness(
  witness: Witness,
  conversationHistory: { role: string; content: string }[],
  question: string,
): Promise<string> {
  const system = witnessSystemPrompt(witness);
  const historyText = conversationHistory
    .map(h => `${h.role}: ${h.content}`)
    .join('\n');
  const userMsg = historyText
    ? `これまでのやり取り：\n${historyText}\n\n新しい質問：${question}`
    : `質問：${question}`;

  return callClaude(system, userMsg, 512);
}
