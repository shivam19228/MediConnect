import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  UploadCloud,
  FileText,
  Volume2,
  Globe,
  ArrowRight,
  Sparkles,
  Heart,
  History,
  CheckCircle,
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { useAuth } from '../../context/AuthContext';
import { EmergencyBanner } from '../../components/common/EmergencyBanner';
import { VoiceAssistantWidget } from '../../components/common/VoiceAssistantWidget';
import { SUPPORTED_LANGUAGES } from '../../data/translations';

import { caseService } from '../../services/caseService';
import { ApiCaseSummary } from '../../services/apiClient';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language, setLanguage, activeDraft, updateDraft, playAssistantGuidance } = useCase();
  const navigate = useNavigate();

  const [patientCases, setPatientCases] = useState<ApiCaseSummary[]>([]);
  const [loadingCases, setLoadingCases] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    caseService
      .getMyCases()
      .then((data) => {
        if (!isMounted) return;
        setPatientCases(data);
        const latestDraft = data.find((c) => c.status === 'DRAFT');
        if (latestDraft && !activeDraft.id) {
          updateDraft({ id: latestDraft.id, language: (latestDraft.language as any) || 'hi' });
        }
        setLoadingCases(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load patient cases', err);
        setLoadingCases(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isHindi = language === 'hi';
  const hasDraftData =
    Boolean(activeDraft.id) ||
    (activeDraft.primarySymptoms && activeDraft.primarySymptoms.length > 0) ||
    (activeDraft.uploadedReports && activeDraft.uploadedReports.length > 0);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleStartNewCheck = () => {
    navigate('/patient/language');
  };

  const handleContinueCheck = () => {
    if (activeDraft.primarySymptoms && activeDraft.primarySymptoms.length > 0) {
      navigate('/patient/questionnaire');
    } else {
      navigate('/patient/language');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Emergency banner at top */}
      <EmergencyBanner />

      {/* Main Welcome Hero */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-teal-950/15 mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-teal-600/60 border border-teal-400/40 px-3.5 py-1 rounded-full text-xs font-semibold text-teal-100">
            <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
            <span>{user?.name ? `Patient: ${user.name}` : 'Patient Portal'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {isHindi ? 'नमस्ते! आज आपकी तबीयत कैसी है?' : 'Namaste! How are you feeling today?'}
          </h1>

          <p className="text-sm md:text-base text-teal-100/90 leading-relaxed">
            {isHindi
              ? 'मेडीकनेक्ट में आपका स्वागत है। आप अपनी समस्या बोलकर या नीचे दिए गए विकल्पों को चुनकर बता सकते हैं।'
              : 'Welcome to MediConnect. You can explain your symptoms naturally by speaking or selecting large guided options below.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                playAssistantGuidance(
                  isHindi
                    ? 'नमस्ते! मैं आपकी सहायता करूँगा। नीचे दिए गए हरे बटन को दबाकर स्वास्थ्य जाँच शुरू करें।'
                    : 'Namaste! I will guide you. Press the green button below to start your health check.'
                )
              }
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/30 backdrop-blur-sm transition-all"
            >
              <Volume2 className="w-4 h-4 text-teal-200" />
              <span>{isHindi ? 'मार्गदर्शन सुनें (Listen)' : 'Listen to Voice Guide'}</span>
            </button>
          </div>
        </div>

        {/* Decorative corner icon */}
        <div className="absolute right-4 -bottom-6 text-teal-500/10 pointer-events-none hidden md:block">
          <Heart className="w-64 h-64" />
        </div>
      </div>

      {/* Language Quick-Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-100 text-teal-800 rounded-2xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isHindi ? 'आपकी चुनी हुई भाषा:' : 'Current Selected Language:'}
            </h3>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'सभी सवाल इसी भाषा में बोले और दिखाए जाएंगे'
                : 'Questions and voice assistance will be in this language'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => navigate('/patient/language')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-800 font-bold text-xs md:text-sm px-4 py-2.5 rounded-2xl border border-slate-200 transition-colors"
          >
            <span>{currentLangObj.nativeName} ({currentLangObj.name})</span>
            <span className="text-teal-600 font-extrabold text-xs">Change</span>
          </button>
        </div>
      </div>

      {/* 4 Large Action Cards (Usability prioritized) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Card 1: Start Health Check */}
        <div
          onClick={handleStartNewCheck}
          className="group bg-white border-2 border-teal-500/80 hover:border-teal-600 rounded-3xl p-6 md:p-8 shadow-lg shadow-teal-900/5 hover:shadow-xl hover:shadow-teal-900/10 transition-all cursor-pointer flex flex-col justify-between active:scale-[0.99]"
        >
          <div>
            <div className="w-14 h-14 bg-teal-600 group-hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/30 transition-colors mb-5">
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                Primary Step
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mt-2 group-hover:text-teal-900">
              {isHindi ? 'नई स्वास्थ्य जाँच शुरू करें' : 'Start Health Check'}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {isHindi
                ? 'अपनी बीमारी, बुखार, दर्द या तकलीफ के बारे में बोलकर या छूकर बताएं।'
                : 'Explain your symptoms, pain, or fever through voice guidance or simple cards.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-teal-700 font-bold text-sm">
            <span>{isHindi ? 'शुरू करने के लिए यहाँ दबाएं' : 'Click to begin questionnaire'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Continue Previous Check */}
        <div
          onClick={handleContinueCheck}
          className={`group bg-white border-2 rounded-3xl p-6 md:p-8 shadow-sm transition-all flex flex-col justify-between ${
            hasDraftData
              ? 'border-sky-300 hover:border-sky-500 hover:shadow-md cursor-pointer'
              : 'border-slate-200 opacity-80 cursor-pointer'
          }`}
        >
          <div>
            <div className="w-14 h-14 bg-sky-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-sky-600/20 mb-5">
              <RotateCcw className="w-7 h-7" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full">
                {hasDraftData ? 'Draft In Progress' : 'No Active Draft'}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mt-2">
              {isHindi ? 'पिछली जाँच जारी रखें' : 'Continue Previous Check'}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {hasDraftData
                ? isHindi
                  ? 'आपके द्वारा दर्ज किए गए उत्तर सुरक्षित हैं। वहीं से आगे बढ़ें।'
                  : 'Resume your unfinished responses from your current session.'
                : isHindi
                  ? 'यदि आपने पहले कुछ जवाब दिए हैं तो उन्हें यहाँ से जारी रखें।'
                  : 'Resume an intake form if you started earlier in this session.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sky-700 font-bold text-sm">
            <span>{isHindi ? 'जारी रखने के लिए दबाएं' : 'Continue saved answers'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Upload Medical Reports */}
        <div
          onClick={() => navigate('/patient/upload-reports')}
          className="group bg-white border-2 border-slate-200 hover:border-teal-400 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/20 mb-5">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              {isHindi ? 'पुरानी मेडिकल रिपोर्टें' : 'My Medical Reports'}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {isHindi
                ? 'अपने पुराने पर्चे, खून की जांच या एक्स-रे की फोटो यहाँ अपलोड करें।'
                : 'Upload diagnostic lab tests, prescriptions, and scans for your doctor.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold text-sm">
            <span>{isHindi ? 'रिपोर्ट अपलोड करें' : 'Upload reports & scans'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Health History */}
        <div
          onClick={() => navigate('/patient/medical-history')}
          className="group bg-white border-2 border-slate-200 hover:border-teal-400 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-600/20 mb-5">
              <History className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              {isHindi ? 'मेरा स्वास्थ्य इतिहास' : 'My Health History'}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {isHindi
                ? 'डायबिटीज, बीपी, एलर्जी या पुरानी दवाओं के बारे में जानकारी दें।'
                : 'Record existing conditions, chronic medications, and known allergies.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-indigo-700 font-bold text-sm">
            <span>{isHindi ? 'इतिहास दर्ज करें' : 'Manage medical history'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Server-Loaded Case History Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isHindi ? 'मेरी पिछली जांच और पर्चे (OPD Tokens)' : 'My Case Records & OPD Tokens'}
            </h3>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'सर्वर पर सुरक्षित आपके सभी पंजीकृत मामले'
                : 'Directly synchronized with your MediConnect backend profile'}
            </p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {loadingCases ? 'Loading...' : `${patientCases.length} Records`}
          </span>
        </div>

        {loadingCases ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your server records...</div>
        ) : patientCases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {isHindi
              ? 'अभी तक कोई पंजीकृत मामला नहीं है। ऊपर दिए गए बटन से नई जांच शुरू करें।'
              : 'No medical cases found. Click "Start Health Check" above to begin your first intake.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {patientCases.map((c: ApiCaseSummary) => (
              <div
                key={c.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-2xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {c.tokenNumber ? (
                      <span className="font-mono text-xs font-black text-teal-900 bg-teal-100 px-2.5 py-0.5 rounded-lg border border-teal-200">
                        Token: {c.tokenNumber}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                        Draft in Progress
                      </span>
                    )}
                    <span className="text-xs font-bold uppercase text-slate-500">
                      {c.status}
                    </span>
                    {c.isEmergencyFlagged && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {c.primarySymptoms && c.primarySymptoms.length > 0
                      ? c.primarySymptoms.join(', ')
                      : 'General Intake Check'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Created: {new Date(c.createdAt).toLocaleDateString()} • Severity: {c.severity} • Reports: {c.uploadedReportCount}
                  </p>
                </div>

                <div>
                  {c.tokenNumber ? (
                    <button
                      onClick={() => navigate(`/patient/token/${c.id}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <span>View Receipt / Token</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        updateDraft({ id: c.id });
                        navigate('/patient/questionnaire');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Resume Draft</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Voice Assistant */}
      <VoiceAssistantWidget
        currentScreenGuidance={
          isHindi
            ? 'नमस्ते! ऊपर दिए गए बड़े हरे कार्ड पर क्लिक करके नई स्वास्थ्य जाँच शुरू करें।'
            : 'Hello! Click on the large green card above to start your health check.'
        }
      />
    </div>
  );
};
