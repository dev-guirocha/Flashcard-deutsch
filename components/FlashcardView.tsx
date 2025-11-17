
import React, { useState, useEffect } from 'react';
import type { Category, Flashcard, CardStats } from '../types';
import type { VocabularyEntry } from '../data/vocabulary';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { BackIcon } from './icons/BackIcon';

interface FlashcardViewProps {
  category: Category;
  onBack: () => void;
  onToggleFavorite: (card: Flashcard) => void;
  isFavorite: (card: Flashcard) => boolean;
  onRecordResult: (card: Flashcard, isCorrect: boolean) => void;
  getCardStats: (card: Flashcard) => CardStats | undefined;
  sessionStats: {
    seen: number;
    correct: number;
    incorrect: number;
    notes: string[];
    startedAt: number;
  };
  onAddSessionNote: (note: string) => void;
  onSaveCard: (entry: VocabularyEntry) => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({
  category,
  onBack,
  onToggleFavorite,
  isFavorite,
  onRecordResult,
  getCardStats,
  sessionStats,
  onAddSessionNote,
  onSaveCard,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(category.flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    englishTranslation: '',
    germanSentence: '',
    englishSentenceTranslation: '',
  });

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  useEffect(() => {
    setCards(category.flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [category]);

  if (!cards.length) {
    return (
      <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-4">No cards available</h2>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Back to categories
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const remainingCards = Math.max(0, cards.length - currentIndex - 1);
  const currentStats = getCardStats(currentCard);
  const accuracy =
    currentStats && currentStats.seen
      ? Math.round((currentStats.correct / currentStats.seen) * 100)
      : null;

  useEffect(() => {
    setEditValues({
      englishTranslation: currentCard.englishTranslation,
      germanSentence: currentCard.germanSentence ?? '',
      englishSentenceTranslation: currentCard.englishSentenceTranslation ?? '',
    });
  }, [currentCard]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
  };

  const handleReshuffle = () => {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleResult = (isEasy: boolean) => {
    onRecordResult(currentCard, isEasy);
    handleNext();
  };

  const handleAddNote = () => {
    if (!noteDraft.trim()) {
      return;
    }
    onAddSessionNote(noteDraft);
    setNoteDraft('');
  };

  const handleEditChange = (field: keyof typeof editValues, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = () => {
    const updatedEntry: VocabularyEntry = {
      germanWord: currentCard.germanWord,
      englishTranslation: editValues.englishTranslation,
      category: currentCard.category ?? category.name,
      germanSentence: editValues.germanSentence || undefined,
      englishSentenceTranslation: editValues.englishSentenceTranslation || undefined,
    };
    onSaveCard(updatedEntry);
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <BackIcon />
          Back to Categories
        </button>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-center">{category.name}</h1>
          <button
            onClick={() => onToggleFavorite(currentCard)}
            className="text-sm px-3 py-1 rounded-full border border-yellow-400 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-slate-700 transition"
          >
            {isFavorite(currentCard) ? '★ Remove favorite' : '☆ Mark as favorite'}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs px-3 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Edit card
          </button>
        </div>
        <div className="w-36 text-right text-sm text-slate-500 dark:text-slate-400">
          {category.isShuffled && (
            <button
              onClick={handleReshuffle}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Reshuffle deck
            </button>
          )}
        </div>
      </div>

      <div className="w-full aspect-[3/2] perspective-[1000px] mb-4">
        <div 
          className={`relative w-full h-full flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of Card */}
          <div className="absolute w-full h-full flashcard-front p-6 flex flex-col justify-center items-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl cursor-pointer border border-slate-200 dark:border-slate-700">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 text-center">{currentCard.germanWord}</h2>
            {currentCard.germanSentence && (
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 text-center italic">"{currentCard.germanSentence}"</p>
            )}
            <span className="absolute bottom-4 text-sm text-slate-400">Click to flip</span>
          </div>
          
          {/* Back of Card */}
          <div className="absolute w-full h-full flashcard-back p-6 flex flex-col justify-center items-center bg-blue-50 dark:bg-slate-700 rounded-2xl shadow-xl cursor-pointer border border-slate-200 dark:border-slate-600">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 text-center">{currentCard.englishTranslation}</h2>
            {currentCard.englishSentenceTranslation && (
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 text-center italic">"{currentCard.englishSentenceTranslation}"</p>
            )}
             <span className="absolute bottom-4 text-sm text-slate-400">Click to flip</span>
          </div>
        </div>
      </div>
      
      <div className="text-center text-lg mb-4 font-medium">
        Card {currentIndex + 1} of {cards.length} · {remainingCards} left
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {currentStats ? (
          <>
            Seen {currentStats.seen} · Correct {currentStats.correct} · Incorrect {currentStats.incorrect}{' '}
            {accuracy !== null && `· ${accuracy}% accuracy`}
          </>
        ) : (
          'No stats yet for this card'
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mb-4">
        <button
          onClick={() => handleResult(false)}
          className="flex-1 px-6 py-3 rounded-lg border border-red-300 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-slate-700 transition"
        >
          Need more practice
        </button>
        <button
          onClick={() => handleResult(true)}
          className="flex-1 px-6 py-3 rounded-lg border border-green-400 text-green-600 dark:text-green-300 hover:bg-green-50 dark:hover:bg-slate-700 transition"
        >
          I got it
        </button>
      </div>

      <div className="w-full max-w-xl mb-6 text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Session tracker</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Since {new Date(sessionStats.startedAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {sessionStats.seen} cards · {sessionStats.correct} correct · {sessionStats.incorrect} incorrect
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Quick note about this session"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          />
          <button
            onClick={handleAddNote}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Save note
          </button>
        </div>
        {sessionStats.notes.length > 0 && (
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-100">Recent notes:</p>
            {sessionStats.notes.slice(0, 3).map((note, index) => (
              <p key={`${note}-${index}`} className="italic">• {note}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between w-full max-w-sm">
        <button onClick={handlePrev} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all transform hover:scale-105">
          <ArrowLeftIcon />
          Previous
        </button>
        <button onClick={handleNext} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105">
          Next
          <ArrowRightIcon />
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 text-left">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
              Edit {currentCard.germanWord}
            </h3>
            <div className="space-y-3">
              <label className="block text-sm text-slate-500 dark:text-slate-400">
                English translation
                <input
                  type="text"
                  value={editValues.englishTranslation}
                  onChange={(e) => handleEditChange('englishTranslation', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </label>
              <label className="block text-sm text-slate-500 dark:text-slate-400">
                German example sentence
                <textarea
                  value={editValues.germanSentence}
                  onChange={(e) => handleEditChange('germanSentence', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </label>
              <label className="block text-sm text-slate-500 dark:text-slate-400">
                English translation of sentence
                <textarea
                  value={editValues.englishSentenceTranslation}
                  onChange={(e) => handleEditChange('englishSentenceTranslation', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardView;
