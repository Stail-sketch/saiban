// === AI逆転裁判 — 型定義 ===

export type Phase =
  | 'lobby'
  | 'generating'
  | 'intro'           // 事件導入
  | 'investigation'   // 探偵パート（証拠集め・聞き込み）
  | 'court_ready'     // 法廷準備
  | 'testimony'       // 証人の証言表示
  | 'cross_exam'      // 尋問（ゆさぶる / つきつける）
  | 'objection_moment'// 異議あり！演出中
  | 'breakdown'       // 証人崩壊演出
  | 'verdict'         // 判決
  | 'result';

export interface Evidence {
  id: string;
  name: string;
  type: string;
  description: string;
  detail: string; // 法廷記録で見れる詳細
  sprite: string; // アイコン用テキスト絵文字
}

export interface TestimonyStatement {
  index: number;
  text: string;
  contradiction: {
    evidenceId: string; // この証拠でつきつけると矛盾
    explanation: string; // なぜ矛盾するかの説明
  } | null;
  pressDialogue: string[]; // ゆさぶり時の会話（証人→弁護士→証人...）
  pressed: boolean;
  broken: boolean;
}

export interface Witness {
  name: string;
  age: number;
  occupation: string;
  personality: string;
  appearance: string; // 見た目の描写
  testimony: TestimonyStatement[];
  breakdownDialogue: string[]; // 崩壊時のセリフ群
}

export interface InvestigationLocation {
  id: string;
  name: string;
  description: string;
  people: { name: string; dialogue: string[] }[];
  clues: { evidenceId: string; findDescription: string; found: boolean }[];
}

export interface Defendant {
  name: string;
  age: number;
  occupation: string;
  background: string;
  personality: string;
}

export interface Scenario {
  case_title: string;
  case_number: number;
  summary: string; // 冒頭で表示される事件概要
  date: string;
  location: string;
  defendant: Defendant;
  victim: { name: string; age: number; occupation: string; cause: string };
  truth_summary: string;
  real_culprit: string; // 真犯人の名前
  evidence: Evidence[]; // 全証拠（調査で集める）
  initial_evidence: string[]; // 最初から持ってる証拠ID
  witnesses: Witness[];
  investigation_locations: InvestigationLocation[];
  prosecutor: { name: string; personality: string }; // AI検察官
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  ready: boolean;
  hp: number; // ライフ（初期5）
}

export interface ChatMessage {
  id: string;
  speaker: string;
  speakerType: 'defense' | 'prosecutor' | 'judge' | 'witness' | 'narrator' | 'system';
  content: string;
  timestamp: number;
  emotion?: string; // normal, angry, shocked, nervous, smirk, breakdown
}

export interface GameRoom {
  code: string;
  host: string;
  players: Map<string, Player>;
  phase: Phase;
  scenario: Scenario | null;
  collectedEvidence: string[]; // 収集済み証拠ID
  chatMessages: ChatMessage[];
  currentWitnessIndex: number;
  currentStatementIndex: number;
  penaltyCount: number; // ペナルティ回数
  maxPenalties: number; // 最大ペナルティ（5）
  timer: ReturnType<typeof setTimeout> | null;
  timerEnd: number;
  timerDuration: number;
  testimonyLoop: number; // 何周目の証言か
  createdAt: number;
}
