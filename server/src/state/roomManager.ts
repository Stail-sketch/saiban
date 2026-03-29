import { GameRoom, Player, Phase } from '../types/game.js';

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
  const host: Player = {
    id: playerId,
    socketId: hostSocketId,
    name: hostName,
    role: 'spectator',
    ready: false,
  };
  const room: GameRoom = {
    code,
    host: playerId,
    players: new Map([[playerId, host]]),
    phase: 'lobby',
    scenario: null,
    jurors: [],
    publicEvidence: [],
    chatMessages: [],
    currentTurn: null,
    turnNumber: 0,
    maxTurns: 10,
    prosecutionTurns: 0,
    defenseTurns: 0,
    objectionsRemaining: { prosecution: 3, defense: 3 },
    timer: null,
    timerEnd: 0,
    timerDuration: 0,
    witnessOnStand: null,
    witnessChat: [],
    witnessExchanges: 0,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, socketId: string, name: string): { room: GameRoom; playerId: string } | null {
  const room = rooms.get(code);
  if (!room || room.phase !== 'lobby') return null;
  const playerId = crypto.randomUUID();
  const player: Player = {
    id: playerId,
    socketId,
    name,
    role: 'spectator',
    ready: false,
  };
  room.players.set(playerId, player);
  return { room, playerId };
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code);
}

export function getRoomBySocketId(socketId: string): { room: GameRoom; player: Player } | undefined {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (player.socketId === socketId) {
        return { room, player };
      }
    }
  }
  return undefined;
}

export function removePlayer(socketId: string): { room: GameRoom; player: Player } | undefined {
  const found = getRoomBySocketId(socketId);
  if (!found) return undefined;
  found.room.players.delete(found.player.id);
  if (found.room.players.size === 0) {
    if (found.room.timer) clearTimeout(found.room.timer);
    rooms.delete(found.room.code);
  }
  return found;
}

export function getPlayersArray(room: GameRoom) {
  return Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    ready: p.ready,
  }));
}

// Cleanup stale rooms (1 hour TTL)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > 3600000) {
      if (room.timer) clearTimeout(room.timer);
      rooms.delete(code);
    }
  }
}, 300000);
