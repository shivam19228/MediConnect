import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mic,
  Globe,
  UploadCloud,
  FileCheck2,
  Stethoscope,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  HeartHandshake,
  Lock,
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES, type LanguageMeta } from '../data/translations';


export const LandingPage: React.FC = () => {
  const { language } = useCase();
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const isHindi = language === 'hi';

  const handleStartCheck = () => {
    if (isAuthenticated && role === 'PATIENT') {
      navigate('/patient/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-teal-50/70 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Multilingual Pill */}
              <div className="inline-flex items-center gap-2 bg-teal-100/80 border border-teal-300/80 px-4 py-1.5 rounded-full text-xs font-bold text-teal-900 shadow-sm">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>
                  {isHindi
                    ? '10+ भारतीय भाषाओं में आवाज-आधारित स्वास्थ्य सहायता'
                    : 'Voice-Assisted Case-Taking in 10+ Indian Languages'}
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                {isHindi ? (
                  <>
                    आपकी सेहत की बात, <br />
                    <span className="text-teal-600">सीधी और आसान।</span>
                  </>
                ) : (
                  <>
                    Your Health Story, <br />
                    <span className="text-teal-600">Understood.</span>
                  </>
                )}
              </h1>

              {/* Supporting Text */}
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl">
                {isHindi
                  ? 'अपनी भाषा में बताएं कि आपको क्या परेशानी है। मेडीकनेक्ट आपकी तकलीफ और पुरानी रिपोर्ट को व्यवस्थित करता है ताकि डॉक्टर आपकी बीमारी को आसानी से समझ सकें।'
                  : 'Tell us how you feel in your own language. MediConnect helps organize your symptoms and medical history so your doctor can understand your case more easily.'}
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={handleStartCheck}
                  className="inline-flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-base md:text-lg px-8 py-4 rounded-2xl shadow-xl shadow-teal-600/25 transition-all"
                >
                  <span>{isHindi ? 'स्वास्थ्य जाँच शुरू करें' : 'Start Your Health Check'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-base px-6 py-4 rounded-2xl border-2 border-slate-200 transition-colors shadow-sm"
                >
                  <Users className="w-5 h-5 text-teal-600" />
                  <span>{isHindi ? 'डॉक्टर / रोगी लॉगिन' : 'Doctor & Patient Login'}</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No reading or typing required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Clinical Structure</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Doctor Dashboard Included</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border-2 border-teal-200 p-6 md:p-8 shadow-2xl shadow-teal-900/10 relative">
                {/* Simulated Floating Audio Assistant Badge */}
                <div className="absolute -top-4 -right-3 bg-teal-600 text-white font-bold text-xs py-1.5 px-3.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'बोलकर जवाब दें' : 'Speak to Answer'}</span>
                </div>

                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isHindi ? 'रोगी-केस मार्गदर्शन' : 'Patient Case-Taking Flow'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isHindi ? 'सरल और व्यक्तिगत' : 'Step-by-step guidance'}
                    </p>
                  </div>
                </div>

                {/* Simulated Question Card */}
                <div className="mt-5 space-y-3">
                  <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-2xl">
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                      Question 1 of 4
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      "आज आपको क्या परेशानी हो रही है?"
                    </p>
                    <p className="text-xs text-slate-600">
                      "What health problem are you experiencing today?"
                    </p>
                  </div>

                  {/* Sample selection chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="p-3 bg-teal-600 text-white rounded-xl flex items-center justify-between shadow-sm">
                      <span>बुखार (Fever)</span>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="p-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl">
                      सिरदर्द (Headache)
                    </div>
                    <div className="p-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl">
                      खांसी (Cough/Cold)
                    </div>
                    <div className="p-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl">
                      पेट दर्द (Stomach Pain)
                    </div>
                  </div>

                  {/* Simulated AI Output Card */}
                  <div className="mt-4 p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-teal-400 font-bold">
                      <span>Draft Case Summary for Doctor</span>
                      <span className="bg-teal-950 px-2 py-0.5 rounded border border-teal-800">Demo AI Draft</span>
                    </div>
                    <p className="text-slate-300 leading-snug">
                      Chief Complaint: High fever for 4 days with shivering chills. Measures 102°F. Knee & muscular aches. Paracetamol provides temporary relief.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-3 tracking-tight">
              {isHindi ? 'मेडीकनेक्ट कैसे काम करता है' : 'How MediConnect Works'}
            </h2>
            <p className="text-base text-slate-600 mt-2">
              Designed specifically so patients who cannot read or write comfortably can share their symptoms easily.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between hover:shadow-lg transition-shadow">
              <span className="w-8 h-8 bg-teal-600 text-white rounded-xl font-black text-sm flex items-center justify-center mb-4">
                1
              </span>
              <div>
                <Globe className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">
                  Multiple Indian Languages
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Choose from Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam or English.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between hover:shadow-lg transition-shadow">
              <span className="w-8 h-8 bg-teal-600 text-white rounded-xl font-black text-sm flex items-center justify-center mb-4">
                2
              </span>
              <div>
                <Mic className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">
                  Voice-Assisted Guidance
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Listen to every question spoken aloud. Press the microphone to answer naturally in your own voice.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between hover:shadow-lg transition-shadow">
              <span className="w-8 h-8 bg-teal-600 text-white rounded-xl font-black text-sm flex items-center justify-center mb-4">
                3
              </span>
              <div>
                <UploadCloud className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">
                  Previous Medical Reports
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Take photos or attach older blood tests, prescriptions, and scans so your doctor has the full history.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between hover:shadow-lg transition-shadow">
              <span className="w-8 h-8 bg-teal-600 text-white rounded-xl font-black text-sm flex items-center justify-center mb-4">
                4
              </span>
              <div>
                <FileCheck2 className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">
                  Doctor-Reviewed AI Summaries
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  A structured clinical case report is prepared so the doctor can review answers, reports, and summary together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Languages Showcase */}
      <section className="py-14 bg-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            Spoken in Your Mother Tongue Across India
          </h3>
          <p className="text-sm text-teal-200 max-w-xl mx-auto mb-8">
            Click on any language to preview native greeting and voice assistance
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {SUPPORTED_LANGUAGES.map((lang: LanguageMeta) => (
              <div

                key={lang.code}
                className="bg-teal-800/80 hover:bg-teal-700/90 border border-teal-600/50 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all text-xs font-semibold"
              >
                <span className="text-sm font-bold text-teal-100">{lang.nativeName}</span>
                <span className="text-[11px] text-teal-300">({lang.name})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety, Emergency & Privacy Notice */}
      <section className="py-14 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border-2 border-slate-300/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 text-red-700 rounded-2xl shrink-0 mt-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {isHindi ? 'सुरक्षा और गोपनीयता की महत्वपूर्ण जानकारी' : 'Privacy, Safety & Medical Disclaimer'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  MediConnect is an information gathering and organizational system designed to assist patients in communicating symptoms to their doctors. <strong>MediConnect does not diagnose diseases, prescribe medication, or replace a certified medical doctor.</strong>
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>Not an Emergency Service:</strong> If you or someone around you experiences sudden severe chest pain, extreme breathlessness, loss of consciousness, or signs of stroke, please call <strong>112 (National Emergency Helpline in India)</strong> or visit your nearest emergency emergency room immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
