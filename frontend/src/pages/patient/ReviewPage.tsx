import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Edit3,
  Volume2,
  Globe,
  Activity,
  History,
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { StepProgressBar } from '../../components/patient/StepProgressBar';
import { SYMPTOM_CATEGORIES } from '../../data/symptomQuestions';
import { SUPPORTED_LANGUAGES } from '../../data/translations';
import { VoiceAssistantWidget } from '../../components/common/VoiceAssistantWidget';
import { voiceService } from '../../services/voiceService';

export const ReviewPage: React.FC = () => {
  const { language, activeDraft } = useCase();
  const navigate = useNavigate();
  const isHindi = language === 'hi';

  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const primarySymptomNames = (activeDraft.primarySymptoms || []).map((id) => {
    const found = SYMPTOM_CATEGORIES.find((c) => c.id === id);
    return found ? (isHindi ? found.hindiName : found.name) : id;
  });

  const answers = activeDraft.symptomAnswers || {};
  const history = activeDraft.medicalHistory;
  const reports = activeDraft.uploadedReports || [];

  const handleReadSummaryAloud = () => {
    const text = isHindi
      ? `आपके जवाबों का सारांश: मुख्य समस्या ${primarySymptomNames.join(', ')} है। तकलीफ का स्तर ${
          answers.shared_severity || 5
        } है। पुरानी रिपोर्टें ${reports.length} जुड़ी हैं। अब नीचे दिया गया बटन दबाकर रिपोर्ट तैयार करें।`
      : `Summary of your case: Primary symptoms are ${primarySymptomNames.join(
          ', '
        )}. Severity score is ${answers.shared_severity || 5} out of 10. ${
          reports.length
        } previous reports attached. Click Generate My Case Report to proceed.`;
    voiceService.speak(text, language);
  };

  const handleGenerateReport = () => {
    navigate('/patient/generated-report');
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Progress Bar (Step 5) */}
      <StepProgressBar currentStep={5} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {isHindi ? 'समीक्षा और पुष्टि' : 'Review & Confirm'}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            {isHindi ? 'अपने सभी उत्तरों की जाँच करें' : 'Review Your Health Answers'}
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            {isHindi
              ? 'रिपोर्ट तैयार करने से पहले अपने सभी जवाबों को देख लें। आप किसी भी खंड को सुधार सकते हैं।'
              : 'Review your collected details before generating your draft case report for the doctor.'}
          </p>
        </div>

        <button
          onClick={handleReadSummaryAloud}
          className="flex items-center gap-2 px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-2xl font-bold text-xs transition-colors shrink-0 shadow-sm"
          title="Listen to summary"
        >
          <Volume2 className="w-5 h-5 text-teal-600" />
          <span className="hidden sm:inline">{isHindi ? 'सारांश सुनें' : 'Read Summary'}</span>
        </button>
      </div>

      <div className="space-y-6 mb-10">
        {/* Section 1: Language */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 text-teal-800 rounded-xl flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">
                {isHindi ? 'चुनी गई भाषा' : 'Selected Language'}
              </p>
              <h3 className="text-lg font-black text-slate-900">
                {langObj.nativeName} ({langObj.name})
              </h3>
            </div>
          </div>

          <button
            onClick={() => navigate('/patient/language')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 rounded-xl text-xs font-bold text-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isHindi ? 'बदलें' : 'Edit'}</span>
          </button>
        </div>

        {/* Section 2: Chief Symptoms */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">
                {isHindi ? 'मुख्य स्वास्थ्य समस्याएं' : 'Primary Symptoms & Severity'}
              </h3>
            </div>
            <button
              onClick={() => navigate('/patient/questionnaire')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 rounded-xl text-xs font-bold text-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isHindi ? 'बदलें' : 'Edit'}</span>
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">Symptoms Selected:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {primarySymptomNames.length > 0 ? (
                  primarySymptomNames.map((name) => (
                    <span
                      key={name}
                      className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-900 rounded-full font-bold text-xs"
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">None specified</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block">Pain / Discomfort Severity:</span>
                <span className="text-base font-black text-slate-900">
                  {answers.shared_severity ? `${answers.shared_severity} / 10` : '5 / 10 (Moderate)'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block">Timeline / Duration:</span>
                <span className="text-base font-black text-slate-900 capitalize">
                  {answers.shared_duration ? String(answers.shared_duration).replace(/_/g, ' ') : 'Recent'}
                </span>
              </div>
            </div>

            {answers.shared_relief_triggers && (
              <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                <strong className="text-slate-800">Relief / Trigger notes:</strong> {answers.shared_relief_triggers}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Medical History */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">
                {isHindi ? 'स्वास्थ्य इतिहास और दवाएं' : 'Medical History & Current Medications'}
              </h3>
            </div>
            <button
              onClick={() => navigate('/patient/medical-history')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 rounded-xl text-xs font-bold text-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isHindi ? 'बदलें' : 'Edit'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold block">Existing Conditions:</span>
              <span className="font-bold text-slate-800">
                {history?.conditions && history.conditions.length > 0
                  ? history.conditions.join(', ')
                  : history?.provided === false
                  ? 'Information skipped by patient'
                  : 'None reported'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold block">Current Medicines:</span>
              <span className="font-bold text-slate-800">
                {history?.medications?.trim() || 'None reported'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold block">Known Allergies:</span>
              <span className="font-bold text-slate-800">
                {history?.allergies?.trim() || 'No known allergies reported'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold block">Past Surgeries / Family:</span>
              <span className="font-bold text-slate-800">
                {history?.pastSurgeries || 'None specified'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Attached Reports */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <UploadCloud className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">
                {isHindi ? 'पुरानी मेडिकल रिपोर्टें' : 'Attached Medical Reports'} ({reports.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/patient/upload-reports')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 rounded-xl text-xs font-bold text-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isHindi ? 'बदलें' : 'Edit'}</span>
            </button>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate">{r.name}</span>
                  <span className="text-slate-400 shrink-0">{(r.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No previous reports attached.</p>
          )}
        </div>
      </div>

      {/* Generation CTA Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4">
        <button
          onClick={() => navigate('/patient/upload-reports')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHindi ? 'पीछे' : 'Back to Reports'}</span>
        </button>

        <button
          onClick={handleGenerateReport}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-base md:text-lg px-8 py-4 rounded-2xl shadow-xl shadow-teal-600/30 transition-all"
        >
          <Sparkles className="w-5 h-5 text-teal-200 animate-pulse" />
          <span>{isHindi ? 'मेरी रिपोर्ट तैयार करें' : 'Generate My Case Report'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistantWidget
        currentScreenGuidance={
          isHindi
            ? 'कृपया अपने जवाबों की जाँच कर लें। फिर नीचे दिया गया बटन दबाकर रिपोर्ट तैयार करें।'
            : 'Please review all your collected answers. Then tap Generate My Case Report below.'
        }
      />
    </div>
  );
};
