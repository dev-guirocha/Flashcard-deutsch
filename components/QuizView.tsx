import React, { useMemo, useState, useEffect } from 'react';
import type { Flashcard } from '../types';

interface QuizViewProps {
  questions: Flashcard[];
  onExit: () => void;
  onRecordResult: (card: Flashcard, isCorrect: boolean) => void;
}

const QUESTION_TIME_MS = 15000;

const QuizView: React.FC<QuizViewProps> = ({ questions, onExit, onRecordResult }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(QUESTION_TIME_MS);

  const currentQuestion = questions[currentIndex];
  const quizFinished = currentIndex >= questions.length;

  const options = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }
    const randomPool = [...questions];
    const correct = currentQuestion.englishTranslation;
    const unique = new Set<string>([correct]);
    while (unique.size < 4 && randomPool.length) {
      const index = Math.floor(Math.random() * randomPool.length);
      const option = randomPool.splice(index, 1)[0].englishTranslation;
      unique.add(option);
    }
    const shuffled = Array.from(unique);
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [currentQuestion, questions]);

  useEffect(() => {
    if (currentIndex >= questions.length) {
      return;
    }
    setTimer(QUESTION_TIME_MS);
    setSelectedOption(null);
    setIsAnswered(false);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          handleAnswer(null);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleAnswer = (option: string | null) => {
    if (isAnswered) return;
    setIsAnswered(true);
    const isCorrect = option === currentQuestion.englishTranslation;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    if (option !== null) {
      setSelectedOption(option);
    }
    onRecordResult(currentQuestion, isCorrect);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 800);
  };

  if (quizFinished) {
    return (
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Quiz Complete!</h2>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          You scored {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
        </p>
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
          Question {currentIndex + 1} / {questions.length}
        </span>
        <span>Time: {Math.max(0, Math.floor(timer / 1000))}s</span>
      </div>
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">Translate this word:</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{currentQuestion.germanWord}</h3>
        {currentQuestion.germanSentence && (
          <p className="text-sm text-slate-500 dark:text-slate-300 italic">"{currentQuestion.germanSentence}"</p>
        )}
      </div>
      <div className="space-y-3">
        {options.map((option) => {
          const isCorrectOption = option === currentQuestion.englishTranslation;
          const isWrongSelection = selectedOption === option && !isCorrectOption;
          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
              className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                isAnswered
                  ? isCorrectOption
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : isWrongSelection
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-200'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <button
        onClick={onExit}
        className="w-full mt-4 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        Exit quiz
      </button>
    </div>
  );
};

export default QuizView;
