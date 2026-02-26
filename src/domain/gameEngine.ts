import { Mode, Word } from "../types";
import { normalizeDe } from "./normalizer";
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
  // `runSize <= 0` means endless session
  runSize: number;
  poolSize: number;
  remainingSkips: number;
  index: number; // answered cards count
  score: number;
  streak: number;
  maxStreak: number;
  correctCount: number;
  card: Card | null;
  feedback: { ok: boolean; correct: string; user?: string } | null;
  pool: Word[]; // pre-shuffled
  dueSteps: Record<number, number>;
  cursor: number;
  lastWordId: number | null;
};

type BuildRunOptions = {
  poolSize?: number;
  runSize?: number;
  shufflePool?: boolean;
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

export function buildRun(words: Word[], mode: Mode, options: BuildRunOptions = {}): RunState {
  const poolSize = options.poolSize ?? 60;
  const runSize = options.runSize ?? 0;
  const shufflePool = options.shufflePool ?? true;
  const filtered = words.filter((w) => labelFor(w).length > 0);
  const source = filtered.length > 0 ? filtered : words;
  const ordered = shufflePool ? shuffle(source) : [...source];
  const pool = ordered.slice(0, poolSize);
  const dueSteps: Record<number, number> = {};
  for (const word of pool) dueSteps[word.id] = 0;

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
    dueSteps,
    cursor: 0,
    lastWordId: null,
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
  if (state.runSize > 0 && state.index >= state.runSize) return state;
  if (state.pool.length === 0) return state;

  const chooseIndex = (map: Record<number, number>) => {
    const n = state.pool.length;
    const allowRepeat = n === 1;
    for (let i = 0; i < n; i++) {
      const idx = (state.cursor + i) % n;
      const word = state.pool[idx];
      const due = map[word.id] ?? 0;
      if (due <= 0 && (allowRepeat || word.id !== state.lastWordId)) return idx;
    }
    return -1;
  };

  const decDue = (map: Record<number, number>, step: number) => {
    const out: Record<number, number> = {};
    for (const [id, due] of Object.entries(map)) {
      out[Number(id)] = Math.max((due ?? 0) - step, 0);
    }
    return out;
  };

  let dueSteps = { ...state.dueSteps };
  let selectedIndex = chooseIndex(dueSteps);

  if (selectedIndex < 0) {
    const candidates = state.pool
      .filter((w) => w.id !== state.lastWordId || state.pool.length === 1)
      .map((w) => dueSteps[w.id] ?? 0);
    const minDue = candidates.length > 0 ? Math.min(...candidates) : 0;
    if (minDue > 0) dueSteps = decDue(dueSteps, minDue);
    selectedIndex = chooseIndex(dueSteps);
  }

  if (selectedIndex < 0) selectedIndex = state.cursor % state.pool.length;

  const w = state.pool[selectedIndex];
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
      dueSteps,
      cursor: (selectedIndex + 1) % state.pool.length,
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
    dueSteps,
    cursor: (selectedIndex + 1) % state.pool.length,
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
  if (state.runSize > 0 && state.index >= state.runSize) return state;

  const decDue = (step = 1) => {
    const out: Record<number, number> = {};
    for (const [id, due] of Object.entries(state.dueSteps)) {
      out[Number(id)] = Math.max((due ?? 0) - step, 0);
    }
    return out;
  };

  let dueSteps = decDue(1);
  let cursor = state.cursor;
  let lastWordId = state.lastWordId;

  if (state.card) {
    const currentWordId = state.card.correctWord.id;
    const gap = state.feedback === null ? 1 : state.feedback.ok ? Math.min(12, 4 + state.streak) : 2;
    dueSteps[currentWordId] = gap;
    lastWordId = currentWordId;

    const currentIndex = state.pool.findIndex((w) => w.id === currentWordId);
    if (currentIndex >= 0) cursor = (currentIndex + 1) % Math.max(state.pool.length, 1);
  }

  const nextIndex = state.index + 1;
  return {
    ...state,
    index: nextIndex,
    dueSteps,
    cursor,
    lastWordId,
    feedback: null,
    card: null,
  };
}
