import type { Timestamp } from "firebase/firestore";

export type CategoryKey =
  | "Mult"
  | "Div"
  | "Frac"
  | "Pct"
  | "Pow"
  | "Base"
  | "NT"
  | "Alg"
  | "Geo"
  | "Seq"
  | "Word"
  | "Misc";

export type Category = {
  key: CategoryKey | "All";
  label: string;
};

export type Trick = {
  id: string;
  cat: CategoryKey;
  name: string;
  example: string;
  best: string;
  difficulty: 1 | 2 | 3;
};

export type GeneratedProblem = {
  prompt: string;
  expected: number | string;
};

export type PerQuestion = {
  problem: string;
  answer: string;
  expected: number | string;
  correct: boolean;
  ms: number;
};

export type DrillResult = {
  trickId: string;
  startedAt: Timestamp;
  totalMs: number;
  score: string;
  perQuestion: PerQuestion[];
};

export type Best = {
  bestMs: number;
  attempts: number;
  correct: number;
  lastAttemptAt: Timestamp;
};

export type UserProfile = {
  displayName: string;
  school: string;
  avatarInitials: string;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
};

export type Tweaks = {
  theme: "sage" | "ink" | "mono" | "arcade";
  density: "comfortable" | "dense" | "list";
  monoNumerals: boolean;
};

export type LeaderboardEntry = {
  uid: string;
  bestMs: number;
  displayName: string;
  school: string;
  updatedAt: Timestamp;
};

export type RoomVisibility = "public" | "private";
export type RoomState = "lobby" | "racing" | "ended";

export type RoomPlayer = {
  displayName: string;
  avatarInitials: string;
  solved: number;
  joinedAt: number;
  finishedAt: number | null;
};

export type Room = {
  host: string;
  trickId: string;
  seed: number;
  questionCount: number;
  visibility: RoomVisibility;
  state: RoomState;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  winnerUid: string | null;
  players: Record<string, RoomPlayer>;
};

// === Zetamac ===
export type ZetamacOperator = "+" | "-" | "*" | "/";

export type ZetamacRange = readonly [number, number];

export type ZetamacConfig = {
  operators: readonly ZetamacOperator[];
  durationSeconds: number;
  addRange: ZetamacRange;
  subRange: ZetamacRange;
  mulARange: ZetamacRange;
  mulBRange: ZetamacRange;
  divDivisorRange: ZetamacRange;
  divQuotientRange: ZetamacRange;
};

export type ZetamacProblem = {
  a: number;
  op: ZetamacOperator;
  b: number;
  answer: number;
};

export type ZetamacStatus = "idle" | "running" | "ended";

export type ZetamacState = {
  config: ZetamacConfig;
  seed: number;
  current: ZetamacProblem;
  input: string;
  score: number;
  secondsLeft: number;
  status: ZetamacStatus;
  startedAt: number | null;
};

// === AI Test ===
export type AITestAnswerForm =
  | "integer"
  | "fraction"
  | "mixed"
  | "decimal"
  | "base"
  | "ratio"
  | "other";

export type AITestQuestion = {
  number: number;
  prompt: string;
  answer: string;
  form: AITestAnswerForm;
  base?: number;
  category: string;
};

export type AITestPaper = {
  generatedAt: number;
  questions: AITestQuestion[];
};

export type AITestGradeItem = {
  number: number;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  blank: boolean;
};

export type AITestGrade = {
  numberCorrect: number;
  lastQuestion: number;
  score: number;
  items: AITestGradeItem[];
};

// === Twenty-Four ===
export type TwentyFourOperator = "+" | "-" | "*" | "/";

export type TwentyFourMove = {
  a: string;
  op: TwentyFourOperator;
  b: string;
  result: string;
};

export type TwentyFourStatus = "idle" | "running" | "ended";

export type TwentyFourState = {
  seed: number;
  hand: string[];
  history: TwentyFourMove[];
  selected: number[];
  operator: TwentyFourOperator | null;
  score: number;
  solvedCount: number;
  secondsLeft: number;
  status: TwentyFourStatus;
  startedAt: number | null;
};
