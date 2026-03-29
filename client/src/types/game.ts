export type Phase =
  | 'lobby'
  | 'generating'
  | 'opening_prosecution'
  | 'opening_defense'
  | 'evidence'
  | 'witness_testimony'
  | 'witness_challenge'
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
  fake?: boolean;
  fakeReason?: string;
}

export interface TestimonyStatement {
  index: number;
  text: string;
  pressed?: boolean;
  broken?: boolean;
}

export interface Witness {
  name: string;
  occupation: string;
  relation: string;
  personality: string;
  testimony?: TestimonyStatement[];
}

export interface Defendant {
  name: string;
  age: number;
  occupation: string;
  background: string;
}

export interface OpeningChoice {
  id: string;
  text: string;
  impact: 'strong' | 'medium' | 'weak';
}

export interface CaseInfo {
  case_title: string;
  case_type: string;
  summary: string;
  defendant: Defendant;
  prosecution_theory: string;
  defense_theory: string;
  witnesses: Witness[];
  myEvidence?: Evidence[];
  openings?: OpeningChoice[];
  closings?: OpeningChoice[];
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: Role;
  ready: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'prosecution' | 'defense' | 'judge' | 'witness' | 'system';
  content: string;
  timestamp: number;
  type?: string;
}

export type ObjectionType = '矛盾' | '関係なし' | '誘導尋問' | '根拠なし' | '偽証' | 'その他';

export interface JurorState {
  index: number;
  name: string;
  nickname: string;
  type: string;
  vote: '有罪' | '無罪';
  reason: string;
  comment: string;
  reaction: string;
  locked: boolean;
  persuadability: number;
}

export interface JurorVerdictReveal {
  index: number;
  name: string;
  nickname?: string;
  vote: '有罪' | '無罪';
  comment?: string;
  revealed: boolean;
}

export interface HpState {
  prosecution: number;
  defense: number;
}

export interface GameState {
  roomCode: string;
  phase: Phase;
  players: PlayerInfo[];
  myRole: Role;
  myPlayerId: string;
  caseInfo: CaseInfo | null;
  myEvidence: Evidence[];
  publicEvidence: Evidence[];
  jurors: JurorState[];
  chatMessages: ChatMessage[];
  currentTurn: 'prosecution' | 'defense' | null;
  turnNumber: number;
  maxTurns: number;
  objectionsRemaining: { prosecution: number; defense: number };
  timer: number;
  timerMax: number;
  hp: HpState;
  // Witness/Testimony
  testimonyStatements: TestimonyStatement[];
  currentWitnessName: string;
  // Verdict
  verdictRevealed: JurorVerdictReveal[];
  truth: { guilty: boolean; reason: string } | null;
  winner: 'prosecution' | 'defense' | null;
}
