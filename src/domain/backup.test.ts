import { buildBackupPayload, parseBackupJson, parseWordsCsv, toBackupJson, toWordsCsv } from "./backup";
import { BackupScore, CardProgressRow, Word } from "../types";

const WORDS: Word[] = [
  {
    id: 1,
    de: "Hund",
    lemma: "Hund",
    gloss: "cachorro",
    pt: "cachorro",
    en: "dog",
    exampleDe: "Der Hund ist hier.",
    exampleGloss: "The dog is here.",
    pos: "NOUN",
    rank: 1,
    gender: "m",
    article: "der",
    deWithArticle: "der Hund",
    aliasesPt: ["cao"],
    aliasesEn: ["hound"],
    aliasesDe: ["hunde"],
    tags: ["a1"],
  },
];

const PROGRESS: CardProgressRow[] = [
  {
    wordId: 1,
    box: 2,
    dueAt: 123,
    correct: 4,
    wrong: 1,
    lastReviewedAt: 100,
  },
];

const SCORES: BackupScore[] = [
  {
    points: 120,
    timestamp: 1_700_000_000_000,
    mode: "MC_DE_TO_GLOSS",
    runSize: 30,
    playerName: "test",
  },
];

describe("backup serialization", () => {
  it("serializes and parses backup json", () => {
    const payload = buildBackupPayload({
      words: WORDS,
      cardProgress: PROGRESS,
      scores: SCORES,
    });

    const json = toBackupJson(payload);
    const parsed = parseBackupJson(json);

    expect(parsed.version).toBe(1);
    expect(parsed.words[0].de).toBe("Hund");
    expect(parsed.cardProgress[0].box).toBe(2);
    expect(parsed.scores[0].points).toBe(120);
  });

  it("exports and imports words csv", () => {
    const csv = toWordsCsv(WORDS);
    const parsed = parseWordsCsv(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].aliasesPt).toEqual(["cao"]);
    expect(parsed[0].tags).toEqual(["a1"]);
  });
});
