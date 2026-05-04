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
