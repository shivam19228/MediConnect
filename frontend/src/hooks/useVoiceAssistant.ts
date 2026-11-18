import { useState, useEffect, useRef, useCallback } from 'react';
import { LanguageCode } from '../types/case';
import { voiceService, SpeechRecognitionResultState } from '../services/voiceService';

export type AssistantState =
  | 'idle' // Ready, waiting for action
  | 'speaking' // Assistant is currently speaking the question
  | 'listening' // Microphone is active and listening for patient's reply
  | 'processing' // Speech captured, parsing and saving
  | 'paused' // Temporarily paused
  | 'off'; // Voice assistant toggled OFF by user

interface UseVoiceAssistantOptions {
  language: LanguageCode;
  onAnswerCaptured?: (transcript: string, isFinal: boolean) => void;
  onEmergencyDetected?: (warning: string) => void;
}

const STORAGE_KEY_VOICE_ENABLED = 'mediconnect_voice_mode_enabled';

export function useVoiceAssistant({
  language,
  onAnswerCaptured,
  onEmergencyDetected,
}: UseVoiceAssistantOptions) {
  // Voice Mode: Default to true unless patient previously switched it off
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VOICE_ENABLED);
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const [assistantState, setAssistantState] = useState<AssistantState>(() =>
    isVoiceEnabled ? 'idle' : 'off'
  );

  const [currentSpokenText, setCurrentSpokenText] = useState<string>('');
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const [hasUserStarted, setHasUserStarted] = useState<boolean>(false);

  // References to prevent stale closures and duplicate speech across renders
  const isVoiceEnabledRef = useRef<boolean>(isVoiceEnabled);
  isVoiceEnabledRef.current = isVoiceEnabled;

  const currentSessionIdRef = useRef<number>(0);
  const lastSpokenKeyRef = useRef<string>('');
  const autoAdvanceTimeoutRef = useRef<any>(null);

  const isHindi = language === 'hi';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      currentSessionIdRef.current += 1;
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      voiceService.stopAll();
    };
  }, []);

  /**
   * Toggles Voice Assistant ON or OFF.
   */
  const toggleVoiceMode = useCallback(() => {
    setIsVoiceEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_VOICE_ENABLED, next ? 'true' : 'false');
      } catch (e) {
        // ignore
      }

      if (!next) {
        // Immediately silence speech, stop mic, cancel timers
        currentSessionIdRef.current += 1;
        if (autoAdvanceTimeoutRef.current) {
          clearTimeout(autoAdvanceTimeoutRef.current);
        }
        voiceService.stopAll();
        setAssistantState('off');
        setInterimTranscript('');
      } else {
        // Turning ON: clear past spoken key to allow reading current question
        lastSpokenKeyRef.current = '';
        setAssistantState('idle');
        setVoiceError(null);
        setHasUserStarted(true);
      }

      return next;
    });
  }, []);

  /**
   * Immediately stops any speech and microphone activity without disabling voice mode.
   */
  const pauseAssistant = useCallback(() => {
    currentSessionIdRef.current += 1;
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    voiceService.stopAll();
    setAssistantState('paused');
  }, []);

  /**
   * Starts listening for the patient's spoken reply.
   */
  const startListening = useCallback(
    (onFinalCallback?: (text: string) => void) => {
      if (!isVoiceEnabledRef.current) return;

      const sessionId = currentSessionIdRef.current;
      setVoiceError(null);
      setAssistantState('listening');
      setInterimTranscript('');

      const started = voiceService.startListening(
        language,
        (res: SpeechRecognitionResultState) => {
          if (sessionId !== currentSessionIdRef.current) return;

          if (res.isFinal) {
            setTranscribedText(res.transcript);
            setInterimTranscript('');
            setAssistantState('processing');

            // Emergency trigger detection
            const lower = res.transcript.toLowerCase();
            if (
              lower.includes('chest pain') ||
              lower.includes('heart pain') ||
              lower.includes('सीने में दर्द') ||
              lower.includes('छाती में दर्द') ||
              lower.includes('blood') ||
              lower.includes('खून') ||
              lower.includes('breathless') ||
              lower.includes('सांस नहीं')
            ) {
              onEmergencyDetected?.(res.transcript);
            }

            if (onAnswerCaptured) {
              onAnswerCaptured(res.transcript, true);
            }
            if (onFinalCallback) {
              onFinalCallback(res.transcript);
            }
          } else {
            setInterimTranscript(res.transcript);
            if (onAnswerCaptured) {
              onAnswerCaptured(res.transcript, false);
            }
          }
        },
        (errMsg: string) => {
          if (sessionId !== currentSessionIdRef.current) return;
          console.warn('Speech recognition warning:', errMsg);
          setVoiceError(errMsg);
          setAssistantState('idle');
        },
        () => {
          // onEnd
          if (sessionId === currentSessionIdRef.current) {
            setAssistantState((prev) => (prev === 'listening' ? 'idle' : prev));
          }
        }
      );

      if (!started) {
        setAssistantState('idle');
      }
    },
    [language, onAnswerCaptured, onEmergencyDetected]
  );

  /**
   * Speaks the question text aloud, then automatically starts listening.
   * Prevents speaking the same question twice via questionKey deduplication.
   */
  const speakAndListen = useCallback(
    (
      questionKey: string,
      textToSpeak: string,
      onAnswerReceived?: (text: string) => void,
      forceReplay = false
    ) => {
      if (!isVoiceEnabledRef.current) return;

      // Prevent duplicate playback on React re-renders or StrictMode
      if (!forceReplay && lastSpokenKeyRef.current === questionKey) {
        return;
      }

      // Invalidate any ongoing listening or playback session
      currentSessionIdRef.current += 1;
      const thisSessionId = currentSessionIdRef.current;

      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }

      voiceService.stopAll();
      lastSpokenKeyRef.current = questionKey;
      setCurrentSpokenText(textToSpeak);
      setAssistantState('speaking');
      setInterimTranscript('');

      try {
        voiceService.speak(
          textToSpeak,
          language,
          // onEnd
          () => {
            if (thisSessionId !== currentSessionIdRef.current) return;
            if (!isVoiceEnabledRef.current) return;

            // Short natural 400ms pause between assistant speaking and opening microphone
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              if (thisSessionId !== currentSessionIdRef.current) return;
              if (isVoiceEnabledRef.current) {
                startListening(onAnswerReceived);
              }
            }, 400);
          },
          // onError
          (err) => {
            if (thisSessionId !== currentSessionIdRef.current) return;
            console.warn('TTS playback issue or autoplay restricted:', err);
            setIsAutoplayBlocked(true);
            setAssistantState('idle');
          }
        );
      } catch (e) {
        setIsAutoplayBlocked(true);
        setAssistantState('idle');
      }
    },
    [language, startListening]
  );

  /**
   * One-time user gesture trigger if browser blocked automatic playback.
   */
  const handleUserGestureStart = useCallback(
    (currentKey: string, textToSpeak: string, onAnswerReceived?: (text: string) => void) => {
      setHasUserStarted(true);
      setIsAutoplayBlocked(false);
      lastSpokenKeyRef.current = '';
      speakAndListen(currentKey, textToSpeak, onAnswerReceived, true);
    },
    [speakAndListen]
  );

  /**
   * Replays the current question.
   */
  const replayCurrentQuestion = useCallback(
    (questionKey: string, textToSpeak: string, onAnswerReceived?: (text: string) => void) => {
      speakAndListen(questionKey, textToSpeak, onAnswerReceived, true);
    },
    [speakAndListen]
  );

  /**
   * Retries listening without repeating the full question.
   */
  const retryListening = useCallback(
    (onAnswerReceived?: (text: string) => void) => {
      currentSessionIdRef.current += 1;
      setTranscribedText('');
      setInterimTranscript('');
      startListening(onAnswerReceived);
    },
    [startListening]
  );

  return {
    isVoiceEnabled,
    assistantState,
    currentSpokenText,
    transcribedText,
    interimTranscript,
    voiceError,
    isAutoplayBlocked,
    hasUserStarted,
    toggleVoiceMode,
    pauseAssistant,
    speakAndListen,
    startListening,
    replayCurrentQuestion,
    retryListening,
    handleUserGestureStart,
    setTranscribedText,
    setVoiceError,
  };
}
