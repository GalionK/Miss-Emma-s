export interface VocabularyEntry {
  word: string;
  definition: string;
  ipa?: string; // International Phonetic Alphabet transcription
}

export type Accent = 'American' | 'British';

export type ReadingSpeed = 'Slower' | 'Normal' | 'Faster';

export interface FormattedTextResponse {
    formattedText: string;
    supportiveComment: string;
}

export interface ReadingLog {
    textSnippet: string;
    date: string;
    duration: number; // in seconds
}

export interface ProgressData {
    readingLogs: ReadingLog[];
    vocabularyList: VocabularyEntry[];
    totalReadingTime: number; // in seconds
}

export interface PronunciationCorrection {
  word: string;
  correctionTip: string;
}

export interface PronunciationFeedbackResponse {
  overallFeedback: string;
  corrections: PronunciationCorrection[];
  accuracyScore: number;
}