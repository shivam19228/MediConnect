import React from 'react';
import {
  Thermometer,
  Brain,
  Wind,
  CircleDot,
  HeartPulse,
  Activity,
  SunMedium,
  PersonStanding,
  Droplets,
  ZapOff,
  HelpCircle,
  Volume2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { SymptomCategory } from '../../types/questions';
import { useCase } from '../../context/CaseContext';
import { voiceService } from '../../services/voiceService';

interface SymptomCardProps {
  category: SymptomCategory;
  isSelected: boolean;
  onToggle: () => void;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Thermometer,
  Brain,
  Wind,
  CircleDot,
  HeartPulse,
  Activity,
  SunMedium,
  PersonStanding,
  Droplets,
  ZapOff,
  HelpCircle,
};

export const SymptomCard: React.FC<SymptomCardProps> = ({ category, isSelected, onToggle }) => {
  const { language } = useCase();
  const isHindi = language === 'hi';

  const IconComponent = iconMap[category.iconName] || HelpCircle;

  const handleSpeakCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToSpeak = isHindi
      ? `${category.hindiName}। ${category.descriptionHindi}`
      : `${category.name}. ${category.description}`;
    voiceService.speak(textToSpeak, language);
  };

  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`group relative p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none active:scale-[0.98] ${
        isSelected
          ? 'bg-teal-50/90 border-teal-600 shadow-md shadow-teal-700/10 ring-2 ring-teal-500/20'
          : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm'
      }`}
    >
      {/* Top row: Icon + audio button + selection check */}
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-teal-600 text-white'
              : category.isEmergencyWarning
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-800'
          }`}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Audio helper for this symptom */}
          <button
            type="button"
            onClick={handleSpeakCategory}
            className="p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
            title={isHindi ? 'यह लक्षण सुनकर समझें' : 'Listen to this symptom'}
            aria-label="Listen"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Selection indicator */}
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
            }`}
          >
            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </div>
      </div>

      {/* Middle: Titles */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-teal-900">
            {isHindi ? category.hindiName : category.name}
          </h3>
          <span className="text-xs font-medium text-slate-400">
            ({isHindi ? category.name : category.hindiName})
          </span>
        </div>

        <p className="text-xs md:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {isHindi ? category.descriptionHindi : category.description}
        </p>
      </div>

      {/* Bottom Emergency warning chip if applicable */}
      {category.isEmergencyWarning && (
        <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{isHindi ? 'तत्काल सावधानी' : 'Urgent check'}</span>
        </div>
      )}
    </div>
  );
};
