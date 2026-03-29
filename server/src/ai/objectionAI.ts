import { callClaude } from './claudeClient.js';
import { OBJECTION_SYSTEM_PROMPT } from './prompts.js';

export interface ObjectionRuling {
  score: number;
  sustained: boolean;
  comment: string;
}

export async function judgeObjection(
  targetContent: string,
  objectionType: string,
  objectionReason: string,
  publicEvidence: string[],
): Promise<ObjectionRuling> {
  const userMsg = `【対象の発言/証拠】
${targetContent}

【異議の種類】${objectionType}
【異議の理由】${objectionReason}

【公開証拠一覧】
${publicEvidence.length > 0 ? publicEvidence.join('\n') : 'なし'}`;

  const response = await callClaude(OBJECTION_SYSTEM_PROMPT, userMsg, 512);

  let jsonStr = response;
  const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];

  try {
    const result = JSON.parse(jsonStr.trim());
    return {
      score: result.score,
      sustained: result.score >= 7,
      comment: result.comment,
    };
  } catch {
    return {
      score: 5,
      sustained: false,
      comment: '...判断に迷いますが、却下とします。',
    };
  }
}
