import React, { useState, useCallback, Fragment, useRef, useEffect } from 'react';
import { getFormattedText, getVocabularyExplanations, generateAudio, getPronunciationGuide, getPronunciationFeedback } from './services/geminiService';
import { playAudio, decode, decodeAudioData } from './utils/audioUtils';
import { loadProgress, saveProgress, clearProgress } from './utils/progressUtils';
import type { Accent, FormattedTextResponse, VocabularyEntry, ProgressData, ReadingLog, PronunciationFeedbackResponse, ReadingSpeed } from './types';

// Helper component defined outside the main App to prevent re-creation on re-renders
const IconBook: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

const IconChart: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="m19 9-5 5-4-4-3 3"/>
    </svg>
);

const IconTranslate: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 16.5l-3-3 3-3"/>
        <path d="M3 13.5h18"/>
        <path d="M18 7.5l3 3-3 3"/>
        <path d="M21 10.5H3"/>
    </svg>
);

const IconRepeat: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 2.1l4 4-4 4"/>
        <path d="M3 12.6v-2.6c0-3.3 2.7-6 6-6h12"/>
        <path d="M7 21.9l-4-4 4-4"/>
        <path d="M21 11.4v2.6c0 3.3-2.7 6-6 6H3"/>
    </svg>
);

const IconStop: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="6" width="12" height="12" rx="1"></rect>
    </svg>
);

const IconSpeaker: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

const IconSpinner: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const IconMic: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

const IconShare: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
);

const IconCopy: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const IconDownload: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);

const IconPlay: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
    </svg>
);

const IconPause: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
);

const IconVolumeMax: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
);


const PronunciationGuideModal: React.FC<{
    word: string | null;
    data: { ipa: string } | null;
    isLoading: boolean;
    onClose: () => void;
    onPlayWord: (word: string) => void;
    playingWord: string | null;
}> = ({ word, data, isLoading, onClose, onPlayWord, playingWord }) => {
    if (!word) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs flex flex-col p-6 text-center relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full" aria-label="Close pronunciation guide">
                   <IconClose className="w-5 h-5" />
                </button>
                <h3 className="text-4xl font-bold text-slate-800 mb-2 capitalize break-words animate-subtle-pop-in">{word}</h3>
                {isLoading && (
                    <div className="flex flex-col justify-center items-center my-4 h-24">
                        <IconSpinner className="w-8 h-8 text-emerald-500" />
                        <span className="mt-3 text-slate-500">Finding pronunciation...</span>
                    </div>
                )}
                {data && (
                    <div className="animate-fade-in my-4 h-24 flex flex-col justify-center">
                        <p className="text-2xl text-slate-500 font-mono">/{data.ipa}/</p>
                        <button
                            onClick={() => onPlayWord(word)}
                            disabled={!!playingWord}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            aria-label={`Pronounce ${word}`}
                        >
                            {playingWord === word ? <IconSpinner className="w-5 h-5" /> : <IconSpeaker className="w-5 h-5" />}
                            Listen
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProgressModal: React.FC<{
    progress: ProgressData;
    isOpen: boolean;
    onClose: () => void;
    onClear: () => void;
    onExport: () => void;
    onPlayWord: (word: string) => void;
    playingWord: string | null;
}> = ({ progress, isOpen, onClose, onClear, onExport, onPlayWord, playingWord }) => {
    if (!isOpen) return null;

    const totalReadingMinutes = Math.floor(progress.totalReadingTime / 60);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">My Progress</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                </header>
                <main className="p-6 overflow-y-auto">
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                        <div className="bg-emerald-50 p-4 rounded-lg">
                            <div className="text-3xl font-bold text-emerald-600">{progress.readingLogs.length}</div>
                            <div className="text-sm text-slate-600">Texts Read</div>
                        </div>
                        <div className="bg-sky-50 p-4 rounded-lg">
                            <div className="text-3xl font-bold text-sky-600">{progress.vocabularyList.length}</div>
                            <div className="text-sm text-slate-600">Words Explained</div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg">
                            <div className="text-3xl font-bold text-indigo-600">{totalReadingMinutes}</div>
                            <div className="text-sm text-slate-600">Minutes Read</div>
                        </div>
                    </section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xl font-bold mb-3 text-slate-700">Reading History</h3>
                            <ul className="space-y-2">
                                {progress.readingLogs.length > 0 ? progress.readingLogs.map((log, i) => (
                                    <li key={i} className="p-3 bg-slate-50 rounded-md text-sm">
                                        <p className="font-medium text-slate-800 truncate">"{log.textSnippet}"</p>
                                        <p className="text-xs text-slate-500">{new Date(log.date).toLocaleString()}</p>
                                    </li>
                                )) : <p className="text-slate-500 text-sm">No reading history yet.</p>}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-3 text-slate-700">My Vocabulary</h3>
                             <ul className="space-y-2">
                                {progress.vocabularyList.length > 0 ? progress.vocabularyList.map((item, i) => (
                                     <li key={i} className="p-3 bg-slate-50 rounded-md text-sm">
                                         <div className="flex items-center">
                                            <span className="font-semibold text-slate-800">{item.word}</span>
                                            <button
                                                onClick={() => onPlayWord(item.word)}
                                                disabled={!!playingWord}
                                                className="ml-2 p-1 text-sky-500 hover:text-sky-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                                                aria-label={`Pronounce ${item.word}`}
                                            >
                                                {playingWord === item.word ? <IconSpinner className="w-4 h-4" /> : <IconSpeaker className="w-4 h-4" />}
                                            </button>
                                            {item.ipa && <span className="text-xs text-slate-500 ml-2">/{item.ipa}/</span>}
                                         </div>
                                         <div className="text-slate-600 mt-1" dir="rtl">{item.definition}</div>
                                     </li>
                                )) : <p className="text-slate-500 text-sm">No vocabulary saved yet.</p>}
                            </ul>
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-slate-200 flex justify-between items-center">
                    <button 
                        onClick={onExport}
                        className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition duration-300 border border-slate-300"
                    >
                        <IconDownload className="w-5 h-5"/> Export JSON
                    </button>
                    <button onClick={onClear} className="text-sm text-red-500 hover:text-red-700 hover:underline">Clear All Progress</button>
                </footer>
            </div>
        </div>
    );
};

const AssignmentModal: React.FC<{
    link: string | null;
    onClose: () => void;
}> = ({ link, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);
    if (!link) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full" aria-label="Close share dialog">
                   <IconClose className="w-5 h-5" />
                </button>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Assign to Student</h3>
                <p className="text-slate-500 mb-4">Share this link with your student. They will see the text and be able to practice.</p>
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        readOnly 
                        value={link} 
                        className="w-full bg-slate-100 p-3 pr-12 border border-slate-300 rounded-lg text-slate-700 text-sm"
                        onFocus={(e) => e.target.select()}
                    />
                    <button 
                        onClick={handleCopy}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-500 hover:bg-slate-200 transition"
                        aria-label="Copy link"
                    >
                        {isCopied ? <span className="text-sm text-emerald-600 font-semibold">Copied!</span> : <IconCopy className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const scoreOffset = circumference - (score / 100) * circumference;
        setOffset(scoreOffset);
    }, [score, circumference]);

    let strokeColorClass = 'text-emerald-500';
    if (score < 75) strokeColorClass = 'text-yellow-500';
    if (score < 50) strokeColorClass = 'text-red-500';

    return (
        <div className="relative flex-shrink-0 flex items-center justify-center w-32 h-32">
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                <circle
                    className="text-slate-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
                <circle
                    className={`${strokeColorClass} transition-all duration-1000 ease-in-out`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
            </svg>
            <span className={`text-3xl font-bold ${strokeColorClass}`}>{score}</span>
            <span className="absolute bottom-6 text-xs text-slate-500">/ 100</span>
        </div>
    );
};

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
}> = ({ isPlaying, currentTime, duration, volume, onPlayPause, onSeek, onVolumeChange }) => {
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSeek(parseFloat(e.target.value));
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        onVolumeChange(parseFloat(e.target.value));
    };
    
    return (
        <div className="mt-6 bg-slate-100 p-4 rounded-lg flex items-center gap-4 border border-slate-200">
            <button
                onClick={onPlayPause}
                className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition"
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? <IconPause className="w-6 h-6" /> : <IconPlay className="w-6 h-6 pl-1" />}
            </button>
            <div className="flex-grow flex items-center gap-3">
                <span className="text-sm font-mono text-slate-600">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    aria-label="Seek audio"
                />
                <span className="text-sm font-mono text-slate-600">{formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-2 w-32">
                <IconVolumeMax className="w-5 h-5 text-slate-500" />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolume}
                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    aria-label="Adjust volume"
                />
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [inputText, setInputText] = useState<string>('');
    const [lastProcessedText, setLastProcessedText] = useState<string>('');
    const [formattedResponse, setFormattedResponse] = useState<FormattedTextResponse | null>(null);
    const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
    const [accent, setAccent] = useState<Accent>('American');
    const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>('Normal');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingAction, setLoadingAction] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [playingWord, setPlayingWord] = useState<string | null>(null);

    const [progressData, setProgressData] = useState<ProgressData>(loadProgress());
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

    const [pronunciationGuideWord, setPronunciationGuideWord] = useState<string | null>(null);
    const [pronunciationGuideData, setPronunciationGuideData] = useState<{ ipa: string } | null>(null);
    const [isFetchingPronunciation, setIsFetchingPronunciation] = useState<boolean>(false);

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [pronunciationFeedback, setPronunciationFeedback] = useState<PronunciationFeedbackResponse | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const recordingTimerRef = useRef<number | null>(null);

    const [isAssignmentMode, setIsAssignmentMode] = useState<boolean>(false);
    const [assignmentLink, setAssignmentLink] = useState<string | null>(null);
    const [showReportCopied, setShowReportCopied] = useState(false);

    // --- New Audio Player State & Refs ---
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(1);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    const animationFrameIdRef = useRef<number | null>(null);
    const currentTimeOnStop = useRef<number>(0);

    useEffect(() => {
        saveProgress(progressData);
    }, [progressData]);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const assignment = params.get('assignment');
        if (assignment) {
            try {
                const binaryString = atob(assignment);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const decodedText = new TextDecoder().decode(bytes);
                setInputText(decodedText);
                setIsAssignmentMode(true);
            } catch (e) {
                console.error("Failed to decode assignment text:", e);
                setError("The assignment link appears to be invalid or corrupted.");
            }
        }
    }, []);

    useEffect(() => {
        // Cleanup timer on component unmount
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    const stopPlayback = useCallback((resetPlayer: boolean = false) => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null;
            try {
                audioSourceRef.current.stop();
            } catch (e) { /* Ignore if already stopped */ }
            audioSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
        }
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        setIsPlaying(false);

        if (resetPlayer) {
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close();
                audioContextRef.current = null;
            }
            setAudioBuffer(null);
            setCurrentTime(0);
            setDuration(0);
            pauseTimeRef.current = 0;
            startTimeRef.current = 0;
        }
    }, []);

    const playAudioBuffer = useCallback(() => {
        if (!audioBuffer) return;

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.gain.value = volume;
            gainNodeRef.current.connect(audioContextRef.current.destination);
        }
        
        audioContextRef.current.resume();

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNodeRef.current!);
        audioSourceRef.current = source;
        
        const offset = pauseTimeRef.current % audioBuffer.duration;
        startTimeRef.current = audioContextRef.current.currentTime - offset;

        source.onended = () => {
            const endedNaturally = currentTimeOnStop.current >= duration - 0.1;
            stopPlayback(false); // Stop but don't reset the player
            
            if (endedNaturally) {
                 if (!isAssignmentMode) {
                     const newLog: ReadingLog = {
                        textSnippet: lastProcessedText.substring(0, 100) + (lastProcessedText.length > 100 ? '...' : ''),
                        date: new Date().toISOString(),
                        duration: duration,
                    };
                    setProgressData(prev => ({
                        ...prev,
                        readingLogs: [newLog, ...prev.readingLogs].slice(0, 20),
                        totalReadingTime: prev.totalReadingTime + duration,
                    }));
                }
                setCurrentTime(0);
                pauseTimeRef.current = 0;
            }
        };
        
        source.start(0, offset);
        setIsPlaying(true);
    }, [audioBuffer, duration, volume, isAssignmentMode, lastProcessedText]);

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            stopPlayback(false);
        } else {
            playAudioBuffer();
        }
    }, [isPlaying, playAudioBuffer, stopPlayback]);

    const handleSeek = useCallback((time: number) => {
        if (!audioBuffer) return;
        const wasPlaying = isPlaying;
        stopPlayback(false);
        pauseTimeRef.current = time;
        setCurrentTime(time);
        if (wasPlaying) {
            playAudioBuffer();
        }
    }, [audioBuffer, isPlaying, playAudioBuffer, stopPlayback]);

    const handleVolumeChange = useCallback((newVolume: number) => {
        setVolume(newVolume);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = newVolume;
        }
    }, []);

    useEffect(() => {
        const updateProgress = () => {
            if (isPlaying && audioContextRef.current) {
                const newCurrentTime = (audioContextRef.current.currentTime - startTimeRef.current);
                currentTimeOnStop.current = newCurrentTime;
                setCurrentTime(newCurrentTime);
            }
            animationFrameIdRef.current = requestAnimationFrame(updateProgress);
        };

        if (isPlaying) {
            animationFrameIdRef.current = requestAnimationFrame(updateProgress);
        } else {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        }

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [isPlaying]);

    const handleProcessText = useCallback(async (textToProcess: string, isRepeat: boolean = false) => {
        if (!isRepeat && !textToProcess.trim()) {
            setError("Please enter some text to read.");
            return;
        }
        const effectiveText = isRepeat ? lastProcessedText : textToProcess;
        if (!effectiveText) return;

        setIsLoading(true);
        setError(null);
        setPronunciationFeedback(null);
        stopPlayback(true);
        
        try {
            let response: FormattedTextResponse;
            if (!isRepeat || !formattedResponse) {
                setLoadingAction("Analyzing text...");
                setFormattedResponse(null);
                setVocabulary([]);
                response = await getFormattedText(effectiveText);
                setFormattedResponse(response);
                setLastProcessedText(effectiveText);
            } else {
                response = formattedResponse;
            }
            
            setLoadingAction(`Preparing audio...`);
            const textToRead = response.formattedText.replace(/\*\*/g, '');
            const audioResult = await generateAudio(textToRead, accent, readingSpeed);

            const tempAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBytes = decode(audioResult);
            const decodedBuffer = await decodeAudioData(audioBytes, tempAudioContext, 24000, 1);
            tempAudioContext.close();
            
            setAudioBuffer(decodedBuffer);
            setDuration(decodedBuffer.duration);

        } catch (err) {
            console.error(err);
            setError("An error occurred. Please check the console for details.");
            stopPlayback(true);
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    }, [accent, readingSpeed, lastProcessedText, formattedResponse, stopPlayback]);

    const handleExplain = useCallback(async () => {
        const textToExplain = lastProcessedText || inputText;
        if (!textToExplain) return;
        
        setIsLoading(true);
        setLoadingAction("Finding definitions...");
        setError(null);
        try {
            const vocabResult = await getVocabularyExplanations(textToExplain);
            setVocabulary(vocabResult);

            if (!isAssignmentMode) {
                setProgressData(prev => {
                    const newWords = vocabResult.filter(
                        newItem => !prev.vocabularyList.some(existingItem => existingItem.word.toLowerCase() === newItem.word.toLowerCase())
                    );
                    if (newWords.length === 0) return prev;
                    return {
                        ...prev,
                        vocabularyList: [...prev.vocabularyList, ...newWords],
                    };
                });
            }

        } catch (err) {
            console.error(err);
            setError("Could not get explanations. Please try again.");
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    }, [lastProcessedText, inputText, isAssignmentMode]);
    
    const handlePlayWordAudio = useCallback(async (wordToPlay: string) => {
        if (playingWord || isPlaying) return;
        setPlayingWord(wordToPlay);
        setError(null);
        try {
            const audioResult = await generateAudio(wordToPlay, accent, readingSpeed);
            await playAudio(audioResult);
        } catch (err) {
            console.error(`Error playing audio for ${wordToPlay}:`, err);
            setError(`Sorry, I couldn't play the audio for "${wordToPlay}".`);
        } finally {
            setPlayingWord(null);
        }
    }, [accent, readingSpeed, playingWord, isPlaying]);

    const handleClearProgress = () => {
        if (window.confirm("Are you sure you want to clear all your progress? This cannot be undone.")) {
            clearProgress();
            setProgressData({ readingLogs: [], vocabularyList: [], totalReadingTime: 0 });
            setIsProgressModalOpen(false);
        }
    };

    const handleExportProgress = () => {
        if (!progressData || (progressData.readingLogs.length === 0 && progressData.vocabularyList.length === 0)) {
            alert("There is no progress data to export.");
            return;
        }

        try {
            const jsonString = JSON.stringify(progressData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            const date = new Date().toISOString().slice(0, 10);
            link.download = `miss_emma_progress_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
        } catch (error) {
            console.error("Failed to export progress data:", error);
            setError("An error occurred while exporting your data.");
        }
    };

    const handleShowPronunciationGuide = useCallback(async (word: string) => {
        if (isPlaying || isLoading || playingWord) return;
        const cleanedWord = word.trim().replace(/[.,!?;:"'()]/g, '');
        if (!cleanedWord) return;
    
        setPronunciationGuideWord(cleanedWord);
        setIsFetchingPronunciation(true);
        setPronunciationGuideData(null);
        setError(null);
    
        try {
            const result = await getPronunciationGuide(cleanedWord);
            if (result && result.ipa) {
                setPronunciationGuideData(result);
            } else {
                setError(`Could not find pronunciation for "${cleanedWord}".`);
                setPronunciationGuideWord(null); 
            }
        } catch (err) {
            console.error(`Error fetching pronunciation for ${cleanedWord}:`, err);
            setError(`Sorry, an error occurred while looking up "${cleanedWord}".`);
            setPronunciationGuideWord(null);
        } finally {
            setIsFetchingPronunciation(false);
        }
    }, [isLoading, playingWord, isPlaying]);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleStartRecording = useCallback(async () => {
        setError(null);
        setPronunciationFeedback(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Audio recording is not supported by your browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm' };
            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                setIsAnalyzing(true);
                setLoadingAction("Analyzing your pronunciation...");

                const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
                const audioBase64 = await blobToBase64(audioBlob);

                try {
                    const textForFeedback = (formattedResponse?.formattedText || inputText).replace(/\*\*/g, '');
                    if (textForFeedback) {
                        const feedback = await getPronunciationFeedback(
                            textForFeedback, 
                            { mimeType: options.mimeType, data: audioBase64 },
                            accent
                        );
                        setPronunciationFeedback(feedback);
                    }
                } catch (err) {
                    console.error("Pronunciation analysis failed:", err);
                    setError("Sorry, I couldn't analyze your pronunciation. Please try again.");
                } finally {
                    setIsAnalyzing(false);
                    setLoadingAction('');
                }
            };

            recorder.start();
            setIsRecording(true);

            setRecordingDuration(0);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingDuration(prevDuration => prevDuration + 1);
            }, 1000);

        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Could not start recording. Please make sure microphone access is allowed.");
        }
    }, [accent, formattedResponse, inputText]);

    const handleStopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    }, []);

    const handleGenerateAssignmentLink = () => {
        if (!inputText.trim()) {
            setError("Please enter some text before creating an assignment.");
            return;
        }
        try {
            const textAsBytes = new TextEncoder().encode(inputText);
            let binaryString = '';
            textAsBytes.forEach((byte) => {
                binaryString += String.fromCharCode(byte);
            });
            const encodedText = btoa(binaryString);
            const link = `${window.location.origin}${window.location.pathname}?assignment=${encodeURIComponent(encodedText)}`;
            setAssignmentLink(link);
        } catch (e) {
            console.error("Failed to create assignment link:", e);
            setError("Could not create an assignment link. The text may contain unsupported characters.");
        }
    };

    const handleCopyPracticeReport = () => {
        if (!pronunciationFeedback || (!formattedResponse && !inputText)) return;

        const textSnippet = (formattedResponse?.formattedText || inputText).replace(/\*\*/g, '');

        const correctionsText = pronunciationFeedback.corrections.length > 0
            ? pronunciationFeedback.corrections.map(c => `  - Word: "${c.word}"\n    Tip: ${c.correctionTip}`).join('\n')
            : '  Excellent pronunciation, no corrections needed!';

        const report = `
Miss Emma's Reading Room - Practice Report
-----------------------------------------
Date: ${new Date().toLocaleString()}
Assigned Text: "${textSnippet.substring(0, 100)}..."

Pronunciation Feedback:
- Accuracy Score: ${pronunciationFeedback.accuracyScore}/100
- Overall: ${pronunciationFeedback.overallFeedback}

- Corrections:
${correctionsText}
        `.trim().replace(/^\s+/gm, '');

        navigator.clipboard.writeText(report);
        setShowReportCopied(true);
        setTimeout(() => setShowReportCopied(false), 2000);
    }

    const renderFormattedText = () => {
        if (!formattedResponse?.formattedText) {
            return null;
        }

        return formattedResponse.formattedText.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const word = part.slice(2, -2);
                return (
                    <strong
                        key={partIndex}
                        className="text-emerald-600 cursor-pointer hover:underline"
                        onClick={() => handleShowPronunciationGuide(word)}
                    >
                        {word}
                    </strong>
                );
            }

            return part.split(/([^\w']+)/).filter(Boolean).map((segment, segIndex) => {
                if (!/\w/.test(segment)) {
                    return <Fragment key={`${partIndex}-${segIndex}`}>{segment}</Fragment>;
                }
                return (
                    <span
                        key={`${partIndex}-${segIndex}`}
                        className="cursor-pointer hover:underline"
                        onClick={() => handleShowPronunciationGuide(segment)}
                    >
                        {segment}
                    </span>
                );
            });
        });
    };

    const masterIsDisabled = isLoading || isPlaying || !!playingWord || !!pronunciationGuideWord || isRecording || isAnalyzing;

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
            <PronunciationGuideModal
                word={pronunciationGuideWord}
                data={pronunciationGuideData}
                isLoading={isFetchingPronunciation}
                onClose={() => setPronunciationGuideWord(null)}
                onPlayWord={handlePlayWordAudio}
                playingWord={playingWord}
            />
            <ProgressModal 
                progress={progressData} 
                isOpen={isProgressModalOpen} 
                onClose={() => setIsProgressModalOpen(false)}
                onClear={handleClearProgress}
                onExport={handleExportProgress}
                onPlayWord={handlePlayWordAudio}
                playingWord={playingWord}
            />
            <AssignmentModal
                link={assignmentLink}
                onClose={() => setAssignmentLink(null)}
            />
            <main className="w-full max-w-3xl mx-auto">
                <header className="text-center mb-8 relative">
                    <h1 className="text-4xl sm:text-5xl font-bold text-emerald-600">Miss Emma's Reading Room</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        {isAssignmentMode ? 'Complete Your Assigned Reading' : 'Your friendly AI English teacher'}
                    </p>
                    {!isAssignmentMode && (
                        <button 
                            onClick={() => setIsProgressModalOpen(true)}
                            className="absolute top-0 right-0 flex items-center gap-2 bg-white border border-slate-300 text-slate-600 font-semibold py-2 px-4 rounded-lg hover:bg-slate-100 transition duration-300"
                            aria-label="View my progress"
                        >
                           <IconChart className="w-5 h-5"/> My Progress
                        </button>
                    )}
                </header>

                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
                    <div className="mb-4">
                        <label htmlFor="text-input" className="block text-lg font-semibold mb-2 text-slate-700">
                           {isAssignmentMode ? 'Assigned Text:' : 'Enter your text here:'}
                        </label>
                        <textarea
                            id="text-input"
                            rows={8}
                            className={`w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 text-base ${isAssignmentMode ? 'bg-slate-100' : ''}`}
                            placeholder="Miss Emma will read any text you provide..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={masterIsDisabled}
                            readOnly={isAssignmentMode}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                             <div>
                                <label htmlFor="accent-select" className="text-sm font-medium text-slate-600 mr-2">Accent:</label>
                                <select
                                    id="accent-select"
                                    className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                                    value={accent}
                                    onChange={(e) => setAccent(e.target.value as Accent)}
                                    disabled={masterIsDisabled}
                                >
                                    <option value="American">American 🇺🇸</option>
                                    <option value="British">British 🇬🇧</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="speed-select" className="text-sm font-medium text-slate-600 mr-2">Speed:</label>
                                <select
                                    id="speed-select"
                                    className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                                    value={readingSpeed}
                                    onChange={(e) => setReadingSpeed(e.target.value as ReadingSpeed)}
                                    disabled={masterIsDisabled}
                                >
                                    <option value="Slower">Slower</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Faster">Faster</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleProcessText(inputText, false)}
                                disabled={isLoading || isRecording || isAnalyzing || !inputText.trim()}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <IconBook className="w-5 h-5" />
                                Read Aloud
                            </button>
                        </div>
                    </div>

                    {!isAssignmentMode && (
                        <div className="mt-6 pt-4 border-t border-slate-200">
                             <h3 className="text-lg font-semibold text-slate-700">Share as an Assignment</h3>
                             <p className="text-sm text-slate-500 mt-1 mb-3">Create a unique link to send this text to your students for practice.</p>
                             <button
                                 onClick={handleGenerateAssignmentLink}
                                 disabled={masterIsDisabled || !inputText.trim()}
                                 className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
                             >
                                 <IconShare className="w-5 h-5"/> Create Assignment Link
                             </button>
                        </div>
                    )}

                    {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                </div>
                
                {(isLoading || isAnalyzing) && (
                    <div className="mt-8 text-center">
                        <div className="flex justify-center items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <p className="text-lg text-slate-600">{loadingAction}</p>
                        </div>
                    </div>
                )}

                {formattedResponse && !(isLoading || isAnalyzing) && (
                    <div className="bg-white mt-8 p-6 sm:p-8 rounded-2xl shadow-lg animate-fade-in">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-slate-200">Here's your text:</h2>

                        {audioBuffer && (
                             <AudioPlayer 
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                                duration={duration}
                                volume={volume}
                                onPlayPause={handlePlayPause}
                                onSeek={handleSeek}
                                onVolumeChange={handleVolumeChange}
                             />
                        )}

                        <div className="mt-6 text-lg leading-relaxed prose max-w-none whitespace-pre-wrap">
                            {renderFormattedText()}
                        </div>
                        <p className="mt-6 text-center italic text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                            "{formattedResponse.supportiveComment}"
                        </p>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <button
                                onClick={() => handleProcessText(lastProcessedText, true)}
                                disabled={masterIsDisabled}
                                className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <IconRepeat className="w-5 h-5"/> Re-process Text
                            </button>
                             <button
                                onClick={handleExplain}
                                disabled={masterIsDisabled}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-600 transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <IconTranslate className="w-5 h-5"/> Explain Words
                            </button>
                             <button
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                disabled={masterIsDisabled && !isRecording}
                                className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'}`}
                            >
                                {isRecording ? <IconStop className="w-5 h-5" /> : <IconMic className="w-5 h-5" />}
                                {isRecording ? `Stop Recording (${formatTime(recordingDuration)})` : 'Practice Speaking'}
                            </button>
                        </div>

                        {pronunciationFeedback && !isAnalyzing && (
                            <div className="mt-6 border-t pt-6 border-slate-200 animate-fade-in">
                                <h3 className="text-xl font-bold mb-3 text-slate-700">Pronunciation Coach 🎙️</h3>
                                <div className="bg-teal-50 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-6">
                                    <ScoreCircle score={pronunciationFeedback.accuracyScore} />
                                    <div className="flex-1 text-slate-700 leading-relaxed">
                                        <p className="mb-4 font-semibold">{pronunciationFeedback.overallFeedback}</p>
                                        {pronunciationFeedback.corrections.length > 0 && (
                                            <ul className="space-y-3">
                                                {pronunciationFeedback.corrections.map((correction, index) => (
                                                    <li key={index} className="p-3 bg-white rounded-md shadow-sm">
                                                        <div className="flex items-center font-semibold text-slate-800">
                                                            Let's practice:
                                                            <span className="ml-2 font-bold text-teal-600 text-lg">{correction.word}</span>
                                                            <button
                                                                onClick={() => handlePlayWordAudio(correction.word)}
                                                                disabled={masterIsDisabled}
                                                                className="ml-2 p-1 text-sky-500 hover:text-sky-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                                                                aria-label={`Hear correct pronunciation for ${correction.word}`}
                                                            >
                                                                {playingWord === correction.word ? <IconSpinner className="w-5 h-5" /> : <IconSpeaker className="w-5 h-5" />}
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-1 pl-1">
                                                            <span className="font-semibold">Tip:</span> {correction.correctionTip}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                {isAssignmentMode && (
                                    <div className="mt-4 text-center">
                                        <button 
                                            onClick={handleCopyPracticeReport}
                                            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition"
                                        >
                                            <IconCopy className="w-5 h-5"/>
                                            {showReportCopied ? 'Copied to Clipboard!' : 'Copy Practice Report'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {vocabulary.length > 0 && (
                             <div className="mt-6 border-t pt-6 border-slate-200">
                                <h3 className="text-xl font-bold mb-3">Vocabulary Helper 📖</h3>
                                <ul className="space-y-3">
                                    {vocabulary.map((item, index) => (
                                        <li key={index} className="p-3 bg-slate-50 rounded-md">
                                            <div className="flex items-center">
                                                <span className="font-semibold text-slate-800">{item.word}</span>
                                                <button
                                                    onClick={() => handlePlayWordAudio(item.word)}
                                                    disabled={masterIsDisabled}
                                                    className="ml-2 p-1 text-sky-500 hover:text-sky-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                                                    aria-label={`Pronounce ${item.word}`}
                                                >
                                                    {playingWord === item.word ? <IconSpinner className="w-4 h-4" /> : <IconSpeaker className="w-4 h-4" />}
                                                </button>
                                                {item.ipa && <span className="text-sm text-slate-500 ml-2">/{item.ipa}/</span>}
                                            </div>
                                            <div className="text-slate-600 mt-1" dir="rtl">{item.definition}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;