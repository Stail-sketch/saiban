import { Server } from 'socket.io';
import { GameRoom, JurorState, Phase } from '../types/game.js';
import { generateScenario } from '../ai/scenarioGenerator.js';
import { selectRandomJurors, getInitialVote } from '../data/jurorTypes.js';
import { getJurorReactions, applyReactions, applyChainReactions } from '../ai/jurorAI.js';
import { getPlayersArray } from '../state/roomManager.js';
import { callClaude } from '../ai/claudeClient.js';
import { JUDGE_COMMENT_SYSTEM } from '../ai/prompts.js';

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
      testimony: w.testimony,
    })),
  };
  if (role === 'prosecution') {
    return { ...base, myEvidence: s.prosecution_evidence };
  } else if (role === 'defense') {
    return { ...base, myEvidence: s.defense_evidence };
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

export async function startGame(io: Server, room: GameRoom) {
  room.phase = 'generating';
  io.to(room.code).emit('phase-change', { phase: 'generating' });

  try {
    // Generate scenario
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

    // Send filtered scenario to each player
    for (const player of room.players.values()) {
      const filtered = filterScenarioForRole(room, player.role);
      io.to(player.socketId).emit('game-start', {
        caseInfo: filtered,
        jurors: getJurorsForClient(room.jurors),
        players: getPlayersArray(room),
      });
    }

    // Start opening statement phase
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

  // Clear previous timer
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  let duration = 0;
  let judgeComment = '';

  switch (phase) {
    case 'opening_prosecution':
      duration = 60;
      judgeComment = `開廷します。本件、${room.scenario?.case_title}について審理を開始します。まずは検察官、冒頭陳述をどうぞ。`;
      room.currentTurn = 'prosecution';
      break;
    case 'opening_defense':
      duration = 60;
      judgeComment = '続いて、弁護人の冒頭陳述をお聞きします。';
      room.currentTurn = 'defense';
      break;
    case 'evidence':
      duration = 900; // 15 minutes
      judgeComment = 'それでは証拠調べに入ります。検察側から始めてください。';
      room.currentTurn = 'prosecution';
      room.turnNumber = 1;
      room.prosecutionTurns = 0;
      room.defenseTurns = 0;
      break;
    case 'closing_prosecution':
      duration = 90;
      judgeComment = '証拠調べを終了します。検察官、最終弁論をお願いします。';
      room.currentTurn = 'prosecution';
      break;
    case 'closing_defense':
      duration = 90;
      judgeComment = '続いて、弁護人の最終弁論をどうぞ。';
      room.currentTurn = 'defense';
      break;
    case 'verdict':
      duration = 0;
      judgeComment = '以上で弁論終結です。評決を読み上げます...';
      break;
    case 'truth':
      duration = 0;
      judgeComment = 'それでは...この事件の真相を明かします。';
      break;
    case 'result':
      duration = 0;
      break;
  }

  room.timerDuration = duration;
  room.timerEnd = duration > 0 ? Date.now() + duration * 1000 : 0;

  // Broadcast phase change
  io.to(room.code).emit('phase-change', {
    phase,
    timer: duration,
    currentTurn: room.currentTurn,
    judgeComment,
  });

  // Add judge comment to chat
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

  // Set auto-advance timer
  if (duration > 0) {
    room.timer = setTimeout(() => {
      handleTimerExpired(io, room);
    }, duration * 1000);
  }

  // Handle verdict phase automatically
  if (phase === 'verdict') {
    await handleVerdict(io, room);
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
    case 'closing_prosecution':
      startPhase(io, room, 'closing_defense');
      break;
    case 'closing_defense':
      startPhase(io, room, 'verdict');
      break;
  }
}

export function advanceEvidenceTurn(io: Server, room: GameRoom) {
  if (room.currentTurn === 'prosecution') {
    room.prosecutionTurns++;
    if (room.defenseTurns < 5) {
      room.currentTurn = 'defense';
    } else if (room.prosecutionTurns < 5) {
      // defense exhausted, prosecution continues
    } else {
      startPhase(io, room, 'closing_prosecution');
      return;
    }
  } else {
    room.defenseTurns++;
    if (room.prosecutionTurns < 5) {
      room.currentTurn = 'prosecution';
    } else if (room.defenseTurns < 5) {
      // prosecution exhausted, defense continues
    } else {
      startPhase(io, room, 'closing_prosecution');
      return;
    }
  }

  room.turnNumber++;
  if (room.turnNumber > room.maxTurns) {
    startPhase(io, room, 'closing_prosecution');
    return;
  }

  io.to(room.code).emit('turn-change', {
    currentTurn: room.currentTurn,
    turnNumber: room.turnNumber,
    prosecutionTurns: room.prosecutionTurns,
    defenseTurns: room.defenseTurns,
  });
}

async function handleVerdict(io: Server, room: GameRoom) {
  const jurors = room.jurors;
  const guiltyCount = jurors.filter(j => j.vote === '有罪').length;
  const notGuiltyCount = jurors.filter(j => j.vote === '無罪').length;
  const isGuilty = guiltyCount >= 4;
  const winner = isGuilty ? 'prosecution' : 'defense';

  // Reveal jurors one by one with delay
  for (let i = 0; i < jurors.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    io.to(room.code).emit('verdict-reveal', {
      index: i,
      name: jurors[i].name,
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

  // Move to truth phase after a delay
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
      `事件「${s.case_title}」の真相を発表してください。真相：被告は${s.truth === 'guilty' ? '有罪（犯人）' : '無罪（犯人ではない）'}。理由：${s.truth_reason}。評決は${isGuilty ? '有罪' : '無罪'}でした。`,
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

  // Move to result after delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  room.phase = 'result';
  io.to(room.code).emit('phase-change', { phase: 'result' });
}

export async function processJurorReactions(
  io: Server,
  room: GameRoom,
  event: string,
) {
  try {
    const reactions = await getJurorReactions(room.jurors, event);
    const { updatedJurors, flippedIndices } = applyReactions(room.jurors, reactions, room.turnNumber);
    room.jurors = updatedJurors;

    // Broadcast updated jurors
    io.to(room.code).emit('juror-update', {
      jurors: getJurorsForClient(room.jurors),
      flippedIndices,
    });

    // Check for chain reactions
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
