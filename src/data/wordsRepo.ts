import { allAsync, runAsync } from "./db";
import { Mode, ScoreRow, Word } from "../types";

function parseJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
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
