
import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { BackIcon } from './icons/BackIcon';

interface FlashcardViewProps {
  category: Category;
  onBack: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ category, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % category.flashcards.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + category.flashcards.length) % category.flashcards.length);
  };
  
  const currentCard = category.flashcards[currentIndex];

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <BackIcon />
          Back to Categories
        </button>
        <h1 className="text-2xl font-bold text-center">{category.name}</h1>
        <div className="w-36"></div>
      </div>

      <div className="w-full aspect-[3/2] perspective-[1000px] mb-4">
        <div 
          className={`relative w-full h-full flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of Card */}
          <div className="absolute w-full h-full flashcard-front p-6 flex flex-col justify-center items-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl cursor-pointer border border-slate-200 dark:border-slate-700">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 text-center">{currentCard.germanWord}</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 text-center italic">"{currentCard.germanSentence}"</p>
            <span className="absolute bottom-4 text-sm text-slate-400">Click to flip</span>
          </div>
          
          {/* Back of Card */}
          <div className="absolute w-full h-full flashcard-back p-6 flex flex-col justify-center items-center bg-blue-50 dark:bg-slate-700 rounded-2xl shadow-xl cursor-pointer border border-slate-200 dark:border-slate-600">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 text-center">{currentCard.englishTranslation}</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 text-center italic">"{currentCard.englishSentenceTranslation}"</p>
             <span className="absolute bottom-4 text-sm text-slate-400">Click to flip</span>
          </div>
        </div>
      </div>
      
      <div className="text-center text-lg mb-4 font-medium">
        Card {currentIndex + 1} of {category.flashcards.length}
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
    </div>
  );
};

export default FlashcardView;
