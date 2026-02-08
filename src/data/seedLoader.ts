import { allAsync, execAsync, runAsync } from "./db";
import { Word } from "../types";

// Bump this when you replace assets/words_v1.json
export const SEED_VERSION = 4;

function safeJsonArray(v: any): any[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [];
}

export async function ensureSeed() {
  const rows = await allAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'seedVersion' LIMIT 1`
  );
  const current = rows.length ? parseInt(rows[0].value, 10) : 0;
  if (current === SEED_VERSION) {
    // If examples are missing, force re-seed
    try {
      const ex = await allAsync<{ exampleDe: string }>(
        `SELECT exampleDe FROM words WHERE exampleDe IS NOT NULL AND exampleDe != '' LIMIT 1`
      );
      if (ex.length > 0) return;
    } catch {
      // ignore and re-seed
    }
  }

  // wipe + reimport (MVP)
  await execAsync(`DELETE FROM words;`);

  // NOTE: You MUST have assets/words_v1.json
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require("../../assets/words_v1.json") as Word[];

  // Batch insert in a single transaction for speed
  await execAsync("BEGIN;");
  try {
    for (const w of data) {
      const aliasesPt = JSON.stringify(safeJsonArray(w.aliasesPt));
      const aliasesEn = JSON.stringify(safeJsonArray(w.aliasesEn));
      const aliasesDe = JSON.stringify(safeJsonArray(w.aliasesDe));
      const tags = JSON.stringify(safeJsonArray(w.tags));

      await runAsync(
        `INSERT INTO words
          (id, de, lemma, gloss, pt, en, pos, rank, gender, article, deWithArticle, exampleDe, exampleGloss, aliasesPt, aliasesEn, aliasesDe, tags)
         VALUES
          (?,  ?,   ?,     ?,     ?,  ?,  ?,   ?,    ?,      ?,       ?,           ?,         ?,            ?,        ?,        ?,        ?)`,
        [
          w.id,
          w.de,
          w.lemma,
          w.gloss || w.pt || w.en || "",
          w.pt || null,
          w.en || null,
          w.pos || "OTHER",
          w.rank || w.id,
          w.gender || null,
          w.article || null,
          w.deWithArticle || null,
          w.exampleDe || null,
          w.exampleGloss || null,
          aliasesPt,
          aliasesEn,
          aliasesDe,
          tags,
        ]
      );
    }

    await runAsync(
      `INSERT INTO meta (key, value)
       VALUES ('seedVersion', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(SEED_VERSION)]
    );

    await execAsync("COMMIT;");
  } catch (e) {
    await execAsync("ROLLBACK;");
    throw e;
  }
}
