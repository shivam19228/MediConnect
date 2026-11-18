import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, RotateCcw, HelpCircle, X, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { voiceService } from '../../services/voiceService';

interface VoiceAssistantWidgetProps {
  currentQuestionText?: string;
  currentScreenGuidance?: string;
  onSpeechCaptured?: (text: string) => void;
  floating?: boolean;
}

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  currentQuestionText,
  currentScreenGuidance,
  onSpeechCaptured,
  floating = true,
}) => {
  const { language, isAssistantSpeaking, playAssistantGuidance, stopAssistantSpeech } = useCase();
  const [isOpen, setIsOpen] = useState<boolean>(!floating);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [synthSupported, setSynthSupported] = useState<boolean>(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mediconnect_voice_mode_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const isHindi = language === 'hi';

  const handleToggleVoice = () => {
    const next = !isVoiceEnabled;
    setIsVoiceEnabled(next);
    try {
      localStorage.setItem('mediconnect_voice_mode_enabled', next ? 'true' : 'false');
    } catch (e) {}

    if (!next) {
      voiceService.stopAll();
      setIsListening(false);
      stopAssistantSpeech();
    }
  };

  useEffect(() => {
    setSpeechSupported(voiceService.isSpeechRecognitionSupported());
    setSynthSupported(voiceService.isSpeechSynthesisSupported());
  }, []);

  const handleReadAloud = () => {
    if (!isVoiceEnabled) return;
    const textToSpeak =
      currentQuestionText ||
      currentScreenGuidance ||
      (isHindi
        ? 'नमस्ते! मैं आपकी सहायता करूँगा। अपनी सुविधा अनुसार बोलकर या बटन दबाकर उत्तर दें।'
        : 'Hello! I will guide you. You can tap the large buttons or press the microphone to answer.');

    if (isAssistantSpeaking) {
      stopAssistantSpeech();
    } else {
      playAssistantGuidance(textToSpeak);
    }
  };

  const handleStartListening = () => {
    if (!isVoiceEnabled) return;
    setVoiceError(null);
    if (!speechSupported) {
      setVoiceError(
        isHindi
          ? 'इस ब्राउज़र में बोलकर इनपुट की सुविधा समर्थित नहीं है। कृपया नीचे दिए गए बटनों का उपयोग करें।'
          : 'Voice input is not supported by your current browser. Please tap the button options to answer.'
      );
      return;
    }

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const success = voiceService.startListening(
      language,
      (result) => {
        setTranscribedText(result.transcript);
        if (result.isFinal && onSpeechCaptured) {
          onSpeechCaptured(result.transcript);
        }
      },
      (errorMsg) => {
        setVoiceError(errorMsg);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!success) {
      setIsListening(false);
    }
  };

  const handleApplyCapturedSpeech = () => {
    if (transcribedText.trim() && onSpeechCaptured) {
      onSpeechCaptured(transcribedText.trim());
      setTranscribedText('');
    }
  };

  const defaultGuidance = isHindi
    ? 'सवालों के जवाब देने के लिए बड़े बटनों को छुएं या माइक पर क्लिक करके अपनी बात बोलें।'
    : 'Tap the large buttons to answer or press the microphone to speak your answer in your own language.';

  const activeGuidance = currentScreenGuidance || defaultGuidance;

  return (
    <div
      className={
        floating
          ? 'fixed bottom-5 right-5 z-40 max-w-sm w-full sm:w-96 select-none'
          : 'w-full my-4 select-none'
      }
    >
      {/* Floating trigger button when collapsed */}
      {floating && !isOpen && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold py-3 px-5 rounded-full shadow-xl shadow-teal-700/30 border-2 border-white animate-voice-pulse transition-transform"
            aria-label={isHindi ? 'वॉइस असिस्टेंट खोलें' : 'Open Voice Assistant'}
          >
            <Volume2 className="w-5 h-5 text-teal-100" />
            <span className="text-sm font-bold">
              {isHindi ? 'आवाज सहायक (सुनें/बोलें)' : 'Voice Assistant'}
            </span>
          </button>
        </div>
      )}

      {/* Expanded assistant panel */}
      {(isOpen || !floating) && (
        <div className="bg-white/95 backdrop-blur-md border-2 border-teal-500 rounded-3xl p-4 md:p-5 shadow-2xl shadow-teal-950/15 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-teal-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {isHindi ? 'मेडीकनेक्ट आवाज सहायक' : 'MediConnect Voice Guide'}
                </h4>
                <p className="text-xs text-teal-700 font-medium">
                  {isHindi ? 'बोलकर या सुनकर मदद लें' : 'Voice guidance & speech input'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                  isVoiceEnabled
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                }`}
                title={isVoiceEnabled ? 'Turn Voice Off' : 'Turn Voice On'}
              >
                {isVoiceEnabled ? (isHindi ? 'वॉइस बंद' : 'Voice Off') : (isHindi ? 'वॉइस चालू' : 'Voice On')}
              </button>
              {floating && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Collapse assistant"
                  title="Minimize"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Guidance Message Body */}
          <div className="my-3 bg-teal-50/70 border border-teal-100 rounded-2xl p-3 text-xs md:text-sm text-slate-800 leading-relaxed flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p>{activeGuidance}</p>
          </div>

          {/* Voice controls action strip */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Read Aloud Button */}
            <button
              onClick={handleReadAloud}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                isAssistantSpeaking
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 animate-pulse'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
              }`}
            >
              {isAssistantSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>
                {isAssistantSpeaking
                  ? isHindi ? 'रोकें (Stop)' : 'Stop Audio'
                  : isHindi ? 'सुनें (Listen)' : 'Read Aloud'}
              </span>
            </button>

            {/* Microphone Button */}
            <button
              onClick={handleStartListening}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                isListening
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>
                {isListening
                  ? isHindi ? 'बोल रहे हैं...' : 'Listening...'
                  : isHindi ? 'बोलें (Speak)' : 'Voice Input'}
              </span>
            </button>
          </div>

          {/* Live Listening Waveform */}
          {isListening && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1.5 h-6 mb-2">
                <span className="wave-bar w-1.5 bg-rose-500 rounded-full inline-block" style={{ animationDelay: '0ms' }} />
                <span className="wave-bar w-1.5 bg-rose-600 rounded-full inline-block" style={{ animationDelay: '150ms' }} />
                <span className="wave-bar w-1.5 bg-rose-400 rounded-full inline-block" style={{ animationDelay: '300ms' }} />
                <span className="wave-bar w-1.5 bg-rose-700 rounded-full inline-block" style={{ animationDelay: '450ms' }} />
                <span className="wave-bar w-1.5 bg-rose-500 rounded-full inline-block" style={{ animationDelay: '200ms' }} />
              </div>
              <p className="text-xs font-bold text-rose-800">
                {isHindi ? 'आपकी बात सुनी जा रही है... कृपया स्पष्ट बोलें' : 'Listening... Speak in your natural language'}
              </p>
            </div>
          )}

          {/* Transcribed Speech Preview & Correction before saving */}
          {transcribedText && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {isHindi ? 'पहचानी गई बात (जाँचें या सुधारें):' : 'Captured Speech (Review / Edit):'}
              </label>
              <textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                rows={2}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setTranscribedText('')}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  {isHindi ? 'हटाएं' : 'Clear'}
                </button>
                <button
                  onClick={handleApplyCapturedSpeech}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'स्वीकार करें' : 'Apply Answer'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Error fallback message */}
          {voiceError && (
            <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <span className="font-bold shrink-0">ℹ️</span>
              <p>{voiceError}</p>
            </div>
          )}

          {/* Reassurance Notice */}
          <p className="text-[10px] text-slate-400 mt-2.5 text-center">
            {isHindi
              ? 'आवाज सहायक केवल मार्गदर्शन हेतु है। बोलकर इनपुट न देना चाहें तो बड़े बटनों से चुनें।'
              : 'Voice assistance guides navigation. You can always use visual option cards.'}
          </p>
        </div>
      )}
    </div>
  );
};
