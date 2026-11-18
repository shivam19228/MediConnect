import React from 'react';
import { Smile, Meh, Frown, AlertCircle } from 'lucide-react';
import { useCase } from '../../context/CaseContext';

interface SeverityScaleProps {
  value: number; // 1 to 10
  onChange: (val: number) => void;
}

export const SeverityScale: React.FC<SeverityScaleProps> = ({ value, onChange }) => {
  const { language } = useCase();
  const isHindi = language === 'hi';

  const getEmojiIcon = (val: number) => {
    if (val <= 3) return <Smile className="w-6 h-6 text-emerald-600" />;
    if (val <= 6) return <Meh className="w-6 h-6 text-amber-500" />;
    if (val <= 8) return <Frown className="w-6 h-6 text-orange-600" />;
    return <AlertCircle className="w-6 h-6 text-rose-600 animate-pulse" />;
  };

  const getSeverityLabel = (val: number) => {
    if (val <= 3) {
      return {
        en: 'Mild Discomfort (tolerable, can carry out daily tasks)',
        hi: 'हल्की तकलीफ (सहन करने योग्य, सामान्य कामकाज संभव)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    }
    if (val <= 6) {
      return {
        en: 'Moderate Pain (interferes with work or normal sleep)',
        hi: 'मध्यम दर्द (कामकाज या नींद में खलल डालता है)',
        color: 'text-amber-800 bg-amber-50 border-amber-200',
      };
    }
    if (val <= 8) {
      return {
        en: 'Severe Discomfort (hard to focus, requires immediate relief)',
        hi: 'तेज दर्द (सहन करना कठिन, तुरंत आराम की आवश्यकता)',
        color: 'text-orange-900 bg-orange-50 border-orange-200',
      };
    }
    return {
      en: 'Extreme / Unbearable Pain (incapacitating, seek urgent care)',
      hi: 'असहनीय तेज दर्द (बेहद गंभीर स्थिति, तत्काल डॉक्टर को दिखाएं)',
      color: 'text-rose-900 bg-rose-50 border-rose-300',
    };
  };

  const currentLabel = getSeverityLabel(value);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
          <span>{isHindi ? 'तकलीफ का स्तर चुनें (1 से 10)' : 'Select Discomfort Level (1 to 10)'}</span>
        </label>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl">
          {getEmojiIcon(value)}
          <span className="text-lg font-black text-slate-900">{value} / 10</span>
        </div>
      </div>

      {/* Visual Level Buttons */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 md:gap-2 mb-4">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
          const isSelected = value === num;
          let btnColor = 'hover:bg-slate-100 text-slate-700 border-slate-200';
          if (isSelected) {
            if (num <= 3) btnColor = 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100';
            else if (num <= 6) btnColor = 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30 ring-4 ring-amber-100';
            else if (num <= 8) btnColor = 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/30 ring-4 ring-orange-100';
            else btnColor = 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30 ring-4 ring-rose-100';
          }

          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`h-12 md:h-14 rounded-2xl font-black text-base md:text-lg border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${btnColor}`}
            >
              <span>{num}</span>
            </button>
          );
        })}
      </div>

      {/* Severity explanation badge */}
      <div className={`p-3 rounded-2xl border text-xs md:text-sm font-semibold flex items-center gap-2.5 ${currentLabel.color}`}>
        {getEmojiIcon(value)}
        <span>{isHindi ? currentLabel.hi : currentLabel.en}</span>
      </div>
    </div>
  );
};
