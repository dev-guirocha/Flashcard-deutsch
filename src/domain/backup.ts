import { BackupPayloadV1, BackupScore, CardProgressRow, Pos, Word } from "../types";

const WORDS_CSV_HEADERS = [
  "id",
  "de",
  "lemma",
  "gloss",
  "pt",
  "en",
  "exampleDe",
  "exampleGloss",
  "pos",
  "rank",
  "gender",
  "article",
  "deWithArticle",
  "aliasesPt",
  "aliasesEn",
  "aliasesDe",
  "tags",
];

const VALID_POS = new Set<Pos>([
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

function csvEscape(value: string) {
  const needsQuote = /[",\n\r]/.test(value);
  if (!needsQuote) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function parseJsonArray(value: string | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

function parseIntOr(value: string | undefined, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function safePos(value: string | undefined): Pos {
  if (value && VALID_POS.has(value as Pos)) return value as Pos;
  return "OTHER";
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  while (i < content.length) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }

    if (ch === "\r") {
      i += 1;
      continue;
    }

    cell += ch;
    i += 1;
  }

  row.push(cell);
  if (row.some((part) => part.length > 0)) rows.push(row);

  return rows.filter((r) => r.length > 0);
}

export function toBackupJson(payload: BackupPayloadV1) {
  return JSON.stringify(payload, null, 2);
}

export function parseBackupJson(content: string): BackupPayloadV1 {
  const raw = JSON.parse(content);
  if (!raw || typeof raw !== "object") throw new Error("Backup JSON inválido.");
  if (raw.version !== 1) throw new Error("Versão de backup não suportada.");
  if (!Array.isArray(raw.words)) throw new Error("Backup sem lista de palavras.");
  if (!Array.isArray(raw.cardProgress)) throw new Error("Backup sem progresso de cartões.");
  if (!Array.isArray(raw.scores)) throw new Error("Backup sem scores.");

  return raw as BackupPayloadV1;
}

export function toWordsCsv(words: Word[]) {
  const header = WORDS_CSV_HEADERS.join(",");
  const lines = words.map((w) =>
    [
      String(w.id),
      w.de,
      w.lemma,
      w.gloss,
      w.pt ?? "",
      w.en ?? "",
      w.exampleDe ?? "",
      w.exampleGloss ?? "",
      w.pos,
      String(w.rank),
      w.gender ?? "",
      w.article ?? "",
      w.deWithArticle ?? "",
      JSON.stringify(w.aliasesPt ?? []),
      JSON.stringify(w.aliasesEn ?? []),
      JSON.stringify(w.aliasesDe ?? []),
      JSON.stringify(w.tags ?? []),
    ]
      .map((part) => csvEscape(String(part ?? "")))
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export function parseWordsCsv(content: string): Word[] {
  const rows = parseCsv(content);
  if (rows.length < 2) throw new Error("CSV sem dados para importar.");

  const header = rows[0];
  const indexByHeader = new Map<string, number>();
  header.forEach((name, idx) => indexByHeader.set(name, idx));

  const required = ["id", "de", "lemma", "gloss", "pos", "rank"];
  for (const req of required) {
    if (!indexByHeader.has(req)) {
      throw new Error(`CSV inválido. Coluna obrigatória ausente: ${req}`);
    }
  }

  const get = (row: string[], key: string) => {
    const idx = indexByHeader.get(key);
    if (idx === undefined) return undefined;
    return row[idx];
  };

  const words: Word[] = rows.slice(1).map((row, offset) => {
    const id = parseIntOr(get(row, "id"), offset + 1);
    const de = (get(row, "de") || "").trim();
    const lemma = (get(row, "lemma") || de).trim();
    const gloss = (get(row, "gloss") || "").trim();
    const pos = safePos((get(row, "pos") || "").trim());
    const rank = parseIntOr(get(row, "rank"), id);
    const articleRaw = (get(row, "article") || "").trim();
    const genderRaw = (get(row, "gender") || "").trim();

    if (!de || !lemma || !gloss) {
      throw new Error(`CSV inválido. Linha com campos vazios (id ${id}).`);
    }

    return {
      id,
      de,
      lemma,
      gloss,
      pt: (get(row, "pt") || "").trim() || undefined,
      en: (get(row, "en") || "").trim() || undefined,
      exampleDe: (get(row, "exampleDe") || "").trim() || undefined,
      exampleGloss: (get(row, "exampleGloss") || "").trim() || undefined,
      pos,
      rank,
      gender: genderRaw === "m" || genderRaw === "f" || genderRaw === "n" ? genderRaw : undefined,
      article:
        articleRaw === "der" || articleRaw === "die" || articleRaw === "das" ? articleRaw : undefined,
      deWithArticle: (get(row, "deWithArticle") || "").trim() || undefined,
      aliasesPt: parseJsonArray(get(row, "aliasesPt")),
      aliasesEn: parseJsonArray(get(row, "aliasesEn")),
      aliasesDe: parseJsonArray(get(row, "aliasesDe")),
      tags: parseJsonArray(get(row, "tags")),
    };
  });

  const ids = new Set<number>();
  for (const word of words) {
    if (ids.has(word.id)) {
      throw new Error(`CSV inválido. ID duplicado encontrado: ${word.id}`);
    }
    ids.add(word.id);
  }

  return words;
}

export function buildBackupPayload(input: {
  words: Word[];
  cardProgress: CardProgressRow[];
  scores: BackupScore[];
}): BackupPayloadV1 {
  return {
    version: 1,
    exportedAt: Date.now(),
    words: input.words,
    cardProgress: input.cardProgress,
    scores: input.scores,
  };
}
