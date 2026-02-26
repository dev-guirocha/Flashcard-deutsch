import fs from "fs/promises";

const INPUT_DEFAULT = "../assets/words_v1.json";
const OUTPUT_DEFAULT = "../assets/words_v2_skeleton.json";

function cleanText(value) {
  return String(value || "")
    .replace(/\[\[|\]\]/g, "")
    .replace(/\{\{|\}\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function casefoldKey(word) {
  return cleanText(word).toLocaleLowerCase("de-DE");
}

function toPos(rawPos, word) {
  const pos = String(rawPos || "").trim().toUpperCase();
  const known = new Set([
    "PRON",
    "VERB",
    "NOUN",
    "ADJ",
    "ADV",
    "NUM",
    "ADP",
    "CONJ",
    "DET",
    "PART",
    "INTJ",
    "OTHER",
  ]);
  if (known.has(pos) && pos !== "OTHER") return pos;

  const de = String(word.de || "");
  if (word.article || word.deWithArticle) return "NOUN";
  if (/^[A-ZÄÖÜ]/.test(de) && de.length > 1) return "NOUN";
  return "OTHER";
}

function normalizeEntry(source, index) {
  const de = cleanText(source.de);
  const lemma = cleanText(source.lemma || de);
  const gloss = cleanText(source.gloss || source.pt || source.en);
  const pt = cleanText(source.pt || gloss);
  const en = cleanText(source.en);
  const exampleDe = cleanText(source.exampleDe);
  const exampleGloss = cleanText(source.exampleGloss);
  const tags = Array.isArray(source.tags) ? [...source.tags] : [];

  const hasContraction = /['’]/.test(de);
  if (hasContraction && !tags.includes("colloquial")) tags.push("colloquial");

  return {
    id: Number(source.id) || index + 1,
    rank: Number(source.rank) || Number(source.id) || index + 1,
    de,
    lemma,
    gloss: pt || gloss,
    pt,
    en,
    pos: toPos(source.pos, source),
    gender: source.gender || null,
    article: source.article || null,
    deWithArticle: cleanText(source.deWithArticle),
    aliasesPt: Array.isArray(source.aliasesPt) ? source.aliasesPt : [],
    aliasesEn: Array.isArray(source.aliasesEn) ? source.aliasesEn : [],
    aliasesDe: Array.isArray(source.aliasesDe) ? source.aliasesDe : [],
    tags,
    exampleDe,
    exampleGloss,
    inflections: {},
    imperative_forms: {},
    examples: exampleDe
      ? [{ de: exampleDe, pt: exampleGloss || pt, is_generated: false }]
      : [],
    literal_translation: "",
    context_notes: hasContraction
      ? "Forma coloquial/contraida. Revisar forma expandida para iniciantes."
      : "",
    source: "seed_v1_normalized",
    license: "",
  };
}

function mergeDuplicates(primary, duplicate) {
  const aliasesDe = new Set([...(primary.aliasesDe || []), duplicate.de]);
  const aliasesPt = new Set([...(primary.aliasesPt || []), ...(duplicate.aliasesPt || [])]);
  const aliasesEn = new Set([...(primary.aliasesEn || []), ...(duplicate.aliasesEn || [])]);
  const tags = new Set([...(primary.tags || []), ...(duplicate.tags || [])]);

  return {
    ...primary,
    aliasesDe: [...aliasesDe].filter(Boolean).sort(),
    aliasesPt: [...aliasesPt].filter(Boolean).sort(),
    aliasesEn: [...aliasesEn].filter(Boolean).sort(),
    tags: [...tags].filter(Boolean).sort(),
    examples: [...(primary.examples || []), ...(duplicate.examples || [])].slice(0, 3),
    pt: primary.pt || duplicate.pt,
    en: primary.en || duplicate.en,
    gloss: primary.gloss || duplicate.gloss,
    exampleDe: primary.exampleDe || duplicate.exampleDe,
    exampleGloss: primary.exampleGloss || duplicate.exampleGloss,
  };
}

function buildReport(words, originalCount) {
  const byPos = {};
  for (const w of words) byPos[w.pos] = (byPos[w.pos] || 0) + 1;

  const withPt = words.filter((w) => String(w.pt || "").trim().length > 0).length;
  const withExample = words.filter((w) => String(w.exampleDe || "").trim().length > 0).length;
  const colloquial = words.filter((w) => (w.tags || []).includes("colloquial")).length;

  return {
    originalCount,
    normalizedCount: words.length,
    removedDuplicates: Math.max(originalCount - words.length, 0),
    withPt,
    withExample,
    colloquial,
    byPos,
  };
}

async function main() {
  const input = process.argv[2] || INPUT_DEFAULT;
  const output = process.argv[3] || OUTPUT_DEFAULT;
  const reportPath = output.replace(/\.json$/i, ".report.json");

  const raw = await fs.readFile(new URL(input, import.meta.url), "utf8");
  const source = JSON.parse(raw);
  if (!Array.isArray(source)) throw new Error("Input deck must be a JSON array");

  const dedup = new Map();
  source.forEach((entry, idx) => {
    const normalized = normalizeEntry(entry, idx);
    const key = casefoldKey(normalized.de);
    if (!key) return;

    if (!dedup.has(key)) dedup.set(key, normalized);
    else dedup.set(key, mergeDuplicates(dedup.get(key), normalized));
  });

  const words = [...dedup.values()]
    .sort((a, b) => a.rank - b.rank)
    .map((w, i) => ({ ...w, id: i + 1, rank: i + 1 }));

  const payload = {
    schemaVersion: 2,
    locale: "pt-BR",
    generatedAt: new Date().toISOString(),
    words,
  };

  const report = buildReport(words, source.length);

  await fs.writeFile(new URL(output, import.meta.url), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.writeFile(new URL(reportPath, import.meta.url), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Deck normalization completed.");
  console.log(`Input: ${source.length} entries`);
  console.log(`Output: ${words.length} entries`);
  console.log(`Report: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
