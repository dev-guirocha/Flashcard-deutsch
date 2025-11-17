
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Category, Flashcard, CardStats } from '../types';
import type { VocabularyEntry } from '../data/vocabulary';
import {
  baseVocabularyEntries,
  entriesToCsv,
  parseCsvEntries,
  parseJsonEntries,
  getFlashcardKey,
} from '../data/vocabulary';

interface CategorySelectionProps {
  userName: string;
  categories: Category[];
  allFlashcards: Flashcard[];
  favoriteFlashcards: Flashcard[];
  combinedEntries: VocabularyEntry[];
  hasCustomEntries: boolean;
  cardStats: Record<string, CardStats>;
  customUpdatedAt: number | null;
  onSelectCategory: (category: Category) => void;
  onUpdateCustomEntries: (entries: VocabularyEntry[]) => void;
  studyHistory: Record<
    string,
    {
      seen: number;
      correct: number;
    }
  >;
  sessionStats: {
    seen: number;
    correct: number;
    incorrect: number;
    notes: string[];
    startedAt: number;
  };
  onResetSession: () => void;
  onStartQuiz: (count: number) => void;
  onStartWriting: (count: number) => void;
}

const ChartBar = ({
  value,
  max,
  colorClass,
}: {
  value: number;
  max: number;
  colorClass: string;
}) => {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
};

const StudyHistoryChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(1, ...data.map((point) => point.value));
  const points = data
    .map((point, index) => {
      const x = (index / Math.max(1, data.length - 1)) * 100;
      const y = 100 - (point.value / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <div className="w-full">
      <svg viewBox="0 0 100 100" className="w-full h-24">
        <polyline
          fill="none"
          stroke="rgb(59 130 246)"
          strokeWidth="2"
          points={points}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((point, index) => {
          const x = (index / Math.max(1, data.length - 1)) * 100;
          const y = 100 - (point.value / max) * 100;
          return <circle key={point.label} cx={x} cy={y} r={1.8} fill="rgb(59 130 246)" />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
        {data.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
};

const CategorySelection: React.FC<CategorySelectionProps> = ({
  userName,
  onSelectCategory,
  categories,
  allFlashcards,
  favoriteFlashcards,
  combinedEntries,
  hasCustomEntries,
  cardStats,
  customUpdatedAt,
  studyHistory,
  sessionStats,
  onResetSession,
  onStartQuiz,
  onStartWriting,
  onUpdateCustomEntries,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [minLength, setMinLength] = useState<number>(0);
  const [maxLength, setMaxLength] = useState<number>(20);
  const [themedSelection, setThemedSelection] = useState<Set<string>>(new Set());
  const [themedLimit, setThemedLimit] = useState<number>(30);
  const [quizCount, setQuizCount] = useState<number>(10);
  const [writingCount, setWritingCount] = useState<number>(10);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const favoriteKeySet = useMemo(
    () => new Set(favoriteFlashcards.map((card) => getFlashcardKey(card))),
    [favoriteFlashcards]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredCategories: Category[] = useMemo(() => {
    return categories.filter((category) => {
      if (typeFilter !== 'all' && category.name.toLowerCase() !== typeFilter) {
        return false;
      }

      let candidateCards = category.flashcards;
      if (favoritesOnly) {
        candidateCards = candidateCards.filter((card) => favoriteKeySet.has(getFlashcardKey(card)));
        if (candidateCards.length === 0) {
          return false;
        }
      }

      const matchesLength = candidateCards.some((card) => {
        const len = card.germanWord.length;
        return len >= minLength && len <= maxLength;
      });
      if (!matchesLength) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      if (category.name.toLowerCase().includes(normalizedSearch)) {
        return true;
      }

      return candidateCards.some(
        (card) =>
          card.germanWord.toLowerCase().includes(normalizedSearch) ||
          (card.englishTranslation ?? '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [categories, typeFilter, favoritesOnly, favoriteKeySet, minLength, maxLength, normalizedSearch]);

  if (!categories.length) {
    return (
      <div className="text-center p-8 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg">
        <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">No cards found</h2>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">The vocabulary database is empty. Please add entries to start learning.</p>
      </div>
    );
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleShuffle = () => {
    const shuffled = [...allFlashcards];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    onSelectCategory({
      name: 'Shuffle Deck',
      flashcards: shuffled,
      isShuffled: true,
    });
  };

  const handleFavorites = () => {
    if (!favoriteFlashcards.length) {
      return;
    }
    onSelectCategory({
      name: 'Favorite Cards',
      flashcards: favoriteFlashcards,
      isFavorites: true,
    });
  };

  const handleSpacedPractice = () => {
    if (!allFlashcards.length) {
      return;
    }
    const cardsWithPriority = allFlashcards.map((card) => {
      const stats = cardStats[getFlashcardKey(card)];
      const incorrectScore = stats ? stats.incorrect + 1 : 1.5;
      const correctScore = stats ? stats.correct + 1 : 1;
      const recencyBoost = stats ? Math.min((Date.now() - stats.lastReviewed) / (1000 * 60 * 60 * 24), 2) : 2;
      const priority = incorrectScore / correctScore + recencyBoost;
      return { card, priority };
    });
    cardsWithPriority.sort((a, b) => b.priority - a.priority);
    const prioritized = cardsWithPriority.map((item) => item.card);
    onSelectCategory({
      name: 'Spaced Practice',
      flashcards: prioritized,
      isShuffled: true,
    });
  };

  const triggerFilePicker = () => {
    setImportError(null);
    setImportStatus(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const text = String(loadEvent.target?.result ?? '');
        const lowerName = file.name.toLowerCase();
        const entries = lowerName.endsWith('.csv') ? parseCsvEntries(text) : parseJsonEntries(text);
        onUpdateCustomEntries(entries);
        setImportError(null);
        setImportStatus(`Imported ${entries.length} entries successfully.`);
      } catch (err) {
        setImportStatus(null);
        setImportError(err instanceof Error ? err.message : 'Failed to import vocabulary.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    downloadFile(JSON.stringify(combinedEntries, null, 2), 'vocabulary.json', 'application/json');
  };

  const handleExportCsv = () => {
    downloadFile(entriesToCsv(combinedEntries), 'vocabulary.csv', 'text/csv');
  };

  const handleClearCustomEntries = () => {
    onUpdateCustomEntries([]);
    setImportStatus('Custom vocabulary cleared.');
    setImportError(null);
  };

  const handleMinLengthChange = (value: number) => {
    const sanitized = Math.max(0, value);
    setMinLength(Math.min(sanitized, maxLength));
  };

  const handleMaxLengthChange = (value: number) => {
    const sanitized = Math.max(1, value);
    setMaxLength(Math.max(sanitized, minLength || sanitized));
  };

  const toggleThemedSelection = (name: string) => {
    setThemedSelection((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleStartThemed = () => {
    if (!themedSelection.size) {
      setImportError('Select at least one category for themed practice.');
      return;
    }
    const selectedCategories = categories.filter((category) =>
      themedSelection.has(category.name.toLowerCase())
    );
    const deck = selectedCategories.flatMap((category) => category.flashcards);
    if (deck.length === 0) {
      setImportError('No flashcards found for the selected categories.');
      return;
    }
    const trimmedDeck = deck.slice(0, Math.max(1, themedLimit));
    onSelectCategory({
      name: `Theme: ${Array.from(themedSelection).join(', ')}`,
      flashcards: trimmedDeck,
      isShuffled: true,
    });
  };

  const categoryTypes = useMemo(() => {
    const typeMap = new Map<string, string>();
    categories.forEach((category) => {
      const key = category.name.toLowerCase();
      if (!typeMap.has(key)) {
        typeMap.set(key, category.name);
      }
    });
    return Array.from(typeMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const statsEntries = Object.values(cardStats);
  const totalReviews = statsEntries.reduce((sum, stats) => sum + stats.seen, 0);
  const studiedCards = statsEntries.filter((stats) => stats.seen > 0).length;
  const totalCorrect = statsEntries.reduce((sum, stats) => sum + stats.correct, 0);
  const accuracy = totalReviews ? Math.round((totalCorrect / totalReviews) * 100) : 0;
  const dueForReview = statsEntries.filter((stats) => stats.incorrect > stats.correct).length;
  const lastImportLabel = customUpdatedAt ? new Date(customUpdatedAt).toLocaleString() : 'Never';
  const customEntryCount = Math.max(0, combinedEntries.length - baseVocabularyEntries.length);
  const sessionAccuracy = sessionStats.seen
    ? Math.round((sessionStats.correct / sessionStats.seen) * 100)
    : 0;
  const historyPoints = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const shortLabel = date.toLocaleDateString(undefined, { weekday: 'short' });
      days.push({
        label: shortLabel,
        value: studyHistory[key]?.seen ?? 0,
      });
    }
    return days;
  }, [studyHistory]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
    <div className="w-full max-w-4xl text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Guten Tag, {userName}!</h1>
      <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">Browse the categories below or search for a specific topic.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Session progress</p>
              <p className="text-2xl font-bold">{sessionStats.seen} cards</p>
            </div>
            <button
              onClick={onResetSession}
              className="text-xs px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Reset
            </button>
          </div>
          <ChartBar value={sessionStats.seen} max={Math.max(allFlashcards.length, 1)} colorClass="bg-blue-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sessionStats.correct} correct · {sessionStats.incorrect} incorrect · {sessionAccuracy}% accuracy ·{' '}
            {sessionStats.notes.length} notes
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Overall cards studied</p>
          <p className="text-2xl font-bold">
            {studiedCards} / {allFlashcards.length}
          </p>
          <ChartBar value={studiedCards} max={Math.max(allFlashcards.length, 1)} colorClass="bg-green-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalReviews} total reviews · {accuracy}% accuracy
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Favorites & due</p>
          <p className="text-2xl font-bold">{favoriteFlashcards.length} favorites</p>
          <ChartBar value={favoriteFlashcards.length} max={Math.max(allFlashcards.length, 1)} colorClass="bg-yellow-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {dueForReview} cards flagged for extra practice
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Custom entries</p>
          <p className="text-2xl font-bold">{customEntryCount}</p>
          <ChartBar value={customEntryCount} max={Math.max(combinedEntries.length, 1)} colorClass="bg-purple-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Last import: {lastImportLabel}</p>
        </div>
      </div>

      <div className="w-full mb-8 text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Study charts</h3>
        <div>
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-1">
            <span>Overall completion</span>
            <span>
              {studiedCards}/{allFlashcards.length}
            </span>
          </div>
          <ChartBar value={studiedCards} max={Math.max(allFlashcards.length, 1)} colorClass="bg-blue-500" />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-1">
            <span>Session accuracy</span>
            <span>{sessionAccuracy}%</span>
          </div>
          <ChartBar value={sessionAccuracy} max={100} colorClass="bg-green-500" />
        </div>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Last 7 days (cards reviewed)</p>
          <StudyHistoryChart data={historyPoints} />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 w-full">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search categories or words"
          className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <span className="text-blue-500">●</span> Shuffle deck
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Crie uma sessão completa com cartas embaralhadas.</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleShuffle}
                className="flex-1 min-w-[120px] px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Shuffle all cards
              </button>
              <button
                onClick={handleFavorites}
                disabled={!favoriteFlashcards.length}
                className="flex-1 min-w-[120px] px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                Favorites ({favoriteFlashcards.length})
              </button>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <span className="text-emerald-500">●</span> Spaced practice
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Priorize cartas com mais erros e maior tempo sem revisão.
            </p>
            <button
              onClick={handleSpacedPractice}
              className="w-full px-4 py-2 rounded-lg border border-green-500 text-green-600 dark:text-green-300 hover:bg-green-50 dark:hover:bg-slate-800 transition"
            >
              Start spaced practice
            </button>
          </div>
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <span className="text-indigo-500">●</span> Quick quiz
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Teste relâmpago de múltipla escolha.</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={30}
                value={quizCount}
                onChange={(e) => setQuizCount(Math.max(5, Math.min(30, Number(e.target.value))))}
                className="w-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
              <button
                onClick={() => onStartQuiz(quizCount)}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Start quiz
              </button>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <span className="text-pink-500">●</span> Writing practice
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Digite as respostas em alemão com tolerância a pequenos erros.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={30}
                value={writingCount}
                onChange={(e) => setWritingCount(Math.max(5, Math.min(30, Number(e.target.value))))}
                className="w-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
              <button
                onClick={() => onStartWriting(writingCount)}
                className="flex-1 px-4 py-2 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-700 transition"
              >
                Start writing
              </button>
            </div>
          </div>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center xl:text-left">
          Showing {filteredCategories.length} categorie{filteredCategories.length === 1 ? 'y' : 's'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-left">
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            <option value="all">All</option>
            {categoryTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Min letters</label>
          <input
            type="number"
            min={0}
            value={minLength}
            onChange={(e) => handleMinLengthChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Max letters</label>
          <input
            type="number"
            min={1}
            value={maxLength}
            onChange={(e) => handleMaxLengthChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-slate-500 dark:text-slate-400">Favorites only</label>
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
            disabled={favoriteFlashcards.length === 0}
          />
        </div>
      </div>

      <div className="w-full mb-8 text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Themed revision</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Selected {themedSelection.size} categories
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Combine multiple categories/tags to build a custom deck. Great for misturar verbos + expressões, por exemplo.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
          {categoryTypes.map((type) => (
            <label
              key={type.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                themedSelection.has(type.value)
                  ? 'border-blue-500 bg-blue-50 dark:bg-slate-700'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={themedSelection.has(type.value)}
                onChange={() => toggleThemedSelection(type.value)}
              />
              <span className="text-sm text-slate-700 dark:text-slate-200 capitalize">{type.label}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm text-slate-500 dark:text-slate-400">Max cards</label>
            <input
              type="number"
              min={5}
              value={themedLimit}
              onChange={(e) => setThemedLimit(Math.max(5, Number(e.target.value)))}
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={handleStartThemed}
            className="w-full md:w-auto px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
          >
            Start themed practice
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-3 mb-8">
        <button
          onClick={handleExportJson}
          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          Export JSON
        </button>
        <button
          onClick={handleExportCsv}
          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          Export CSV
        </button>
        <button
          onClick={triggerFilePicker}
          className="flex-1 px-4 py-3 rounded-lg border border-blue-400 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
        >
          Import JSON/CSV
        </button>
        <button
          onClick={handleClearCustomEntries}
          disabled={!hasCustomEntries}
          className="flex-1 px-4 py-3 rounded-lg border border-red-400 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Clear custom data
        </button>
        <input
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {(importStatus || importError) && (
        <p
          className={`mb-6 text-sm ${
            importError ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-400'
          }`}
        >
          {importStatus ?? importError}
        </p>
      )}

      {filteredCategories.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-300">No categories match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat)}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{cat.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{cat.flashcards.length} cards</p>
              </button>
            ))}
          </div>

        </>
      )}
    </div>
    {showScrollTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 px-4 py-3 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        ↑ Back to top
      </button>
    )}
    </>
  );
};

export default CategorySelection;
