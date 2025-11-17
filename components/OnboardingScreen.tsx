
import React, { useState } from 'react';

interface OnboardingScreenProps {
  onNameSubmit: (name: string) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-fade-in">
      <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Willkommen!</h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">Let's learn some German. What's your name?</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 mb-6 text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-white border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          Start Learning
        </button>
      </form>
    </div>
  );
};

export default OnboardingScreen;
