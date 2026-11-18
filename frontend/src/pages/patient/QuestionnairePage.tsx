import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  Mic,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import {
  SYMPTOM_CATEGORIES,
  SYMPTOM_FOLLOWUP_QUESTIONS,
  SHARED_CORE_QUESTIONS,
} from '../../data/symptomQuestions';
import { Question } from '../../types/questions';
import { StepProgressBar } from '../../components/patient/StepProgressBar';
import { SymptomCard } from '../../components/patient/SymptomCard';
import { SeverityScale } from '../../components/patient/SeverityScale';
import { EmergencyBanner } from '../../components/common/EmergencyBanner';
import { ConversationalVoicePanel } from '../../components/common/ConversationalVoicePanel';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import {
  matchSymptomsFromSpeech,
  matchSingleChoiceOption,
  matchScaleValue,
} from '../../services/voiceMatcher';

export const QuestionnairePage: React.FC = () => {
  const { language, activeDraft, updateDraft } = useCase();
  const navigate = useNavigate();
  const isHindi = language === 'hi';

  // Selected primary symptoms (Step A)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    activeDraft.primarySymptoms || []
  );

  // Dynamic question queue (Step B)
  const [dynamicQuestions, setDynamicQuestions] = useState<Question[]>([]);
  // Current index in the dynamic questions (-1 means Step A: Symptom Selection)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);

  // Current answers dictionary
  const [answers, setAnswers] = useState<Record<string, any>>(
    activeDraft.symptomAnswers || {}
  );

  // Manual text input buffer for free-text questions
  const [voiceInputText, setVoiceInputText] = useState<string>('');

  // Auto-advance transition timer ref
  const transitionTimerRef = useRef<any>(null);

  // Emergency flag warning
  const hasConcerningSymptom =
    selectedSymptoms.includes('chest_discomfort') ||
    selectedSymptoms.includes('breathing_difficulty') ||
    (answers.shared_severity || 0) >= 9 ||
    answers.cough_type === 'blood_in_cough' ||
    answers.chest_nature === 'heavy_pressure';

  // Construct dynamic question queue whenever selectedSymptoms change
  useEffect(() => {
    const queue: Question[] = [];
    selectedSymptoms.forEach((symptomId) => {
      const followUps = SYMPTOM_FOLLOWUP_QUESTIONS[symptomId];
      if (followUps) {
        queue.push(...followUps);
      }
    });
    // Append shared core questions
    queue.push(...SHARED_CORE_QUESTIONS);
    setDynamicQuestions(queue);
  }, [selectedSymptoms]);

  // Sync draft to CaseContext & localStorage
  const persistChanges = (newSymptoms: string[], newAnswers: Record<string, any>) => {
    updateDraft({
      primarySymptoms: newSymptoms,
      symptomAnswers: newAnswers,
      severity:
        (newAnswers.shared_severity || 5) >= 7
          ? 'Severe'
          : (newAnswers.shared_severity || 5) <= 3
          ? 'Mild'
          : 'Moderate',
      duration: newAnswers.shared_duration || 'few days',
    });
  };

  const handleToggleSymptom = (id: string) => {
    let updated: string[];
    if (selectedSymptoms.includes(id)) {
      updated = selectedSymptoms.filter((s) => s !== id);
    } else {
      updated = [...selectedSymptoms, id];
    }
    setSelectedSymptoms(updated);
    persistChanges(updated, answers);
  };

  const currentQ: Question | undefined =
    currentQuestionIndex >= 0 ? dynamicQuestions[currentQuestionIndex] : undefined;

  const handleAnswerSelect = (questionId: string, val: any) => {
    const updated = { ...answers, [questionId]: val };
    setAnswers(updated);
    persistChanges(selectedSymptoms, updated);
  };

  const handleMultiChoiceToggle = (questionId: string, optionId: string) => {
    const currentList: string[] = answers[questionId] || [];
    let updatedList: string[];
    if (currentList.includes(optionId)) {
      updatedList = currentList.filter((item) => item !== optionId);
    } else {
      updatedList = [...currentList, optionId];
    }
    handleAnswerSelect(questionId, updatedList);
  };

  // Next Question Handler
  const handleNext = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    if (currentQuestionIndex === -1) {
      if (selectedSymptoms.length === 0) {
        alert(
          isHindi
            ? 'कृपया कम से कम एक लक्षण चुनें या अपनी परेशानी बताएं।'
            : 'Please select at least one symptom category before proceeding.'
        );
        return;
      }
      setCurrentQuestionIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentQuestionIndex < dynamicQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setVoiceInputText('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Finished questionnaire -> proceed to medical history
      persistChanges(selectedSymptoms, answers);
      navigate('/patient/medical-history');
    }
  };

  // Previous Question Handler
  const handlePrevious = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    if (currentQuestionIndex === -1) {
      navigate('/patient/language');
    } else if (currentQuestionIndex === 0) {
      setCurrentQuestionIndex(-1);
    } else {
      setCurrentQuestionIndex((prev) => prev - 1);
      setVoiceInputText('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // AUTOMATIC CONVERSATIONAL VOICE ASSISTANT INTEGRATION
  // =========================================================================

  const handleSpokenAnswer = (transcript: string) => {
    if (!transcript.trim()) return;

    if (currentQuestionIndex === -1) {
      // Step A: Match spoken symptoms
      const matched = matchSymptomsFromSpeech(transcript);
      if (matched.length > 0) {
        setSelectedSymptoms(matched);
        persistChanges(matched, answers);

        // Visual feedback & auto-advance to dynamic questions after brief pause
        transitionTimerRef.current = setTimeout(() => {
          setCurrentQuestionIndex(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
      } else {
        // Fallback: select 'other' and save text
        setSelectedSymptoms(['other']);
        const updated = { ...answers, other_description: transcript };
        setAnswers(updated);
        persistChanges(['other'], updated);

        transitionTimerRef.current = setTimeout(() => {
          setCurrentQuestionIndex(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
      }
    } else if (currentQ) {
      // Step B: Match answer based on question type
      let answered = false;

      if (currentQ.type === 'single-choice' || currentQ.type === 'yes-no') {
        const matchedOption = matchSingleChoiceOption(transcript, currentQ.options || []);
        if (matchedOption) {
          handleAnswerSelect(currentQ.id, matchedOption);
          answered = true;
        } else {
          // If no direct option matched, store as textual answer
          handleAnswerSelect(currentQ.id, transcript);
          answered = true;
        }
      } else if (currentQ.type === 'scale') {
        const score = matchScaleValue(transcript, currentQ.minScale || 1, currentQ.maxScale || 10);
        if (score !== null) {
          handleAnswerSelect(currentQ.id, score);
          answered = true;
        }
      } else if (currentQ.type === 'multi-choice') {
        const matchedOption = matchSingleChoiceOption(transcript, currentQ.options || []);
        if (matchedOption) {
          handleMultiChoiceToggle(currentQ.id, matchedOption);
          answered = true;
        }
      } else if (currentQ.type === 'text' || currentQ.type === 'duration') {
        setVoiceInputText(transcript);
        handleAnswerSelect(currentQ.id, transcript);
        answered = true;
      }

      if (answered) {
        // Auto-advance to next question after 1400ms visual confirmation
        transitionTimerRef.current = setTimeout(() => {
          handleNext();
        }, 1400);
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
        handleSpokenAnswer(text);
      }
    },
  });

  // Construct current question prompt text
  const getCurrentQuestionPrompt = (): { key: string; text: string } => {
    if (currentQuestionIndex === -1) {
      return {
        key: 'step-a-primary-concern',
        text: isHindi
          ? 'नमस्ते! आज आपको क्या परेशानी हो रही है? जैसे बुखार, सिरदर्द, खांसी-जुकाम, या पेट दर्द। बोलकर बताइए या कार्ड चुनिए।'
          : 'Hello! What health problem are you experiencing today? For example fever, cough, headache, or stomach pain. Please speak your symptoms or tap a card.',
      };
    }

    if (currentQ) {
      let optionsText = '';
      if (currentQ.options && currentQ.options.length > 0 && currentQ.type !== 'scale') {
        const optionsList = currentQ.options
          .map((o) => (isHindi ? o.hindiLabel : o.label))
          .join(', ');
        optionsText = isHindi ? ` विकल्प हैं: ${optionsList}` : ` Options are: ${optionsList}`;
      } else if (currentQ.type === 'scale') {
        optionsText = isHindi
          ? ' 1 से 10 के पैमाने पर बताएं, जहां 1 बहुत कम और 10 असहनीय दर्द है।'
          : ' Rate on a scale from 1 to 10, where 1 is mild and 10 is severe.';
      }

      return {
        key: `question-${currentQ.id}-${currentQuestionIndex}`,
        text: isHindi
          ? `${currentQ.hindiText}.${optionsText}`
          : `${currentQ.text}.${optionsText}`,
      };
    }

    return { key: 'empty', text: '' };
  };

  // Automatically speak the current question and then listen whenever question changes
  useEffect(() => {
    if (!isVoiceEnabled) return;

    const { key, text } = getCurrentQuestionPrompt();
    if (!text) return;

    // Trigger conversational speak & listen loop
    speakAndListen(key, text);
  }, [currentQuestionIndex, dynamicQuestions.length, isVoiceEnabled, language]);

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Step 2 Progress Bar */}
      <StepProgressBar currentStep={2} />

      {/* Emergency Alert Banner */}
      {hasConcerningSymptom && <EmergencyBanner />}

      {/* Automatic Conversational Voice Assistant Panel */}
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
          const { key, text } = getCurrentQuestionPrompt();
          replayCurrentQuestion(key, text);
        }}
        onRetryListening={() => retryListening()}
        onStartAssistant={() => {
          const { key, text } = getCurrentQuestionPrompt();
          handleUserGestureStart(key, text);
        }}
        onApplyManualAnswer={(editedText) => {
          setTranscribedText(editedText);
          handleSpokenAnswer(editedText);
        }}
      />

      {/* Screen Question Container */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-10 shadow-lg shadow-teal-950/5 mb-8">
        {/* ======================================================== */}
        {/* STEP A: MAIN HEALTH PROBLEM SELECTION                    */}
        {/* ======================================================== */}
        {currentQuestionIndex === -1 ? (
          <div>
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  {isHindi ? 'मुख्य स्वास्थ्य समस्या' : 'Primary Health Concern'}
                </span>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                  {isHindi
                    ? 'आज आपको क्या परेशानी हो रही है?'
                    : 'What health problem are you experiencing today?'}
                </h1>
                <p className="text-sm md:text-base text-slate-500 mt-1">
                  {isHindi
                    ? 'बोलकर बताएं या नीचे दिए गए कार्ड्स में से चुनें।'
                    : 'Speak naturally or select one or more options below.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const { key, text } = getCurrentQuestionPrompt();
                  replayCurrentQuestion(key, text);
                }}
                className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-2xl transition-colors shrink-0"
                title="Read question aloud"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            {/* Large Symptom Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-8">
              {SYMPTOM_CATEGORIES.map((cat) => (
                <SymptomCard
                  key={cat.id}
                  category={cat}
                  isSelected={selectedSymptoms.includes(cat.id)}
                  onToggle={() => handleToggleSymptom(cat.id)}
                />
              ))}
            </div>

            {/* Demo rule logic disclaimer note */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <p>
                <strong>Configurable Rule Engine:</strong> MediConnect collects information to organize for your doctor. It does not diagnose diseases.
              </p>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STEP B: DYNAMIC SYMPTOM-SPECIFIC QUESTIONS               */
          /* ======================================================== */
          currentQ && (
            <div className="space-y-6">
              {/* Question metadata badge & speak button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {isHindi
                      ? `प्रश्न ${currentQuestionIndex + 1} / ${dynamicQuestions.length}`
                      : `Question ${currentQuestionIndex + 1} of ${dynamicQuestions.length}`}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    Category: {currentQ.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const { key, text } = getCurrentQuestionPrompt();
                    replayCurrentQuestion(key, text);
                  }}
                  className="flex items-center gap-1.5 p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isHindi ? 'सुनें' : 'Read Aloud'}</span>
                </button>
              </div>

              {/* Question Text in Dual Language */}
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-snug">
                  {isHindi ? currentQ.hindiText : currentQ.text}
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {isHindi ? currentQ.text : currentQ.hindiText}
                </p>
                {currentQ.helpText && (
                  <p className="text-xs text-teal-700 mt-2 bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 inline-block">
                    💡 {isHindi ? currentQ.helpTextHindi || currentQ.helpText : currentQ.helpText}
                  </p>
                )}
              </div>

              {/* Controls based on question type */}

              {/* 1. Single Choice Options */}
              {currentQ.type === 'single-choice' && currentQ.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAnswerSelect(currentQ.id, opt.id)}
                        className={`p-4 md:p-5 rounded-2xl border-2 text-left font-bold text-sm md:text-base flex items-center justify-between transition-all active:scale-[0.98] ${
                          isSelected
                            ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-md shadow-teal-700/10 ring-2 ring-teal-500/20'
                            : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800'
                        }`}
                      >
                        <div>
                          <div>{isHindi ? opt.hindiLabel : opt.label}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">
                            {isHindi ? opt.label : opt.hindiLabel}
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                            isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Yes/No Choice */}
              {currentQ.type === 'yes-no' && currentQ.options && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAnswerSelect(currentQ.id, opt.id)}
                        className={`p-5 rounded-2xl border-2 text-center font-bold text-base transition-all active:scale-[0.98] ${
                          isSelected
                            ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                            : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800'
                        }`}
                      >
                        <div>{isHindi ? opt.hindiLabel : opt.label}</div>
                        <div className={`text-xs mt-1 ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                          {isHindi ? opt.label : opt.hindiLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. Multi-Choice Options */}
              {currentQ.type === 'multi-choice' && currentQ.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const currentSelected = answers[currentQ.id] || [];
                    const isSelected = currentSelected.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleMultiChoiceToggle(currentQ.id, opt.id)}
                        className={`p-4 md:p-5 rounded-2xl border-2 text-left font-bold text-sm md:text-base flex items-center justify-between transition-all active:scale-[0.98] ${
                          isSelected
                            ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-md shadow-teal-700/10'
                            : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800'
                        }`}
                      >
                        <div>
                          <div>{isHindi ? opt.hindiLabel : opt.label}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">
                            {isHindi ? opt.label : opt.hindiLabel}
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ml-3 ${
                            isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. Visual Severity Scale (1-10) */}
              {currentQ.type === 'scale' && (
                <div className="pt-2">
                  <SeverityScale
                    value={answers[currentQ.id] || 5}
                    onChange={(val) => handleAnswerSelect(currentQ.id, val)}
                  />
                </div>
              )}

              {/* 5. Freeform Text with Voice / Typing */}
              {currentQ.type === 'text' && (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={4}
                    value={answers[currentQ.id] || voiceInputText}
                    onChange={(e) => {
                      setVoiceInputText(e.target.value);
                      handleAnswerSelect(currentQ.id, e.target.value);
                    }}
                    placeholder={
                      isHindi
                        ? 'यहाँ अपनी बात लिखें या बोलकर बताएं...'
                        : 'Describe your symptoms here or speak naturally...'
                    }
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-base font-medium focus:bg-white focus:border-teal-500 focus:ring-0"
                  />
                  <p className="text-xs text-slate-400">
                    {isHindi
                      ? 'आप बोलकर या टाइप करके अपनी बात दर्ज कर सकते हैं।'
                      : 'You can type your answer or simply speak in your own language.'}
                  </p>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Navigation Buttons Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 sticky bottom-4 z-20">
        <button
          type="button"
          onClick={handlePrevious}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHindi ? 'पीछे' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-3">
          {currentQuestionIndex >= 0 && !currentQ?.required && (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-800 font-bold text-xs md:text-sm"
            >
              {isHindi ? 'यह सवाल छोड़ें' : 'Skip'}
            </button>
          )}

          <button
            type="button"
            id="questionnaire-next-button"
            onClick={handleNext}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm md:text-base px-7 py-3.5 rounded-2xl shadow-lg shadow-teal-600/25 transition-all"
          >
            <span>
              {currentQuestionIndex === -1
                ? isHindi ? 'आगे बढ़ें (Next)' : 'Continue to Questions'
                : currentQuestionIndex === dynamicQuestions.length - 1
                ? isHindi ? 'इतिहास दर्ज करें (Next)' : 'Save & Continue to History'
                : isHindi ? 'अगला सवाल (Next)' : 'Next Question'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
