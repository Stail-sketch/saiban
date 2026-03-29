import { Server, Socket } from 'socket.io';
import * as rm from '../state/roomManager.js';
import { startGame, startPhase, advanceEvidenceTurn, processJurorReactions, filterScenarioForRole, getJurorsForClient, damagePlayer, getPlayerByRole } from '../game/gameLoop.js';
import { judgeObjection } from '../ai/objectionAI.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Connected: ${socket.id}`);

    // --- LOBBY ---
    socket.on('create-room', ({ name }: { name: string }) => {
      const room = rm.createRoom(socket.id, name);
      const player = Array.from(room.players.values())[0];
      socket.join(room.code);
      socket.emit('room-created', {
        roomCode: room.code,
        playerId: player.id,
        players: rm.getPlayersArray(room),
      });
    });

    socket.on('join-room', ({ code, name }: { code: string; name: string }) => {
      const result = rm.joinRoom(code.toUpperCase(), socket.id, name);
      if (!result) {
        socket.emit('error', { message: '部屋が見つからないか、すでにゲームが始まっています。' });
        return;
      }
      socket.join(result.room.code);
      socket.emit('room-joined', {
        roomCode: result.room.code,
        playerId: result.playerId,
        players: rm.getPlayersArray(result.room),
      });
      socket.to(result.room.code).emit('player-joined', {
        players: rm.getPlayersArray(result.room),
      });
    });

    socket.on('select-role', ({ roomCode, playerId, role }: { roomCode: string; playerId: string; role: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player) return;

      if (role !== 'spectator') {
        for (const p of room.players.values()) {
          if (p.id !== playerId && p.role === role) {
            socket.emit('error', { message: 'その役割はすでに選択されています。' });
            return;
          }
        }
      }

      player.role = role as any;
      io.to(roomCode).emit('player-updated', { players: rm.getPlayersArray(room) });
    });

    socket.on('player-ready', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player) return;
      player.ready = true;
      io.to(roomCode).emit('player-updated', { players: rm.getPlayersArray(room) });
    });

    socket.on('start-game', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'lobby') return;

      const roles = Array.from(room.players.values()).map(p => p.role);
      if (!roles.includes('prosecution') || !roles.includes('defense')) {
        socket.emit('error', { message: '検察官と弁護人が必要です。' });
        return;
      }

      startGame(io, room);
    });

    // --- OPENING/CLOSING (Choice-based) ---
    socket.on('select-statement', async ({ roomCode, playerId, choiceId }: { roomCode: string; playerId: string; choiceId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player) return;

      const s = room.scenario!;
      let choiceText = '';
      let impact = 'medium';

      // Find the chosen option
      if (room.phase === 'opening_prosecution') {
        const choice = s.prosecution_openings.find(c => c.id === choiceId);
        if (choice) { choiceText = choice.text; impact = choice.impact; }
      } else if (room.phase === 'opening_defense') {
        const choice = s.defense_openings.find(c => c.id === choiceId);
        if (choice) { choiceText = choice.text; impact = choice.impact; }
      } else if (room.phase === 'closing_prosecution') {
        const choice = s.prosecution_closings.find(c => c.id === choiceId);
        if (choice) { choiceText = choice.text; impact = choice.impact; }
      } else if (room.phase === 'closing_defense') {
        const choice = s.defense_closings.find(c => c.id === choiceId);
        if (choice) { choiceText = choice.text; impact = choice.impact; }
      }

      if (!choiceText) return;

      const msg = {
        id: crypto.randomUUID(),
        sender: player.name,
        senderRole: player.role as 'prosecution' | 'defense',
        content: choiceText,
        timestamp: Date.now(),
      };
      room.chatMessages.push(msg);
      io.to(roomCode).emit('chat-message', msg);

      // Impact affects juror reaction strength
      const sideLabel = player.role === 'prosecution' ? '検察官' : '弁護人';
      const phaseLabel = room.phase.includes('opening') ? '冒頭陳述' : '最終弁論';
      const impactLabel = impact === 'strong' ? '（力強い主張）' : impact === 'weak' ? '（控えめな主張）' : '';
      await processJurorReactions(io, room, `${sideLabel}の${phaseLabel}${impactLabel}：「${choiceText}」`);

      // Advance phase
      if (room.phase === 'opening_prosecution') {
        startPhase(io, room, 'opening_defense');
      } else if (room.phase === 'opening_defense') {
        startPhase(io, room, 'evidence');
      } else if (room.phase === 'closing_prosecution') {
        startPhase(io, room, 'closing_defense');
      } else if (room.phase === 'closing_defense') {
        startPhase(io, room, 'verdict');
      }
    });

    // --- EVIDENCE PHASE ---
    socket.on('submit-evidence', async ({ roomCode, playerId, evidenceId }: { roomCode: string; playerId: string; evidenceId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'evidence') return;
      const player = room.players.get(playerId);
      if (!player || room.currentTurn !== player.role) return;

      const allEvidence = [...room.scenario!.prosecution_evidence, ...room.scenario!.defense_evidence];
      const evidence = allEvidence.find(e => e.id === evidenceId);
      if (!evidence || room.publicEvidence.find(e => e.id === evidenceId)) return;

      // Add to public board (without revealing fake flag)
      const publicEv = { ...evidence, fake: false, fakeReason: undefined };
      room.publicEvidence.push(evidence); // Server keeps real data
      io.to(roomCode).emit('evidence-submitted', {
        evidence: publicEv, // Clients don't see fake flag
        submittedBy: player.role,
      });

      const sideLabel = player.role === 'prosecution' ? '検察側' : '弁護側';
      await processJurorReactions(io, room, `${sideLabel}が証拠「${evidence.name}」を提出：${evidence.description}（強度：${evidence.strength}）`);

      advanceEvidenceTurn(io, room);
    });

    // --- WITNESS ---
    socket.on('summon-witness', async ({ roomCode, playerId, witnessIndex }: { roomCode: string; playerId: string; witnessIndex: number }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'evidence') return;
      const player = room.players.get(playerId);
      if (!player || room.currentTurn !== player.role) return;

      const witness = room.scenario!.witnesses[witnessIndex];
      if (!witness) return;

      room.currentWitnessIndex = witnessIndex;
      room.witnessExamTurn = player.role;

      const msg = {
        id: crypto.randomUUID(),
        sender: 'ニシキ裁判長',
        senderRole: 'judge' as const,
        content: `証人${witness.name}さん、証言台へどうぞ。`,
        timestamp: Date.now(),
      };
      room.chatMessages.push(msg);
      io.to(roomCode).emit('chat-message', msg);

      // Show testimony
      await startPhase(io, room, 'witness_testimony');
    });

    // --- TESTIMONY CHALLENGE ---
    socket.on('press-statement', async ({ roomCode, playerId, statementIndex }: { roomCode: string; playerId: string; statementIndex: number }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'witness_challenge') return;

      const witness = room.scenario!.witnesses[room.currentWitnessIndex];
      const statement = witness.testimony[statementIndex];
      if (!statement || statement.pressed) return;

      statement.pressed = true;

      // Send press response
      io.to(roomCode).emit('testimony-press', {
        statementIndex,
        witnessName: witness.name,
        response: statement.pressResponse,
        isContradiction: statement.isContradiction,
      });

      // If it's a contradiction, hint that something is off
      if (statement.isContradiction) {
        await processJurorReactions(io, room, `証人${witness.name}が「${statement.text}」について問い詰められ、動揺した反応を見せた`);
      }
    });

    socket.on('present-evidence', async ({ roomCode, playerId, statementIndex, evidenceId }: {
      roomCode: string; playerId: string; statementIndex: number; evidenceId: string;
    }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'witness_challenge') return;
      const player = room.players.get(playerId);
      if (!player) return;

      const witness = room.scenario!.witnesses[room.currentWitnessIndex];
      const statement = witness.testimony[statementIndex];
      if (!statement) return;

      const isCorrect = statement.isContradiction && statement.challengeEvidenceId === evidenceId;

      if (isCorrect) {
        // SUCCESS! Testimony breaks
        statement.broken = true;

        io.to(roomCode).emit('testimony-break', {
          statementIndex,
          witnessName: witness.name,
          evidenceId,
          success: true,
        });

        const breakMsg = {
          id: crypto.randomUUID(),
          sender: witness.name,
          senderRole: 'witness' as const,
          content: `う...っ！そ、それは...！（${witness.hidden_info}）`,
          timestamp: Date.now(),
          type: 'testimony_break' as const,
        };
        room.chatMessages.push(breakMsg);
        io.to(roomCode).emit('chat-message', breakMsg);

        // Big juror reaction
        await processJurorReactions(io, room,
          `証人${witness.name}の証言「${statement.text}」が証拠によって完全に崩された！証人は「${witness.hidden_info}」を暴露した。`);

        // Return to evidence phase
        await new Promise(r => setTimeout(r, 2000));
        room.phase = 'evidence';
        io.to(room.code).emit('phase-change', { phase: 'evidence', currentTurn: room.currentTurn });
        advanceEvidenceTurn(io, room);
      } else {
        // FAILURE! Wrong evidence
        io.to(roomCode).emit('testimony-break', {
          statementIndex,
          witnessName: witness.name,
          evidenceId,
          success: false,
        });

        damagePlayer(io, room, player.role as 'prosecution' | 'defense', 1, '証拠のつきつけ失敗');

        // Check if still alive
        if (player.hp > 0) {
          // Continue challenge phase
          io.to(roomCode).emit('challenge-continue', { message: '違う証拠のようだ...もう一度考えろ！' });
        }
      }
    });

    socket.on('end-witness', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      room.phase = 'evidence';
      io.to(room.code).emit('phase-change', { phase: 'evidence', currentTurn: room.currentTurn });
      advanceEvidenceTurn(io, room);
    });

    // --- OBJECTION (Bluff Detection) ---
    socket.on('raise-objection', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'evidence') return;
      const player = room.players.get(playerId);
      if (!player) return;

      const side = player.role as 'prosecution' | 'defense';
      if (room.objectionsRemaining[side] <= 0) {
        socket.emit('error', { message: '異議の回数を使い切りました。' });
        return;
      }

      room.objectionsRemaining[side]--;
      io.to(roomCode).emit('objection-raised', { side, remaining: room.objectionsRemaining[side] });
    });

    socket.on('submit-objection', async ({ roomCode, playerId, type, reason, targetEvidenceId }: {
      roomCode: string; playerId: string; type: string; reason: string; targetEvidenceId?: string;
    }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player) return;

      const side = player.role as 'prosecution' | 'defense';

      // Bluff detection: check if target evidence is fake
      if (type === '偽証' && targetEvidenceId) {
        const evidence = room.publicEvidence.find(e => e.id === targetEvidenceId);
        if (evidence) {
          if (evidence.fake) {
            // CAUGHT! Bluff detected
            const otherSide = evidence.side as 'prosecution' | 'defense';
            damagePlayer(io, room, otherSide, 2, 'ニセ証拠がバレた！');

            io.to(roomCode).emit('objection-ruled', {
              sustained: true,
              comment: `な、なんと！この証拠は偽物だったのですか！${evidence.fakeReason || ''}...採用します！`,
              side,
              bluffCaught: true,
              evidenceId: targetEvidenceId,
            });

            // Remove fake evidence from board
            room.publicEvidence = room.publicEvidence.filter(e => e.id !== targetEvidenceId);

            await processJurorReactions(io, room,
              `${otherSide === 'prosecution' ? '検察' : '弁護'}側の証拠「${evidence.name}」がニセモノだと発覚！法廷に衝撃が走った！`);
          } else {
            // False accusation! Penalty to objector
            damagePlayer(io, room, side, 1, '偽証の指摘が外れた');

            io.to(roomCode).emit('objection-ruled', {
              sustained: false,
              comment: 'この証拠は本物です。根拠のない偽証疑惑は法廷を混乱させるだけです。却下！',
              side,
              bluffCaught: false,
            });
          }
          return;
        }
      }

      // Normal objection
      const publicEvidenceNames = room.publicEvidence.map(e => `${e.name}: ${e.description}`);
      const lastMessages = room.chatMessages.slice(-3).map(m => m.content).join('\n');
      const ruling = await judgeObjection(lastMessages, type, reason, publicEvidenceNames);

      io.to(roomCode).emit('objection-ruled', {
        sustained: ruling.sustained,
        comment: ruling.comment,
        side,
      });

      if (ruling.sustained) {
        await processJurorReactions(io, room,
          `${side === 'prosecution' ? '検察' : '弁護'}側の異議「${type}」が採用された！裁判長：「${ruling.comment}」`);
      } else {
        await processJurorReactions(io, room,
          `${side === 'prosecution' ? '検察' : '弁護'}側の異議が却下された。裁判長：「${ruling.comment}」`);
      }
    });

    socket.on('end-turn', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'evidence') return;
      const player = room.players.get(playerId);
      if (!player || room.currentTurn !== player.role) return;
      advanceEvidenceTurn(io, room);
    });

    // --- REJOIN ---
    socket.on('rejoin-room', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) {
        socket.emit('error', { message: '部屋が見つかりません。' });
        return;
      }
      const player = room.players.get(playerId);
      if (!player) {
        socket.emit('error', { message: 'プレイヤーが見つかりません。' });
        return;
      }
      player.socketId = socket.id;
      socket.join(roomCode);

      const filtered = filterScenarioForRole(room, player.role);
      socket.emit('rejoin-success', {
        roomCode: room.code,
        playerId: player.id,
        phase: room.phase,
        caseInfo: filtered,
        jurors: getJurorsForClient(room.jurors),
        players: rm.getPlayersArray(room),
        publicEvidence: room.publicEvidence.map(e => ({ ...e, fake: false, fakeReason: undefined })),
        chatMessages: room.chatMessages,
        currentTurn: room.currentTurn,
        turnNumber: room.turnNumber,
        objectionsRemaining: room.objectionsRemaining,
        timer: room.timerEnd > 0 ? Math.max(0, Math.floor((room.timerEnd - Date.now()) / 1000)) : 0,
        myRole: player.role,
        hp: {
          prosecution: (Array.from(room.players.values()).find(p => p.role === 'prosecution')?.hp ?? 5),
          defense: (Array.from(room.players.values()).find(p => p.role === 'defense')?.hp ?? 5),
        },
      });
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
    });
  });
}
