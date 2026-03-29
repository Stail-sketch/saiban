import { GameRoom, Player } from '../types/game.js';

const rooms = new Map<string, GameRoom>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

export function createRoom(hostSocketId: string, hostName: string): GameRoom {
  const code = generateCode();
  const playerId = crypto.randomUUID();
  const host: Player = { id: playerId, socketId: hostSocketId, name: hostName, ready: false, hp: 5 };
  const room: GameRoom = {
    code,
    host: playerId,
    players: new Map([[playerId, host]]),
    phase: 'lobby',
    scenario: null,
    collectedEvidence: [],
    chatMessages: [],
    currentWitnessIndex: 0,
    currentStatementIndex: 0,
    penaltyCount: 0,
    maxPenalties: 5,
    timer: null,
    timerEnd: 0,
    timerDuration: 0,
    testimonyLoop: 0,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, socketId: string, name: string): { room: GameRoom; playerId: string } | null {
  const room = rooms.get(code);
  if (!room || room.phase !== 'lobby') return null;
  const playerId = crypto.randomUUID();
  room.players.set(playerId, { id: playerId, socketId, name, ready: false, hp: 5 });
  return { room, playerId };
}

export function getRoom(code: string) { return rooms.get(code); }

export function getPlayersArray(room: GameRoom) {
  return Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name, ready: p.ready }));
}

// Cleanup stale rooms
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > 3600000) {
      if (room.timer) clearTimeout(room.timer);
      rooms.delete(code);
    }
  }
}, 300000);
