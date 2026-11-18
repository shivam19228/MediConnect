import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Edit,
  Clock,
  Shield,
  Send,
  User,
  Stethoscope,
  Info,
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { useAuth } from '../../context/AuthContext';
import { StepProgressBar } from '../../components/patient/StepProgressBar';
import { reportService } from '../../services/reportService';
import { GeneratedCaseReport } from '../../types/case';
import { VoiceAssistantWidget } from '../../components/common/VoiceAssistantWidget';

export const GeneratedReportPage: React.FC = () => {
  const { activeDraft, language, submitActiveCase } = useCase();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isHindi = language === 'hi';

  // Simulated AI synthesis states
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(true);
  const synthesisStage = 3;
  const [report, setReport] = useState<GeneratedCaseReport | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    // Generate draft clinical intake summary directly from recorded patient answers
    const generated = reportService.generateReportFromCase({
      ...activeDraft,
      patientName: user?.name || activeDraft.patientName || 'Patient',
    });
    setReport(generated);
    setIsSynthesizing(false);
  }, [activeDraft, user]);

  const handleFinishAndSubmit = async () => {
    if (isSubmitting) return; // Prevent duplicate clicks
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const saved = await submitActiveCase({ name: user?.name, phone: user?.phone });
      setSubmittedCaseId(saved.id);
      setIsSubmitted(true);
      // Immediately navigate to the dedicated Token Confirmation Page
      navigate(`/patient/token/${saved.id}`);
    } catch (err: any) {
      console.error('Submission failed', err);
      setSubmissionError(
        err.message ||
        (isHindi
          ? 'केस जमा करने में समस्या आई। कृपया पुनः प्रयास करें।'
          : 'Failed to process case submission. Please try again.')
      );
      setIsSubmitting(false);
    }
  };


  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    if (!report) return;
    const content = `
MEDICONNECT CASE REPORT (CLINICAL INTAKE SUMMARY)
-------------------------------------------------
Generated: ${report.generatedAt}

1. PATIENT INFORMATION
Name: ${report.patientInfo.name}
ID: ${report.patientInfo.demoId}
Age: ${report.patientInfo.age || 45} | Gender: ${report.patientInfo.gender || 'Female'}

2. SELECTED INTAKE LANGUAGE
${report.selectedLanguage}

3. CHIEF COMPLAINT
${report.chiefComplaint}

4. HISTORY OF PRESENT ILLNESS (HPI)
${report.historyOfPresentIllness}

5. SYMPTOM DURATION & SEVERITY
${report.symptomDurationAndSeverity}

6. ASSOCIATED SYMPTOMS
${report.associatedSymptoms.map((s) => `• ${s}`).join('\n')}

7. RELEVANT MEDICAL HISTORY
${report.relevantMedicalHistory}

8. CURRENT MEDICINES
${report.currentMedicines}

9. KNOWN ALLERGIES
${report.knownAllergies}

10. PREVIOUS MEDICAL REPORTS
${report.previousMedicalReports.map((r) => `• ${r.name} (${r.type}, ${r.sizeFormatted}) - ${r.extractionNote}`).join('\n')}

11. PATIENT-REPORTED OBSERVATIONS
${report.patientReportedInformation.map((p) => `• ${p}`).join('\n')}

12. MISSING OR UNANSWERED ITEMS
${report.missingOrUnansweredInformation.map((m) => `• ${m}`).join('\n')}

13. ITEMS REQUIRING DOCTOR CLINICAL REVIEW
${report.itemsRequiringDoctorReview.map((d) => `• ${d}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MediConnect_Case_${report.patientInfo.demoId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Progress Bar (Step 6) */}
      <StepProgressBar currentStep={6} />

      {/* Simulated AI Loading Sequence */}
      {isSynthesizing ? (
        <div className="bg-white border-2 border-teal-200 rounded-3xl p-10 md:p-14 text-center shadow-xl max-w-xl mx-auto my-12 animate-fadeIn">
          <div className="w-20 h-20 bg-teal-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-teal-600/30 mb-6 animate-voice-pulse">
            <Sparkles className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isHindi ? 'आपकी केस रिपोर्ट तैयार की जा रही है...' : 'Synthesizing Your Clinical Case Report...'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {isHindi
              ? 'आपके दिए गए लक्षणों और उत्तरों को डॉक्टर के लिए संरचित किया जा रहा है'
              : 'Organizing your reported symptoms, severity, and timeline for physician review'}
          </p>

          {/* Synthesis Stages */}
          <div className="mt-8 space-y-3 max-w-md mx-auto text-left text-xs font-bold">
            <div
              className={`p-3 rounded-2xl flex items-center justify-between transition-colors ${
                synthesisStage >= 1 ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-400'
              }`}
            >
              <span>1. Analyzing reported primary symptoms & timeline</span>
              {synthesisStage >= 1 && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
            </div>

            <div
              className={`p-3 rounded-2xl flex items-center justify-between transition-colors ${
                synthesisStage >= 2 ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-400'
              }`}
            >
              <span>2. Correlating medical history & attached lab metadata</span>
              {synthesisStage >= 2 && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
            </div>

            <div
              className={`p-3 rounded-2xl flex items-center justify-between transition-colors ${
                synthesisStage >= 3 ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-400'
              }`}
            >
              <span>3. Structuring 13-section case summary for doctor</span>
              {synthesisStage >= 3 && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
            </div>
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Permanent Disclaimer Notice (Prompt Rule) */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed space-y-1">
              <p className="font-bold">
                {isHindi
                  ? 'प्रारंभिक नैदानिक सारांश — डॉक्टर द्वारा इन-पर्सन सत्यापन आवश्यक है।'
                  : 'Preliminary Clinical Intake Summary — Requires Clinician Verification'}
              </p>
              <p className="text-amber-800">
                {isHindi
                  ? 'यह सारांश आपके द्वारा दर्ज किए गए लक्षणों और अपलोड की गई मेडिकल रिपोर्टों के आधार पर तैयार किया गया है। यह पक्का निदान नहीं है।'
                  : 'This summary has been synthesized from your recorded symptoms, medical history, and uploaded diagnostic documents for physician review. It does not constitute a definitive medical diagnosis.'}
              </p>
            </div>
          </div>

          {/* Submission Success Toast Card */}
          {isSubmitted && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-6 shadow-lg shadow-emerald-700/10 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">
                    {isHindi ? 'केस सफलतापूर्वक डॉक्टर को भेजा गया!' : 'Case Successfully Submitted to Doctor Dashboard!'}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Case ID: <strong>{submittedCaseId}</strong>. You can switch to the Doctor role anytime to view and review this case.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Open Doctor Dashboard Now</span>
                </button>
                <button
                  onClick={() => navigate('/patient/dashboard')}
                  className="bg-white text-emerald-900 border border-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  Return to Patient Home
                </button>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/patient/review')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Answers</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleDownloadText}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Text</span>
              </button>
            </div>

            {submissionError && (
              <div className="w-full text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-bold">
                {submissionError}
              </div>
            )}

            {!isSubmitted ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinishAndSubmit}
                className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs md:text-sm px-6 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isHindi ? 'टोकन जारी हो रहा है...' : 'Generating Token...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isHindi ? 'केस जमा करें और टोकन प्राप्त करें' : 'Submit Case & Get Token'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/patient/token/${submittedCaseId}`)}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isHindi ? 'टोकन रसीद देखें' : 'View Token Receipt'}</span>
              </button>
            )}
          </div>


          {/* Formal Structured Case Report Document (13 Sections) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl space-y-8 print:border-none print:shadow-none">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    Clinical Case Report Draft
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
                    MediConnect Patient Intake Summary
                  </h1>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Case ID: <strong className="text-slate-900">{report.patientInfo.demoId}</strong></div>
                  <div>Date: {new Date(report.generatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Source Distinctions Legend */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-600">
              <span className="uppercase text-slate-400">Data Legend:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                ● Patient-Reported
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                ● AI Organizational Text
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                ● Unanswered / Pending Doctor Check
              </span>
            </div>

            {/* 13 Structured Sections */}
            <div className="space-y-6 text-sm">
              {/* 1. Patient Information */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Patient Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl font-medium text-slate-800">
                  <div><span className="text-xs text-slate-400 block">Name</span>{report.patientInfo.name}</div>
                  <div><span className="text-xs text-slate-400 block">Patient ID</span>{report.patientInfo.demoId}</div>
                  <div><span className="text-xs text-slate-400 block">Age</span>{report.patientInfo.age || 45} yrs</div>
                  <div><span className="text-xs text-slate-400 block">Gender</span>{report.patientInfo.gender || 'Female'}</div>
                </div>
              </div>

              {/* 2. Selected Language */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  2. Intake Communication Language
                </h3>
                <p className="font-bold text-slate-800">{report.selectedLanguage}</p>
              </div>

              {/* 3. Chief Complaint */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  3. Chief Complaint
                </h3>
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-slate-900 font-bold">
                  {report.chiefComplaint}
                </div>
              </div>

              {/* 4. History of Present Illness (HPI) */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    4. History of Present Illness (HPI)
                  </h3>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Simulated AI Organization
                  </span>
                </div>
                <p className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl text-slate-800 leading-relaxed font-normal">
                  {report.historyOfPresentIllness}
                </p>
              </div>

              {/* 5. Symptom Duration and Severity */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  5. Symptom Duration & Severity Index
                </h3>
                <p className="font-bold text-slate-800">{report.symptomDurationAndSeverity}</p>
              </div>

              {/* 6. Associated Symptoms */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  6. Associated Secondary Symptoms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.associatedSymptoms.map((sym, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 capitalize"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              {/* 7. Relevant Medical History */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  7. Relevant Medical & Surgical History
                </h3>
                <p className="font-medium text-slate-800">{report.relevantMedicalHistory}</p>
              </div>

              {/* 8. Current Medicines */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  8. Current Regular Medicines
                </h3>
                <p className="font-medium text-slate-800">{report.currentMedicines}</p>
              </div>

              {/* 9. Known Allergies */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  9. Known Drug & Environmental Allergies
                </h3>
                <p className="font-bold text-rose-900 bg-rose-50/60 p-2.5 rounded-xl border border-rose-200 inline-block">
                  {report.knownAllergies}
                </p>
              </div>

              {/* 10. Previous Medical Reports */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  10. Attached Previous Medical Reports (Metadata Only)
                </h3>
                {report.previousMedicalReports.length > 0 ? (
                  <div className="space-y-2">
                    {report.previousMedicalReports.map((rep, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{rep.name}</span>
                          <span className="text-slate-500 font-normal">{rep.sizeFormatted}</span>
                        </div>
                        <p className="text-slate-500 mt-1 italic">{rep.extractionNote}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No previous diagnostic reports uploaded.</p>
                )}
              </div>

              {/* 11. Patient-Reported Information */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  11. Direct Patient-Reported Observations
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
                  {report.patientReportedInformation.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 12. Missing or Unanswered Information */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                  12. Missing or Unanswered Information
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                  {report.missingOrUnansweredInformation.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 13. Items Requiring Doctor Review */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
                  13. Key Items Requiring Doctor Clinical Review
                </h3>
                <div className="space-y-2">
                  {report.itemsRequiringDoctorReview.map((item, idx) => (
                    <div key={idx} className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs font-bold text-teal-950 flex items-start gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Voice Assistant */}
      <VoiceAssistantWidget
        currentScreenGuidance={
          isHindi
            ? 'आपकी केस रिपोर्ट तैयार हो गई है। आप इसे देख सकते हैं, प्रिंट कर सकते हैं, या डॉक्टर को भेज सकते हैं।'
            : 'Your draft case report is ready. You can review it, print, or click Finish & Submit to Doctor.'
        }
      />
    </div>
  );
};
