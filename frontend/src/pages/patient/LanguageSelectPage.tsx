import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Check, ArrowRight, Globe, Info } from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { SUPPORTED_LANGUAGES, LanguageMeta } from '../../data/translations';
import { LanguageCode } from '../../types/case';
import { voiceService } from '../../services/voiceService';
import { StepProgressBar } from '../../components/patient/StepProgressBar';
import { VoiceAssistantWidget } from '../../components/common/VoiceAssistantWidget';

export const LanguageSelectPage: React.FC = () => {
  const { language, setLanguage } = useCase();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<LanguageCode>(language);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handlePreviewVoice = (e: React.MouseEvent, lang: LanguageMeta) => {
    e.stopPropagation();
    setVoiceNotice(null);

    const hasSynth = voiceService.isSpeechSynthesisSupported();
    if (!hasSynth) {
      setVoiceNotice('Audio speech synthesis is not supported in this browser.');
      return;
    }

    voiceService.speak(
      lang.sampleGreeting,
      lang.code,
      undefined,
      () => {
        setVoiceNotice(`Browser voice for ${lang.name} may be limited. You can still use the visual cards.`);
      }
    );
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    setSelected(code);
    setLanguage(code);
  };

  const handleProceed = () => {
    setLanguage(selected);
    navigate('/patient/questionnaire');
  };

  const isHindi = selected === 'hi';

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Progress Bar (Step 1) */}
      <StepProgressBar currentStep={1} />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl mx-auto flex items-center justify-center mb-3">
          <Globe className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          {isHindi ? 'अपनी मनपसंद भाषा चुनिए' : 'Choose Your Preferred Language'}
        </h1>
        <p className="text-sm md:text-base text-slate-600 mt-2">
          {isHindi
            ? 'अपनी मातृभाषा का चयन करें। पूरा चेकअप और आवाज सहायक इसी भाषा में सहायता करेगा।'
            : 'Select the language you feel most comfortable speaking and listening to.'}
        </p>
      </div>

      {/* Notice if voice was tested */}
      {voiceNotice && (
        <div className="max-w-2xl mx-auto mb-6 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <p>{voiceNotice}</p>
        </div>
      )}

      {/* Grid of Large Language Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isCurrent = selected === lang.code;

          return (
            <div
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectLanguage(lang.code);
                }
              }}
              className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between select-none active:scale-[0.98] ${
                isCurrent
                  ? 'bg-teal-50 border-teal-600 shadow-md shadow-teal-700/10 ring-2 ring-teal-500/20'
                  : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm'
              }`}
            >
              {/* Left text */}
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {lang.nativeName}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {lang.name} • <span className="text-teal-700">{lang.region}</span>
                </div>
              </div>

              {/* Right buttons: speaker preview + radio check */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handlePreviewVoice(e, lang)}
                  className="p-2.5 text-slate-400 hover:text-teal-700 hover:bg-teal-100 rounded-xl transition-colors"
                  title={`Listen to sample greeting in ${lang.name}`}
                  aria-label={`Listen in ${lang.name}`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isCurrent && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation CTA Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-4 shadow-xl flex items-center justify-between">
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="px-5 py-3 rounded-2xl text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
        >
          {isHindi ? 'वापस' : 'Back'}
        </button>

        <button
          onClick={handleProceed}
          className="inline-flex items-center gap-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm md:text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-teal-600/25 transition-all"
        >
          <span>{isHindi ? 'आगे बढ़ें (Next)' : 'Continue to Health Questions'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistantWidget
        currentScreenGuidance={
          isHindi
            ? 'नमस्ते! पहले अपनी भाषा चुनिए। सुनने के लिए स्पीकर बटन दबाएं, फिर नीचे दिए गए हरे बटन पर क्लिक करें।'
            : 'Hello! Choose your language card above. You can tap the speaker to hear a preview, then click Continue.'
        }
      />
    </div>
  );
};
