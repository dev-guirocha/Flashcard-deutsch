import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_INPUT_DECK = "../assets/words_v2_skeleton.json";
const DEFAULT_OUTPUT_DECK = "../assets/words_v2_enriched.json";

function resolvePath(inputPath) {
  if (!inputPath) return null;
  if (path.isAbsolute(inputPath)) return inputPath;
  const cwdCandidate = path.resolve(process.cwd(), inputPath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;
  return path.resolve(__dirname, inputPath);
}

function cleanText(value) {
  return String(value || "")
    .replace(/\[\[|\]\]/g, "")
    .replace(/\{\{|\}\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLocaleLowerCase("de-DE");
}

function stripArticle(value) {
  return cleanText(value).replace(/^(der|die|das)\s+/i, "").trim();
}

function mapPos(value) {
  const p = cleanText(value).toLowerCase();
  if (!p) return "OTHER";
  if (p.includes("noun")) return "NOUN";
  if (p.includes("verb")) return "VERB";
  if (p.includes("adjective")) return "ADJ";
  if (p.includes("adverb")) return "ADV";
  if (p.includes("pronoun")) return "PRON";
  if (p.includes("determiner") || p.includes("article")) return "DET";
  if (p.includes("preposition") || p.includes("postposition")) return "ADP";
  if (p.includes("conjunction")) return "CONJ";
  if (p.includes("numeral")) return "NUM";
  if (p.includes("particle")) return "PART";
  if (p.includes("interjection")) return "INTJ";
  return "OTHER";
}

function hasAnyTag(tags, candidates) {
  const lower = new Set((tags || []).map((t) => String(t).toLowerCase()));
  return candidates.some((c) => lower.has(c));
}

function extractGenderFromRaw(raw) {
  const tags = raw?.tags || [];
  if (hasAnyTag(tags, ["masculine", "m"])) return "m";
  if (hasAnyTag(tags, ["feminine", "f"])) return "f";
  if (hasAnyTag(tags, ["neuter", "n"])) return "n";

  for (const form of raw?.forms || []) {
    const ftags = form?.tags || [];
    if (hasAnyTag(ftags, ["masculine", "m"])) return "m";
    if (hasAnyTag(ftags, ["feminine", "f"])) return "f";
    if (hasAnyTag(ftags, ["neuter", "n"])) return "n";
  }
  return null;
}

function translationMatchesLanguage(item, desiredCodes, desiredNames) {
  const code = String(item?.lang_code || item?.code || "").toLowerCase();
  const lang = String(item?.lang || item?.language || "").toLowerCase();
  if (desiredCodes.has(code)) return true;
  if (desiredNames.has(lang)) return true;
  return false;
}

function pickTranslation(raw, target) {
  const desiredCodes =
    target === "pt"
      ? new Set(["pt", "pt-br", "por"])
      : new Set(["en", "eng"]);
  const desiredNames =
    target === "pt"
      ? new Set(["portuguese", "portuguese (brazil)", "brazilian portuguese"])
      : new Set(["english"]);

  const readItems = (arr) => {
    if (!Array.isArray(arr)) return "";
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      if (!translationMatchesLanguage(item, desiredCodes, desiredNames)) continue;
      const value = cleanText(item.word || item.text || item.translation || item.term);
      if (value) return value;
    }
    return "";
  };

  const rootTranslation = readItems(raw?.translations);
  if (rootTranslation) return rootTranslation;

  for (const sense of raw?.senses || []) {
    const senseTranslation = readItems(sense?.translations);
    if (senseTranslation) return senseTranslation;
  }

  return "";
}

function pickEnglishFallbackGloss(raw) {
  for (const sense of raw?.senses || []) {
    if (!Array.isArray(sense?.glosses)) continue;
    for (const gloss of sense.glosses) {
      const text = cleanText(gloss);
      if (text) return text;
    }
  }
  return "";
}

function extractExamples(raw) {
  const examples = [];
  const pushExample = (de, translation) => {
    const deText = cleanText(de);
    if (!deText) return;
    if (examples.some((x) => x.de === deText)) return;
    examples.push({
      de: deText,
      pt: "",
      en: cleanText(translation),
      source: "kaikki",
      is_generated: false,
    });
  };

  for (const sense of raw?.senses || []) {
    const list = sense?.examples;
    if (!Array.isArray(list)) continue;
    for (const example of list) {
      if (typeof example === "string") {
        pushExample(example, "");
      } else if (example && typeof example === "object") {
        pushExample(
          example.text || example.example || example.de || example.quote,
          example.translation || example.en || ""
        );
      }
      if (examples.length >= 3) return examples;
    }
  }
  return examples;
}

function extractInflectionsAndImperative(raw) {
  const inflections = {};
  const imperative = {};

  for (const form of raw?.forms || []) {
    const formText = cleanText(form?.form || form?.word);
    if (!formText) continue;
    const tags = (form?.tags || []).map((t) => String(t).toLowerCase());
    const hasAny = (...needles) => needles.some((n) => tags.includes(n));
    const hasAll = (...needles) => needles.every((n) => tags.includes(n));

    if (!inflections.plural && hasAll("plural") && !hasAny("genitive", "dative", "accusative")) {
      inflections.plural = formText;
    }
    if (!inflections.prs_1sg && hasAll("present", "first-person", "singular")) {
      inflections.prs_1sg = formText;
    }
    if (!inflections.prs_2sg && hasAll("present", "second-person", "singular")) {
      inflections.prs_2sg = formText;
    }
    if (!inflections.prs_3sg && hasAll("present", "third-person", "singular")) {
      inflections.prs_3sg = formText;
    }
    if (!inflections.past_participle && hasAll("participle", "past")) {
      inflections.past_participle = formText;
    }

    if (hasAll("imperative")) {
      const isFormal = hasAny("formal", "polite");
      const isPlural = hasAll("plural");
      const isSingular = hasAll("singular");
      if (!imperative.Sie && isFormal) imperative.Sie = formText;
      else if (!imperative.ihr && isPlural && !isFormal) imperative.ihr = formText;
      else if (!imperative.du && isSingular && !isFormal) imperative.du = formText;
      else if (!imperative.du) imperative.du = formText;
    }
  }

  return { inflections, imperative };
}

function buildCandidate(raw) {
  const pos = mapPos(raw?.pos);
  const gender = extractGenderFromRaw(raw);
  const article = gender === "m" ? "der" : gender === "f" ? "die" : gender === "n" ? "das" : null;
  const pt = pickTranslation(raw, "pt");
  const en = pickTranslation(raw, "en") || pickEnglishFallbackGloss(raw);
  const examples = extractExamples(raw);
  const { inflections, imperative } = extractInflectionsAndImperative(raw);

  return {
    pos,
    gender,
    article,
    pt,
    en,
    examples,
    inflections,
    imperative_forms: imperative,
    context_notes: "",
  };
}

function candidateScore(word, candidate) {
  let score = 0;
  if (candidate.pos && candidate.pos !== "OTHER") score += 2;
  if (word.pos === candidate.pos && candidate.pos !== "OTHER") score += 3;
  if (word.pos === "OTHER" && candidate.pos !== "OTHER") score += 2;
  if (candidate.pt) score += 3;
  if (candidate.en) score += 1;
  if ((candidate.examples || []).length > 0) score += 1;
  if (candidate.gender || candidate.article) score += 1;
  if (Object.keys(candidate.inflections || {}).length > 0) score += 1;
  if (Object.keys(candidate.imperative_forms || {}).length > 0) score += 1;
  return score;
}

function mergeWord(word, candidate) {
  const next = { ...word };
  let changed = false;

  if ((next.pos === "OTHER" || !next.pos) && candidate.pos !== "OTHER") {
    next.pos = candidate.pos;
    changed = true;
  }
  if (!next.gender && candidate.gender) {
    next.gender = candidate.gender;
    changed = true;
  }
  if (!next.article && candidate.article) {
    next.article = candidate.article;
    changed = true;
  }
  if (!cleanText(next.deWithArticle) && next.article) {
    next.deWithArticle = `${next.article} ${next.lemma || next.de}`.trim();
    changed = true;
  }
  if (!cleanText(next.pt) && candidate.pt) {
    next.pt = candidate.pt;
    if (!cleanText(next.gloss)) next.gloss = candidate.pt;
    changed = true;
  }
  if (!cleanText(next.en) && candidate.en) {
    next.en = candidate.en;
    changed = true;
  }
  if ((!next.examples || next.examples.length === 0) && candidate.examples.length > 0) {
    next.examples = candidate.examples.slice(0, 3);
    if (!cleanText(next.exampleDe)) next.exampleDe = next.examples[0]?.de || "";
    if (!cleanText(next.exampleGloss)) next.exampleGloss = next.examples[0]?.en || "";
    changed = true;
  }

  const mergedInflections = { ...(next.inflections || {}), ...(candidate.inflections || {}) };
  if (Object.keys(mergedInflections).length !== Object.keys(next.inflections || {}).length) {
    next.inflections = mergedInflections;
    changed = true;
  }

  const mergedImperative = { ...(next.imperative_forms || {}), ...(candidate.imperative_forms || {}) };
  if (Object.keys(mergedImperative).length !== Object.keys(next.imperative_forms || {}).length) {
    next.imperative_forms = mergedImperative;
    changed = true;
  }

  if (!cleanText(next.source)) {
    next.source = "kaikki.org/wiktextract";
    changed = true;
  }
  if (!cleanText(next.license)) {
    next.license = "CC-BY-SA-4.0";
    changed = true;
  }

  return { next, changed };
}

function buildWordIndex(words) {
  const map = new Map();
  const add = (key, idx) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(idx);
  };

  words.forEach((word, idx) => {
    const keys = [
      normalizeKey(word.lemma),
      normalizeKey(word.de),
      normalizeKey(stripArticle(word.deWithArticle)),
    ];
    keys.forEach((k) => add(k, idx));
  });

  return map;
}

function usage() {
  console.log("Usage:");
  console.log("  node de-seed/enrich_with_kaikki.mjs <kaikki_jsonl> [input_deck] [output_deck]");
  console.log("");
  console.log("Example:");
  console.log(
    "  node de-seed/enrich_with_kaikki.mjs ~/Downloads/kaikki.org-dictionary-German.jsonl ../assets/words_v2_skeleton.json ../assets/words_v2_enriched.json"
  );
}

async function main() {
  const kaikkeiPathArg = process.argv[2];
  if (!kaikkeiPathArg) {
    usage();
    process.exit(1);
  }

  const kaikkeiPath = resolvePath(kaikkeiPathArg);
  const inputDeckPath = resolvePath(process.argv[3] || DEFAULT_INPUT_DECK);
  const outputDeckPath = resolvePath(process.argv[4] || DEFAULT_OUTPUT_DECK);
  const reportPath = outputDeckPath.replace(/\.json$/i, ".report.json");

  const inputRaw = await fsp.readFile(inputDeckPath, "utf8");
  const inputParsed = JSON.parse(inputRaw);
  const words = Array.isArray(inputParsed) ? inputParsed : inputParsed.words;
  if (!Array.isArray(words)) throw new Error("Input deck inválido: esperado array em words.");

  const index = buildWordIndex(words);
  const bestByIndex = new Map();

  let linesRead = 0;
  let matchedLines = 0;

  const stream = fs.createReadStream(kaikkeiPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    linesRead += 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed[0] !== "{") continue;

    let raw;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const langCode = String(raw?.lang_code || "").toLowerCase();
    const langName = String(raw?.lang || "").toLowerCase();
    if (langCode && langCode !== "de") continue;
    if (langName && langName !== "german") continue;

    const head = cleanText(raw?.word || raw?.title);
    if (!head) continue;

    const keys = new Set([normalizeKey(head), normalizeKey(stripArticle(head))]);
    const candidateIndices = new Set();
    for (const key of keys) {
      const hit = index.get(key);
      if (!hit) continue;
      for (const idx of hit) candidateIndices.add(idx);
    }
    if (candidateIndices.size === 0) continue;

    const candidate = buildCandidate(raw);
    matchedLines += 1;
    for (const idx of candidateIndices) {
      const word = words[idx];
      const score = candidateScore(word, candidate);
      const prev = bestByIndex.get(idx);
      if (!prev || score > prev.score) {
        bestByIndex.set(idx, { score, candidate });
      }
    }

    if (linesRead % 250000 === 0) {
      console.log(`Processed ${linesRead.toLocaleString()} lines...`);
    }
  }

  let updatedWords = 0;
  let posUpgraded = 0;
  let ptFilled = 0;
  let enFilled = 0;
  let exampleFilled = 0;
  let inflectionFilled = 0;
  let imperativeFilled = 0;

  const outputWords = words.map((word, idx) => {
    const best = bestByIndex.get(idx);
    if (!best) return word;

    const before = {
      pos: word.pos,
      pt: cleanText(word.pt),
      en: cleanText(word.en),
      exampleDe: cleanText(word.exampleDe),
      inflections: Object.keys(word.inflections || {}).length,
      imperative: Object.keys(word.imperative_forms || {}).length,
    };

    const merged = mergeWord(word, best.candidate);
    if (!merged.changed) return word;

    const after = {
      pos: merged.next.pos,
      pt: cleanText(merged.next.pt),
      en: cleanText(merged.next.en),
      exampleDe: cleanText(merged.next.exampleDe),
      inflections: Object.keys(merged.next.inflections || {}).length,
      imperative: Object.keys(merged.next.imperative_forms || {}).length,
    };

    updatedWords += 1;
    if (before.pos === "OTHER" && after.pos !== "OTHER") posUpgraded += 1;
    if (!before.pt && after.pt) ptFilled += 1;
    if (!before.en && after.en) enFilled += 1;
    if (!before.exampleDe && after.exampleDe) exampleFilled += 1;
    if (before.inflections === 0 && after.inflections > 0) inflectionFilled += 1;
    if (before.imperative === 0 && after.imperative > 0) imperativeFilled += 1;

    return merged.next;
  });

  const outputPayload = Array.isArray(inputParsed)
    ? outputWords
    : {
        ...inputParsed,
        generatedAt: new Date().toISOString(),
        enrichment: {
          provider: "kaikki.org",
          method: "wiktextract-jsonl",
          updatedAt: new Date().toISOString(),
        },
        words: outputWords,
      };

  const report = {
    inputDeck: inputDeckPath,
    kaikkeiPath,
    outputDeck: outputDeckPath,
    linesRead,
    matchedLines,
    candidatesFound: bestByIndex.size,
    updatedWords,
    posUpgraded,
    ptFilled,
    enFilled,
    exampleFilled,
    inflectionFilled,
    imperativeFilled,
  };

  await fsp.writeFile(outputDeckPath, `${JSON.stringify(outputPayload, null, 2)}\n`, "utf8");
  await fsp.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Kaikki enrichment completed.");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
