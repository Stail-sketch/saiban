import { Server } from 'socket.io';
import { GameRoom, JurorState, Phase, Player } from '../types/game.js';
import { generateScenario } from '../ai/scenarioGenerator.js';
import { selectRandomJurors, getInitialVote } from '../data/jurorTypes.js';
import { getJurorReactions, applyReactions, applyChainReactions } from '../ai/jurorAI.js';
import { getPlayersArray } from '../state/roomManager.js';
import { callClaude } from '../ai/claudeClient.js';
import { JUDGE_COMMENT_SYSTEM } from '../ai/prompts.js';

const MAX_HP = 5;

export function getPlayerByRole(room: GameRoom, role: string): Player | undefined {
  for (const p of room.players.values()) {
    if (p.role === role) return p;
  }
  return undefined;
}

export function filterScenarioForRole(room: GameRoom, role: string) {
  const s = room.scenario;
  if (!s) return null;

  const base = {
    case_title: s.case_title,
    case_type: s.case_type,
    summary: s.summary,
    defendant: s.defendant,
    prosecution_theory: s.prosecution_theory,
    defense_theory: s.defense_theory,
    witnesses: s.witnesses.map(w => ({
      name: w.name,
      occupation: w.occupation,
      relation: w.relation,
      personality: w.personality,
      testimony: w.testimony.map(t => ({
        index: t.index,
        text: t.text,
        pressed: t.pressed,
        broken: t.broken,
        // Don't expose challengeEvidenceId or isContradiction to clients!
      })),
    })),
  };

  if (role === 'prosecution') {
    return {
      ...base,
      myEvidence: s.prosecution_evidence.map(e => ({
        ...e,
        // Only show fake flag to owner
        fake: e.fake,
        fakeReason: e.fake ? e.fakeReason : undefined,
      })),
      openings: s.prosecution_openings,
      closings: s.prosecution_closings,
    };
  } else if (role === 'defense') {
    return {
      ...base,
      myEvidence: s.defense_evidence.map(e => ({
        ...e,
        fake: e.fake,
        fakeReason: e.fake ? e.fakeReason : undefined,
      })),
      openings: s.defense_openings,
      closings: s.defense_closings,
    };
  }
  return base;
}

export function getJurorsForClient(jurors: JurorState[]) {
  return jurors.map(j => ({
    index: j.index,
    name: j.name,
    nickname: j.nickname,
    type: j.type,
    vote: j.vote,
    reason: j.reason,
    comment: j.comment,
    reaction: j.reaction,
    locked: j.locked,
    persuadability: j.persuadability,
  }));
}

function getHpInfo(room: GameRoom) {
  const pros = getPlayerByRole(room, 'prosecution');
  const def = getPlayerByRole(room, 'defense');
  return {
    prosecution: pros?.hp ?? MAX_HP,
    defense: def?.hp ?? MAX_HP,
  };
}

export function damagePlayer(io: Server, room: GameRoom, role: 'prosecution' | 'defense', amount: number, reason: string) {
  const player = getPlayerByRole(room, role);
  if (!player) return;

  player.hp = Math.max(0, player.hp - amount);

  io.to(room.code).emit('hp-change', {
    role,
    hp: player.hp,
    maxHp: MAX_HP,
    damage: amount,
    reason,
  });

  const msg = {
    id: crypto.randomUUID(),
    sender: 'システム',
    senderRole: 'system' as const,
    content: `${role === 'prosecution' ? '検察' : '弁護'}の信用ゲージ -${amount}！（${reason}）残り: ${player.hp}/${MAX_HP}`,
    timestamp: Date.now(),
    type: 'hp_change' as const,
  };
  room.chatMessages.push(msg);
  io.to(room.code).emit('chat-message', msg);

  // Check for instant loss
  if (player.hp <= 0) {
    const winner = role === 'prosecution' ? 'defense' : 'prosecution';
    io.to(room.code).emit('instant-loss', { loser: role, winner, reason: '信用ゲージが0になりました！' });
    // Skip to verdict
    setTimeout(() => handleInstantLoss(io, room, winner), 2000);
  }
}

async function handleInstantLoss(io: Server, room: GameRoom, winner: 'prosecution' | 'defense') {
  room.phase = 'result';
  const s = room.scenario!;

  io.to(room.code).emit('verdict-result', {
    guiltyCount: winner === 'prosecution' ? 6 : 0,
    notGuiltyCount: winner === 'prosecution' ? 0 : 6,
    isGuilty: winner === 'prosecution',
    winner,
    instantLoss: true,
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  const truthComment = `真相は...被告は${s.truth === 'guilty' ? '本当に犯人でした' : '無実でした'}。${s.truth_reason}`;
  io.to(room.code).emit('truth-reveal', {
    truth: s.truth,
    truthReason: s.truth_reason,
    judgeComment: truthComment,
    verdictMatchesTruth: (winner === 'prosecution' && s.truth === 'guilty') || (winner === 'defense' && s.truth === 'not_guilty'),
    winner,
  });

  await new Promise(resolve => setTimeout(resolve, 3000));
  io.to(room.code).emit('phase-change', { phase: 'result' });
}

export async function startGame(io: Server, room: GameRoom) {
  room.phase = 'generating';
  io.to(room.code).emit('phase-change', { phase: 'generating' });

  try {
    const scenario = await generateScenario();
    room.scenario = scenario;

    // Select 6 random jurors
    const jurorTypes = selectRandomJurors(6);
    room.jurors = jurorTypes.map((jt, index) => ({
      index,
      name: jt.name,
      nickname: jt.nickname,
      type: jt.type,
      vote: getInitialVote(jt.initialBias),
      reason: jt.initialBias === '有罪' ? '怪しいと思う'
            : jt.initialBias === '無罪' ? 'まだわからない'
            : '判断中...',
      comment: jt.initialBias === '有罪' ? '有罪に決まってる'
             : jt.initialBias === '無罪' ? '無罪だと信じたい'
             : 'まだ何とも...',
      reaction: 'neutral' as const,
      locked: false,
      lockedUntilTurn: 0,
      persuadability: jt.persuadability,
      moveCondition: jt.moveCondition,
      description: jt.description,
    }));

    // Init HP
    for (const p of room.players.values()) {
      p.hp = MAX_HP;
    }

    // Send filtered scenario to each player
    for (const player of room.players.values()) {
      const filtered = filterScenarioForRole(room, player.role);
      io.to(player.socketId).emit('game-start', {
        caseInfo: filtered,
        jurors: getJurorsForClient(room.jurors),
        players: getPlayersArray(room),
        hp: getHpInfo(room),
      });
    }

    await startPhase(io, room, 'opening_prosecution');
  } catch (err) {
    console.error('Failed to generate scenario:', err);
    io.to(room.code).emit('error', { message: 'シナリオ生成に失敗しました。もう一度お試しください。' });
    room.phase = 'lobby';
    io.to(room.code).emit('phase-change', { phase: 'lobby' });
  }
}

export async function startPhase(io: Server, room: GameRoom, phase: Phase) {
  room.phase = phase;

  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  let duration = 0;
  let judgeComment = '';

  switch (phase) {
    case 'opening_prosecution':
      duration = 30;
      judgeComment = `開廷します。本件、${room.scenario?.case_title}について審理を開始します。検察官、冒頭陳述をどうぞ。`;
      room.currentTurn = 'prosecution';
      break;
    case 'opening_defense':
      duration = 30;
      judgeComment = '続いて、弁護人の冒頭陳述をお聞きします。';
      room.currentTurn = 'defense';
      break;
    case 'evidence':
      duration = 600; // 10 minutes
      judgeComment = 'それでは証拠調べに入ります。検察側から始めてください。';
      room.currentTurn = 'prosecution';
      room.turnNumber = 1;
      room.prosecutionTurns = 0;
      room.defenseTurns = 0;
      break;
    case 'witness_testimony': {
      duration = 0; // No timer for testimony display
      const witness = room.scenario!.witnesses[room.currentWitnessIndex];
      judgeComment = `証人${witness.name}さん、証言をお願いします。`;
      break;
    }
    case 'witness_challenge':
      duration = 45;
      judgeComment = '証言に対して「ゆさぶる」か「証拠をつきつける」か選んでください。';
      break;
    case 'closing_prosecution':
      duration = 20;
      judgeComment = '証拠調べを終了します。検察官、最終弁論を選択してください。';
      room.currentTurn = 'prosecution';
      break;
    case 'closing_defense':
      duration = 20;
      judgeComment = '弁護人、最終弁論を選択してください。';
      room.currentTurn = 'defense';
      break;
    case 'verdict':
      judgeComment = '以上で弁論終結です。評決を読み上げます...';
      break;
    case 'truth':
      judgeComment = 'それでは...この事件の真相を明かします。';
      break;
  }

  room.timerDuration = duration;
  room.timerEnd = duration > 0 ? Date.now() + duration * 1000 : 0;

  io.to(room.code).emit('phase-change', {
    phase,
    timer: duration,
    currentTurn: room.currentTurn,
    judgeComment,
    hp: getHpInfo(room),
  });

  if (judgeComment) {
    const msg = {
      id: crypto.randomUUID(),
      sender: 'ニシキ裁判長',
      senderRole: 'judge' as const,
      content: judgeComment,
      timestamp: Date.now(),
    };
    room.chatMessages.push(msg);
    io.to(room.code).emit('chat-message', msg);
  }

  if (duration > 0) {
    room.timer = setTimeout(() => handleTimerExpired(io, room), duration * 1000);
  }

  if (phase === 'verdict') {
    await handleVerdict(io, room);
  }

  // Auto-show testimony statements
  if (phase === 'witness_testimony') {
    const witness = room.scenario!.witnesses[room.currentWitnessIndex];
    for (let i = 0; i < witness.testimony.length; i++) {
      await new Promise(r => setTimeout(r, 1200));
      io.to(room.code).emit('testimony-statement', {
        witnessName: witness.name,
        statement: {
          index: witness.testimony[i].index,
          text: witness.testimony[i].text,
        },
      });
    }
    await new Promise(r => setTimeout(r, 800));
    await startPhase(io, room, 'witness_challenge');
  }
}

function handleTimerExpired(io: Server, room: GameRoom) {
  switch (room.phase) {
    case 'opening_prosecution':
      startPhase(io, room, 'opening_defense');
      break;
    case 'opening_defense':
      startPhase(io, room, 'evidence');
      break;
    case 'evidence':
      startPhase(io, room, 'closing_prosecution');
      break;
    case 'witness_challenge':
      // Auto-advance back to evidence
      room.phase = 'evidence';
      io.to(room.code).emit('phase-change', { phase: 'evidence', currentTurn: room.currentTurn });
      advanceEvidenceTurn(io, room);
      break;
    case 'closing_prosecution':
      startPhase(io, room, 'closing_defense');
      break;
    case 'closing_defense':
      startPhase(io, room, 'verdict');
      break;
  }
}

export function advanceEvidenceTurn(io: Server, room: GameRoom) {
  // Unlock jurors whose lock expired
  for (const j of room.jurors) {
    if (j.locked && j.lockedUntilTurn <= room.turnNumber) {
      j.locked = false;
    }
  }

  if (room.currentTurn === 'prosecution') {
    room.prosecutionTurns++;
    room.currentTurn = room.defenseTurns < 5 ? 'defense' : 'prosecution';
  } else {
    room.defenseTurns++;
    room.currentTurn = room.prosecutionTurns < 5 ? 'prosecution' : 'defense';
  }

  room.turnNumber++;
  if (room.prosecutionTurns >= 5 && room.defenseTurns >= 5) {
    startPhase(io, room, 'closing_prosecution');
    return;
  }

  io.to(room.code).emit('turn-change', {
    currentTurn: room.currentTurn,
    turnNumber: room.turnNumber,
    prosecutionTurns: room.prosecutionTurns,
    defenseTurns: room.defenseTurns,
    hp: getHpInfo(room),
  });
}

async function handleVerdict(io: Server, room: GameRoom) {
  const jurors = room.jurors;
  const guiltyCount = jurors.filter(j => j.vote === '有罪').length;
  const notGuiltyCount = jurors.filter(j => j.vote === '無罪').length;
  const isGuilty = guiltyCount >= 4;
  const winner = isGuilty ? 'prosecution' : 'defense';

  for (let i = 0; i < jurors.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    io.to(room.code).emit('verdict-reveal', {
      index: i,
      name: jurors[i].name,
      nickname: jurors[i].nickname,
      vote: jurors[i].vote,
      comment: jurors[i].comment,
    });
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  io.to(room.code).emit('verdict-result', {
    guiltyCount,
    notGuiltyCount,
    isGuilty,
    winner,
  });

  await new Promise(resolve => setTimeout(resolve, 3000));
  await handleTruth(io, room, isGuilty, winner);
}

async function handleTruth(io: Server, room: GameRoom, isGuilty: boolean, winner: string) {
  room.phase = 'truth';
  const s = room.scenario!;

  let truthComment: string;
  try {
    truthComment = await callClaude(
      JUDGE_COMMENT_SYSTEM,
      `事件「${s.case_title}」の真相を発表。真相：被告は${s.truth === 'guilty' ? '有罪' : '無罪'}。理由：${s.truth_reason}。評決は${isGuilty ? '有罪' : '無罪'}でした。`,
      512,
    );
  } catch {
    truthComment = `真相は...被告は${s.truth === 'guilty' ? '本当に犯人でした' : '無実でした'}。${s.truth_reason}`;
  }

  const verdictMatchesTruth = (isGuilty && s.truth === 'guilty') || (!isGuilty && s.truth === 'not_guilty');

  io.to(room.code).emit('truth-reveal', {
    truth: s.truth,
    truthReason: s.truth_reason,
    judgeComment: truthComment,
    verdictMatchesTruth,
    winner,
  });

  await new Promise(resolve => setTimeout(resolve, 5000));
  room.phase = 'result';
  io.to(room.code).emit('phase-change', { phase: 'result' });
}

export async function processJurorReactions(io: Server, room: GameRoom, event: string) {
  try {
    const reactions = await getJurorReactions(room.jurors, event);
    const { updatedJurors, flippedIndices } = applyReactions(room.jurors, reactions, room.turnNumber);
    room.jurors = updatedJurors;

    io.to(room.code).emit('juror-update', {
      jurors: getJurorsForClient(room.jurors),
      flippedIndices,
    });

    if (flippedIndices.length > 0) {
      const chainFlips = applyChainReactions(room.jurors, flippedIndices);
      if (chainFlips.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        io.to(room.code).emit('chain-reaction', {
          jurors: getJurorsForClient(room.jurors),
          chainFlippedIndices: chainFlips,
        });
      }
    }
  } catch (err) {
    console.error('Failed to process juror reactions:', err);
  }
}
