import { LanguageCode } from '../types/case';
import { SUPPORTED_LANGUAGES } from '../data/translations';

// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const customWindow = typeof window !== 'undefined' ? (window as unknown as IWindow) : null;
const SpeechRecognitionClass = customWindow?.SpeechRecognition || customWindow?.webkitSpeechRecognition;

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

class VoiceService {
  private recognitionInstance: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListeningActive = false;

  public isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!SpeechRecognitionClass;
  }

  public getSpeechCode(languageCode: LanguageCode): string {
    const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === languageCode);
    return found ? found.speechCode : 'en-IN';
  }

  /**
   * Text-to-Speech: Speaks the provided text in the selected language.
   */
  public speak(
    text: string,
    languageCode: LanguageCode = 'hi',
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    if (!this.isSpeechSynthesisSupported()) {
      console.warn('Text-to-speech is not supported in this browser.');
      onError?.('Speech synthesis not supported');
      return;
    }

    try {
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = this.getSpeechCode(languageCode);
      utterance.lang = targetLang;
      utterance.rate = 0.95; // slightly slower for better patient comprehension
      utterance.pitch = 1.0;

      // Try to select an appropriate voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // First look for exact lang match
        let bestVoice = voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase());
        // Second look for language prefix match (e.g. 'hi' in 'hi_IN')
        if (!bestVoice) {
          const prefix = targetLang.split('-')[0].toLowerCase();
          bestVoice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
        }
        // Third fallback to en-IN or default
        if (!bestVoice && languageCode !== 'en') {
          bestVoice = voices.find((v) => v.lang.includes('IN') || v.lang.includes('India'));
        }
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        console.warn('Speech synthesis utterance error:', e);
        onError?.(e);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error during speak execution:', err);
      onError?.(err);
    }
  }

  public stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    if (!this.isSpeechSynthesisSupported()) return false;
    return window.speechSynthesis.speaking;
  }

  /**
   * Speech-to-Text: Listens to the microphone and streams transcribed text.
   */
  public startListening(
    languageCode: LanguageCode,
    onResult: (result: SpeechRecognitionResultState) => void,
    onError: (errorMessage: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser. Please use manual selection.');
      return false;
    }

    // Stop speaking if currently speaking
    this.stopSpeaking();

    // Stop previous instance if running
    this.stopListening();

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false; // patient speaks one answer at a time
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = this.getSpeechCode(languageCode);

      recognition.onstart = () => {
        this.isListeningActive = true;
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          onResult({ transcript: finalTranscript.trim(), isFinal: true });
        } else if (interimTranscript.trim()) {
          onResult({ transcript: interimTranscript.trim(), isFinal: false });
        }
      };

      recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        let msg = 'Voice input error occurred. Please try again or tap an answer option.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          msg = 'Microphone permission was denied. Please allow microphone access in your browser or select your answer manually.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech was detected. Please tap the microphone button again and speak clearly.';
        } else if (event.error === 'network') {
          msg = 'Network issue with speech recognition. You can continue using manual option buttons.';
        }
        onError(msg);
      };

      recognition.onend = () => {
        this.isListeningActive = false;
        this.recognitionInstance = null;
        onEnd();
      };

      this.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      this.isListeningActive = false;
      onError('Could not start microphone. Please use buttons to answer.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.abort();
      } catch (e) {
        // ignore
      }
      this.recognitionInstance = null;
    }
    this.isListeningActive = false;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  /**
   * Immediately stops both assistant speech and active microphone listening.
   */
  public stopAll(): void {
    this.stopSpeaking();
    this.stopListening();
  }
}

export const voiceService = new VoiceService();
