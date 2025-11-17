import React, { useState, useMemo } from 'react';
import type { Flashcard } from '../types';

interface WritingPracticeViewProps {
  cards: Flashcard[];
  onExit: () => void;
  onRecordResult: (card: Flashcard, isCorrect: boolean) => void;
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

const levenshtein = (a: string, b: string) => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
};

const WritingPracticeView: React.FC<WritingPracticeViewProps> = ({ cards, onExit, onRecordResult }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<null | { isCorrect: boolean; correctWord: string }>(null);

  const currentCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentCard) return;

    const attempt = normalize(answer);
    const expected = normalize(currentCard.germanWord);
    const distance = levenshtein(attempt, expected);
    const threshold = Math.max(1, Math.floor(expected.length * 0.2));
    const isCorrect = distance <= threshold || attempt === expected;

    setResult({ isCorrect, correctWord: currentCard.germanWord });
    onRecordResult(currentCard, isCorrect);
  };

  const handleNext = () => {
    setAnswer('');
    setResult(null);
    setCurrentIndex((prev) => prev + 1);
  };

  if (currentIndex >= cards.length) {
    return (
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">All done!</h2>
        <button
          onClick={onExit}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Back to categories
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6 text-left">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
        <span>
          Card {currentIndex + 1} / {cards.length}
        </span>
      </div>
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">Translate into German:</p>
        <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">{currentCard.englishTranslation}</h3>
        {currentCard.englishSentenceTranslation && (
          <p className="text-sm text-slate-500 dark:text-slate-300 italic">"{currentCard.englishSentenceTranslation}"</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type the German word here"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        />
        <button
          type="submit"
          disabled={!answer.trim() || result !== null}
          className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Check
        </button>
      </form>

      {result && (
        <div
          className={`p-4 rounded-xl border ${
            result.isCorrect
              ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'
          }`}
        >
          {result.isCorrect ? 'Nice job!' : 'Almost there.'} Correct answer: {result.correctWord}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onExit}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Back to categories
        </button>
        <button
          onClick={handleNext}
          disabled={!result}
          className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default WritingPracticeView;
