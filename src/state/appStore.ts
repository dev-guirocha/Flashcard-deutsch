import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyBackupImport,
  applyWordsImport,
  getAllCardProgress,
  getAllScores,
  getAllWords,
  getTopScores,
  recordCardReview,
  saveScore,
} from "../data/wordsRepo";
import { ensureSeed } from "../data/seedLoader";
import { migrate } from "../data/migrations";
import {
  BackupScore,
  CardProgressRow,
  Mode,
  Pos,
  ReviewStats,
  RunPreset,
  ScoreRow,
  Word,
} from "../types";
import {
  advance,
  buildRun,
  nextCard,
  RunState,
  skip,
  submitMc,
  submitType,
} from "../domain/gameEngine";
import {
  buildBackupPayload,
  parseBackupJson,
  parseWordsCsv,
  toBackupJson,
  toWordsCsv,
} from "../domain/backup";

const EMPTY_REVIEW_STATS: ReviewStats = {
  dueCount: 0,
  trackedCount: 0,
  masteredCount: 0,
  newCount: 0,
};

function labelFor(word: Word) {
  return (word.gloss || word.pt || word.en || "").trim();
}

function isArticleTrainingWord(word: Word) {
  const hasNounSignal = word.pos === "NOUN" || !!word.article || !!word.deWithArticle;
  return hasNounSignal && labelFor(word).length > 0;
}

function toProgressMap(rows: CardProgressRow[]) {
  const out: Record<number, CardProgressRow> = {};
  for (const row of rows) {
    out[row.wordId] = row;
  }
  return out;
}

function shuffleWords(words: Word[]) {
  const out = [...words];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function computeReviewStats(
  words: Word[],
  progressMap: Record<number, CardProgressRow>,
  now = Date.now()
): ReviewStats {
  if (!words.length) return EMPTY_REVIEW_STATS;

  let dueCount = 0;
  let trackedCount = 0;
  let masteredCount = 0;

  for (const word of words) {
    const progress = progressMap[word.id];
    if (!progress) continue;
    trackedCount += 1;
    if (progress.dueAt <= now) dueCount += 1;
    if (progress.box >= 5) masteredCount += 1;
  }

  return {
    dueCount,
    trackedCount,
    masteredCount,
    newCount: Math.max(words.length - trackedCount, 0),
  };
}

function prioritizeWordsForRun(
  words: Word[],
  progressMap: Record<number, CardProgressRow>,
  preset: RunPreset,
  now = Date.now()
) {
  const due: Word[] = [];
  const scheduled: Word[] = [];
  const fresh: Word[] = [];

  for (const word of words) {
    const progress = progressMap[word.id];
    if (!progress) {
      fresh.push(word);
      continue;
    }

    if (progress.dueAt <= now) due.push(word);
    else scheduled.push(word);
  }

  due.sort((a, b) => (progressMap[a.id]?.dueAt ?? 0) - (progressMap[b.id]?.dueAt ?? 0));
  scheduled.sort((a, b) => (progressMap[a.id]?.dueAt ?? 0) - (progressMap[b.id]?.dueAt ?? 0));

  if (preset === "REVIEW_DUE") {
    return due.length > 0 ? due : [...shuffleWords(fresh), ...scheduled];
  }

  return [...due, ...shuffleWords(fresh), ...scheduled];
}

type StartRunOptions = {
  onlyPos?: Pos;
  onlyArticles?: boolean;
};

export function useAppModel() {
  const [ready, setReady] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, CardProgressRow>>({});
  const [reviewStats, setReviewStats] = useState<ReviewStats>(EMPTY_REVIEW_STATS);
  const [run, setRun] = useState<RunState | null>(null);
  const articleTrainableCount = useMemo(
    () => words.filter((w) => isArticleTrainingWord(w)).length,
    [words]
  );

  const loadAllData = useCallback(async () => {
    const [w, progressRows, s] = await Promise.all([
      getAllWords(),
      getAllCardProgress(),
      getTopScores(20),
    ]);
    const progressByWord = toProgressMap(progressRows);
    setWords(w);
    setProgressMap(progressByWord);
    setReviewStats(computeReviewStats(w, progressByWord));
    setScores(s);
  }, []);

  useEffect(() => {
    (async () => {
      await migrate();
      await ensureSeed();
      await loadAllData();
      setReady(true);
    })().catch((e) => {
      console.error("Init error", e);
    });
  }, [loadAllData]);

  const actions = useMemo(
    () => ({
      async refreshScores() {
        const s = await getTopScores(20);
        setScores(s);
      },
      startRun(mode: Mode, preset: RunPreset = "STANDARD", options: StartRunOptions = {}) {
        let sourceWords = words;
        if (options.onlyArticles) {
          sourceWords = sourceWords.filter((w) => isArticleTrainingWord(w));
        } else if (options.onlyPos) {
          sourceWords = sourceWords.filter((w) => w.pos === options.onlyPos);
        }
        const prioritized = prioritizeWordsForRun(sourceWords, progressMap, preset);
        const poolSize = Math.min(60, prioritized.length);
        if (poolSize === 0) {
          setRun(null);
          return false;
        }
        const base = buildRun(prioritized, mode, { shufflePool: false, poolSize, runSize: 0 });
        const withCard = nextCard(base);
        setRun(withCard);
        return true;
      },
      next() {
        setRun((r) => {
          if (!r) return r;
          const advanced = advance(r);
          const withCard = nextCard(advanced);
          return withCard;
        });
      },
      doSkip() {
        setRun((r) => {
          if (!r) return r;
          if (r.remainingSkips <= 0) return r;
          const skipped = skip(r);
          const advanced = advance(skipped);
          return nextCard(advanced);
        });
      },
      answerMc(optionId: number) {
        if (!run || !run.card || run.feedback) return;

        const wordId = run.card.correctWord.id;
        const updated = submitMc(run, optionId);
        setRun(updated);

        if (!updated.feedback) return;
        void recordCardReview(wordId, updated.feedback.ok)
          .then((saved) => {
            setProgressMap((prev) => {
              const next = { ...prev, [saved.wordId]: saved };
              setReviewStats(computeReviewStats(words, next));
              return next;
            });
          })
          .catch((e) => console.error("review save error", e));
      },
      answerType(text: string) {
        if (!run || !run.card || run.feedback) return;

        const wordId = run.card.correctWord.id;
        const updated = submitType(run, text);
        setRun(updated);

        if (!updated.feedback) return;
        void recordCardReview(wordId, updated.feedback.ok)
          .then((saved) => {
            setProgressMap((prev) => {
              const next = { ...prev, [saved.wordId]: saved };
              setReviewStats(computeReviewStats(words, next));
              return next;
            });
          })
          .catch((e) => console.error("review save error", e));
      },
      async finishAndSave(playerName?: string) {
        if (!run) return;
        const effectiveRunSize = run.runSize > 0 ? run.runSize : Math.max(run.index, 1);
        await saveScore({
          points: run.score,
          timestamp: Date.now(),
          mode: run.mode,
          runSize: effectiveRunSize,
          playerName: playerName || null,
        });
        const s = await getTopScores(20);
        setScores(s);
        setRun(null);
      },
      abandonRun() {
        setRun(null);
      },
      async exportBackupJson() {
        const [allWords, allProgress, allScores] = await Promise.all([
          getAllWords(),
          getAllCardProgress(),
          getAllScores(),
        ]);
        const payload = buildBackupPayload({
          words: allWords,
          cardProgress: allProgress,
          scores: allScores.map((s) => ({
            points: s.points,
            timestamp: s.timestamp,
            mode: s.mode,
            runSize: s.runSize,
            playerName: s.playerName ?? null,
          })),
        });
        return toBackupJson(payload);
      },
      async exportWordsCsv() {
        const allWords = await getAllWords();
        return toWordsCsv(allWords);
      },
      async importBackupJson(content: string) {
        const parsed = parseBackupJson(content);
        if (!parsed.words.length) throw new Error("Backup sem palavras para importar.");

        const validWordIds = new Set(parsed.words.map((w) => w.id));
        const validProgress = parsed.cardProgress.filter((p) => validWordIds.has(p.wordId));
        const validScores: BackupScore[] = parsed.scores.map((s) => ({
          points: Number.isFinite(s.points) ? Math.max(Math.trunc(s.points), 0) : 0,
          timestamp: Number.isFinite(s.timestamp) ? Math.trunc(s.timestamp) : Date.now(),
          mode: s.mode === "TYPE_GLOSS_TO_DE" ? "TYPE_GLOSS_TO_DE" : "MC_DE_TO_GLOSS",
          runSize: Number.isFinite(s.runSize) ? Math.max(Math.trunc(s.runSize), 0) : 0,
          playerName: s.playerName ?? null,
        }));

        await applyBackupImport({
          words: parsed.words,
          cardProgress: validProgress,
          scores: validScores,
        });
        await loadAllData();
        setRun(null);
        return {
          words: parsed.words.length,
          progress: validProgress.length,
          scores: validScores.length,
        };
      },
      async importWordsCsv(content: string) {
        const parsedWords = parseWordsCsv(content);
        await applyWordsImport({ words: parsedWords });
        await loadAllData();
        setRun(null);
        return { words: parsedWords.length };
      },
      async installStarterArticlesDeck() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const starterDeck = require("../../assets/decks/articles_a1_min.json") as Word[];
        if (!Array.isArray(starterDeck) || starterDeck.length === 0) {
          throw new Error("Deck mínimo inválido.");
        }
        await applyWordsImport({ words: starterDeck });
        await loadAllData();
        setRun(null);
        return { words: starterDeck.length };
      },
    }),
    [words, run, progressMap, loadAllData]
  );

  return { ready, words, scores, run, reviewStats, articleTrainableCount, actions };
}
