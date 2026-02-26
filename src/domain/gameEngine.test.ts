import { advance, buildRun, nextCard, submitMc, submitType } from "./gameEngine";
import { Word } from "../types";

const WORDS: Word[] = [
  {
    id: 1,
    de: "Hund",
    lemma: "Hund",
    gloss: "cachorro",
    pos: "NOUN",
    rank: 1,
    article: "der",
    deWithArticle: "der Hund",
    aliasesPt: [],
    aliasesEn: [],
    aliasesDe: [],
    tags: [],
  },
  {
    id: 2,
    de: "Katze",
    lemma: "Katze",
    gloss: "gato",
    pos: "NOUN",
    rank: 2,
    article: "die",
    deWithArticle: "die Katze",
    aliasesPt: [],
    aliasesEn: [],
    aliasesDe: [],
    tags: [],
  },
  {
    id: 3,
    de: "Buch",
    lemma: "Buch",
    gloss: "livro",
    pos: "NOUN",
    rank: 3,
    article: "das",
    deWithArticle: "das Buch",
    aliasesPt: [],
    aliasesEn: [],
    aliasesDe: [],
    tags: [],
  },
  {
    id: 4,
    de: "laufen",
    lemma: "laufen",
    gloss: "correr",
    pos: "VERB",
    rank: 4,
    aliasesPt: [],
    aliasesEn: [],
    aliasesDe: [],
    tags: [],
  },
];

describe("gameEngine", () => {
  it("builds a run without shuffling when disabled", () => {
    const run = buildRun(WORDS, "MC_DE_TO_GLOSS", {
      shufflePool: false,
      poolSize: 3,
      runSize: 3,
    });

    expect(run.pool.map((w) => w.id)).toEqual([1, 2, 3]);
    expect(run.runSize).toBe(3);
  });

  it("scores correct MC answer", () => {
    const run = nextCard(
      buildRun(WORDS, "MC_DE_TO_GLOSS", { shufflePool: false, poolSize: 4, runSize: 4 })
    );

    if (!run.card || run.card.kind !== "MC") throw new Error("expected MC card");
    const correctId = run.card.options.find((o) => o.isCorrect)?.id;
    if (!correctId) throw new Error("missing correct option");

    const updated = submitMc(run, correctId);
    expect(updated.feedback?.ok).toBe(true);
    expect(updated.score).toBe(10);
    expect(updated.streak).toBe(1);
    expect(updated.correctCount).toBe(1);
  });

  it("accepts article-based type answer", () => {
    const run = nextCard(
      buildRun(WORDS, "TYPE_GLOSS_TO_DE", { shufflePool: false, poolSize: 4, runSize: 4 })
    );

    const updated = submitType(run, "der Hund");
    expect(updated.feedback?.ok).toBe(true);
    expect(updated.feedback?.correct).toBe("der Hund");
  });

  it("runs endlessly and avoids immediate repeat after correct answer", () => {
    let run = nextCard(buildRun(WORDS, "MC_DE_TO_GLOSS", { shufflePool: false, poolSize: 2, runSize: 0 }));
    if (!run.card || run.card.kind !== "MC") throw new Error("expected MC card");

    const firstWordId = run.card.correctWord.id;
    const correctId = run.card.options.find((o) => o.isCorrect)?.id;
    if (!correctId) throw new Error("missing correct option");

    run = submitMc(run, correctId);
    run = advance(run);
    run = nextCard(run);

    if (!run.card || run.card.kind !== "MC") throw new Error("expected MC card");
    expect(run.card.correctWord.id).not.toBe(firstWordId);
  });

  it("repeats missed word sooner in endless mode", () => {
    let run = nextCard(buildRun(WORDS, "MC_DE_TO_GLOSS", { shufflePool: false, poolSize: 2, runSize: 0 }));
    if (!run.card || run.card.kind !== "MC") throw new Error("expected MC card");
    const firstWordId = run.card.correctWord.id;

    const wrongId = run.card.options.find((o) => !o.isCorrect)?.id;
    if (!wrongId) throw new Error("missing wrong option");

    run = submitMc(run, wrongId);
    run = advance(run);
    run = nextCard(run);

    if (!run.card || run.card.kind !== "MC") throw new Error("expected second card");
    const secondWordId = run.card.correctWord.id;
    const secondCorrectId = run.card.options.find((o) => o.isCorrect)?.id;
    if (!secondCorrectId) throw new Error("missing second correct option");

    run = submitMc(run, secondCorrectId);
    run = advance(run);
    run = nextCard(run);

    if (!run.card || run.card.kind !== "MC") throw new Error("expected third card");
    expect(run.card.correctWord.id).toBe(firstWordId);
    expect(run.card.correctWord.id).not.toBe(secondWordId);
  });
});
