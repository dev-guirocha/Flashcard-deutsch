
export interface Flashcard {
  germanWord: string;
  englishTranslation: string;
  germanSentence: string;
  englishSentenceTranslation: string;
}

export interface Category {
  name: string;
  flashcards: Flashcard[];
}
