export type Pos =
  | "PRON"
  | "VERB"
  | "NOUN"
  | "ADJ"
  | "ADV"
  | "NUM"
  | "ADP"
  | "CONJ"
  | "DET"
  | "PART"
  | "INTJ"
  | "OTHER";

export type Word = {
  id: number;
  de: string; // surface (ist/bin/sind etc)
  lemma: string;
  gloss: string; // pt if exists else en
  pt?: string;
  en?: string;
  exampleDe?: string;
  exampleGloss?: string;
  pos: Pos;
  rank: number;
  gender?: "m" | "f" | "n";
  article?: "der" | "die" | "das";
  deWithArticle?: string;
  aliasesPt: string[];
  aliasesEn: string[];
  aliasesDe: string[];
  tags: string[];
};

export type Mode = "MC_DE_TO_GLOSS" | "TYPE_GLOSS_TO_DE";

export type ScoreRow = {
  id: number;
  points: number;
  timestamp: number;
  mode: Mode;
  runSize: number;
  playerName?: string | null;
};

export type CardProgressRow = {
  wordId: number;
  box: number;
  dueAt: number;
  correct: number;
  wrong: number;
  lastReviewedAt?: number | null;
};

export type ReviewStats = {
  dueCount: number;
  trackedCount: number;
  masteredCount: number;
  newCount: number;
};

export type RunPreset = "STANDARD" | "REVIEW_DUE";

export type BackupScore = {
  points: number;
  timestamp: number;
  mode: Mode;
  runSize: number;
  playerName?: string | null;
};

export type BackupPayloadV1 = {
  version: 1;
  exportedAt: number;
  words: Word[];
  cardProgress: CardProgressRow[];
  scores: BackupScore[];
};
