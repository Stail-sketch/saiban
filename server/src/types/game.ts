export type Phase =
  | 'lobby'
  | 'generating'
  | 'opening_prosecution'
  | 'opening_defense'
  | 'evidence'
  | 'closing_prosecution'
  | 'closing_defense'
  | 'verdict'
  | 'truth'
  | 'result';

export type Role = 'prosecution' | 'defense' | 'spectator';

export type EvidenceType = '物証' | '証言録' | 'アリバイ' | '動機資料';
export type EvidenceStrength = 'strong' | 'medium' | 'weak';

export interface Evidence {
  id: string;
  name: string;
  type: EvidenceType;
  description: string;
  strength: EvidenceStrength;
  side: 'prosecution' | 'defense';
  affects_juror_types: string[];
}

export interface Witness {
  name: string;
  occupation: string;
  relation: string;
  testimony: string;
  hidden_info: string;
  weakness: string;
}

export interface Defendant {
  name: string;
  age: number;
  occupation: string;
  background: string;
}

export interface Scenario {
  case_title: string;
  case_type: string;
  summary: string;
  defendant: Defendant;
  truth: 'guilty' | 'not_guilty';
  truth_reason: string;
  prosecution_theory: string;
  defense_theory: string;
  witnesses: Witness[];
  prosecution_evidence: Evidence[];
  defense_evidence: Evidence[];
}

export interface JurorState {
  index: number;
  name: string;
  nickname: string;
  type: string;
  vote: '有罪' | '無罪';
  reason: string;
  comment: string;
  reaction: 'neutral' | 'surprised' | 'convinced' | 'dismissive' | 'confused';
  locked: boolean;
  lockedUntilTurn: number;
  persuadability: number;
  moveCondition: string;
  description: string;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  role: Role;
  ready: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'prosecution' | 'defense' | 'judge' | 'system';
  content: string;
  timestamp: number;
}

export interface GameRoom {
  code: string;
  host: string;
  players: Map<string, Player>;
  phase: Phase;
  scenario: Scenario | null;
  jurors: JurorState[];
  publicEvidence: Evidence[];
  chatMessages: ChatMessage[];
  currentTurn: 'prosecution' | 'defense' | null;
  turnNumber: number;
  maxTurns: number; // 10 total (5 each)
  prosecutionTurns: number;
  defenseTurns: number;
  objectionsRemaining: { prosecution: number; defense: number };
  timer: ReturnType<typeof setTimeout> | null;
  timerEnd: number;
  timerDuration: number;
  witnessOnStand: Witness | null;
  witnessChat: { role: string; content: string }[];
  witnessExchanges: number;
  createdAt: number;
}
