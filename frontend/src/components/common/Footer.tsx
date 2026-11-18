import React from 'react';
import { ShieldCheck, PhoneCall, Heart, Info } from 'lucide-react';
import { useCase } from '../../context/CaseContext';

export const Footer: React.FC = () => {
  const { language } = useCase();
  const isHindi = language === 'hi';

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      {/* Top Banner: Medical & Emergency Disclaimer */}
      <div className="bg-red-950/60 border-b border-red-900/60 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-red-600 text-white rounded-md">
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span className="font-semibold">
              {isHindi
                ? 'आपातकालीन सहायता (भारत): डायल करें 112 या 108'
                : 'Medical Emergency (India): Dial National Helpline 112 or Ambulance 108'}
            </span>
          </div>
          <p className="text-[11px] text-red-300/80 text-center sm:text-right">
            {isHindi
              ? 'मेडीकनेक्ट एक स्वास्थ्य सूचना संग्रह प्रणाली है। यह किसी भी प्रकार से डॉक्टर का विकल्प नहीं है।'
              : 'MediConnect is a case-taking assistive tool and does NOT replace a licensed doctor.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center text-slate-950 font-black">
                MC
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Medi<span className="text-teal-400">Connect</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-md">
              Empowering patients of every literacy level to explain their symptoms naturally in their own mother tongue through voice guidance, while generating structured case drafts for physician review.
            </p>

            <div className="mt-4 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p>
                <strong>Clinical Integration:</strong> Powered by Spring Boot backend, MySQL database, and Google Gemini AI for clinician decision support.
              </p>
            </div>
          </div>

          {/* Col 2: Supported Indian Languages */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
              Supported Languages
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
              <span>हिन्दी (Hindi)</span>
              <span>English</span>
              <span>বাংলা (Bengali)</span>
              <span>தமிழ் (Tamil)</span>
              <span>తెలుగు (Telugu)</span>
              <span>मराठी (Marathi)</span>
              <span>ગુજરાતી (Gujarati)</span>
              <span>ਪੰਜਾਬੀ (Punjabi)</span>
              <span>ಕನ್ನಡ (Kannada)</span>
              <span>മലയാളം (Malayalam)</span>
            </div>
          </div>

          {/* Col 3: Safe Healthcare Standards */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
              Accessibility & Ethics
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Non-diagnostic intake engine</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Web Speech API integration</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>No forced typing required</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Patient privacy focused</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 MediConnect Healthcare Systems. Built with care for inclusive healthcare.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Designed for healthcare accessibility</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};
