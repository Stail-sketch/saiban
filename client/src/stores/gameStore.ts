import { create } from 'zustand';
import type { GameState, Phase, Evidence, DialogueMessage, TestimonyStatement, InvestigationLocation, Defendant, Victim, Prosecutor } from '../types/game';

interface GameStore extends GameState {
  setRoomCode: (c: string) => void;
  setMyPlayerId: (id: string) => void;
  setPlayerName: (n: string) => void;
  setPhase: (p: Phase) => void;
  setCaseTitle: (t: string) => void;
  setSummary: (s: string) => void;
  setDefendant: (d: Defendant) => void;
  setVictim: (v: Victim) => void;
  setProsecutor: (p: Prosecutor) => void;
  setEvidence: (e: Evidence[]) => void;
  addEvidence: (e: Evidence) => void;
  addDialogue: (d: DialogueMessage) => void;
  clearDialogue: () => void;
  setHp: (hp: number) => void;
  setMaxHp: (m: number) => void;
  setLocations: (l: InvestigationLocation[]) => void;
  setCurrentLocation: (l: any) => void;
  setTestimonyStatements: (s: TestimonyStatement[]) => void;
  updateStatement: (index: number, update: Partial<TestimonyStatement>) => void;
  setCurrentWitnessName: (n: string) => void;
  setCurrentWitnessAppearance: (a: string) => void;
  setVerdict: (v: 'guilty' | 'not_guilty') => void;
  reset: () => void;
}

const init: GameState = {
  roomCode: '', phase: 'lobby', myPlayerId: '', playerName: '',
  caseTitle: '', summary: '', defendant: null, victim: null, prosecutor: null,
  evidence: [], dialogue: [], hp: 5, maxHp: 5,
  locations: [], currentLocation: null,
  testimonyStatements: [], currentWitnessName: '', currentWitnessAppearance: '',
  verdict: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...init,
  setRoomCode: (c) => set({ roomCode: c }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setPlayerName: (n) => set({ playerName: n }),
  setPhase: (p) => set({ phase: p }),
  setCaseTitle: (t) => set({ caseTitle: t }),
  setSummary: (s) => set({ summary: s }),
  setDefendant: (d) => set({ defendant: d }),
  setVictim: (v) => set({ victim: v }),
  setProsecutor: (p) => set({ prosecutor: p }),
  setEvidence: (e) => set({ evidence: e }),
  addEvidence: (e) => set((s) => ({ evidence: [...s.evidence, e] })),
  addDialogue: (d) => set((s) => ({ dialogue: [...s.dialogue, d] })),
  clearDialogue: () => set({ dialogue: [] }),
  setHp: (hp) => set({ hp }),
  setMaxHp: (m) => set({ maxHp: m }),
  setLocations: (l) => set({ locations: l }),
  setCurrentLocation: (l) => set({ currentLocation: l }),
  setTestimonyStatements: (s) => set({ testimonyStatements: s }),
  updateStatement: (index, update) => set((s) => ({
    testimonyStatements: s.testimonyStatements.map(t => t.index === index ? { ...t, ...update } : t),
  })),
  setCurrentWitnessName: (n) => set({ currentWitnessName: n }),
  setCurrentWitnessAppearance: (a) => set({ currentWitnessAppearance: a }),
  setVerdict: (v) => set({ verdict: v }),
  reset: () => set(init),
}));
