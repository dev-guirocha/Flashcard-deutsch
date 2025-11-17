
import React, { useState, useEffect } from 'react';
import OnboardingScreen from './components/OnboardingScreen';
import CategorySelection from './components/CategorySelection';
import FlashcardView from './components/FlashcardView';
import type { Category } from './types';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('germanFlashcardsUserName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

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

  const renderContent = () => {
    if (!userName) {
      return <OnboardingScreen onNameSubmit={handleNameSubmit} />;
    }
    if (!selectedCategory) {
      return <CategorySelection userName={userName} onSelectCategory={handleSelectCategory} />;
    }
    return <FlashcardView category={selectedCategory} onBack={handleBackToCategories} />;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      {renderContent()}
    </div>
  );
};

export default App;
