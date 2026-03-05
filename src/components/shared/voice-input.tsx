"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceInputProps {
  /** Current text value — voice transcription is appended to this */
  onTranscript: (text: string) => void;
  /** Current textarea value, used to append transcription */
  currentValue: string;
  disabled?: boolean;
}

// Type augmentation for Web Speech API (not all browsers have it)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceInput({
  onTranscript,
  currentValue,
  disabled = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);
  // Use refs to avoid stale closures in speech callbacks
  const currentValueRef = useRef(currentValue);
  const onTranscriptRef = useRef(onTranscript);
  currentValueRef.current = currentValue;
  onTranscriptRef.current = onTranscript;

  // Check support on mount
  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        // Append final transcript to current value (using refs for fresh values)
        const val = currentValueRef.current;
        const separator = val && !val.endsWith(" ") ? " " : "";
        const newValue = val + separator + finalTranscript;
        onTranscriptRef.current(newValue);
        // Update ref immediately so rapid restarts (continuous=false) don't lose text
        currentValueRef.current = newValue;
        setInterimText("");
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        // Normal — user paused or session was stopped. onend will handle restart if needed.
        return;
      }
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      isListeningRef.current = false;
      setInterimText("");
    };

    recognition.onend = () => {
      // With continuous=false, recognition ends after each utterance.
      // Auto-restart if user hasn't pressed the stop button.
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // If restart fails (e.g., component unmounting), clean up
          setIsListening(false);
          isListeningRef.current = false;
          setInterimText("");
        }
        return;
      }
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    isListeningRef.current = false;
    setInterimText("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!supported) return null;

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-input transition-colors ${
          isListening
            ? "bg-red-100 text-red-600 animate-pulse"
            : "bg-gray-100 text-tech-text-muted hover:bg-gray-200 active:bg-gray-300"
        } disabled:opacity-40 disabled:pointer-events-none`}
        aria-label={isListening ? "Detener dictado" : "Dictar con voz"}
        title={isListening ? "Detener dictado" : "Dictar con voz"}
      >
        {isListening ? (
          // Stop icon (square)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Mic icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
          </svg>
        )}
      </button>
      {interimText && (
        <span className="text-label text-tech-text-muted italic truncate max-w-[150px]">
          {interimText}...
        </span>
      )}
    </div>
  );
}
