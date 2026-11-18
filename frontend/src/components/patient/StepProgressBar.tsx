import React from 'react';
import { Languages, Activity, History, UploadCloud, CheckCircle2, FileText } from 'lucide-react';
import { useCase } from '../../context/CaseContext';

interface StepProgressBarProps {
  currentStep: number; // 1 to 6
}

export const PATIENT_STEPS = [
  { step: 1, title: 'Language', titleHindi: 'भाषा', icon: Languages, path: '/patient/language' },
  { step: 2, title: 'Symptoms', titleHindi: 'लक्षण', icon: Activity, path: '/patient/questionnaire' },
  { step: 3, title: 'History', titleHindi: 'इतिहास', icon: History, path: '/patient/medical-history' },
  { step: 4, title: 'Reports', titleHindi: 'रिपोर्टें', icon: UploadCloud, path: '/patient/upload-reports' },
  { step: 5, title: 'Review', titleHindi: 'जाँचें', icon: CheckCircle2, path: '/patient/review' },
  { step: 6, title: 'Case Report', titleHindi: 'रिपोर्ट', icon: FileText, path: '/patient/generated-report' },
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep }) => {
  const { language } = useCase();
  const isHindi = language === 'hi';

  const progressPercent = Math.round(((currentStep - 1) / (PATIENT_STEPS.length - 1)) * 100);

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-4 md:p-6 shadow-sm mb-6">
      {/* Top summary row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
          {isHindi ? `चरण ${currentStep} / ${PATIENT_STEPS.length}` : `Step ${currentStep} of ${PATIENT_STEPS.length}`}
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {isHindi ? `${progressPercent}% पूर्ण` : `${progressPercent}% Completed`}
        </span>
      </div>

      {/* Visual Progress Track */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6">
        <div
          className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step nodes */}
      <div className="grid grid-cols-6 gap-1 md:gap-2 text-center">
        {PATIENT_STEPS.map((s) => {
          const Icon = s.icon;
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <div key={s.step} className="flex flex-col items-center">
              <div
                className={`w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center font-bold text-xs md:text-sm transition-all ${
                  isDone
                    ? 'bg-teal-600 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-teal-100 text-teal-900 border-2 border-teal-600 shadow-md ring-4 ring-teal-50'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span
                className={`text-[11px] md:text-xs font-medium mt-1.5 line-clamp-1 ${
                  isCurrent ? 'text-teal-950 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {isHindi ? s.titleHindi : s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
