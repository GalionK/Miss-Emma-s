
import type { ProgressData } from '../types';

const PROGRESS_KEY = 'missEmmaProgress';

const defaultProgress: ProgressData = {
    readingLogs: [],
    vocabularyList: [],
    totalReadingTime: 0,
};

// Load progress from local storage
export function loadProgress(): ProgressData {
    try {
        const savedProgress = localStorage.getItem(PROGRESS_KEY);
        if (savedProgress) {
            return JSON.parse(savedProgress) as ProgressData;
        }
    } catch (error) {
        console.error("Failed to load progress from localStorage:", error);
    }
    return defaultProgress;
}

// Save progress to local storage
export function saveProgress(data: ProgressData): void {
    try {
        const dataToSave = JSON.stringify(data);
        localStorage.setItem(PROGRESS_KEY, dataToSave);
    } catch (error) {
        console.error("Failed to save progress to localStorage:", error);
    }
}

// Clear all progress from local storage
export function clearProgress(): void {
    try {
        localStorage.removeItem(PROGRESS_KEY);
    } catch (error) {
        console.error("Failed to clear progress from localStorage:", error);
    }
}
