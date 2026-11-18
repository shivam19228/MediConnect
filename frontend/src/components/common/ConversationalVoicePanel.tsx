import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Check,
  Edit2,
  AlertCircle,
  HelpCircle,
  Play,
  Square,
} from 'lucide-react';
import { AssistantState } from '../../hooks/useVoiceAssistant';

interface ConversationalVoicePanelProps {
  assistantState: AssistantState;
  isVoiceEnabled: boolean;
  currentSpokenText: string;
  transcribedText: string;
  interimTranscript?: string;
  voiceError?: string | null;
  isAutoplayBlocked?: boolean;
  isHindi: boolean;
  onToggleVoiceMode: () => void;
  onReplayQuestion: () => void;
  onRetryListening: () => void;
  onStartAssistant: () => void;
  onApplyManualAnswer?: (editedText: string) => void;
}

export const ConversationalVoicePanel: React.FC<ConversationalVoicePanelProps> = ({
  assistantState,
  isVoiceEnabled,
  currentSpokenText,
  transcribedText,
  interimTranscript,
  voiceError,
  isAutoplayBlocked,
  isHindi,
  onToggleVoiceMode,
  onReplayQuestion,
  onRetryListening,
  onStartAssistant,
  onApplyManualAnswer,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');

  const handleStartEdit = () => {
    setEditText(transcribedText || interimTranscript || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onApplyManualAnswer) {
      onApplyManualAnswer(editText.trim());
    }
    setIsEditing(false);
  };

  // Status configuration
  const getStatusDisplay = () => {
    if (!isVoiceEnabled || assistantState === 'off') {
      return {
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
        text: isHindi ? 'वॉइस मोड: बंद (Voice OFF)' : 'Voice Mode: OFF',
        icon: <VolumeX className="w-3.5 h-3.5 text-slate-500" />,
      };
    }
    switch (assistantState) {
      case 'speaking':
        return {
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
          text: isHindi ? 'सहायक बोल रहे हैं...' : 'Assistant is speaking...',
          icon: <Volume2 className="w-3.5 h-3.5 text-amber-700" />,
        };
      case 'listening':
        return {
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse',
          text: isHindi ? 'आपकी बात सुनी जा रही है...' : 'Listening to your answer...',
          icon: <Mic className="w-3.5 h-3.5 text-rose-600 animate-bounce" />,
        };
      case 'processing':
        return {
          badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
          text: isHindi ? 'उत्तर दर्ज किया जा रहा है...' : 'Processing your answer...',
          icon: <Sparkles className="w-3.5 h-3.5 text-teal-700 animate-spin" />,
        };
      case 'paused':
        return {
          badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300',
          text: isHindi ? 'सहायक रुका हुआ है (Paused)' : 'Assistant Paused',
          icon: <Square className="w-3.5 h-3.5 text-yellow-700" />,
        };
      default:
        return {
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          text: isHindi ? 'सहायक तैयार है (Ready)' : 'Assistant Ready',
          icon: <Check className="w-3.5 h-3.5 text-emerald-700" />,
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="bg-white border-2 border-teal-200/90 rounded-3xl p-5 sm:p-6 shadow-md mb-6 relative overflow-hidden transition-all">
      {/* Top decorative accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          !isVoiceEnabled
            ? 'bg-slate-300'
            : assistantState === 'listening'
            ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 animate-pulse'
            : assistantState === 'speaking'
            ? 'bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500'
            : 'bg-gradient-to-r from-teal-500 to-emerald-500'
        }`}
      />

      {/* Header Strip: Avatar + Status + Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Avatar icon */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform ${
              !isVoiceEnabled
                ? 'bg-slate-400'
                : assistantState === 'listening'
                ? 'bg-gradient-to-tr from-rose-600 to-pink-500 scale-105 shadow-rose-600/30'
                : assistantState === 'speaking'
                ? 'bg-gradient-to-tr from-amber-500 to-teal-600 shadow-teal-600/20'
                : 'bg-gradient-to-tr from-teal-600 to-emerald-600'
            }`}
          >
            {assistantState === 'listening' ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                {isHindi ? 'मेडीकनेक्ट आवाज सहायक' : 'MediConnect Voice Guide'}
              </span>
              {/* Dynamic Status Pill */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.badgeClass}`}
              >
                {status.icon}
                <span>{status.text}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVoiceEnabled
                ? isHindi
                  ? 'स्वाभाविक रूप से बोलें, सवाल अपने आप आगे बढ़ेंगे।'
                  : 'Speak naturally, questions advance automatically.'
                : isHindi
                ? 'वॉइस सहायक बंद है। आप स्क्रीन पर देखकर उत्तर दे सकते हैं।'
                : 'Voice mode is OFF. You can read and tap or type manually.'}
            </p>
          </div>
        </div>

        {/* Voice Mode Toggle Button */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            id="voice-assistant-toggle-button"
            onClick={onToggleVoiceMode}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold shadow-sm transition-all active:scale-95 border ${
              isVoiceEnabled
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-teal-600/20'
            }`}
            title={
              isVoiceEnabled
                ? 'Turn Voice Off — stops speaking & listening immediately'
                : 'Turn Voice On — enables automatic speech & listening'
            }
          >
            {isVoiceEnabled ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-600" />
                <span>{isHindi ? 'वॉइस बंद करें (Turn Off)' : 'Turn Voice Off'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-white" />
                <span>{isHindi ? 'वॉइस चालू करें (Turn On)' : 'Turn Voice On'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Autoplay blocked banner fallback */}
      {isVoiceEnabled && isAutoplayBlocked && (
        <div className="mt-4 p-4 bg-teal-50 border-2 border-teal-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 text-white rounded-xl shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="text-xs text-teal-950">
              <span className="font-bold block text-sm">
                {isHindi ? 'बोलकर बातचीत शुरू करें' : 'Start Conversational Voice Assistant'}
              </span>
              <span>
                {isHindi
                  ? 'ब्राउज़र अनुमति के लिए एक बार नीचे दिए बटन पर क्लिक करें।'
                  : 'Click once to start audio playback; then conversation continues hands-free.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onStartAssistant}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-600/20 active:scale-95 transition-all shrink-0"
          >
            {isHindi ? 'बातचीत शुरू करें (Start)' : 'Start Voice Assistant'}
          </button>
        </div>
      )}

      {/* Spoken Question Box */}
      {isVoiceEnabled && currentSpokenText && (
        <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="text-teal-600 font-bold text-xs uppercase tracking-wider shrink-0 mt-0.5">
              {isHindi ? 'पूछा गया सवाल:' : 'Current Question:'}
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              {currentSpokenText}
            </p>
          </div>

          {/* Replay Audio Button */}
          <button
            type="button"
            onClick={onReplayQuestion}
            className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 shadow-2xs shrink-0 transition-colors"
            title={isHindi ? 'सवाल फिर से सुनें' : 'Replay Question Audio'}
          >
            <RotateCcw className="w-4 h-4 text-teal-700" />
          </button>
        </div>
      )}

      {/* Active Listening Waveform */}
      {isVoiceEnabled && assistantState === 'listening' && (
        <div className="mt-3 p-3 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-pulse" />
              <span className="w-1.5 h-5 bg-rose-600 rounded-full animate-bounce" />
              <span className="w-1.5 h-2 bg-rose-400 rounded-full animate-pulse" />
              <span className="w-1.5 h-6 bg-rose-700 rounded-full animate-bounce" />
              <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-pulse" />
            </div>
            <p className="text-xs font-bold text-rose-900">
              {interimTranscript
                ? `“${interimTranscript}”`
                : isHindi
                ? 'अपनी बात बोलें... हम सुन रहे हैं'
                : 'Listening... Please speak your answer'}
            </p>
          </div>

          <button
            type="button"
            onClick={onRetryListening}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs shrink-0"
          >
            {isHindi ? 'पुनः प्रयास' : 'Restart Mic'}
          </button>
        </div>
      )}

      {/* Transcribed Speech Confirmation & Edit Drawer */}
      {isVoiceEnabled && (transcribedText || isEditing) && (
        <div className="mt-3 p-3.5 bg-teal-50/60 border border-teal-200 rounded-2xl animate-fadeIn space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-700" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-900">
                {isHindi ? 'पहचाना गया उत्तर (Recognized Answer)' : 'Captured Speech'}
              </span>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:text-teal-950 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isHindi ? 'सुधारें (Edit)' : 'Edit Text'}</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium"
                placeholder={isHindi ? 'सही उत्तर यहाँ लिखें...' : 'Type correct answer here...'}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  {isHindi ? 'सहेजें' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-semibold text-slate-900 bg-white p-2.5 rounded-xl border border-teal-100">
              “{transcribedText}”
            </p>
          )}
        </div>
      )}

      {/* Voice Warning / Error Notification */}
      {voiceError && isVoiceEnabled && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{voiceError}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {isHindi
                ? 'आप स्क्रीन पर दिए गए बटनों को दबाकर भी उत्तर दे सकते हैं।'
                : 'You can also tap the option buttons below or type your answer manually.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetryListening}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 font-bold text-[11px] shrink-0"
          >
            {isHindi ? 'फिर से बोलें' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
};
