import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Printer,
  Home,
  FileText,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
  ArrowRight,
  Info,
  Copy,
  Check,
  Share2,
  ChevronDown,
  ChevronUp,
  Eye,
  Activity,
} from 'lucide-react';
import { caseService } from '../../services/caseService';
import { tokenService } from '../../services/tokenService';
import { PatientCase } from '../../types/case';
import { TokenData } from '../../types/token';
import { useCase } from '../../context/CaseContext';

export const TokenConfirmationPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { language } = useCase();

  const [patientCase, setPatientCase] = useState<PatientCase | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSubmittedCase, setShowSubmittedCase] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isHindi = language === 'hi';

  useEffect(() => {
    let isMounted = true;
    if (caseId) {
      setLoading(true);
      setLoadError(null);
      caseService
        .getCaseById(caseId)
        .then((found) => {
          if (!isMounted) return;
          setPatientCase(found);
          if (found.tokenData) {
            setTokenData(found.tokenData);
          } else if (found.tokenNumber) {
            const submissionDate = found.createdAt ? new Date(found.createdAt) : new Date();
            const formatted = tokenService.formatSubmissionTimestamp(submissionDate, found.language);
            setTokenData({
              tokenNumber: found.tokenNumber,
              caseId: found.id,
              patientId: found.patientId || 'patient',
              patientName: found.patientName || 'Patient',
              submittedAt: found.createdAt,
              dayOfWeek: formatted.dayOfWeek,
              formattedDate: formatted.formattedDate,
              formattedTime: formatted.formattedTime,
              status: 'Submitted — Awaiting Doctor Review',
              uploadedReportCount: found.uploadedReports?.length || 0,
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error('Failed to fetch case token receipt from backend', err);
          setLoadError(err.message || 'Unable to load case receipt from server.');
          setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 min-h-[60vh]">
        <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isHindi ? 'केस रसीद लोड हो रही है...' : 'Retrieving official case token receipt...'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to MediConnect hospital server...</p>
      </div>
    );
  }

  if (loadError || !patientCase || !tokenData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 min-h-[60vh]">
        <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isHindi ? 'केस रसीद नहीं मिली' : 'Case receipt not found'}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          {loadError || 'The requested case token could not be loaded from the server.'}
        </p>
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="mt-5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-teal-700 transition-colors"
        >
          {isHindi ? 'मरीज़ डैशबोर्ड पर जाएं' : 'Return to Patient Dashboard'}
        </button>
      </div>
    );
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(tokenData.tokenNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    const textReceipt = tokenService.generateReceiptText(tokenData);
    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MediConnect_Token_${tokenData.tokenNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-slate-50/80 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Print-Only Style Definition to render solely the official receipt card */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-token-receipt, #printable-token-receipt * {
            visibility: visible;
          }
          #printable-token-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            box-shadow: none;
            border: 1px solid #cbd5e1;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Breadcrumb & Status Notification */}
      <div className="no-print text-center max-w-xl mx-auto mb-8 animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/15 mb-4 animate-bounce">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
          {isHindi ? 'केस सफलतापूर्वक दर्ज किया गया' : 'Intake Successfully Registered'}
        </span>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">
          {isHindi ? 'आपकी केस रिपोर्ट सफलतापूर्वक जमा हो गई है' : 'Your Case Submission Is Successful'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          {isHindi
            ? 'आपके द्वारा दी गई जानकारी और रिपोर्टें डॉक्टर की समीक्षा सूची में जोड़ दी गई हैं। कृपया नीचे दिए गए टोकन नंबर को सुरक्षित रखें।'
            : 'Your symptoms and medical reports have been structured and forwarded to the doctor clinical workspace. Please keep your intake token handy.'}
        </p>
      </div>

      {/* Professional Token Card (Printable Target) */}
      <div
        id="printable-token-receipt"
        className="bg-white border-2 border-teal-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-teal-950/5 relative overflow-hidden"
      >
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500" />

        {/* Card Header: Brand & Document Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-teal-600 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Medi<span className="text-teal-600">Connect</span>
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 uppercase">
                  Patient Intake Receipt
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                AI-Powered Multilingual Case-Taking System
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{tokenData.status}</span>
            </span>
          </div>
        </div>

        {/* Central Token Number Display Banner */}
        <div className="my-6 p-6 sm:p-8 bg-gradient-to-br from-teal-50/70 via-sky-50/40 to-slate-50 border-2 border-teal-300/80 rounded-3xl text-center relative">
          <span className="text-xs uppercase font-extrabold tracking-widest text-teal-700 block mb-1">
            {isHindi ? 'आधिकारिक टोकन संख्या' : 'Official Patient Intake Token'}
          </span>

          <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-wider text-slate-900 select-all py-1">
            {tokenData.tokenNumber}
          </div>

          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            {isHindi
              ? 'डॉक्टर से परामर्श के समय या अपनी रिपोर्ट की स्थिति जानने के लिए यह टोकन नंबर बताएं।'
              : 'Quote this token number when consulting with your doctor or referencing your case.'}
          </p>

          {/* Copy Token Button */}
          <div className="mt-3 no-print">
            <button
              onClick={handleCopyToken}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isHindi ? 'कॉपी हो गया!' : 'Copied!') : (isHindi ? 'टोकन कॉपी करें' : 'Copy Token')}</span>
            </button>
          </div>
        </div>

        {/* Structured Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs md:text-sm text-slate-700">
          {/* Day of Submission */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-xl shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">
                {isHindi ? 'जमा करने का दिन' : 'Submission Day'}
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5">{tokenData.dayOfWeek}</p>
            </div>
          </div>

          {/* Date of Submission */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-sky-100 text-sky-800 rounded-xl shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">
                {isHindi ? 'जमा करने की तारीख' : 'Submission Date'}
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5">{tokenData.formattedDate}</p>
            </div>
          </div>

          {/* Time of Submission */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">
                {isHindi ? 'जमा करने का समय' : 'Submission Time'}
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5">{tokenData.formattedTime}</p>
            </div>
          </div>

          {/* Patient Name */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">
                {isHindi ? 'रोगी का नाम' : 'Patient Name'}
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5">{tokenData.patientName}</p>
              <span className="text-[11px] text-slate-400">ID: {tokenData.patientId}</span>
            </div>
          </div>

          {/* Case Reference ID */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">
                {isHindi ? 'केस संदर्भ संख्या' : 'Case Reference ID'}
              </span>
              <p className="font-extrabold text-slate-900 font-mono mt-0.5">{tokenData.caseId}</p>
            </div>
          </div>

          {/* Uploaded Reports Count */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl shrink-0 mt-0.5">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">
                {isHindi ? 'संलग्न रिपोर्टें' : 'Uploaded Reports'}
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5">
                {tokenData.uploadedReportCount}{' '}
                {tokenData.uploadedReportCount === 1 ? 'Report' : 'Reports'}
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Non-Booking Reassurance Notice */}
        <div className="mt-6 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs text-slate-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900">
              {isHindi ? 'रोगी के लिए महत्वपूर्ण सूचना:' : 'Important Information for Patient:'}
            </p>
            <p className="leading-relaxed text-slate-600">
              {isHindi
                ? 'यह टोकन पुष्टि करता है कि आपके लक्षण डॉक्टर की समीक्षा के लिए सुरक्षित रूप से दर्ज कर लिए गए हैं। यह किसी अस्पताल का पक्का अपॉइंटमेंट नहीं है। यदि आपकी तबीयत अचानक बिगड़ती है, तो 112 डायल करें या तुरंत नजदीकी अस्पताल जाएं।'
                : 'This token confirms your symptom intake was successfully recorded for physician review. This is an intake confirmation token, not a confirmed hospital booking. If your symptoms worsen, call Emergency 112 or visit the nearest hospital.'}
            </p>
          </div>
        </div>

        {/* Verification watermark */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>MediConnect Verified Electronic Intake</span>
          </div>
          <div>Department: General Medicine & Triage</div>
        </div>
      </div>

      {/* Action Buttons Strip (Excluded from Print) */}
      <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-lg">
        {/* Left Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action 1: Download Token */}
          <button
            id="download-token-button"
            onClick={handleDownloadReceipt}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 transition-all shadow-xs"
            title="Download printable text receipt"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>{isHindi ? 'टोकन डाउनलोड करें' : 'Download Token'}</span>
          </button>

          {/* Action 2: Print Token */}
          <button
            id="print-token-button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 transition-all shadow-xs"
            title="Print official receipt or save as PDF"
          >
            <Printer className="w-4 h-4 text-teal-700" />
            <span>{isHindi ? 'टोकन प्रिंट करें' : 'Print Token'}</span>
          </button>
        </div>

        {/* Right Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action 4: View Submitted Case */}
          <button
            id="view-submitted-case-button"
            onClick={() => setShowSubmittedCase(!showSubmittedCase)}
            className="inline-flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-teal-200 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-teal-700" />
            <span>
              {showSubmittedCase
                ? (isHindi ? 'विवरण छुपाएं' : 'Hide Case Details')
                : (isHindi ? 'केस विवरण देखें' : 'View Submitted Case')}
            </span>
            {showSubmittedCase ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Action 3: Go to Patient Dashboard */}
          <button
            id="go-patient-dashboard-button"
            onClick={() => navigate('/patient/dashboard')}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md shadow-teal-600/20 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>{isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Patient Dashboard'}</span>
          </button>
        </div>
      </div>

      {/* Action 4 Expandable: Submitted Case Details View */}
      {showSubmittedCase && (
        <div className="no-print mt-6 bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md animate-fadeIn space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {isHindi ? 'दर्ज की गई केस जानकारी' : 'Submitted Case Intake Details'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isHindi ? 'डॉक्टर को भेजी गई प्राथमिक जानकारी' : 'Original symptom responses and clinical draft'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
              {patientCase.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Chief Complaint */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isHindi ? 'मुख्य समस्या' : 'Chief Complaint'}
              </span>
              <p className="font-bold text-slate-900">
                {patientCase.generatedReport?.chiefComplaint ||
                  (patientCase.primarySymptoms || []).join(', ') ||
                  'Symptom intake completed'}
              </p>
            </div>

            {/* Severity & Duration */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isHindi ? 'तीव्रता एवं अवधि' : 'Severity & Duration'}
              </span>
              <p className="font-bold text-slate-900">
                Severity: {patientCase.severity || 'Moderate'} • Duration: {patientCase.duration || 'Not specified'}
              </p>
            </div>

            {/* Medical History */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isHindi ? 'पूर्व चिकित्सा इतिहास' : 'Reported Medical History'}
              </span>
              <div className="text-xs text-slate-700 flex flex-wrap gap-2 mt-1">
                {(patientCase.medicalHistory?.conditions || []).length > 0 ? (
                  patientCase.medicalHistory.conditions.map((c) => (
                    <span key={c} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">No chronic pre-existing conditions reported</span>
                )}
              </div>
            </div>

            {/* Uploaded Reports Metadata */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isHindi ? 'अपलोड की गई मेडिकल फाइलें' : 'Uploaded Medical Records'}
              </span>
              {(patientCase.uploadedReports || []).length > 0 ? (
                <div className="space-y-2 mt-1">
                  {patientCase.uploadedReports.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-600" />
                        <span className="font-bold text-slate-800">{file.name}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Uploaded'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">No previous medical documents were attached.</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowSubmittedCase(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2"
            >
              {isHindi ? 'विवरण बंद करें' : 'Collapse Details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
