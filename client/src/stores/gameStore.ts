import { create } from 'zustand';
import type { GameState, Phase, PlayerInfo, JurorState, Evidence, ChatMessage, JurorVerdictReveal, TestimonyStatement, HpState } from '../types/game';

interface GameStore extends GameState {
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
  setHp: (hp: HpState) => void;
  updateHp: (role: 'prosecution' | 'defense', hp: number) => void;
  setTestimonyStatements: (s: TestimonyStatement[]) => void;
  addTestimonyStatement: (s: TestimonyStatement) => void;
  updateTestimonyStatement: (index: number, update: Partial<TestimonyStatement>) => void;
  setCurrentWitnessName: (name: string) => void;
  addVerdictReveal: (v: JurorVerdictReveal) => void;
  setTruth: (t: GameState['truth']) => void;
  setWinner: (w: GameState['winner']) => void;
  removePublicEvidence: (id: string) => void;
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
  hp: { prosecution: 5, defense: 5 },
  testimonyStatements: [],
  currentWitnessName: '',
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
  setHp: (hp) => set({ hp }),
  updateHp: (role, hp) => set((s) => ({ hp: { ...s.hp, [role]: hp } })),
  setTestimonyStatements: (s) => set({ testimonyStatements: s }),
  addTestimonyStatement: (s) => set((st) => ({ testimonyStatements: [...st.testimonyStatements, s] })),
  updateTestimonyStatement: (index, update) => set((s) => ({
    testimonyStatements: s.testimonyStatements.map(t => t.index === index ? { ...t, ...update } : t),
  })),
  setCurrentWitnessName: (name) => set({ currentWitnessName: name }),
  addVerdictReveal: (v) => set((s) => ({ verdictRevealed: [...s.verdictRevealed, v] })),
  setTruth: (t) => set({ truth: t }),
  setWinner: (w) => set({ winner: w }),
  removePublicEvidence: (id) => set((s) => ({ publicEvidence: s.publicEvidence.filter(e => e.id !== id) })),
  reset: () => set(initialState),
}));
