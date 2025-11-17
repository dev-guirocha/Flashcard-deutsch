
export interface Flashcard {
  germanWord: string;
  englishTranslation: string;
  germanSentence?: string;
  englishSentenceTranslation?: string;
  category?: string;
}

export interface Category {
  name: string;
  flashcards: Flashcard[];
  isShuffled?: boolean;
  isFavorites?: boolean;
}

export interface CardStats {
  seen: number;
  correct: number;
  incorrect: number;
  lastReviewed: number;
}
