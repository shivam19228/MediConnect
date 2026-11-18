import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Shield,
  FileCheck,
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { useAuth } from '../../context/AuthContext';
import { caseService } from '../../services/caseService';
import { MedicalReportMetadata } from '../../types/case';
import { StepProgressBar } from '../../components/patient/StepProgressBar';
import { VoiceAssistantWidget } from '../../components/common/VoiceAssistantWidget';
import { voiceService } from '../../services/voiceService';

export const UploadReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { language, activeDraft, addUploadedReport, removeUploadedReport, syncDraftToBackend } = useCase();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isHindi = language === 'hi';
  const reports = activeDraft.uploadedReports || [];

  const handleFileProcess = async (files: FileList | null) => {
    setValidationError(null);
    if (!files || files.length === 0) return;

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const fileList = Array.from(files);

    for (const file of fileList) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        setValidationError(
          isHindi
            ? `अमान्य फ़ाइल प्रकार: "${file.name}"। कृपया केवल PDF, JPG, या PNG फ़ाइल चुनें।`
            : `Unsupported format: "${file.name}". Please upload PDF, JPG, or PNG files only.`
        );
        return;
      }

      // Check max size 15MB
      if (file.size > 15 * 1024 * 1024) {
        setValidationError(
          isHindi
            ? `फ़ाइल बहुत बड़ी है (${(file.size / (1024 * 1024)).toFixed(1)} MB)। अधिकतम सीमा 15 MB है।`
            : `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 15 MB.`
        );
        return;
      }
    }

    setIsUploading(true);
    try {
      const caseId = await syncDraftToBackend({ name: user?.name, phone: user?.phone });

      for (const file of fileList) {
        try {
          const uploaded = await caseService.uploadReportToBackend(caseId, file);
          addUploadedReport(uploaded, uploaded.previewUrl);
        } catch (err: any) {
          console.error('File upload failed', err);
          setValidationError(err.message || 'File upload failed. Please try again.');
        }
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to sync draft with server. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileProcess(e.dataTransfer.files);
  };

  const readPromptAloud = () => {
    const text = isHindi
      ? 'क्या आपके पास पुरानी मेडिकल रिपोर्ट है? आप उसे यहाँ अपलोड कर सकते हैं।'
      : 'Do you have any previous medical reports? You can upload them here.';
    voiceService.speak(text, language);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Progress Bar (Step 4) */}
      <StepProgressBar currentStep={4} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {isHindi ? 'पुरानी रिपोर्टें' : 'Previous Reports'}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            {isHindi
              ? 'क्या आपके पास पुरानी मेडिकल रिपोर्ट है?'
              : 'Do you have any previous medical reports?'}
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            {isHindi
              ? 'आप डॉक्टर के पर्चे, खून की जांच या एक्स-रे की फोटो यहाँ अपलोड कर सकते हैं।'
              : 'You can upload photos of old doctor prescriptions, blood tests, or scan results.'}
          </p>
        </div>

        <button
          onClick={readPromptAloud}
          className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-2xl transition-colors shrink-0"
          title="Read prompt aloud"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-3 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all mb-6 ${
          isDragging
            ? 'border-teal-600 bg-teal-50/80 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-teal-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
          onChange={(e) => handleFileProcess(e.target.files)}
          className="hidden"
        />

        <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg md:text-xl font-bold text-slate-900">
          {isUploading
            ? isHindi ? 'फ़ाइल सर्वर पर अपलोड हो रही है...' : 'Uploading securely to private storage...'
            : isHindi ? 'फ़ाइल चुनने के लिए यहाँ क्लिक करें या खींचकर लाएं' : 'Click to Browse or Drag & Drop Reports'}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 mt-1.5">
          {isHindi
            ? 'PDF, JPG, JPEG या PNG फ़ाइलें (अधिकतम 15 MB)'
            : 'Supported formats: PDF, JPG, JPEG, PNG (Up to 15 MB each)'}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 bg-teal-600 text-white font-bold text-xs md:text-sm px-6 py-2.5 rounded-2xl shadow-md shadow-teal-600/20">
          <UploadCloud className="w-4 h-4" />
          <span>
            {isUploading
              ? isHindi ? 'अपलोड हो रहा है...' : 'Uploading...'
              : isHindi ? 'फ़ाइल चुनें (Browse Files)' : 'Select Files from Device'}
          </span>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 flex items-center gap-2.5 mb-6">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-semibold">{validationError}</p>
        </div>
      )}

      {/* Private Medical Storage Notice */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-3xl text-xs text-slate-700 flex items-start gap-3 mb-6">
        <Shield className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Private Medical Storage:</strong> Uploaded reports are securely stored in your private medical reports storage bucket. Access is restricted to you and authorized doctors reviewing your case. No permanent public URLs are exposed.
        </p>
      </div>

      {/* Attached Files List */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <span>
              {isHindi ? 'संलग्न रिपोर्टें' : 'Selected Medical Reports'} ({reports.length})
            </span>
          </h3>
          {reports.length === 0 && (
            <span className="text-xs text-slate-400">
              {isHindi ? 'कोई रिपोर्ट संलग्न नहीं' : 'No reports attached yet'}
            </span>
          )}
        </div>

        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:border-teal-300 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-teal-700 shrink-0">
                    {rep.isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{rep.name}</p>
                    <p className="text-xs text-slate-400">
                      {(rep.size / (1024 * 1024)).toFixed(2)} MB • {rep.type} • {rep.uploadDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rep.isImage && rep.previewUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewImage(rep.previewUrl || null)}
                      className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                      title="Preview Image"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeUploadedReport(rep.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
            {isHindi
              ? 'यदि आपके पास कोई पुरानी रिपोर्ट नहीं है, तो आप बिना रिपोर्ट अपलोड किए भी आगे बढ़ सकते हैं।'
              : 'You do not need an old report to proceed. You can click Continue below without adding files.'}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedPreviewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Document Image Preview</h4>
              <button
                onClick={() => setSelectedPreviewImage(null)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold"
              >
                Close ✕
              </button>
            </div>
            <div className="my-3 max-h-[70vh] overflow-auto rounded-xl flex items-center justify-center bg-slate-100">
              <img src={selectedPreviewImage} alt="Medical Report Preview" className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 sticky bottom-4">
        <button
          onClick={() => navigate('/patient/medical-history')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHindi ? 'पीछे' : 'Back to History'}</span>
        </button>

        <button
          onClick={async () => {
            try {
              await syncDraftToBackend({ name: user?.name, phone: user?.phone });
            } catch (e) {
              console.warn('Draft sync notice', e);
            }
            navigate('/patient/review');
          }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm md:text-base px-7 py-3.5 rounded-2xl shadow-lg shadow-teal-600/25 transition-all"
        >
          <span>{isHindi ? 'समीक्षा करें (Review Answers)' : 'Continue to Review'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistantWidget
        currentScreenGuidance={
          isHindi
            ? 'अपनी पुरानी मेडिकल रिपोर्ट अपलोड करने के लिए ऊपर दिए गए बॉक्स पर क्लिक करें। न हो तो सीधे आगे बढ़ें।'
            : 'Select this button to upload previous medical reports. If you do not have any, tap Continue to Review.'
        }
      />
    </div>
  );
};
