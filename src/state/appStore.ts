import { useEffect, useMemo, useState } from "react";
import { getAllWords, getTopScores, saveScore } from "../data/wordsRepo";
import { ensureSeed } from "../data/seedLoader";
import { migrate } from "../data/migrations";
import { Mode, ScoreRow, Word } from "../types";
import {
  advance,
  buildRun,
  nextCard,
  RunState,
  skip,
  submitMc,
  submitType,
} from "../domain/gameEngine";

export function useAppModel() {
  const [ready, setReady] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [run, setRun] = useState<RunState | null>(null);

  useEffect(() => {
    (async () => {
      await migrate();
      await ensureSeed();
      const w = await getAllWords();
      setWords(w);
      const s = await getTopScores(20);
      setScores(s);
      setReady(true);
    })().catch((e) => {
      console.error("Init error", e);
    });
  }, []);

  const actions = useMemo(
    () => ({
      async refreshScores() {
        const s = await getTopScores(20);
        setScores(s);
      },
      startRun(mode: Mode) {
        const base = buildRun(words, mode);
        const withCard = nextCard(base);
        setRun(withCard);
      },
      next() {
        setRun((r) => {
          if (!r) return r;
          const advanced = advance(r);
          const withCard = nextCard(advanced);
          return withCard;
        });
      },
      doSkip() {
        setRun((r) => (r ? skip(r) : r));
        // After skip we immediately advance
        setRun((r) => {
          if (!r) return r;
          const advanced = advance(r);
          return nextCard(advanced);
        });
      },
      answerMc(optionId: number) {
        setRun((r) => (r ? submitMc(r, optionId) : r));
      },
      answerType(text: string) {
        setRun((r) => (r ? submitType(r, text) : r));
      },
      async finishAndSave(playerName?: string) {
        if (!run) return;
        await saveScore({
          points: run.score,
          timestamp: Date.now(),
          mode: run.mode,
          runSize: run.runSize,
          playerName: playerName || null,
        });
        const s = await getTopScores(20);
        setScores(s);
        setRun(null);
      },
      abandonRun() {
        setRun(null);
      },
    }),
    [words, run]
  );

  return { ready, words, scores, run, actions };
}
