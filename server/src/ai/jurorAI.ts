import { callClaude } from './claudeClient.js';
import { jurorBatchReactionPrompt } from './prompts.js';
import { JurorState } from '../types/game.js';

interface JurorReaction {
  index: number;
  newVote: '有罪' | '無罪' | '変わらず';
  reason: string;
  comment: string;
  reaction: 'surprised' | 'convinced' | 'dismissive' | 'confused';
}

export async function getJurorReactions(
  jurors: JurorState[],
  event: string,
): Promise<JurorReaction[]> {
  const systemPrompt = jurorBatchReactionPrompt(
    jurors.map(j => ({
      name: j.name,
      nickname: j.nickname,
      type: j.type,
      description: j.description,
      currentVote: j.vote,
      currentReason: j.reason,
      moveCondition: j.moveCondition,
      persuadability: j.persuadability,
    })),
  );

  const response = await callClaude(systemPrompt, `以下の出来事が起きました：\n${event}`);

  let jsonStr = response;
  const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];
  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr) as JurorReaction[];
  } catch {
    // Fallback: no reactions
    return jurors.map((_, i) => ({
      index: i,
      newVote: '変わらず' as const,
      reason: '',
      comment: '...',
      reaction: 'neutral' as 'dismissive',
    }));
  }
}

export function applyReactions(
  jurors: JurorState[],
  reactions: JurorReaction[],
  currentTurn: number,
): { updatedJurors: JurorState[]; flippedIndices: number[] } {
  const flippedIndices: number[] = [];

  for (const reaction of reactions) {
    const juror = jurors[reaction.index];
    if (!juror || juror.locked) continue;

    if (reaction.newVote !== '変わらず' && reaction.newVote !== juror.vote) {
      juror.vote = reaction.newVote;
      flippedIndices.push(reaction.index);
    }
    if (reaction.reason) juror.reason = reaction.reason;
    if (reaction.comment) juror.comment = reaction.comment;
    juror.reaction = reaction.reaction || 'neutral';
  }

  return { updatedJurors: jurors, flippedIndices };
}

export function applyChainReactions(
  jurors: JurorState[],
  flippedIndices: number[],
): number[] {
  const chainFlips: number[] = [];

  for (const idx of flippedIndices) {
    // Check adjacent jurors (wrapping around)
    const adjacents = [
      (idx - 1 + jurors.length) % jurors.length,
      (idx + 1) % jurors.length,
    ];

    for (const adjIdx of adjacents) {
      const adj = jurors[adjIdx];
      if (adj.locked || flippedIndices.includes(adjIdx) || chainFlips.includes(adjIdx)) continue;

      // Base chain probability
      let prob = 0.15;
      if (adj.type === '流され屋') prob += 0.35;
      if (adj.type === '優柔不断') prob += 0.15;
      if (adj.persuadability >= 4) prob += 0.1;

      if (Math.random() < prob) {
        // Flip to match the juror that triggered the chain
        adj.vote = jurors[idx].vote;
        adj.comment = adj.type === '流され屋'
          ? `${jurors[idx].name}さんに同意...`
          : 'うーん、確かに...';
        adj.reaction = 'surprised';
        chainFlips.push(adjIdx);
      }
    }
  }

  return chainFlips;
}

export async function persuadeJuror(
  juror: JurorState,
  evidenceName: string,
  evidenceDescription: string,
  reason: string,
  side: 'prosecution' | 'defense',
): Promise<{ success: boolean; comment: string; reaction: string }> {
  const systemPrompt = `あなたは陪審員「${juror.name}（${juror.nickname}）」です。
タイプ：${juror.type}
性格：${juror.description}
現在の票：${juror.vote}
説得されやすい条件：${juror.moveCondition}
説得しやすさ：${'★'.repeat(juror.persuadability)}

${side === 'prosecution' ? '検察官' : '弁護人'}があなたを直接説得しようとしています。

以下のJSON形式のみで応答してください：
{
  "success": true or false,
  "comment": "キャラクターとしてのリアクション（30文字以内）",
  "reaction": "surprised | convinced | dismissive | confused"
}`;

  const userMsg = `証拠「${evidenceName}」：${evidenceDescription}\n説得理由：${reason}`;
  const response = await callClaude(systemPrompt, userMsg);

  let jsonStr = response;
  const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];

  try {
    return JSON.parse(jsonStr.trim());
  } catch {
    return { success: false, comment: '...よくわからない', reaction: 'confused' };
  }
}
