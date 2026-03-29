import { Server, Socket } from 'socket.io';
import * as rm from '../state/roomManager.js';
import { startGame, startPhase, advanceEvidenceTurn, processJurorReactions, filterScenarioForRole, getJurorsForClient } from '../game/gameLoop.js';
import { askWitness } from '../ai/witnessAI.js';
import { judgeObjection } from '../ai/objectionAI.js';
import { persuadeJuror } from '../ai/jurorAI.js';

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

      // Check if role is already taken (except spectator)
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

      // Check: at least prosecutor and defense
      const roles = Array.from(room.players.values()).map(p => p.role);
      if (!roles.includes('prosecution') || !roles.includes('defense')) {
        socket.emit('error', { message: '検察官と弁護人が必要です。' });
        return;
      }

      startGame(io, room);
    });

    // --- STATEMENTS ---
    socket.on('submit-statement', async ({ roomCode, playerId, content }: { roomCode: string; playerId: string; content: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player) return;

      const msg = {
        id: crypto.randomUUID(),
        sender: player.name,
        senderRole: player.role as 'prosecution' | 'defense',
        content,
        timestamp: Date.now(),
      };
      room.chatMessages.push(msg);
      io.to(roomCode).emit('chat-message', msg);

      // Process juror reactions
      const sideLabel = player.role === 'prosecution' ? '検察官' : '弁護人';
      await processJurorReactions(io, room, `${sideLabel}の${room.phase.includes('opening') ? '冒頭陳述' : '最終弁論'}：「${content}」`);

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
      if (!player) return;
      if (room.currentTurn !== player.role) return;

      const evidence = player.role === 'prosecution'
        ? room.scenario!.prosecution_evidence.find(e => e.id === evidenceId)
        : room.scenario!.defense_evidence.find(e => e.id === evidenceId);

      if (!evidence || room.publicEvidence.find(e => e.id === evidenceId)) return;

      room.publicEvidence.push(evidence);
      io.to(roomCode).emit('evidence-submitted', { evidence });

      const sideLabel = player.role === 'prosecution' ? '検察側' : '弁護側';
      await processJurorReactions(io, room, `${sideLabel}が証拠「${evidence.name}」を提出：${evidence.description}（強度：${evidence.strength}）`);

      advanceEvidenceTurn(io, room);
    });

    socket.on('summon-witness', async ({ roomCode, playerId, witnessName }: { roomCode: string; playerId: string; witnessName: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'evidence') return;
      const player = room.players.get(playerId);
      if (!player || room.currentTurn !== player.role) return;

      const witness = room.scenario!.witnesses.find(w => w.name === witnessName);
      if (!witness) return;

      room.witnessOnStand = witness;
      room.witnessChat = [];
      room.witnessExchanges = 0;

      io.to(roomCode).emit('witness-summoned', {
        witness: {
          name: witness.name,
          occupation: witness.occupation,
          relation: witness.relation,
          testimony: witness.testimony,
        },
      });

      const msg = {
        id: crypto.randomUUID(),
        sender: 'ニシキ裁判長',
        senderRole: 'judge' as const,
        content: `証人${witness.name}さん、証言台へどうぞ。`,
        timestamp: Date.now(),
      };
      room.chatMessages.push(msg);
      io.to(roomCode).emit('chat-message', msg);
    });

    socket.on('ask-witness', async ({ roomCode, playerId, question }: { roomCode: string; playerId: string; question: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || !room.witnessOnStand) return;
      if (room.witnessExchanges >= 5) {
        socket.emit('error', { message: '尋問回数の上限に達しました。' });
        return;
      }

      const player = room.players.get(playerId);
      if (!player) return;

      room.witnessChat.push({ role: player.role, content: question });
      room.witnessExchanges++;

      io.to(roomCode).emit('witness-question', { role: player.role, content: question });

      const answer = await askWitness(room.witnessOnStand, room.witnessChat, question);
      room.witnessChat.push({ role: 'witness', content: answer });

      io.to(roomCode).emit('witness-answer', { content: answer });

      // Process juror reactions to the Q&A
      await processJurorReactions(io, room,
        `証人${room.witnessOnStand.name}への尋問 — 質問：「${question}」→ 証言：「${answer}」`);

      if (room.witnessExchanges >= 5) {
        io.to(roomCode).emit('witness-dismissed');
        room.witnessOnStand = null;
        advanceEvidenceTurn(io, room);
      }
    });

    socket.on('dismiss-witness', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || !room.witnessOnStand) return;
      room.witnessOnStand = null;
      io.to(roomCode).emit('witness-dismissed');
      advanceEvidenceTurn(io, room);
    });

    socket.on('persuade-juror', async ({ roomCode, playerId, jurorIndex, evidenceId, reason }: {
      roomCode: string; playerId: string; jurorIndex: number; evidenceId: string; reason: string;
    }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'evidence') return;
      const player = room.players.get(playerId);
      if (!player || room.currentTurn !== player.role) return;

      const juror = room.jurors[jurorIndex];
      if (!juror || juror.locked) {
        socket.emit('error', { message: 'この陪審員は現在説得できません。' });
        return;
      }

      const evidence = room.publicEvidence.find(e => e.id === evidenceId);
      if (!evidence) {
        socket.emit('error', { message: '公開済みの証拠を選択してください。' });
        return;
      }

      const result = await persuadeJuror(juror, evidence.name, evidence.description, reason, player.role);

      if (result.success) {
        juror.vote = juror.vote === '有罪' ? '無罪' : '有罪';
        juror.comment = result.comment;
        juror.reaction = result.reaction as any;
        io.to(roomCode).emit('persuasion-result', {
          success: true,
          jurorIndex,
          comment: result.comment,
          jurors: getJurorsForClient(room.jurors),
        });
      } else {
        juror.locked = true;
        juror.lockedUntilTurn = room.turnNumber + 3;
        juror.comment = result.comment;
        io.to(roomCode).emit('persuasion-result', {
          success: false,
          jurorIndex,
          comment: result.comment,
          jurors: getJurorsForClient(room.jurors),
        });
      }

      advanceEvidenceTurn(io, room);
    });

    socket.on('end-turn', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'evidence') return;
      const player = room.players.get(playerId);
      if (!player || room.currentTurn !== player.role) return;
      advanceEvidenceTurn(io, room);
    });

    // --- OBJECTION ---
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

    socket.on('submit-objection', async ({ roomCode, playerId, type, reason, targetContent }: {
      roomCode: string; playerId: string; type: string; reason: string; targetContent: string;
    }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player) return;

      const publicEvidenceNames = room.publicEvidence.map(e => `${e.name}: ${e.description}`);
      const ruling = await judgeObjection(targetContent, type, reason, publicEvidenceNames);

      io.to(roomCode).emit('objection-ruled', {
        sustained: ruling.sustained,
        score: ruling.score,
        comment: ruling.comment,
        side: player.role,
      });

      // Process juror reactions
      const resultText = ruling.sustained ? '採用' : '却下';
      const sideLabel = player.role === 'prosecution' ? '検察側' : '弁護側';
      await processJurorReactions(io, room,
        `${sideLabel}の異議「${type}：${reason}」が${resultText}された。裁判長コメント：「${ruling.comment}」`);
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
        publicEvidence: room.publicEvidence,
        chatMessages: room.chatMessages,
        currentTurn: room.currentTurn,
        turnNumber: room.turnNumber,
        objectionsRemaining: room.objectionsRemaining,
        timer: room.timerEnd > 0 ? Math.max(0, Math.floor((room.timerEnd - Date.now()) / 1000)) : 0,
        myRole: player.role,
      });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
      // Don't remove player immediately - allow rejoin
    });
  });
}
