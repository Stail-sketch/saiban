import { Server } from 'socket.io';
import { GameRoom, Phase, ChatMessage } from '../types/game.js';
import { generateScenario } from '../ai/scenarioGenerator.js';
import { getPlayersArray } from '../state/roomManager.js';

function msg(room: GameRoom, speaker: string, type: ChatMessage['speakerType'], content: string, emotion?: string): ChatMessage {
  const m: ChatMessage = { id: crypto.randomUUID(), speaker, speakerType: type, content, timestamp: Date.now(), emotion };
  room.chatMessages.push(m);
  return m;
}

function broadcast(io: Server, room: GameRoom, event: string, data: any) {
  io.to(room.code).emit(event, data);
}

function say(io: Server, room: GameRoom, speaker: string, type: ChatMessage['speakerType'], content: string, emotion?: string) {
  const m = msg(room, speaker, type, content, emotion);
  broadcast(io, room, 'dialogue', m);
}

export async function startGame(io: Server, room: GameRoom) {
  room.phase = 'generating';
  broadcast(io, room, 'phase-change', { phase: 'generating' });

  try {
    const scenario = await generateScenario();
    room.scenario = scenario;
    room.collectedEvidence = [...scenario.initial_evidence];
    room.penaltyCount = 0;
    room.currentWitnessIndex = 0;
    room.currentStatementIndex = 0;
    room.testimonyLoop = 0;

    // Send game data
    broadcast(io, room, 'game-start', {
      caseTitle: scenario.case_title,
      summary: scenario.summary,
      date: scenario.date,
      location: scenario.location,
      defendant: scenario.defendant,
      victim: scenario.victim,
      prosecutor: scenario.prosecutor,
      evidence: scenario.evidence.filter(e => scenario.initial_evidence.includes(e.id)),
      players: getPlayersArray(room),
      hp: room.maxPenalties - room.penaltyCount,
      maxHp: room.maxPenalties,
    });

    // Intro sequence
    await startPhase(io, room, 'intro');
  } catch (err) {
    console.error('Failed to generate scenario:', err);
    broadcast(io, room, 'error', { message: 'シナリオ生成に失敗しました。もう一度お試しください。' });
    room.phase = 'lobby';
    broadcast(io, room, 'phase-change', { phase: 'lobby' });
  }
}

export async function startPhase(io: Server, room: GameRoom, phase: Phase) {
  room.phase = phase;
  if (room.timer) { clearTimeout(room.timer); room.timer = null; }

  broadcast(io, room, 'phase-change', { phase, hp: room.maxPenalties - room.penaltyCount, maxHp: room.maxPenalties });

  const s = room.scenario!;

  switch (phase) {
    case 'intro': {
      await delay(500);
      say(io, room, 'ナレーター', 'narrator', s.summary);
      await delay(2000);
      say(io, room, 'ナレーター', 'narrator', `被告人：${s.defendant.name}（${s.defendant.age}歳・${s.defendant.occupation}）`);
      await delay(1500);
      say(io, room, 'ナレーター', 'narrator', `被害者：${s.victim.name}（${s.victim.age}歳・${s.victim.occupation}）— ${s.victim.cause}`);
      await delay(2000);
      broadcast(io, room, 'intro-complete', {});
      break;
    }

    case 'investigation': {
      const locations = s.investigation_locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        people: loc.people.map(p => p.name),
        clueCount: loc.clues.filter(c => !c.found).length,
      }));
      broadcast(io, room, 'investigation-data', { locations });
      break;
    }

    case 'court_ready': {
      say(io, room, '裁判長', 'judge', '被告人、起立。これより審理を開始します。');
      await delay(1500);
      say(io, room, s.prosecutor.name, 'prosecutor', `ふっ...弁護人、今日も無駄な抵抗ですか？`, 'smirk');
      await delay(1500);
      broadcast(io, room, 'court-ready', {
        witnessName: s.witnesses[room.currentWitnessIndex]?.name,
        witnessAppearance: s.witnesses[room.currentWitnessIndex]?.appearance,
      });
      break;
    }

    case 'testimony': {
      const witness = s.witnesses[room.currentWitnessIndex];
      if (!witness) { await startPhase(io, room, 'verdict'); return; }

      say(io, room, '裁判長', 'judge', `証人${witness.name}、証言を始めてください。`);
      await delay(1000);

      // Show testimony title
      broadcast(io, room, 'testimony-title', {
        witnessName: witness.name,
        witnessOccupation: witness.occupation,
        witnessAppearance: witness.appearance,
      });

      await delay(1500);

      // Display each statement with delay
      for (const st of witness.testimony) {
        if (!st.broken) {
          broadcast(io, room, 'testimony-statement', { statement: st, witnessName: witness.name });
          await delay(1800);
        }
      }

      await delay(500);
      say(io, room, '裁判長', 'judge', '弁護人、尋問を行ってください。');

      // Move to cross examination
      room.currentStatementIndex = 0;
      room.phase = 'cross_exam';
      broadcast(io, room, 'cross-exam-start', {
        statements: witness.testimony.filter(st => !st.broken),
        currentIndex: 0,
        witnessName: witness.name,
      });
      break;
    }

    case 'verdict': {
      say(io, room, '裁判長', 'judge', '...以上の審理の結果を踏まえ、判決を言い渡します。');
      await delay(2000);

      const allBroken = s.witnesses.every(w => w.testimony.some(t => t.broken));
      if (allBroken) {
        say(io, room, '裁判長', 'judge', `被告人${s.defendant.name}に対し...`);
        await delay(2000);
        broadcast(io, room, 'verdict-result', { verdict: 'not_guilty', defendant: s.defendant.name });
        await delay(2000);
        say(io, room, 'ナレーター', 'narrator', `真相：${s.truth_summary}`);
        await delay(2000);
        room.phase = 'result';
        broadcast(io, room, 'phase-change', { phase: 'result' });
      } else {
        broadcast(io, room, 'verdict-result', { verdict: 'guilty', defendant: s.defendant.name });
        room.phase = 'result';
        broadcast(io, room, 'phase-change', { phase: 'result' });
      }
      break;
    }
  }
}

export function handlePress(io: Server, room: GameRoom, statementIndex: number) {
  const witness = room.scenario!.witnesses[room.currentWitnessIndex];
  const st = witness.testimony[statementIndex];
  if (!st || st.pressed || st.broken) return;

  st.pressed = true;

  // Send press dialogue sequence
  broadcast(io, room, 'press-dialogue', {
    statementIndex,
    witnessName: witness.name,
    dialogue: st.pressDialogue,
    isContradiction: !!st.contradiction,
  });
}

export function handlePresent(io: Server, room: GameRoom, statementIndex: number, evidenceId: string) {
  const witness = room.scenario!.witnesses[room.currentWitnessIndex];
  const st = witness.testimony[statementIndex];
  if (!st || st.broken) return;

  if (st.contradiction && st.contradiction.evidenceId === evidenceId) {
    // CORRECT! Contradiction found!
    st.broken = true;

    broadcast(io, room, 'objection-success', {
      statementIndex,
      evidenceId,
      explanation: st.contradiction.explanation,
      witnessName: witness.name,
    });

    // Check if all contradictions for this witness are broken
    const allContradictionsBroken = witness.testimony
      .filter(t => t.contradiction)
      .every(t => t.broken);

    if (allContradictionsBroken) {
      // Witness breakdown!
      setTimeout(() => {
        broadcast(io, room, 'witness-breakdown', {
          witnessName: witness.name,
          dialogue: witness.breakdownDialogue,
        });

        // Move to next witness or verdict
        setTimeout(() => {
          room.currentWitnessIndex++;
          if (room.currentWitnessIndex < room.scenario!.witnesses.length) {
            startPhase(io, room, 'testimony');
          } else {
            startPhase(io, room, 'verdict');
          }
        }, 4000);
      }, 3000);
    }
  } else {
    // WRONG evidence
    room.penaltyCount++;
    broadcast(io, room, 'objection-fail', {
      statementIndex,
      evidenceId,
      hp: room.maxPenalties - room.penaltyCount,
      maxHp: room.maxPenalties,
    });

    const s = room.scenario!;
    say(io, room, '裁判長', 'judge', 'その証拠は今の証言とは関係ないようですが...', 'normal');
    say(io, room, s.prosecutor.name, 'prosecutor', 'ハッ！見当違いですよ、弁護人。', 'smirk');

    if (room.penaltyCount >= room.maxPenalties) {
      // Game over
      setTimeout(() => {
        broadcast(io, room, 'game-over', { reason: '信用を完全に失った...' });
        room.phase = 'result';
        broadcast(io, room, 'phase-change', { phase: 'result' });
      }, 1500);
    }
  }
}

export function handleInvestigate(io: Server, room: GameRoom, locationId: string) {
  const loc = room.scenario!.investigation_locations.find(l => l.id === locationId);
  if (!loc) return;

  broadcast(io, room, 'investigation-location', {
    id: loc.id,
    name: loc.name,
    description: loc.description,
    people: loc.people,
    clues: loc.clues.map(c => ({
      evidenceId: c.evidenceId,
      findDescription: c.findDescription,
      found: c.found,
    })),
  });
}

export function handleTalkTo(io: Server, room: GameRoom, locationId: string, personName: string) {
  const loc = room.scenario!.investigation_locations.find(l => l.id === locationId);
  if (!loc) return;
  const person = loc.people.find(p => p.name === personName);
  if (!person) return;

  broadcast(io, room, 'talk-dialogue', {
    personName: person.name,
    dialogue: person.dialogue,
  });
}

export function handleExamineClue(io: Server, room: GameRoom, locationId: string, evidenceId: string) {
  const loc = room.scenario!.investigation_locations.find(l => l.id === locationId);
  if (!loc) return;
  const clue = loc.clues.find(c => c.evidenceId === evidenceId);
  if (!clue || clue.found) return;

  clue.found = true;

  // Add to collected evidence
  if (!room.collectedEvidence.includes(evidenceId)) {
    room.collectedEvidence.push(evidenceId);
  }

  const evidence = room.scenario!.evidence.find(e => e.id === evidenceId);
  if (!evidence) return;

  broadcast(io, room, 'evidence-found', {
    evidence,
    findDescription: clue.findDescription,
  });
}

export function getCollectedEvidenceList(room: GameRoom) {
  return room.scenario!.evidence.filter(e => room.collectedEvidence.includes(e.id));
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
