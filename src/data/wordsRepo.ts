import { allAsync, execAsync, runAsync } from "./db";
import { BackupScore, CardProgressRow, Mode, ScoreRow, Word } from "../types";
import { updateAfterReview } from "../domain/srsLeitner";

const CUSTOM_DECK_META_KEY = "customDeckInstalled";

function parseJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function safeJsonArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((item) => typeof item === "string") as string[];
  return [];
}

async function insertWord(word: Word) {
  await runAsync(
    `INSERT INTO words
      (id, de, lemma, gloss, pt, en, pos, rank, gender, article, deWithArticle, exampleDe, exampleGloss, aliasesPt, aliasesEn, aliasesDe, tags)
     VALUES
      (?,  ?,   ?,     ?,     ?,  ?,  ?,   ?,    ?,      ?,       ?,           ?,         ?,            ?,        ?,        ?,        ?)`,
    [
      word.id,
      word.de,
      word.lemma,
      word.gloss || word.pt || word.en || "",
      word.pt || null,
      word.en || null,
      word.pos || "OTHER",
      word.rank || word.id,
      word.gender || null,
      word.article || null,
      word.deWithArticle || null,
      word.exampleDe || null,
      word.exampleGloss || null,
      JSON.stringify(safeJsonArray(word.aliasesPt)),
      JSON.stringify(safeJsonArray(word.aliasesEn)),
      JSON.stringify(safeJsonArray(word.aliasesDe)),
      JSON.stringify(safeJsonArray(word.tags)),
    ]
  );
}

export async function getAllWords(): Promise<Word[]> {
  const rows = await allAsync<any>(`SELECT * FROM words ORDER BY rank ASC`);
  return rows.map((r) => ({
    id: r.id,
    de: r.de,
    lemma: r.lemma,
    gloss: r.gloss,
    pt: r.pt ?? undefined,
    en: r.en ?? undefined,
    exampleDe: r.exampleDe ?? undefined,
    exampleGloss: r.exampleGloss ?? undefined,
    pos: r.pos,
    rank: r.rank,
    gender: r.gender ?? undefined,
    article: r.article ?? undefined,
    deWithArticle: r.deWithArticle ?? undefined,
    aliasesPt: parseJsonArray(r.aliasesPt),
    aliasesEn: parseJsonArray(r.aliasesEn),
    aliasesDe: parseJsonArray(r.aliasesDe),
    tags: parseJsonArray(r.tags),
  }));
}

export async function saveScore(input: {
  points: number;
  timestamp: number;
  mode: Mode;
  runSize: number;
  playerName?: string | null;
}) {
  await runAsync(
    `INSERT INTO scores (points, timestamp, mode, runSize, playerName) VALUES (?, ?, ?, ?, ?)`,
    [input.points, input.timestamp, input.mode, input.runSize, input.playerName ?? null]
  );
}

export async function getTopScores(limit = 20): Promise<ScoreRow[]> {
  return allAsync<ScoreRow>(
    `SELECT id, points, timestamp, mode, runSize, playerName
     FROM scores
     ORDER BY points DESC, timestamp DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getAllScores(): Promise<ScoreRow[]> {
  return allAsync<ScoreRow>(
    `SELECT id, points, timestamp, mode, runSize, playerName
     FROM scores
     ORDER BY timestamp DESC`
  );
}

export async function getAllCardProgress(): Promise<CardProgressRow[]> {
  return allAsync<CardProgressRow>(
    `SELECT wordId, box, dueAt, correct, wrong, lastReviewedAt FROM card_progress`
  );
}

export async function saveCardProgress(progress: CardProgressRow) {
  await runAsync(
    `INSERT INTO card_progress (wordId, box, dueAt, correct, wrong, lastReviewedAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(wordId) DO UPDATE SET
       box = excluded.box,
       dueAt = excluded.dueAt,
       correct = excluded.correct,
       wrong = excluded.wrong,
       lastReviewedAt = excluded.lastReviewedAt`,
    [
      progress.wordId,
      progress.box,
      progress.dueAt,
      progress.correct,
      progress.wrong,
      progress.lastReviewedAt ?? null,
    ]
  );
}

async function getCardProgressByWordId(wordId: number): Promise<CardProgressRow | null> {
  const rows = await allAsync<CardProgressRow>(
    `SELECT wordId, box, dueAt, correct, wrong, lastReviewedAt
     FROM card_progress
     WHERE wordId = ?
     LIMIT 1`,
    [wordId]
  );
  return rows[0] ?? null;
}

export async function recordCardReview(wordId: number, ok: boolean, now = Date.now()) {
  const current = await getCardProgressByWordId(wordId);
  const prevBox = current?.box ?? 1;
  const next = updateAfterReview(prevBox, ok, now);

  const progress: CardProgressRow = {
    wordId,
    box: next.box,
    dueAt: next.dueAt,
    correct: (current?.correct ?? 0) + (ok ? 1 : 0),
    wrong: (current?.wrong ?? 0) + (ok ? 0 : 1),
    lastReviewedAt: now,
  };

  await saveCardProgress(progress);
  return progress;
}

export async function applyBackupImport(input: {
  words: Word[];
  cardProgress: CardProgressRow[];
  scores: BackupScore[];
}) {
  await execAsync("BEGIN;");
  try {
    await execAsync(`DELETE FROM card_progress;`);
    await execAsync(`DELETE FROM scores;`);
    await execAsync(`DELETE FROM words;`);

    for (const word of input.words) {
      await insertWord(word);
    }

    for (const progress of input.cardProgress) {
      await runAsync(
        `INSERT INTO card_progress (wordId, box, dueAt, correct, wrong, lastReviewedAt)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(wordId) DO UPDATE SET
           box = excluded.box,
           dueAt = excluded.dueAt,
           correct = excluded.correct,
           wrong = excluded.wrong,
           lastReviewedAt = excluded.lastReviewedAt`,
        [
          progress.wordId,
          Math.min(Math.max(progress.box || 1, 1), 5),
          progress.dueAt || 0,
          progress.correct || 0,
          progress.wrong || 0,
          progress.lastReviewedAt ?? null,
        ]
      );
    }

    for (const score of input.scores) {
      await runAsync(
        `INSERT INTO scores (points, timestamp, mode, runSize, playerName) VALUES (?, ?, ?, ?, ?)`,
        [
          score.points || 0,
          score.timestamp || Date.now(),
          score.mode,
          score.runSize || 0,
          score.playerName ?? null,
        ]
      );
    }

    await runAsync(
      `INSERT INTO meta (key, value)
       VALUES (?, '1')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [CUSTOM_DECK_META_KEY]
    );

    await execAsync("COMMIT;");
  } catch (e) {
    await execAsync("ROLLBACK;");
    throw e;
  }
}

export async function applyWordsImport(input: { words: Word[] }) {
  await execAsync("BEGIN;");
  try {
    await execAsync(`DELETE FROM card_progress;`);
    await execAsync(`DELETE FROM words;`);

    for (const word of input.words) {
      await insertWord(word);
    }

    await runAsync(
      `INSERT INTO meta (key, value)
       VALUES (?, '1')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [CUSTOM_DECK_META_KEY]
    );

    await execAsync("COMMIT;");
  } catch (e) {
    await execAsync("ROLLBACK;");
    throw e;
  }
}
