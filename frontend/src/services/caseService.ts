import {
  PatientCase,
  MedicalReportMetadata,
  DoctorReview,
  GeneratedCaseReport,
  LanguageCode,
  SeverityLevel,
} from '../types/case';
import { TokenData } from '../types/token';
import {
  apiClient,
  ApiCaseDetail,
  ApiDoctorCaseDetail,
  ApiDoctorCaseSummary,
  ApiMedicalReport,
  ApiGeneratedReport,
  ApiDoctorReview,
  ApiCaseSummary,
} from './apiClient';

const DRAFT_STORAGE_KEY = 'mediconnect_active_patient_draft';

// In-memory file cache for temporary image previews during session (NEVER stored in localStorage)
const inMemoryFilePreviews = new Map<string, string>();

/**
 * Mapping helpers between backend API DTOs and frontend domain types
 */
function mapApiAnswersToRecord(answers?: { questionId: string; answer: string }[]): Record<string, any> {
  if (!answers || answers.length === 0) return {};
  const record: Record<string, any> = {};
  answers.forEach((a) => {
    try {
      if (a.answer.startsWith('[') || a.answer.startsWith('{')) {
        record[a.questionId] = JSON.parse(a.answer);
      } else {
        record[a.questionId] = a.answer;
      }
    } catch {
      record[a.questionId] = a.answer;
    }
  });
  return record;
}

function mapRecordToApiAnswers(record: Record<string, any>): { questionId: string; questionText?: string; answer: string; audioUsed?: boolean }[] {
  return Object.entries(record).map(([questionId, val]) => {
    let answerStr = '';
    if (typeof val === 'object' && val !== null) {
      answerStr = JSON.stringify(val);
    } else {
      answerStr = String(val ?? '');
    }
    return {
      questionId,
      answer: answerStr,
      audioUsed: false,
    };
  });
}

function mapApiMedicalReport(rep: ApiMedicalReport): MedicalReportMetadata {
  return {
    id: rep.id,
    name: rep.name,
    size: rep.size,
    type: rep.type,
    uploadDate: rep.uploadDate || (rep.createdAt ? rep.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    previewUrl: inMemoryFilePreviews.get(rep.id),
    isImage: rep.isImage ?? rep.type.startsWith('image/'),
  };
}

function mapApiGeneratedReport(apiReport?: ApiGeneratedReport): GeneratedCaseReport | undefined {
  if (!apiReport) return undefined;

  const parseJsonArrayOrText = (raw?: string): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // not JSON array
    }
    return raw.split('\n').map((s) => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
  };

  return {
    patientInfo: {
      name: 'Clinical Patient Record',
      demoId: apiReport.id || 'N/A',
    },
    selectedLanguage: apiReport.selectedLanguage || 'en',
    chiefComplaint: apiReport.chiefComplaint || 'No chief complaint recorded',
    historyOfPresentIllness: apiReport.historyOfPresentIllness || 'N/A',
    symptomDurationAndSeverity: apiReport.symptomDurationAndSeverity || 'N/A',
    associatedSymptoms: parseJsonArrayOrText(apiReport.associatedSymptoms),
    relevantMedicalHistory: apiReport.relevantMedicalHistory || 'N/A',
    currentMedicines: apiReport.currentMedicines || 'N/A',
    knownAllergies: apiReport.knownAllergies || 'N/A',
    previousMedicalReports: [
      {
        name: 'Attached Reports',
        type: 'Medical Records',
        sizeFormatted: 'Verified',
        extractionNote: apiReport.previousMedicalReports || 'Analyzed by clinical pipeline',
      },
    ],
    patientReportedInformation: parseJsonArrayOrText(apiReport.patientReportedInformation),
    missingOrUnansweredInformation: parseJsonArrayOrText(apiReport.missingOrUnansweredInfo),
    itemsRequiringDoctorReview: parseJsonArrayOrText(apiReport.itemsRequiringDoctorReview),
    generatedAt: apiReport.generatedAt || new Date().toISOString(),
    isDemoGenerated: apiReport.isDemoGenerated ?? false,
  };
}

function mapApiDoctorReview(review?: ApiDoctorReview): DoctorReview | undefined {
  if (!review) return undefined;
  return {
    status: review.status || 'PENDING_REVIEW',
    doctorNotes: review.doctorNotes || '',
    followUpRequired: review.followUpRequired ?? false,
    clinicalRecommendations: review.clinicalRecommendations,
    reviewedBy: review.reviewedByDoctorName,
    reviewedAt: review.reviewedAt,
  };
}

export function mapApiCaseDetailToPatientCase(apiCase: ApiCaseDetail): PatientCase {
  const tokenData: TokenData | undefined = apiCase.token
    ? {
        tokenNumber: apiCase.token.tokenNumber,
        caseId: apiCase.id,
        patientId: apiCase.patientId || 'patient-unknown',
        patientName: apiCase.patientName || 'Patient',
        submittedAt: apiCase.token.submittedAt || apiCase.createdAt,
        dayOfWeek: apiCase.token.dayOfWeek || '',
        formattedDate: apiCase.token.formattedDate || '',
        formattedTime: apiCase.token.formattedTime || '',
        status: apiCase.token.status || apiCase.status,
        uploadedReportCount: apiCase.token.uploadedReportCount || 0,
        department: apiCase.token.department,
        locale: apiCase.token.locale,
      }
    : undefined;

  const rawConditions = apiCase.medicalHistory?.conditions || '';
  const parsedConditions = rawConditions
    ? rawConditions.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: apiCase.id,
    patientId: apiCase.patientId || '',
    patientName: apiCase.patientName || '',
    patientAge: apiCase.patientAge,
    patientGender: apiCase.patientGender,
    patientPhone: apiCase.patientPhone,
    tokenNumber: apiCase.token?.tokenNumber,
    tokenData,
    language: (apiCase.language as LanguageCode) || 'hi',
    primarySymptoms: apiCase.primarySymptoms || [],
    symptomAnswers: mapApiAnswersToRecord(apiCase.symptomAnswers),
    severity: apiCase.severity || 'Moderate',
    duration: apiCase.duration || '',
    medicalHistory: {
      conditions: parsedConditions,
      medications: apiCase.medicalHistory?.medications || '',
      allergies: apiCase.medicalHistory?.allergies || '',
      pastSurgeries: apiCase.medicalHistory?.pastSurgeries || '',
      familyHistory: apiCase.medicalHistory?.familyHistory || '',
      provided: apiCase.medicalHistory?.provided ?? false,
    },
    uploadedReports: [],
    createdAt: apiCase.createdAt,
    updatedAt: apiCase.updatedAt,
    isEmergencyFlagged: apiCase.isEmergencyFlagged ?? false,
  };
}

export function mapApiDoctorCaseDetailToPatientCase(docCase: ApiDoctorCaseDetail): PatientCase {
  const tokenData: TokenData | undefined = docCase.token
    ? {
        tokenNumber: docCase.token.tokenNumber,
        caseId: docCase.id,
        patientId: 'patient',
        patientName: 'Patient',
        submittedAt: docCase.token.submittedAt || docCase.createdAt,
        dayOfWeek: docCase.token.dayOfWeek || '',
        formattedDate: docCase.token.formattedDate || '',
        formattedTime: docCase.token.formattedTime || '',
        status: docCase.token.status || docCase.caseStatus,
        uploadedReportCount: docCase.token.uploadedReportCount || (docCase.uploadedReports?.length || 0),
        department: docCase.token.department,
        locale: docCase.token.locale,
      }
    : undefined;

  const rawConditions = docCase.medicalHistory?.conditions || '';
  const parsedConditions = rawConditions
    ? rawConditions.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: docCase.id,
    patientId: '',
    patientName: `Patient (${docCase.patientAge || '—'}y / ${docCase.patientGender || '—'})`,
    patientAge: docCase.patientAge,
    patientGender: docCase.patientGender,
    tokenNumber: docCase.token?.tokenNumber,
    tokenData,
    language: (docCase.language as LanguageCode) || 'hi',
    primarySymptoms: docCase.primarySymptoms || [],
    symptomAnswers: mapApiAnswersToRecord(docCase.symptomAnswers),
    severity: docCase.severity || 'Moderate',
    duration: docCase.duration || '',
    medicalHistory: {
      conditions: parsedConditions,
      medications: docCase.medicalHistory?.medications || '',
      allergies: docCase.medicalHistory?.allergies || '',
      pastSurgeries: docCase.medicalHistory?.pastSurgeries || '',
      familyHistory: docCase.medicalHistory?.familyHistory || '',
      provided: docCase.medicalHistory?.provided ?? false,
    },
    uploadedReports: (docCase.uploadedReports || []).map(mapApiMedicalReport),
    generatedReport: mapApiGeneratedReport(docCase.generatedReport),
    doctorReview: mapApiDoctorReview(docCase.review),
    createdAt: docCase.createdAt,
    updatedAt: docCase.updatedAt,
    isEmergencyFlagged: docCase.isEmergencyFlagged ?? false,
  };
}

class CaseService {
  /**
   * In-memory file preview registration
   */
  public registerInMemoryPreview(reportId: string, previewUrl: string): void {
    inMemoryFilePreviews.set(reportId, previewUrl);
  }

  public getInMemoryPreview(reportId: string): string | undefined {
    return inMemoryFilePreviews.get(reportId);
  }

  // ========================================================
  // Active Patient Draft Management
  // ========================================================

  public getActiveDraft(): Partial<PatientCase> {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<PatientCase>;
        if (draft.uploadedReports) {
          draft.uploadedReports = draft.uploadedReports.map((rep) => ({
            ...rep,
            previewUrl: inMemoryFilePreviews.get(rep.id) || rep.previewUrl,
          }));
        }
        return draft;
      }
    } catch (e) {
      console.warn('Failed to parse active draft', e);
    }

    return {
      language: 'hi',
      primarySymptoms: [],
      symptomAnswers: {},
      severity: 'Moderate',
      duration: '',
      medicalHistory: {
        conditions: [],
        medications: '',
        allergies: '',
        pastSurgeries: '',
        familyHistory: '',
        provided: false,
      },
      uploadedReports: [],
    };
  }

  public updateActiveDraft(partial: Partial<PatientCase>): Partial<PatientCase> {
    const current = this.getActiveDraft();
    const updated = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    try {
      const safeDraft = {
        ...updated,
        uploadedReports: (updated.uploadedReports || []).map((rep) => ({
          id: rep.id,
          name: rep.name,
          size: rep.size,
          type: rep.type,
          uploadDate: rep.uploadDate,
          isImage: rep.isImage,
          previewUrl: rep.previewUrl?.startsWith('blob:') ? undefined : rep.previewUrl,
        })),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(safeDraft));
    } catch (e) {
      console.error('Failed to save active draft', e);
    }
    return updated;
  }

  public clearActiveDraft(): void {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear draft', e);
    }
  }

  // ========================================================
  // Backend Integration Methods
  // ========================================================

  /**
   * Ensures a backend draft case exists in MySQL for the authenticated patient.
   * If draft.id is missing or invalid, creates a new draft on the backend.
   */
  public async ensureBackendDraft(
    draft: Partial<PatientCase>,
    userInfo?: { name?: string; phone?: string }
  ): Promise<string> {
    if (draft.id && !draft.id.startsWith('mock-')) {
      return draft.id;
    }

    const created = await apiClient.createCaseDraft({
      patientName: userInfo?.name || draft.patientName || 'Patient',
      patientAge: draft.patientAge || 45,
      patientGender: draft.patientGender || 'Other',
      patientPhone: userInfo?.phone || draft.patientPhone,
      language: draft.language || 'hi',
      primarySymptoms: draft.primarySymptoms || [],
      severity: draft.severity || 'Moderate',
      duration: draft.duration || 'few days',
      isEmergencyFlagged: draft.isEmergencyFlagged ?? false,
    });

    this.updateActiveDraft({ id: created.id });
    return created.id;
  }

  /**
   * Syncs questionnaire answers, medical history, and clinical parameters to the backend draft.
   */
  public async syncDraftToBackend(
    draft: Partial<PatientCase>,
    userInfo?: { name?: string; phone?: string }
  ): Promise<string> {
    const caseId = await this.ensureBackendDraft(draft, userInfo);

    // Update case basic metadata
    await apiClient.updateCaseDraft(caseId, {
      patientName: userInfo?.name || draft.patientName,
      patientAge: draft.patientAge,
      patientGender: draft.patientGender,
      patientPhone: userInfo?.phone || draft.patientPhone,
      language: draft.language,
      primarySymptoms: draft.primarySymptoms,
      severity: draft.severity,
      duration: draft.duration,
      isEmergencyFlagged: draft.isEmergencyFlagged,
    });

    // Save questionnaire answers if present
    if (draft.symptomAnswers && Object.keys(draft.symptomAnswers).length > 0) {
      const answersList = mapRecordToApiAnswers(draft.symptomAnswers);
      await apiClient.saveCaseAnswers(caseId, answersList);
    }

    // Save medical history if present
    if (draft.medicalHistory) {
      const condStr = Array.isArray(draft.medicalHistory.conditions)
        ? draft.medicalHistory.conditions.join(', ')
        : (draft.medicalHistory.conditions || '');

      await apiClient.updateMedicalHistory(caseId, {
        conditions: condStr,
        medications: draft.medicalHistory.medications,
        allergies: draft.medicalHistory.allergies,
        pastSurgeries: draft.medicalHistory.pastSurgeries,
        familyHistory: draft.medicalHistory.familyHistory,
        provided: draft.medicalHistory.provided,
      });
    }

    return caseId;
  }

  /**
   * Submits the active case to the backend, generating the official OPD token.
   */
  public async submitCaseToBackend(
    draft: Partial<PatientCase>,
    userInfo?: { name?: string; phone?: string }
  ): Promise<PatientCase> {
    const caseId = await this.syncDraftToBackend(draft, userInfo);
    const submitResult = await apiClient.submitCase(caseId);

    // Fetch complete submitted case from backend
    const fullCaseDetail = await apiClient.getCaseById(caseId);
    const mapped = mapApiCaseDetailToPatientCase(fullCaseDetail);

    // Attach verified submitted token
    if (submitResult.token) {
      mapped.tokenNumber = submitResult.token.tokenNumber;
      mapped.tokenData = {
        tokenNumber: submitResult.token.tokenNumber,
        caseId: submitResult.caseId,
        patientId: mapped.patientId,
        patientName: mapped.patientName,
        submittedAt: submitResult.token.submittedAt || new Date().toISOString(),
        dayOfWeek: submitResult.token.dayOfWeek || '',
        formattedDate: submitResult.token.formattedDate || '',
        formattedTime: submitResult.token.formattedTime || '',
        status: submitResult.token.status || 'SUBMITTED',
        uploadedReportCount: submitResult.token.uploadedReportCount || 0,
        department: submitResult.token.department,
        locale: submitResult.token.locale,
      };
    }

    this.clearActiveDraft();
    return mapped;
  }

  /**
   * Uploads a document to secure local storage via the backend.
   */
  public async uploadReportToBackend(caseId: string, file: File): Promise<MedicalReportMetadata> {
    const apiReport = await apiClient.uploadPatientReport(caseId, file);
    const mapped = mapApiMedicalReport(apiReport);

    if (file.type.startsWith('image/')) {
      const blobUrl = URL.createObjectURL(file);
      this.registerInMemoryPreview(mapped.id, blobUrl);
      mapped.previewUrl = blobUrl;
    }

    return mapped;
  }

  /**
   * Deletes a report from the backend and private Storage bucket.
   */
  public async deleteReportFromBackend(caseId: string, reportId: string): Promise<void> {
    await apiClient.deletePatientReport(caseId, reportId);
  }

  /**
   * Fetches all cases belonging to the authenticated patient.
   */
  public async getMyCases(): Promise<ApiCaseSummary[]> {
    return apiClient.getMyCases();
  }

  /**
   * Fetches single case by ID with full details and reports.
   */
  public async getCaseById(caseId: string): Promise<PatientCase> {
    const detail = await apiClient.getCaseById(caseId);
    const mapped = mapApiCaseDetailToPatientCase(detail);

    // Fetch reports
    try {
      const reports = await apiClient.getPatientReports(caseId);
      mapped.uploadedReports = reports.map(mapApiMedicalReport);
    } catch {
      // reports optional
    }

    return mapped;
  }

  // ========================================================
  // Doctor & Admin Workflow Methods
  // ========================================================

  public async getDoctorCases(
    params: {
      page?: number;
      size?: number;
      status?: string;
      urgentOnly?: boolean;
      search?: string;
    } = {},
    isAdmin: boolean = false
  ): Promise<{ cases: ApiDoctorCaseSummary[]; total: number }> {
    const res = await apiClient.getCases(params, isAdmin);
    return {
      cases: res.content || [],
      total: res.totalElements || 0,
    };
  }

  public async getDoctorCaseDetail(caseId: string, isAdmin: boolean = false): Promise<PatientCase> {
    const detail = await apiClient.getDoctorCaseDetail(caseId, isAdmin);
    return mapApiDoctorCaseDetailToPatientCase(detail);
  }

  public async submitDoctorReview(
    caseId: string,
    review: Partial<DoctorReview>,
    isAdmin: boolean = false,
    isUpdate: boolean = false
  ): Promise<DoctorReview> {
    const res = await apiClient.submitDoctorReview(
      caseId,
      {
        status: review.status || 'REVIEWED',
        doctorNotes: review.doctorNotes || '',
        clinicalRecommendations: review.clinicalRecommendations || '',
        followUpRequired: review.followUpRequired ?? false,
      },
      isAdmin,
      isUpdate
    );
    return mapApiDoctorReview(res) || {
      status: review.status || 'REVIEWED',
      doctorNotes: review.doctorNotes || '',
      followUpRequired: review.followUpRequired ?? false,
    };
  }

  public async generateAiReport(caseId: string, isAdmin: boolean = false): Promise<GeneratedCaseReport> {
    const res = await apiClient.generateCaseReport(caseId, isAdmin);
    const mapped = mapApiGeneratedReport(res);
    if (!mapped) throw new Error('Failed to parse generated clinical report.');
    return mapped;
  }

  public async generatePatientAiReport(caseId: string): Promise<GeneratedCaseReport> {
    const res = await apiClient.generatePatientCaseReport(caseId);
    const mapped = mapApiGeneratedReport(res);
    if (!mapped) throw new Error('Failed to parse generated clinical report.');
    return mapped;
  }

  public async getPatientAiReport(caseId: string): Promise<GeneratedCaseReport | undefined> {
    try {
      const res = await apiClient.getPatientCaseReport(caseId);
      return mapApiGeneratedReport(res);
    } catch {
      return undefined;
    }
  }

  public async getDoctorReportSignedUrl(caseId: string, reportId: string): Promise<string> {
    const res = await apiClient.getDoctorReportSignedUrl(caseId, reportId);
    return res.signedUrl;
  }

  public async downloadDoctorReportBlob(caseId: string, reportId: string): Promise<Blob> {
    return apiClient.downloadDoctorReport(caseId, reportId);
  }

  public async deleteReportAdmin(caseId: string, reportId: string): Promise<void> {
    await apiClient.deleteDoctorReportAdmin(caseId, reportId);
  }
}

export const caseService = new CaseService();
