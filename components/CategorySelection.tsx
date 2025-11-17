
import React, { useState, useEffect } from 'react';
import { generateFlashcardData } from '../services/geminiService';
import type { Category } from '../types';
import Spinner from './Spinner';

interface CategorySelectionProps {
  userName: string;
  onSelectCategory: (category: Category) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ userName, onSelectCategory }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await generateFlashcardData();
        setCategories(data);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-lg">Generating your lessons, {userName}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 rounded-lg">
        <h2 className="text-2xl font-bold text-red-800 dark:text-red-200">Oops!</h2>
        <p className="mt-2 text-red-700 dark:text-red-300">{error}</p>
        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">Please check your internet connection and API key setup.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Guten Tag, {userName}!</h1>
      <p className="text-xl text-slate-600 dark:text-slate-300 mb-10">Choose a category to start your lesson.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, index) => (
          <button
            key={index}
            onClick={() => onSelectCategory(cat)}
            className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{cat.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{cat.flashcards.length} cards</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;
