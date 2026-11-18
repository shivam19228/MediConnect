import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Pill,
  ShieldAlert,
  Scissors,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { StepProgressBar } from '../../components/patient/StepProgressBar';
import { ConversationalVoicePanel } from '../../components/common/ConversationalVoicePanel';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import {
  matchMedicalConditionsFromSpeech,
  matchAllergiesFromSpeech,
} from '../../services/voiceMatcher';

const COMMON_CONDITIONS = [
  { id: 'diabetes', label: 'Diabetes (Sugar)', hindiLabel: 'डायबिटीज (शुगर)' },
  { id: 'hypertension', label: 'High Blood Pressure (BP)', hindiLabel: 'हाई ब्लड प्रेशर (बीपी)' },
  { id: 'asthma', label: 'Asthma / Breathing Trouble', hindiLabel: 'अस्थमा / दमा' },
  { id: 'heart', label: 'Heart Condition', hindiLabel: 'हार्ट की बीमारी' },
  { id: 'thyroid', label: 'Thyroid Problem', hindiLabel: 'थायरॉइड' },
  { id: 'none', label: 'No existing conditions', hindiLabel: 'कोई पुरानी बीमारी नहीं' },
];

const COMMON_ALLERGIES = [
  { id: 'sulfa', label: 'Sulfa Drugs', hindiLabel: 'सल्फा दवाएं' },
  { id: 'penicillin', label: 'Penicillin / Antibiotics', hindiLabel: 'पेनिसिलिन / एंटीबायोटिक' },
  { id: 'dust_pollen', label: 'Dust & Pollen', hindiLabel: 'धूल या पराग' },
  { id: 'food', label: 'Certain Foods', hindiLabel: 'विशेष खाद्य पदार्थ' },
  { id: 'no_allergies', label: 'No known allergies', hindiLabel: 'कोई ज्ञात एलर्जी नहीं' },
];

export const MedicalHistoryPage: React.FC = () => {
  const { language, activeDraft, updateDraft } = useCase();
  const navigate = useNavigate();
  const isHindi = language === 'hi';

  const initialHistory = activeDraft.medicalHistory || {
    conditions: [],
    medications: '',
    allergies: '',
    pastSurgeries: '',
    familyHistory: '',
    provided: true,
  };

  const [conditions, setConditions] = useState<string[]>(initialHistory.conditions || []);
  const [medications, setMedications] = useState<string>(initialHistory.medications || '');
  const [allergies, setAllergies] = useState<string>(initialHistory.allergies || '');
  const [surgeries, setSurgeries] = useState<string>(initialHistory.pastSurgeries || '');
  const [familyHistory, setFamilyHistory] = useState<string>(initialHistory.familyHistory || '');

  // Conversational step inside history: 0 = conditions, 1 = medications, 2 = allergies
  const [historyStep, setHistoryStep] = useState<number>(0);

  const handleToggleCondition = (id: string) => {
    if (id === 'none') {
      setConditions(['No existing conditions']);
      return;
    }
    const filtered = conditions.filter((c) => c !== 'No existing conditions');
    if (filtered.includes(id)) {
      setConditions(filtered.filter((c) => c !== id));
    } else {
      setConditions([...filtered, id]);
    }
  };

  const handleToggleAllergy = (label: string) => {
    if (label.includes('No known')) {
      setAllergies('No known allergies');
      return;
    }
    const current = allergies ? allergies.split(', ').filter((a) => !a.includes('No known')) : [];
    if (current.includes(label)) {
      setAllergies(current.filter((a) => a !== label).join(', '));
    } else {
      setAllergies([...current, label].join(', '));
    }
  };

  const handleSaveAndContinue = (skip: boolean = false) => {
    updateDraft({
      medicalHistory: {
        conditions: skip ? [] : conditions,
        medications: skip ? 'Not provided (skipped by patient)' : medications,
        allergies: skip ? 'Not provided (skipped by patient)' : allergies,
        pastSurgeries: skip ? 'Not provided' : surgeries,
        familyHistory: skip ? 'Not provided' : familyHistory,
        provided: !skip,
      },
    });
    navigate('/patient/upload-reports');
  };

  // Conversational speech parsing for medical history
  const handleHistorySpeechAnswer = (transcript: string) => {
    if (!transcript.trim()) return;

    if (historyStep === 0) {
      // Step 0: Conditions
      const matched = matchMedicalConditionsFromSpeech(transcript);
      if (matched.length > 0) {
        if (matched.includes('none')) {
          setConditions(['No existing conditions']);
        } else {
          setConditions(matched);
        }
      } else {
        setConditions([transcript]);
      }
      setTimeout(() => setHistoryStep(1), 1200);
    } else if (historyStep === 1) {
      // Step 1: Medications
      setMedications(transcript);
      setTimeout(() => setHistoryStep(2), 1200);
    } else if (historyStep === 2) {
      // Step 2: Allergies
      const matched = matchAllergiesFromSpeech(transcript);
      if (matched.length > 0) {
        setAllergies(matched.join(', '));
      } else {
        setAllergies(transcript);
      }
    }
  };

  const {
    isVoiceEnabled,
    assistantState,
    currentSpokenText,
    transcribedText,
    interimTranscript,
    voiceError,
    isAutoplayBlocked,
    toggleVoiceMode,
    speakAndListen,
    replayCurrentQuestion,
    retryListening,
    handleUserGestureStart,
    setTranscribedText,
  } = useVoiceAssistant({
    language,
    onAnswerCaptured: (text, isFinal) => {
      if (isFinal) {
        handleHistorySpeechAnswer(text);
      }
    },
  });

  const getHistoryStepPrompt = (): { key: string; text: string } => {
    if (historyStep === 0) {
      return {
        key: 'history-step-conditions',
        text: isHindi
          ? 'क्या आपको पहले से कोई पुरानी बीमारी है? जैसे शुगर, बीपी, अस्थमा या दिल की बीमारी? बोलकर बताएं या कार्ड चुनें।'
          : 'Do you have any pre-existing health conditions such as diabetes, blood pressure, asthma, or heart trouble? Please speak or select from the cards.',
      };
    }
    if (historyStep === 1) {
      return {
        key: 'history-step-medications',
        text: isHindi
          ? 'क्या आप नियमित रूप से कोई दवाई ले रहे हैं? दवाइयों के नाम बोलकर बताएं, या कोई दवा नहीं बोलें।'
          : 'Are you taking any daily medicines? Please speak the names of your medicines, or say none.',
      };
    }
    return {
      key: 'history-step-allergies',
      text: isHindi
        ? 'क्या आपको किसी दवाई या चीज से कोई एलर्जी है? जैसे पेनिसिलिन, सल्फा या धूल? बोलकर बताएं या कोई एलर्जी नहीं कहें।'
        : 'Do you have any known allergies to medicines or foods? Please tell us, or say no allergies.',
    };
  };

  useEffect(() => {
    if (!isVoiceEnabled) return;
    const { key, text } = getHistoryStepPrompt();
    speakAndListen(key, text);
  }, [historyStep, isVoiceEnabled, language]);

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Progress Bar (Step 3) */}
      <StepProgressBar currentStep={3} />

      {/* Conversational Voice Panel */}
      <ConversationalVoicePanel
        assistantState={assistantState}
        isVoiceEnabled={isVoiceEnabled}
        currentSpokenText={currentSpokenText}
        transcribedText={transcribedText}
        interimTranscript={interimTranscript}
        voiceError={voiceError}
        isAutoplayBlocked={isAutoplayBlocked}
        isHindi={isHindi}
        onToggleVoiceMode={toggleVoiceMode}
        onReplayQuestion={() => {
          const { key, text } = getHistoryStepPrompt();
          replayCurrentQuestion(key, text);
        }}
        onRetryListening={() => retryListening()}
        onStartAssistant={() => {
          const { key, text } = getHistoryStepPrompt();
          handleUserGestureStart(key, text);
        }}
        onApplyManualAnswer={(editedText) => {
          setTranscribedText(editedText);
          handleHistorySpeechAnswer(editedText);
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {isHindi ? 'स्वास्थ्य इतिहास' : 'Medical History'}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            {isHindi ? 'पुरानी बीमारियां और दवाएं' : 'Past Conditions & Medications'}
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            {isHindi
              ? 'यदि आपको कोई जानकारी नहीं पता है, तो आप इसे छोड़ भी सकते हैं।'
              : 'You can tap options, speak answers, or skip if you are unsure.'}
          </p>
        </div>

        <button
          onClick={() => {
            const { key, text } = getHistoryStepPrompt();
            replayCurrentQuestion(key, text);
          }}
          className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-2xl transition-colors shrink-0"
          title="Read instructions aloud"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6 mb-10">
        {/* Section 1: Conditions */}
        <div
          className={`bg-white border-2 rounded-3xl p-6 shadow-sm transition-all ${
            historyStep === 0 ? 'border-teal-500 ring-2 ring-teal-500/10' : 'border-slate-200'
          }`}
        >
          <label className="flex items-center gap-2 text-base font-bold text-slate-900 mb-3">
            <History className="w-5 h-5 text-teal-600" />
            <span>
              {isHindi
                ? 'क्या आपको इनमें से कोई बीमारी पहले से है?'
                : 'Do you have any existing chronic conditions?'}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {COMMON_CONDITIONS.map((cond) => {
              const isSelected =
                conditions.includes(cond.id) ||
                (cond.id === 'none' && conditions.includes('No existing conditions'));

              return (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => handleToggleCondition(cond.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left text-xs md:text-sm font-bold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700'
                  }`}
                >
                  <span>{isHindi ? cond.hindiLabel : cond.label}</span>
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Regular Medications */}
        <div
          className={`bg-white border-2 rounded-3xl p-6 shadow-sm transition-all ${
            historyStep === 1 ? 'border-teal-500 ring-2 ring-teal-500/10' : 'border-slate-200'
          }`}
        >
          <label className="flex items-center gap-2 text-base font-bold text-slate-900 mb-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <span>
              {isHindi ? 'क्या आप कोई नियमित दवा ले रहे हैं?' : 'Are you taking any daily medicines?'}
            </span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            {isHindi
              ? 'जैसे: बीपी की गोली, थायरॉइड, इंसुलिन या दर्द की दवा'
              : 'e.g., BP medicine, Metformin, Inhaler, Thyroid tablet'}
          </p>

          <textarea
            rows={2}
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            placeholder={
              isHindi
                ? 'दवाओं के नाम यहाँ लिखें या बोलें...'
                : 'List medicines here or say them via voice assistant...'
            }
            className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-0"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setMedications('None currently')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              {isHindi ? 'कोई दवा नहीं (None)' : 'No regular medicines'}
            </button>
            <button
              type="button"
              onClick={() => setMedications('Not sure / Details at home')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              {isHindi ? 'याद नहीं (Not sure)' : 'Cannot remember name'}
            </button>
          </div>
        </div>

        {/* Section 3: Known Allergies */}
        <div
          className={`bg-white border-2 rounded-3xl p-6 shadow-sm transition-all ${
            historyStep === 2 ? 'border-teal-500 ring-2 ring-teal-500/10' : 'border-slate-200'
          }`}
        >
          <label className="flex items-center gap-2 text-base font-bold text-slate-900 mb-3">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            <span>
              {isHindi ? 'क्या आपको किसी दवा या चीज से एलर्जी है?' : 'Do you have known allergies?'}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
            {COMMON_ALLERGIES.map((alg) => {
              const isSelected = allergies.includes(alg.label);
              return (
                <button
                  key={alg.id}
                  type="button"
                  onClick={() => handleToggleAllergy(alg.label)}
                  className={`p-3.5 rounded-2xl border-2 text-left text-xs md:text-sm font-bold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700'
                  }`}
                >
                  <span>{isHindi ? alg.hindiLabel : alg.label}</span>
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder={isHindi ? 'अन्य एलर्जी यहाँ दर्ज करें...' : 'Specify other allergies here...'}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs md:text-sm text-slate-900 font-medium"
          />
        </div>

        {/* Section 4: Surgeries & Family */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
              <Scissors className="w-4 h-4 text-teal-600" />
              <span>{isHindi ? 'पुरानी सर्जरी या ऑपरेशन' : 'Past Surgeries or Hospital Stay'}</span>
            </label>
            <input
              type="text"
              value={surgeries}
              onChange={(e) => setSurgeries(e.target.value)}
              placeholder={isHindi ? 'जैसे: अपेंडिक्स, पथरी या कोई नहीं' : 'e.g. Appendectomy, C-Section, None'}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs md:text-sm text-slate-900 font-medium"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>{isHindi ? 'परिवार में गंभीर बीमारी' : 'Family Medical History'}</span>
            </label>
            <input
              type="text"
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              placeholder={
                isHindi ? 'जैसे: माता/पिता को शुगर या हार्ट' : 'e.g. Parents had diabetes, heart trouble'
              }
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs md:text-sm text-slate-900 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Navigation Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 sticky bottom-4 z-20">
        <button
          onClick={() => navigate('/patient/questionnaire')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHindi ? 'पीछे' : 'Back to Symptoms'}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveAndContinue(true)}
            className="px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-800 font-bold text-xs md:text-sm"
          >
            {isHindi ? 'छोड़ें (Skip History)' : 'Skip this step'}
          </button>

          <button
            id="medical-history-save-button"
            onClick={() => handleSaveAndContinue(false)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm md:text-base px-7 py-3.5 rounded-2xl shadow-lg shadow-teal-600/25 transition-all"
          >
            <span>{isHindi ? 'सहेजें और रिपोर्ट अपलोड करें' : 'Save & Continue'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
