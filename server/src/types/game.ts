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
  fake: boolean; // ニセモノかどうか（所有者のみ見える）
  fakeReason?: string; // ニセモノの理由
}

export interface TestimonyStatement {
  index: number;
  text: string;
  challengeEvidenceId: string | null; // この文を崩せる証拠ID（nullなら崩せない）
  isContradiction: boolean; // 矛盾を含む文かどうか
  pressed: boolean; // ゆさぶり済み
  broken: boolean; // 崩れた
  pressResponse: string; // ゆさぶり時の証人の反応
}

export interface Witness {
  name: string;
  occupation: string;
  relation: string;
  personality: string;
  testimony: TestimonyStatement[];
  hidden_info: string;
  weakness: string;
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
  prosecution_openings: OpeningChoice[];
  defense_openings: OpeningChoice[];
  prosecution_closings: OpeningChoice[];
  defense_closings: OpeningChoice[];
}

export interface JurorState {
  index: number;
  name: string;
  nickname: string;
  type: string;
  vote: '有罪' | '無罪';
  reason: string;
  comment: string;
  reaction: 'neutral' | 'surprised' | 'convinced' | 'dismissive' | 'confused' | 'shocked';
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
  hp: number; // 信用ゲージ（初期5）
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'prosecution' | 'defense' | 'judge' | 'witness' | 'system';
  content: string;
  timestamp: number;
  type?: 'normal' | 'objection' | 'ruling' | 'testimony_break' | 'hp_change' | 'bluff_caught';
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
  maxTurns: number;
  prosecutionTurns: number;
  defenseTurns: number;
  objectionsRemaining: { prosecution: number; defense: number };
  timer: ReturnType<typeof setTimeout> | null;
  timerEnd: number;
  timerDuration: number;
  currentWitnessIndex: number;
  witnessExamTurn: 'prosecution' | 'defense' | null;
  createdAt: number;
}
