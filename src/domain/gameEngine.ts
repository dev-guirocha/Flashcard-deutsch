import { Mode, Word } from "../types";
import { normalizeDe, normalizePt } from "./normalizer";
import { scoreForCorrect } from "./scoring";

export type McCard = {
  kind: "MC";
  promptDe: string;
  promptTtsDe: string;
  options: { id: number; label: string; isCorrect: boolean }[];
  correctWord: Word;
};

export type TypeCard = {
  kind: "TYPE";
  promptGloss: string;
  promptTtsDe: string; // we still speak the target de
  correctWord: Word;
};

export type Card = McCard | TypeCard;

export type RunState = {
  mode: Mode;
  runSize: number;
  poolSize: number;
  remainingSkips: number;
  index: number; // 0..runSize-1
  score: number;
  streak: number;
  maxStreak: number;
  correctCount: number;
  card: Card | null;
  feedback: { ok: boolean; correct: string; user?: string } | null;
  pool: Word[]; // pre-shuffled
};

function labelFor(w: Word) {
  return (w.gloss || w.pt || w.en || "").trim();
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildRun(words: Word[], mode: Mode): RunState {
  const poolSize = 60;
  const runSize = 30;
  const filtered = words.filter((w) => labelFor(w).length > 0);
  const source = filtered.length > 0 ? filtered : words;
  const pool = shuffle(source).slice(0, poolSize);

  return {
    mode,
    runSize,
    poolSize,
    remainingSkips: 3,
    index: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    correctCount: 0,
    card: null,
    feedback: null,
    pool,
  };
}

function pickDistractors(all: Word[], correct: Word, n = 3) {
  const samePos = all.filter(
    (w) => w.id !== correct.id && w.pos === correct.pos && labelFor(w).length > 0
  );
  const fallback = all.filter((w) => w.id !== correct.id && labelFor(w).length > 0);
  const src = samePos.length >= n ? samePos : fallback;
  return shuffle(src).slice(0, n);
}

export function nextCard(state: RunState): RunState {
  if (state.index >= state.runSize) return state;

  const w = state.pool[state.index % state.pool.length];
  if (!w) return state;

  if (state.mode === "MC_DE_TO_GLOSS") {
    const distractors = pickDistractors(state.pool, w, 3);
    const options = shuffle([
      { id: w.id, label: labelFor(w), isCorrect: true },
      ...distractors.map((d) => ({
        id: d.id,
        label: labelFor(d),
        isCorrect: false,
      })),
    ]);

    const promptDe = w.deWithArticle || w.de;
    return {
      ...state,
      feedback: null,
      card: {
        kind: "MC",
        promptDe,
        promptTtsDe: w.lemma || w.de,
        options,
        correctWord: w,
      },
    };
  }

  // TYPE_GLOSS_TO_DE
  return {
    ...state,
    feedback: null,
    card: {
      kind: "TYPE",
      promptGloss: w.gloss || w.pt || w.en || "",
      promptTtsDe: w.lemma || w.de,
      correctWord: w,
    },
  };
}

export function submitMc(state: RunState, optionId: number): RunState {
  if (!state.card || state.card.kind !== "MC") return state;
  const ok = state.card.options.find((o) => o.id === optionId)?.isCorrect ?? false;
  const correct = state.card.correctWord.gloss || "";

  let score = state.score;
  let streak = state.streak;
  let maxStreak = state.maxStreak;
  let correctCount = state.correctCount;

  if (ok) {
    score += scoreForCorrect(streak);
    streak += 1;
    maxStreak = Math.max(maxStreak, streak);
    correctCount += 1;
  } else {
    streak = 0;
  }

  return {
    ...state,
    score,
    streak,
    maxStreak,
    correctCount,
    feedback: { ok, correct },
  };
}

export function submitType(state: RunState, userInput: string): RunState {
  if (!state.card || state.card.kind !== "TYPE") return state;

  const w = state.card.correctWord;

  const target1 = normalizeDe(w.deWithArticle || w.de);
  const target2 = normalizeDe(w.lemma || w.de);

  const user = normalizeDe(userInput);

  // accept with/without article if noun
  const ok =
    user === target1 ||
    user === target2 ||
    (w.article ? user === normalizeDe(`${w.article} ${w.lemma}`) : false);

  let score = state.score;
  let streak = state.streak;
  let maxStreak = state.maxStreak;
  let correctCount = state.correctCount;

  if (ok) {
    score += scoreForCorrect(streak);
    streak += 1;
    maxStreak = Math.max(maxStreak, streak);
    correctCount += 1;
  } else {
    streak = 0;
  }

  const correct = w.deWithArticle || w.lemma || w.de;
  return {
    ...state,
    score,
    streak,
    maxStreak,
    correctCount,
    feedback: { ok, correct, user: userInput },
  };
}

export function skip(state: RunState): RunState {
  if (state.remainingSkips <= 0) return state;
  return {
    ...state,
    remainingSkips: state.remainingSkips - 1,
    feedback: null,
  };
}

export function advance(state: RunState): RunState {
  const nextIndex = state.index + 1;
  return { ...state, index: nextIndex, feedback: null, card: null };
}
