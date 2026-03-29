import { create } from 'zustand';
import type { GameState, Phase, PlayerInfo, JurorState, Evidence, ChatMessage, ObjectionResult, JurorVerdictReveal } from '../types/game';

interface GameStore extends GameState {
  // Setters
  setRoomCode: (code: string) => void;
  setMyPlayerId: (id: string) => void;
  setMyRole: (role: GameState['myRole']) => void;
  setPhase: (phase: Phase) => void;
  setPlayers: (players: PlayerInfo[]) => void;
  setCaseInfo: (info: GameState['caseInfo']) => void;
  setMyEvidence: (ev: Evidence[]) => void;
  setPublicEvidence: (ev: Evidence[]) => void;
  addPublicEvidence: (ev: Evidence) => void;
  setJurors: (jurors: JurorState[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  setCurrentTurn: (turn: 'prosecution' | 'defense' | null) => void;
  setTurnNumber: (n: number) => void;
  setObjectionsRemaining: (obj: { prosecution: number; defense: number }) => void;
  setTimer: (t: number) => void;
  setTimerMax: (t: number) => void;
  setWitnessOnStand: (w: GameState['witnessOnStand']) => void;
  setWitnessChat: (c: GameState['witnessChat']) => void;
  addWitnessChat: (entry: { role: string; content: string }) => void;
  addVerdictReveal: (v: JurorVerdictReveal) => void;
  setTruth: (t: GameState['truth']) => void;
  setWinner: (w: GameState['winner']) => void;
  reset: () => void;
}

const initialState: GameState = {
  roomCode: '',
  phase: 'lobby',
  players: [],
  myRole: 'spectator',
  myPlayerId: '',
  caseInfo: null,
  myEvidence: [],
  publicEvidence: [],
  jurors: [],
  chatMessages: [],
  currentTurn: null,
  turnNumber: 0,
  maxTurns: 10,
  objectionsRemaining: { prosecution: 3, defense: 3 },
  timer: 0,
  timerMax: 0,
  witnessOnStand: null,
  witnessChat: [],
  verdictRevealed: [],
  truth: null,
  winner: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setRoomCode: (code) => set({ roomCode: code }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setMyRole: (role) => set({ myRole: role }),
  setPhase: (phase) => set({ phase }),
  setPlayers: (players) => set({ players }),
  setCaseInfo: (info) => set({ caseInfo: info }),
  setMyEvidence: (ev) => set({ myEvidence: ev }),
  setPublicEvidence: (ev) => set({ publicEvidence: ev }),
  addPublicEvidence: (ev) => set((s) => ({ publicEvidence: [...s.publicEvidence, ev] })),
  setJurors: (jurors) => set({ jurors }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  setCurrentTurn: (turn) => set({ currentTurn: turn }),
  setTurnNumber: (n) => set({ turnNumber: n }),
  setObjectionsRemaining: (obj) => set({ objectionsRemaining: obj }),
  setTimer: (t) => set({ timer: t }),
  setTimerMax: (t) => set({ timerMax: t }),
  setWitnessOnStand: (w) => set({ witnessOnStand: w }),
  setWitnessChat: (c) => set({ witnessChat: c }),
  addWitnessChat: (entry) => set((s) => ({ witnessChat: [...s.witnessChat, entry] })),
  addVerdictReveal: (v) => set((s) => ({ verdictRevealed: [...s.verdictRevealed, v] })),
  setTruth: (t) => set({ truth: t }),
  setWinner: (w) => set({ winner: w }),
  reset: () => set(initialState),
}));
