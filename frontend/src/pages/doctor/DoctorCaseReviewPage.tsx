import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  FileText,
  UploadCloud,
  AlertTriangle,
  Save,
  Eye,
  Shield,
  Stethoscope,
  Sparkles,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { caseService } from '../../services/caseService';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { PatientCase, ReviewStatus, MedicalReportMetadata } from '../../types/case';
import { CaseStatusBadge } from '../../components/doctor/CaseStatusBadge';
import { SYMPTOM_CATEGORIES } from '../../data/symptomQuestions';
import { SUPPORTED_LANGUAGES } from '../../data/translations';

export const DoctorCaseReviewPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [patientCase, setPatientCase] = useState<PatientCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ANSWERS' | 'REPORTS' | 'AI_REPORT'>('AI_REPORT');

  // Doctor Review Panel State
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('REVIEWED');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<string>('');
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [savedSuccessToast, setSavedSuccessToast] = useState<boolean>(false);

  // AI Generation State
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Document Preview / Modal State
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  const loadCaseData = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await caseService.getDoctorCaseDetail(caseId, isAdmin);
      setPatientCase(data);
      if (data.doctorReview) {
        setReviewStatus(data.doctorReview.status || 'REVIEWED');
        setDoctorNotes(data.doctorReview.doctorNotes || '');
        setFollowUpRequired(data.doctorReview.followUpRequired || false);
        setRecommendations(data.doctorReview.clinicalRecommendations || '');
      }
    } catch (err: any) {
      console.error('Failed to load case detail', err);
      setLoadError(err.message || 'Failed to retrieve case details from the backend.');
    } finally {
      setIsLoading(false);
    }
  }, [caseId, isAdmin]);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  const handleSaveReview = async () => {
    if (!patientCase) return;
    setIsSavingReview(true);
    setReviewError(null);
    try {
      const isUpdate = Boolean(patientCase.doctorReview && patientCase.doctorReview.status);
      const updatedReview = await caseService.submitDoctorReview(
        patientCase.id,
        {
          status: reviewStatus,
          doctorNotes,
          followUpRequired,
          clinicalRecommendations: recommendations,
        },
        isAdmin,
        isUpdate
      );

      setPatientCase((prev) => (prev ? { ...prev, doctorReview: updatedReview } : null));
      setSavedSuccessToast(true);
      setTimeout(() => setSavedSuccessToast(false), 4000);
    } catch (err: any) {
      console.error('Failed to submit doctor review', err);
      setReviewError(err.message || 'Failed to save clinical review. Please try again.');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleGenerateAiReport = async () => {
    if (!patientCase) return;
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const report = await caseService.generateAiReport(patientCase.id, isAdmin);
      setPatientCase((prev) => (prev ? { ...prev, generatedReport: report } : null));
      setActiveTab('AI_REPORT');
    } catch (err: any) {
      console.error('Failed to generate AI report', err);
      setAiError(
        err.message ||
          'Failed to generate AI clinical summary. Ensure the Gemini API key is configured on the backend.'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleViewReport = async (rep: MedicalReportMetadata) => {
    if (!patientCase) return;
    setLoadingDocId(rep.id);
    try {
      const signedUrl = await caseService.getDoctorReportSignedUrl(patientCase.id, rep.id);
      if (rep.isImage) {
        setSelectedImageModal(signedUrl);
      } else {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      console.error('Failed to fetch document signed URL', err);
      alert(`Unable to open document: ${err.message || 'Storage error'}`);
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleDownloadReport = async (rep: MedicalReportMetadata) => {
    if (!patientCase) return;
    setLoadingDocId(rep.id);
    try {
      const blob = await apiClient.downloadDoctorReport(patientCase.id, rep.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = rep.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to download document', err);
      alert(`Unable to download document: ${err.message || 'Download error'}`);
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleDeleteReport = async (rep: MedicalReportMetadata) => {
    if (!patientCase) return;
    if (!window.confirm(`Permanently delete document "${rep.name}" from secure document storage?`)) {
      return;
    }
    setLoadingDocId(rep.id);
    try {
      await caseService.deleteReportAdmin(patientCase.id, rep.id);
      await loadCaseData();
    } catch (err: any) {
      console.error('Failed to delete document', err);
      alert(`Failed to delete document: ${err.message || 'Delete error'}`);
    } finally {
      setLoadingDocId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Loading Case from MediConnect Backend...</h2>
        <p className="text-xs text-slate-500 mt-1">Retrieving intake parameters, medical history, and clinical reports.</p>
      </div>
    );
  }

  if (loadError || !patientCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Unable to load case record</h2>
        <p className="text-xs text-slate-500 max-w-md text-center mt-2">
          {loadError || 'The requested case record does not exist or you do not have permission to view it.'}
        </p>
        <button
          onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/doctor/dashboard')}
          className="mt-6 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
        >
          Return to {isAdmin ? 'Admin Console' : 'Doctor Dashboard'}
        </button>
      </div>
    );
  }

  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === patientCase.language);
  const primarySymptomNames = (patientCase.primarySymptoms || []).map((id) => {
    const found = SYMPTOM_CATEGORIES.find((c) => c.id === id);
    return found ? found.name : id;
  });

  return (
    <div className="flex-1 bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/doctor/dashboard')}
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl shadow-sm transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {isAdmin ? 'Admin Case Inspection' : 'Doctor Clinical Review'}
              </span>
              <CaseStatusBadge status={patientCase.doctorReview?.status || 'PENDING_REVIEW'} />
              {patientCase.tokenNumber && (
                <span className="font-mono text-xs font-black text-teal-900 bg-teal-100/90 px-3 py-0.5 rounded-full border border-teal-300 shadow-2xs">
                  Token: {patientCase.tokenNumber}
                </span>
              )}
              {patientCase.isEmergencyFlagged && (
                <span className="text-[11px] font-black uppercase text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
                  Urgent / Red-Flag
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {patientCase.patientName} — Case #{patientCase.id}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCaseData}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Reload case from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-500">
            Intake: {new Date(patientCase.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Review Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: 3 Tabs (AI Case Report, Patient Answers, Medical Reports) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tab Navigation Strip */}
          <div className="bg-white border border-slate-200 rounded-3xl p-1.5 shadow-sm grid grid-cols-3 gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('AI_REPORT')}
              className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'AI_REPORT'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tab 1: AI Clinical Report</span>
            </button>

            <button
              onClick={() => setActiveTab('ANSWERS')}
              className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'ANSWERS'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Tab 2: Patient Intake</span>
            </button>

            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'REPORTS'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                Tab 3: Attached Reports ({patientCase.uploadedReports?.length || 0})
              </span>
            </button>
          </div>

          {/* TAB 1: AI CLINICAL REPORT */}
          {activeTab === 'AI_REPORT' && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              {patientCase.generatedReport ? (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-teal-950">Official Token:</span>
                      <span className="font-mono font-black text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded">
                        {patientCase.tokenNumber || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Generated:</span>
                      <span className="text-slate-700">
                        {new Date(patientCase.generatedReport.generatedAt).toLocaleString()}
                      </span>
                      <button
                        onClick={handleGenerateAiReport}
                        disabled={isGeneratingAi}
                        className="ml-2 px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Regenerate clinical intake summary"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {/* Medical Disclaimer */}
                  <div className="p-4 bg-teal-50 border-2 border-teal-300 rounded-2xl text-xs text-slate-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <strong className="block text-slate-900 font-bold">
                          AI Clinical Intake Summary — For Decision Support Only
                        </strong>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        Synthesized using Google Gemini based on patient questionnaire responses, symptom descriptions, and verified medical document contents. Clinician verification and independent medical assessment are required before making clinical decisions.
                      </p>
                    </div>
                  </div>

                  {aiError && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 font-medium">
                      <strong>AI Generation Notice:</strong> {aiError}
                    </div>
                  )}

                  {/* Chief Complaint */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Chief Complaint
                    </h4>
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl font-bold text-slate-900 text-base">
                      {patientCase.generatedReport.chiefComplaint}
                    </div>
                  </div>

                  {/* HPI Narrative */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        History of Present Illness (HPI)
                      </h4>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Clinical Synthesis
                      </span>
                    </div>
                    <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl text-slate-800 leading-relaxed text-sm whitespace-pre-line">
                      {patientCase.generatedReport.historyOfPresentIllness}
                    </div>
                  </div>

                  {/* Duration, Severity, Associated */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-slate-400 font-bold block uppercase mb-1">Timeline & Severity:</span>
                      <p className="text-slate-900 font-bold text-sm">
                        {patientCase.generatedReport.symptomDurationAndSeverity}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-slate-400 font-bold block uppercase mb-1">Associated Symptoms:</span>
                      <p className="text-slate-900 font-bold text-sm capitalize">
                        {patientCase.generatedReport.associatedSymptoms?.length
                          ? patientCase.generatedReport.associatedSymptoms.join(', ')
                          : 'None reported'}
                      </p>
                    </div>
                  </div>

                  {/* Medical History & Current Medicines */}
                  {(patientCase.generatedReport.relevantMedicalHistory ||
                    patientCase.generatedReport.currentMedicines) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {patientCase.generatedReport.relevantMedicalHistory && (
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <span className="text-slate-400 font-bold block uppercase mb-1">Relevant Medical History:</span>
                          <p className="text-slate-800">{patientCase.generatedReport.relevantMedicalHistory}</p>
                        </div>
                      )}
                      {patientCase.generatedReport.currentMedicines && (
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <span className="text-slate-400 font-bold block uppercase mb-1">Current Medicines:</span>
                          <p className="text-slate-800">{patientCase.generatedReport.currentMedicines}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted Document Analysis & Laboratory Findings */}
                  {patientCase.generatedReport.previousMedicalReports && (
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span>Extracted Document Analysis & Diagnostic Findings</span>
                        </h4>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                          Gemini Document Parser
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium bg-white p-3 rounded-xl border border-slate-200">
                        {Array.isArray(patientCase.generatedReport.previousMedicalReports)
                          ? patientCase.generatedReport.previousMedicalReports.map((r: any) => r.extractionNote || r.name).join('\n')
                          : String(patientCase.generatedReport.previousMedicalReports)}
                      </div>
                    </div>
                  )}

                  {/* Missing, Unanswered, or Unreadable Information */}
                  {patientCase.generatedReport.missingOrUnansweredInformation && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Clinical Gaps & Unreadable Document Sections</span>
                      </h4>
                      <div className="text-xs text-amber-950 whitespace-pre-line leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200">
                        {Array.isArray(patientCase.generatedReport.missingOrUnansweredInformation)
                          ? patientCase.generatedReport.missingOrUnansweredInformation.join('\n• ')
                          : String(patientCase.generatedReport.missingOrUnansweredInformation)}
                      </div>
                    </div>
                  )}

                  {/* Items Requiring Doctor Review */}
                  {patientCase.generatedReport.itemsRequiringDoctorReview &&
                    patientCase.generatedReport.itemsRequiringDoctorReview.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
                          Items Requiring Clinician Review
                        </h4>
                        <div className="space-y-2">
                          {patientCase.generatedReport.itemsRequiringDoctorReview.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-xs font-bold text-teal-950 flex items-start gap-2"
                            >
                              <Stethoscope className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              ) : (
                /* Empty state when no report has been generated yet */
                <div className="py-12 px-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl mx-auto flex items-center justify-center">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      No AI Clinical Summary Generated Yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      In accordance with clinical protocol, AI clinical intake summaries are generated on-demand only upon explicit action by an authorized clinician or administrator.
                    </p>
                  </div>

                  {aiError && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 max-w-md mx-auto font-medium">
                      {aiError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleGenerateAiReport}
                      disabled={isGeneratingAi}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/25 text-xs md:text-sm inline-flex items-center gap-2 transition-all"
                    >
                      {isGeneratingAi ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing Documents & Generating Clinical Summary...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{aiError ? 'Retry AI Clinical Summary Generation' : 'Generate AI Clinical Intake Summary'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PATIENT INTAKE (Questionnaire & Medical History) */}
          {activeTab === 'ANSWERS' && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  <span>Patient Intake & Questionnaire Responses</span>
                </h3>
                <span className="text-xs text-slate-400">Direct Intake Data</span>
              </div>

              {/* Patient Basic Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Intake Token</span>
                  <span className="font-mono font-bold text-teal-800">{patientCase.tokenNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Language</span>
                  <span className="font-medium text-slate-800">{langObj?.nativeName || patientCase.language}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Age / Gender</span>
                  <span className="font-medium text-slate-800">
                    {patientCase.patientAge || '—'}y / {patientCase.patientGender || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Contact</span>
                  <span className="font-medium text-slate-800">{patientCase.patientPhone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Duration</span>
                  <span className="font-medium text-slate-800">{patientCase.duration || '—'}</span>
                </div>
              </div>

              {/* Primary symptoms */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Reported Chief Symptoms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {primarySymptomNames.length > 0 ? (
                    primarySymptomNames.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-900 font-bold rounded-xl text-xs"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None specified</span>
                  )}
                </div>
              </div>

              {/* Raw Question-Answer Map */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Symptom-Specific Questionnaire Responses
                </h4>
                {Object.keys(patientCase.symptomAnswers || {}).length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
                    {Object.entries(patientCase.symptomAnswers || {}).map(([key, val]) => (
                      <div key={key} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-semibold text-slate-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                          {Array.isArray(val) ? val.join(', ') : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-400 text-center">
                    No symptom-specific questionnaire answers recorded.
                  </div>
                )}
              </div>

              {/* Medical History Section */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Medical History & Medications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Existing Conditions:</span>
                    <p className="text-slate-800">
                      {patientCase.medicalHistory?.conditions?.length
                        ? patientCase.medicalHistory.conditions.join(', ')
                        : 'None reported'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Daily Medications:</span>
                    <p className="text-slate-800">
                      {patientCase.medicalHistory?.medications || 'None reported'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Known Allergies:</span>
                    <p className="text-rose-900 font-bold">
                      {patientCase.medicalHistory?.allergies || 'None reported'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Past Surgeries / History:</span>
                    <p className="text-slate-800">
                      {patientCase.medicalHistory?.pastSurgeries || 'None specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTACHED MEDICAL REPORTS */}
          {activeTab === 'REPORTS' && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-teal-600" />
                  <span>Uploaded Diagnostic Documents</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {patientCase.uploadedReports?.length || 0} Attached
                </span>
              </div>

              {/* Storage Infrastructure Banner */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs text-teal-950 flex items-start gap-3">
                <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Secure Document Storage:</strong> Documents are stored securely in MediConnect's local medical document storage. Access is governed via authenticated signed endpoints and role-based access control.
                </p>
              </div>

              {patientCase.uploadedReports && patientCase.uploadedReports.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patientCase.uploadedReports.map((rep) => {
                    const isBusy = loadingDocId === rep.id;
                    return (
                      <div
                        key={rep.id}
                        className="border-2 border-slate-200 hover:border-teal-400 rounded-2xl p-4 transition-all bg-white flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate" title={rep.name}>
                              {rep.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {(rep.size / (1024 * 1024)).toFixed(2)} MB • {rep.type}
                            </p>
                            <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                              Uploaded: {new Date(rep.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Document Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleViewReport(rep)}
                            disabled={isBusy}
                            className="flex-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleDownloadReport(rep)}
                            disabled={isBusy}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteReport(rep)}
                              disabled={isBusy}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                              title="Delete document (Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No medical reports were uploaded for this patient intake.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Doctor Review & Clinical Notes Panel */}
        <div className="lg:col-span-4 bg-white border-2 border-teal-600 rounded-3xl p-6 shadow-xl sticky top-24 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-teal-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-black text-slate-900">
                {isAdmin ? 'Administrative Review' : 'Physician Review Panel'}
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              Clinical Action
            </span>
          </div>

          {savedSuccessToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-400 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Clinical review saved to backend successfully!</span>
            </div>
          )}

          {reviewError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 font-medium">
              {reviewError}
            </div>
          )}

          {/* Review Status Radio Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Clinical Review Status
            </label>
            <div className="space-y-2 text-xs font-bold">
              {[
                { status: 'REVIEWED', label: 'Mark as Reviewed', desc: 'Case evaluated and documented' },
                { status: 'REQUIRES_FOLLOWUP', label: 'Follow-up Required', desc: 'Needs patient callback / investigation' },
                { status: 'URGENT', label: 'Urgent Referral', desc: 'Immediate physical clinic visit required' },
              ].map((item) => (
                <label
                  key={item.status}
                  className={`flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    reviewStatus === item.status
                      ? 'bg-teal-50 border-teal-600 text-teal-950 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewStatus"
                    value={item.status}
                    checked={reviewStatus === item.status}
                    onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Doctor Clinical Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Doctor's Clinical Notes
            </label>
            <textarea
              rows={4}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Record clinical observations, examination notes, differential diagnosis..."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs md:text-sm text-slate-900 font-medium focus:bg-white focus:border-teal-500"
            />
          </div>

          {/* Recommendations / Rx */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Clinical Advice / Prescription Notes
            </label>
            <textarea
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="e.g. Paracetamol 650mg SOS, blood complete count, follow up in 3 days..."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs md:text-sm text-slate-900 font-medium focus:bg-white focus:border-teal-500"
            />
          </div>

          {/* Follow-up Required Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="followUpCheck"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="followUpCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
              Schedule Teleconsult / Physical Follow-up
            </label>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveReview}
            disabled={isSavingReview}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-teal-600/25 text-xs md:text-sm transition-all"
          >
            {isSavingReview ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Review to Backend...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{patientCase.doctorReview?.status ? 'Update Clinical Review' : 'Submit Clinical Review'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expand Image Modal */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Diagnostic Image Review</h4>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold"
              >
                Close ✕
              </button>
            </div>
            <div className="my-3 max-h-[75vh] overflow-auto rounded-xl flex items-center justify-center bg-slate-100">
              <img src={selectedImageModal} alt="Enlarged Report" className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
