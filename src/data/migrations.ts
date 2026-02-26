import { execAsync } from "./db";

export async function migrate() {
  await execAsync(`
    PRAGMA journal_mode = WAL;
  `);

  await execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY NOT NULL,
      de TEXT NOT NULL,
      lemma TEXT NOT NULL,
      gloss TEXT NOT NULL,
      pt TEXT,
      en TEXT,
      exampleDe TEXT,
      exampleGloss TEXT,
      pos TEXT NOT NULL,
      rank INTEGER NOT NULL,
      gender TEXT,
      article TEXT,
      deWithArticle TEXT,
      aliasesPt TEXT NOT NULL,
      aliasesEn TEXT NOT NULL,
      aliasesDe TEXT NOT NULL,
      tags TEXT NOT NULL
    );
  `);

  await execAsync(`
    CREATE INDEX IF NOT EXISTS idx_words_rank ON words(rank);
  `);
  await execAsync(`
    CREATE INDEX IF NOT EXISTS idx_words_pos ON words(pos);
  `);

  await execAsync(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      points INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      mode TEXT NOT NULL,
      runSize INTEGER NOT NULL,
      playerName TEXT
    );
  `);

  await execAsync(`
    CREATE TABLE IF NOT EXISTS card_progress (
      wordId INTEGER PRIMARY KEY NOT NULL,
      box INTEGER NOT NULL DEFAULT 1,
      dueAt INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      wrong INTEGER NOT NULL DEFAULT 0,
      lastReviewedAt INTEGER
    );
  `);

  await execAsync(`
    CREATE INDEX IF NOT EXISTS idx_progress_due ON card_progress(dueAt);
  `);

  // Add new columns if database already exists
  const addColumn = async (sql: string) => {
    try {
      await execAsync(sql);
    } catch (e) {
      const msg = String(e?.message || e);
      if (!msg.includes("duplicate column name")) throw e;
    }
  };

  await addColumn(`ALTER TABLE words ADD COLUMN exampleDe TEXT;`);
  await addColumn(`ALTER TABLE words ADD COLUMN exampleGloss TEXT;`);
}
