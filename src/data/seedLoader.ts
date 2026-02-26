import { allAsync, execAsync, runAsync } from "./db";
import { Word } from "../types";

// Bump this when you replace assets/words_v1.json
export const SEED_VERSION = 6;
const CUSTOM_DECK_META_KEY = "customDeckInstalled";

function safeJsonArray(v: any): any[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [];
}

async function upsertSeedWord(w: Word) {
  const aliasesPt = JSON.stringify(safeJsonArray(w.aliasesPt));
  const aliasesEn = JSON.stringify(safeJsonArray(w.aliasesEn));
  const aliasesDe = JSON.stringify(safeJsonArray(w.aliasesDe));
  const tags = JSON.stringify(safeJsonArray(w.tags));

  await runAsync(
    `INSERT INTO words
      (id, de, lemma, gloss, pt, en, pos, rank, gender, article, deWithArticle, exampleDe, exampleGloss, aliasesPt, aliasesEn, aliasesDe, tags)
     VALUES
      (?,  ?,   ?,     ?,     ?,  ?,  ?,   ?,    ?,      ?,       ?,           ?,         ?,            ?,        ?,        ?,        ?)
     ON CONFLICT(id) DO UPDATE SET
      de = excluded.de,
      lemma = excluded.lemma,
      gloss = excluded.gloss,
      pt = excluded.pt,
      en = excluded.en,
      pos = excluded.pos,
      rank = excluded.rank,
      gender = excluded.gender,
      article = excluded.article,
      deWithArticle = excluded.deWithArticle,
      exampleDe = excluded.exampleDe,
      exampleGloss = excluded.exampleGloss,
      aliasesPt = excluded.aliasesPt,
      aliasesEn = excluded.aliasesEn,
      aliasesDe = excluded.aliasesDe,
      tags = excluded.tags`,
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

export async function ensureSeed() {
  const cleanupOrphanProgress = async () => {
    await execAsync(
      `DELETE FROM card_progress WHERE wordId NOT IN (SELECT id FROM words)`
    ).catch(() => {
      // ignore for first run if table does not exist yet
    });
  };

  const rows = await allAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'seedVersion' LIMIT 1`
  );
  const customDeckRows = await allAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = ? LIMIT 1`,
    [CUSTOM_DECK_META_KEY]
  );
  const hasCustomDeck = customDeckRows[0]?.value === "1";

  if (hasCustomDeck) {
    await cleanupOrphanProgress();
    return;
  }

  const current = rows.length ? parseInt(rows[0].value, 10) : 0;
  if (current === SEED_VERSION) {
    // If examples are missing, force re-seed
    try {
      const ex = await allAsync<{ exampleDe: string }>(
        `SELECT exampleDe FROM words WHERE exampleDe IS NOT NULL AND exampleDe != '' LIMIT 1`
      );
      if (ex.length > 0) {
        await cleanupOrphanProgress();
        return;
      }
    } catch {
      // ignore and re-seed
    }
  }

  // Primary seed: normalized deck v2 (fallback to v1 for compatibility).
  let data: Word[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const seedV2 = require("../../assets/words_v2_skeleton.json") as { words?: Word[] } | Word[];
    data = Array.isArray(seedV2) ? seedV2 : seedV2.words || [];
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const seedV1 = require("../../assets/words_v1.json") as Word[];
    data = Array.isArray(seedV1) ? seedV1 : [];
  }
  if (!data.length) {
    throw new Error("Seed vazio: nenhum deck disponível em assets/words_v2_skeleton.json");
  }

  // Non-destructive sync: keep existing IDs and progress links stable.
  await execAsync("BEGIN;");
  try {
    for (const w of data) {
      await upsertSeedWord(w);
    }

    await runAsync(
      `INSERT INTO meta (key, value)
       VALUES ('seedVersion', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(SEED_VERSION)]
    );

    await cleanupOrphanProgress();

    await execAsync("COMMIT;");
  } catch (e) {
    await execAsync("ROLLBACK;");
    throw e;
  }
}
