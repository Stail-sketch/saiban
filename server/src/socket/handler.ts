import { Server, Socket } from 'socket.io';
import * as rm from '../state/roomManager.js';
import { startGame, startPhase, handlePress, handlePresent, handleInvestigate, handleTalkTo, handleExamineClue, getCollectedEvidenceList } from '../game/gameLoop.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Connected: ${socket.id}`);

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
      if (!result) { socket.emit('error', { message: '部屋が見つかりません。' }); return; }
      socket.join(result.room.code);
      socket.emit('room-joined', { roomCode: result.room.code, playerId: result.playerId, players: rm.getPlayersArray(result.room) });
      socket.to(result.room.code).emit('player-joined', { players: rm.getPlayersArray(result.room) });
    });

    socket.on('start-game', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'lobby') return;
      startGame(io, room);
    });

    // Investigation
    socket.on('go-to-location', ({ roomCode, locationId }: { roomCode: string; locationId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'investigation') return;
      handleInvestigate(io, room, locationId);
    });

    socket.on('talk-to', ({ roomCode, locationId, personName }: { roomCode: string; locationId: string; personName: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'investigation') return;
      handleTalkTo(io, room, locationId, personName);
    });

    socket.on('examine-clue', ({ roomCode, locationId, evidenceId }: { roomCode: string; locationId: string; evidenceId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'investigation') return;
      handleExamineClue(io, room, locationId, evidenceId);
    });

    socket.on('end-investigation', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'investigation') return;
      startPhase(io, room, 'court_ready');
    });

    // Intro complete -> investigation
    socket.on('intro-done', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      startPhase(io, room, 'investigation');
    });

    // Court ready -> testimony
    socket.on('start-testimony', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room) return;
      startPhase(io, room, 'testimony');
    });

    // Cross examination actions
    socket.on('press', ({ roomCode, statementIndex }: { roomCode: string; statementIndex: number }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'cross_exam') return;
      handlePress(io, room, statementIndex);
    });

    socket.on('present-evidence', ({ roomCode, statementIndex, evidenceId }: { roomCode: string; statementIndex: number; evidenceId: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || room.phase !== 'cross_exam') return;
      handlePresent(io, room, statementIndex, evidenceId);
    });

    // Get evidence list
    socket.on('get-evidence', ({ roomCode }: { roomCode: string }) => {
      const room = rm.getRoom(roomCode);
      if (!room || !room.scenario) return;
      socket.emit('evidence-list', { evidence: getCollectedEvidenceList(room) });
    });

    socket.on('disconnect', () => { console.log(`Disconnected: ${socket.id}`); });
  });
}
