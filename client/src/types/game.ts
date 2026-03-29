export type Phase =
  | 'lobby' | 'generating' | 'intro' | 'investigation'
  | 'court_ready' | 'testimony' | 'cross_exam'
  | 'objection_moment' | 'breakdown' | 'verdict' | 'result';

export interface Evidence {
  id: string;
  name: string;
  type: string;
  description: string;
  detail: string;
  sprite: string;
}

export interface TestimonyStatement {
  index: number;
  text: string;
  pressed?: boolean;
  broken?: boolean;
}

export interface Defendant {
  name: string; age: number; occupation: string; background: string; personality: string;
}

export interface Victim {
  name: string; age: number; occupation: string; cause: string;
}

export interface Prosecutor {
  name: string; personality: string;
}

export interface DialogueMessage {
  id: string;
  speaker: string;
  speakerType: 'defense' | 'prosecutor' | 'judge' | 'witness' | 'narrator' | 'system';
  content: string;
  timestamp: number;
  emotion?: string;
}

export interface InvestigationLocation {
  id: string;
  name: string;
  description: string;
  people: string[];
  clueCount: number;
}

export interface GameState {
  roomCode: string;
  phase: Phase;
  myPlayerId: string;
  playerName: string;
  // Case info
  caseTitle: string;
  summary: string;
  defendant: Defendant | null;
  victim: Victim | null;
  prosecutor: Prosecutor | null;
  // Game state
  evidence: Evidence[];
  dialogue: DialogueMessage[];
  hp: number;
  maxHp: number;
  // Investigation
  locations: InvestigationLocation[];
  currentLocation: any | null;
  // Court
  testimonyStatements: TestimonyStatement[];
  currentWitnessName: string;
  currentWitnessAppearance: string;
  // Result
  verdict: 'guilty' | 'not_guilty' | null;
}
