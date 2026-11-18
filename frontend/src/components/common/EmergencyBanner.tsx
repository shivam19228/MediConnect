import React from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X } from 'lucide-react';
import { useCase } from '../../context/CaseContext';

interface EmergencyBannerProps {
  onDismiss?: () => void;
  isDismissible?: boolean;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ onDismiss, isDismissible = true }) => {
  const { language } = useCase();
  const isHindi = language === 'hi';

  return (
    <div
      role="alert"
      className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 md:p-5 shadow-lg shadow-red-100 my-4 text-slate-900 transition-all animate-fadeIn"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 bg-red-600 text-white rounded-xl shrink-0 mt-0.5">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {isHindi ? 'आपातकालीन चेतावनी' : 'Emergency Alert'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isHindi ? 'तत्काल चिकित्सा सहायता' : 'Immediate Medical Attention'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-red-950 mt-1">
            {isHindi
              ? 'क्या आपको सीने में तेज दर्द, सांस लेने में गंभीर तकलीफ, या अचानक कमजोरी है?'
              : 'Experiencing severe chest pain, extreme breathlessness, or sudden weakness?'}
          </h3>

          <p className="text-sm text-slate-700 mt-1 leading-relaxed">
            {isHindi
              ? 'मेडीकनेक्ट एक सामान्य केस-टेकिंग फॉर्म है और आपातकालीन सेवा नहीं है। यदि आपकी स्थिति गंभीर है, तो इस प्रश्नावली को पूरा करने का इंतजार न करें। तुरंत निकटतम अस्पताल जाएं।'
              : 'MediConnect is an information-collection tool and is NOT an emergency service. If your symptoms are severe or sudden, do not wait for this questionnaire or AI summary. Seek urgent in-person emergency hospital care.'}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isHindi ? 'राष्ट्रीय आपातकालीन 112 डायल करें' : 'Call National Emergency 112'}</span>
            </a>
            <span className="text-xs text-slate-500">
              {isHindi
                ? '(भारत में आपातकालीन नंबर 112 या स्थानीय एम्बुलेंस 108)'
                : '(Emergency 112 or local ambulance 108 in India)'}
            </span>
          </div>
        </div>

        {isDismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-red-100 rounded-lg transition-colors"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
