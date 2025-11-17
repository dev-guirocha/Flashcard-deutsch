
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import OnboardingScreen from './components/OnboardingScreen';
import CategorySelection from './components/CategorySelection';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import WritingPracticeView from './components/WritingPracticeView';
import type { Category, Flashcard, CardStats } from './types';
import {
  baseVocabularyEntries,
  buildAllFlashcards,
  buildCategoriesFromEntries,
  getFlashcardKey,
  type VocabularyEntry,
} from './data/vocabulary';

const CUSTOM_VOCAB_KEY = 'customVocabularyEntries';
const FAVORITES_KEY = 'favoriteFlashcards';
const CARD_STATS_KEY = 'flashcardStats';
const CUSTOM_UPDATED_AT_KEY = 'customVocabularyUpdatedAt';
const SESSION_STATS_KEY = 'studySessionStats';
const STUDY_HISTORY_KEY = 'studyHistory';

type SessionStats = {
  seen: number;
  correct: number;
  incorrect: number;
  notes: string[];
  startedAt: number;
};

type StudyHistory = Record<
  string,
  {
    seen: number;
    correct: number;
  }
>;

const readLocalStorage = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(key);
};

const loadCustomEntries = (): VocabularyEntry[] => {
  const stored = readLocalStorage(CUSTOM_VOCAB_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadFavoriteKeys = (): Set<string> => {
  const stored = readLocalStorage(FAVORITES_KEY);
  if (!stored) {
    return new Set();
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
};

const loadCardStats = (): Record<string, CardStats> => {
  const stored = readLocalStorage(CARD_STATS_KEY);
  if (!stored) {
    return {};
  }
  try {
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const loadCustomUpdatedAt = (): number | null => {
  const stored = readLocalStorage(CUSTOM_UPDATED_AT_KEY);
  if (!stored) {
    return null;
  }
  const asNumber = Number(stored);
  return Number.isFinite(asNumber) ? asNumber : null;
};

const defaultSessionStats = (): SessionStats => ({
  seen: 0,
  correct: 0,
  incorrect: 0,
  notes: [],
  startedAt: Date.now(),
});

const loadSessionStats = (): SessionStats => {
  const stored = readLocalStorage(SESSION_STATS_KEY);
  if (!stored) {
    return defaultSessionStats();
  }
  try {
    const parsed = JSON.parse(stored);
    if (
      typeof parsed === 'object' &&
      parsed &&
      typeof parsed.seen === 'number' &&
      typeof parsed.correct === 'number' &&
      typeof parsed.incorrect === 'number' &&
      Array.isArray(parsed.notes)
    ) {
      return {
        seen: parsed.seen,
        correct: parsed.correct,
        incorrect: parsed.incorrect,
        notes: parsed.notes,
        startedAt: parsed.startedAt ?? Date.now(),
      };
    }
    return defaultSessionStats();
  } catch {
    return defaultSessionStats();
  }
};

const loadStudyHistory = (): StudyHistory => {
  const stored = readLocalStorage(STUDY_HISTORY_KEY);
  if (!stored) {
    return {};
  }
  try {
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const trimHistory = (history: StudyHistory, days = 14): StudyHistory => {
  const entries = Object.entries(history).sort(([a], [b]) => (a > b ? 1 : -1));
  const trimmed = entries.slice(-days);
  return trimmed.reduce<StudyHistory>((acc, [date, value]) => {
    acc[date] = value;
    return acc;
  }, {});
};

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [customEntries, setCustomEntries] = useState<VocabularyEntry[]>(() => loadCustomEntries());
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(() => loadFavoriteKeys());
  const [cardStats, setCardStats] = useState<Record<string, CardStats>>(() => loadCardStats());
  const [customUpdatedAt, setCustomUpdatedAt] = useState<number | null>(() => loadCustomUpdatedAt());
  const [sessionStats, setSessionStats] = useState<SessionStats>(() => loadSessionStats());
  const [studyHistory, setStudyHistory] = useState<StudyHistory>(() => loadStudyHistory());
  const [quizDeck, setQuizDeck] = useState<Flashcard[] | null>(null);
  const [writingDeck, setWritingDeck] = useState<Flashcard[] | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('germanFlashcardsUserName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CUSTOM_VOCAB_KEY, JSON.stringify(customEntries));
  }, [customEntries]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoriteKeys)));
  }, [favoriteKeys]);

  useEffect(() => {
    localStorage.setItem(CARD_STATS_KEY, JSON.stringify(cardStats));
  }, [cardStats]);

  useEffect(() => {
    if (customUpdatedAt) {
      localStorage.setItem(CUSTOM_UPDATED_AT_KEY, String(customUpdatedAt));
    } else {
      localStorage.removeItem(CUSTOM_UPDATED_AT_KEY);
    }
  }, [customUpdatedAt]);

  useEffect(() => {
    localStorage.setItem(SESSION_STATS_KEY, JSON.stringify(sessionStats));
  }, [sessionStats]);

  useEffect(() => {
    localStorage.setItem(STUDY_HISTORY_KEY, JSON.stringify(studyHistory));
  }, [studyHistory]);

  const combinedEntries = useMemo(
    () => [...baseVocabularyEntries, ...customEntries],
    [customEntries]
  );

  const categories = useMemo(
    () => buildCategoriesFromEntries(combinedEntries),
    [combinedEntries]
  );

  const allFlashcards = useMemo(() => buildAllFlashcards(categories), [categories]);

  const favoriteFlashcards = useMemo(
    () => allFlashcards.filter((card) => favoriteKeys.has(getFlashcardKey(card))),
    [allFlashcards, favoriteKeys]
  );

  const handleNameSubmit = (name: string) => {
    localStorage.setItem('germanFlashcardsUserName', name);
    setUserName(name);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleUpdateCustomEntries = (entries: VocabularyEntry[]) => {
    setCustomEntries(entries);
    setSelectedCategory(null);
    setCustomUpdatedAt(entries.length ? Date.now() : null);
  };

  const toggleFavorite = (card: Flashcard) => {
    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      const key = getFlashcardKey(card);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isFavorite = useCallback(
    (card: Flashcard) => favoriteKeys.has(getFlashcardKey(card)),
    [favoriteKeys]
  );

  const recordCardResult = useCallback((card: Flashcard, isCorrect: boolean) => {
    setCardStats((prev) => {
      const key = getFlashcardKey(card);
      const existing = prev[key] ?? { seen: 0, correct: 0, incorrect: 0, lastReviewed: 0 };
      const nextStats: CardStats = {
        seen: existing.seen + 1,
        correct: existing.correct + (isCorrect ? 1 : 0),
        incorrect: existing.incorrect + (isCorrect ? 0 : 1),
        lastReviewed: Date.now(),
      };
      return { ...prev, [key]: nextStats };
    });
    setSessionStats((prev) => ({
      ...prev,
      seen: prev.seen + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
    setStudyHistory((prev) => {
      const key = todayKey();
      const current = prev[key] ?? { seen: 0, correct: 0 };
      const updated = {
        ...prev,
        [key]: {
          seen: current.seen + 1,
          correct: current.correct + (isCorrect ? 1 : 0),
        },
      };
      return trimHistory(updated);
    });
  }, []);

  const addSessionNote = useCallback((note: string) => {
    if (!note.trim()) {
      return;
    }
    setSessionStats((prev) => ({
      ...prev,
      notes: [note.trim(), ...prev.notes],
    }));
  }, []);

  const resetSessionStats = useCallback(() => {
    setSessionStats(defaultSessionStats());
  }, []);

  const getStatsForCard = useCallback(
    (card: Flashcard) => cardStats[getFlashcardKey(card)],
    [cardStats]
  );

  const handleSaveCardEdits = useCallback((entry: VocabularyEntry) => {
    setCustomEntries((prev) => {
      const filtered = prev.filter(
        (current) =>
          !(
            current.germanWord.toLowerCase() === entry.germanWord.toLowerCase() &&
            current.category.toLowerCase() === entry.category.toLowerCase()
          )
      );
      return [...filtered, entry];
    });
    setCustomUpdatedAt(Date.now());
  }, []);

  const shuffleCards = (cards: Flashcard[]) => {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const handleStartQuiz = (questionCount: number) => {
    const deck = shuffleCards(allFlashcards).slice(0, Math.max(5, questionCount));
    setQuizDeck(deck);
  };

  const handleExitQuiz = () => {
    setQuizDeck(null);
  };

  const handleStartWriting = (count: number) => {
    const deck = shuffleCards(allFlashcards).slice(0, Math.max(5, count));
    setWritingDeck(deck);
  };

  const handleExitWriting = () => {
    setWritingDeck(null);
  };

  const renderContent = () => {
    if (!userName) {
      return <OnboardingScreen onNameSubmit={handleNameSubmit} />;
    }
    if (quizDeck) {
      return <QuizView questions={quizDeck} onExit={handleExitQuiz} onRecordResult={recordCardResult} />;
    }
    if (writingDeck) {
      return <WritingPracticeView cards={writingDeck} onExit={handleExitWriting} onRecordResult={recordCardResult} />;
    }
    if (!selectedCategory) {
      return (
        <CategorySelection
          userName={userName}
          onSelectCategory={handleSelectCategory}
          categories={categories}
          allFlashcards={allFlashcards}
          favoriteFlashcards={favoriteFlashcards}
          combinedEntries={combinedEntries}
          hasCustomEntries={customEntries.length > 0}
          cardStats={cardStats}
          customUpdatedAt={customUpdatedAt}
          studyHistory={studyHistory}
          sessionStats={sessionStats}
          onResetSession={resetSessionStats}
          onStartQuiz={handleStartQuiz}
          onStartWriting={handleStartWriting}
          onUpdateCustomEntries={handleUpdateCustomEntries}
        />
      );
    }
    return (
      <FlashcardView
        category={selectedCategory}
        onBack={handleBackToCategories}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        onRecordResult={recordCardResult}
        getCardStats={getStatsForCard}
        sessionStats={sessionStats}
        onAddSessionNote={addSessionNote}
        onSaveCard={handleSaveCardEdits}
      />
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      {renderContent()}
    </div>
  );
};

export default App;
