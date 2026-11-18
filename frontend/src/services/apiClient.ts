/**
 * MediConnect Centralized API Client
 * Connects frontend with Spring Boot backend (default: http://localhost:8081/api/v1)
 */

import { UserRole } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';
const TOKEN_KEY = 'mediconnect_auth_token';

// ========================================================
// API Types & DTOs
// ========================================================

export interface ApiUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  specialty?: string;
}

export interface ApiAuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: ApiUserSummary;
}

export interface ApiUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  specialty?: string;
  patientProfile?: {
    age?: number;
    gender?: string;
    bloodGroup?: string;
    preferredLanguage?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    address?: string;
  };
  createdAt?: string;
}

export interface ApiCaseAnswer {
  questionId: string;
  questionText?: string;
  answer: string;
  audioUsed?: boolean;
}

export interface ApiMedicalHistory {
  conditions?: string;
  medications?: string;
  allergies?: string;
  pastSurgeries?: string;
  familyHistory?: string;
  provided?: boolean;
}

export interface ApiIntakeToken {
  tokenNumber: string;
  submittedAt?: string;
  dayOfWeek?: string;
  formattedDate?: string;
  formattedTime?: string;
  status?: string;
  department?: string;
  locale?: string;
  uploadedReportCount?: number;
}

export interface ApiCaseDetail {
  id: string;
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  language?: string;
  primarySymptoms: string[];
  severity?: 'Mild' | 'Moderate' | 'Severe';
  duration?: string;
  isEmergencyFlagged?: boolean;
  symptomAnswers?: ApiCaseAnswer[];
  medicalHistory?: ApiMedicalHistory;
  token?: ApiIntakeToken;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCaseSummary {
  id: string;
  patientName: string;
  status: string;
  language: string;
  severity: string;
  duration: string;
  isEmergencyFlagged: boolean;
  primarySymptoms: string[];
  tokenNumber?: string;
  answerCount: number;
  hasMedicalHistory: boolean;
  uploadedReportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSubmitCaseResponse {
  caseId: string;
  status: string;
  token: ApiIntakeToken;
  message: string;
}

export interface ApiMedicalReport {
  id: string;
  caseId?: string;
  name: string;
  size: number;
  type: string;
  storageReference?: string;
  uploadDate?: string;
  isImage?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiSignedUrlResponse {
  reportId: string;
  fileName: string;
  signedUrl: string;
  expiresInSeconds: number;
}

export interface ApiDoctorCaseSummary {
  id: string;
  tokenNumber?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  language?: string;
  severity?: string;
  duration?: string;
  isEmergencyFlagged?: boolean;
  primarySymptoms: string[];
  caseStatus?: string;
  reviewStatus?: 'PENDING_REVIEW' | 'REVIEWED' | 'REQUIRES_FOLLOWUP' | 'URGENT';
  hasAiReport?: boolean;
  uploadedReportCount?: number;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedByDoctorId?: string;
  reviewedByDoctorName?: string;
}

export interface ApiDoctorSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  specialty?: string;
}

export interface ApiDoctorReview {
  id?: string;
  caseId?: string;
  status: 'PENDING_REVIEW' | 'REVIEWED' | 'REQUIRES_FOLLOWUP' | 'URGENT';
  doctorNotes?: string;
  clinicalRecommendations?: string;
  followUpRequired: boolean;
  reviewedByDoctorId?: string;
  reviewedByDoctorName?: string;
  reviewedByDoctorSpecialty?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiGeneratedReport {
  id: string;
  selectedLanguage: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  symptomDurationAndSeverity: string;
  associatedSymptoms: string;
  relevantMedicalHistory: string;
  currentMedicines: string;
  knownAllergies: string;
  previousMedicalReports: string;
  patientReportedInformation: string;
  missingOrUnansweredInfo: string;
  itemsRequiringDoctorReview: string;
  isDemoGenerated?: boolean;
  generatedAt?: string;
  modelName?: string;
  promptTokens?: number;
  completionTokens?: number;
  disclaimer?: string;
}

export interface ApiDoctorCaseDetail {
  id: string;
  token?: ApiIntakeToken;
  patientAge?: number;
  patientGender?: string;
  language?: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
  duration?: string;
  isEmergencyFlagged?: boolean;
  caseStatus: string;
  primarySymptoms: string[];
  symptomAnswers: ApiCaseAnswer[];
  medicalHistory?: ApiMedicalHistory;
  uploadedReports: ApiMedicalReport[];
  generatedReport?: ApiGeneratedReport;
  review?: ApiDoctorReview;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTriageStats {
  totalSubmitted: number;
  pendingReview: number;
  urgentCases: number;
  reviewedCases: number;
  requiresFollowup: number;
}

export interface ApiPagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ========================================================
// Token Management (Client Storage)
// ========================================================

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Failed to update token storage', e);
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

// ========================================================
// HTTP Request Wrapper
// ========================================================

class ApiError extends Error {
  status: number;
  errorType?: string;
  path?: string;

  constructor(message: string, status: number, errorType?: string, path?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorType = errorType;
    this.path = path;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Inject Bearer token if present
  const token = tokenStorage.get();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type only if not sending FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    const errorMsg = netErr?.message || '';
    if (
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      netErr?.name === 'TypeError'
    ) {
      throw new ApiError(
        `Unable to connect to the backend server at ${BASE_URL}. Please ensure the backend is running on port 8081.`,
        0,
        'ConnectionRefused',
        endpoint
      );
    }
    throw netErr;
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // If not calling login/register, clear token
    if (!endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('mediconnect:unauthorized'));
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    let errorType = 'Error';
    let path = endpoint;

    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMessage = errorJson.message;
      if (errorJson.error) errorType = errorJson.error;
      if (errorJson.path) path = errorJson.path;
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // ignore
      }
    }

    throw new ApiError(errorMessage, response.status, errorType, path);
  }

  // Check if caller expects Blob
  if (headers.get('Accept') === 'application/octet-stream' || endpoint.endsWith('/download')) {
    return (await response.blob()) as unknown as T;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

// ========================================================
// API Service Methods
// ========================================================

export const apiClient = {
  getBaseUrl(): string {
    return BASE_URL;
  },

  // ------------------------------------------------------
  // Authentication
  // ------------------------------------------------------
  async login(emailInput: string, passwordInput: string): Promise<ApiAuthResponse> {
    const res = await request<ApiAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailInput.trim(), password: passwordInput }),
    });
    if (res.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  async register(payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: 'PATIENT' | 'DOCTOR';
  }): Promise<ApiAuthResponse> {
    const res = await request<ApiAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  async getCurrentUser(): Promise<ApiUserProfile> {
    return request<ApiUserProfile>('/auth/me', { method: 'GET' });
  },

  logout(): void {
    tokenStorage.clear();
  },

  // ------------------------------------------------------
  // Patient Cases & Intake
  // ------------------------------------------------------
  async createCaseDraft(payload: {
    patientName?: string;
    patientAge?: number;
    patientGender?: string;
    patientPhone?: string;
    language?: string;
    primarySymptoms?: string[];
    severity?: 'Mild' | 'Moderate' | 'Severe';
    duration?: string;
    isEmergencyFlagged?: boolean;
  } = {}): Promise<ApiCaseDetail> {
    return request<ApiCaseDetail>('/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyCases(): Promise<ApiCaseSummary[]> {
    return request<ApiCaseSummary[]>('/cases', { method: 'GET' });
  },

  async getCaseById(caseId: string): Promise<ApiCaseDetail> {
    return request<ApiCaseDetail>(`/cases/${encodeURIComponent(caseId)}`, { method: 'GET' });
  },

  async updateCaseDraft(
    caseId: string,
    payload: {
      patientName?: string;
      patientAge?: number;
      patientGender?: string;
      patientPhone?: string;
      language?: string;
      primarySymptoms?: string[];
      severity?: 'Mild' | 'Moderate' | 'Severe';
      duration?: string;
      isEmergencyFlagged?: boolean;
    }
  ): Promise<ApiCaseDetail> {
    return request<ApiCaseDetail>(`/cases/${encodeURIComponent(caseId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async saveCaseAnswers(
    caseId: string,
    answers: { questionId: string; questionText?: string; answer: string; audioUsed?: boolean }[]
  ): Promise<ApiCaseDetail> {
    return request<ApiCaseDetail>(`/cases/${encodeURIComponent(caseId)}/answers`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    });
  },

  async updateMedicalHistory(
    caseId: string,
    history: {
      conditions?: string;
      medications?: string;
      allergies?: string;
      pastSurgeries?: string;
      familyHistory?: string;
      provided?: boolean;
    }
  ): Promise<ApiMedicalHistory> {
    return request<ApiMedicalHistory>(`/cases/${encodeURIComponent(caseId)}/medical-history`, {
      method: 'PUT',
      body: JSON.stringify(history),
    });
  },

  async getMedicalHistory(caseId: string): Promise<ApiMedicalHistory> {
    return request<ApiMedicalHistory>(`/cases/${encodeURIComponent(caseId)}/medical-history`, {
      method: 'GET',
    });
  },

  async getPatientLatestMedicalHistory(): Promise<ApiMedicalHistory> {
    return request<ApiMedicalHistory>('/patient/medical-history', { method: 'GET' });
  },

  async submitCase(caseId: string): Promise<ApiSubmitCaseResponse> {
    return request<ApiSubmitCaseResponse>(`/cases/${encodeURIComponent(caseId)}/submit`, {
      method: 'POST',
    });
  },

  // ------------------------------------------------------
  // Patient Medical Reports (Secure Local Storage)
  // ------------------------------------------------------
  async uploadPatientReport(caseId: string, file: File): Promise<ApiMedicalReport> {
    const formData = new FormData();
    formData.append('file', file);
    return request<ApiMedicalReport>(`/patient/cases/${encodeURIComponent(caseId)}/reports`, {
      method: 'POST',
      body: formData,
    });
  },

  async getPatientReports(caseId: string): Promise<ApiMedicalReport[]> {
    return request<ApiMedicalReport[]>(`/patient/cases/${encodeURIComponent(caseId)}/reports`, {
      method: 'GET',
    });
  },

  async getPatientReportSignedUrl(
    caseId: string,
    reportId: string,
    expiresInSeconds: number = 300
  ): Promise<ApiSignedUrlResponse> {
    return request<ApiSignedUrlResponse>(
      `/patient/cases/${encodeURIComponent(caseId)}/reports/${encodeURIComponent(reportId)}/signed-url?expiresInSeconds=${expiresInSeconds}`,
      { method: 'GET' }
    );
  },

  async downloadPatientReport(caseId: string, reportId: string): Promise<Blob> {
    return request<Blob>(
      `/patient/cases/${encodeURIComponent(caseId)}/reports/${encodeURIComponent(reportId)}/download`,
      {
        method: 'GET',
        headers: { Accept: 'application/octet-stream' },
      }
    );
  },

  async deletePatientReport(caseId: string, reportId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/patient/cases/${encodeURIComponent(caseId)}/reports/${encodeURIComponent(reportId)}`,
      { method: 'DELETE' }
    );
  },

  // ------------------------------------------------------
  // Doctor & Admin Workflow
  // ------------------------------------------------------
  async getCases(
    params: {
      page?: number;
      size?: number;
      status?: string;
      urgentOnly?: boolean;
      search?: string;
      sortBy?: string;
      sortDirection?: string;
      assignedDoctorId?: string;
      assignedToMe?: boolean;
    } = {},
    isAdmin: boolean = false
  ): Promise<ApiPagedResponse<ApiDoctorCaseSummary>> {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.urgentOnly) query.set('urgentOnly', 'true');
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDirection) query.set('sortDirection', params.sortDirection);
    if (params.assignedDoctorId) query.set('assignedDoctorId', params.assignedDoctorId);
    if (params.assignedToMe) query.set('assignedToMe', 'true');

    const prefix = isAdmin ? '/admin' : '/doctor';
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<ApiPagedResponse<ApiDoctorCaseSummary>>(`${prefix}/cases${qs}`, {
      method: 'GET',
    });
    if (res && res.content) {
      res.content = res.content.map((item) => ({
        ...item,
        id: item.id || (item as any).caseId,
      }));
    }
    return res;
  },

  async getDoctors(): Promise<ApiDoctorSummary[]> {
    return request<ApiDoctorSummary[]>('/admin/doctors', { method: 'GET' });
  },

  async assignDoctor(caseId: string, doctorId: string | null): Promise<ApiDoctorCaseSummary> {
    return request<ApiDoctorCaseSummary>(`/admin/cases/${encodeURIComponent(caseId)}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ doctorId }),
    });
  },

  async getDoctorCaseDetail(caseId: string, isAdmin: boolean = false): Promise<ApiDoctorCaseDetail> {
    const prefix = isAdmin ? '/admin' : '/doctor';
    return request<ApiDoctorCaseDetail>(`${prefix}/cases/${encodeURIComponent(caseId)}`, {
      method: 'GET',
    });
  },

  async getTriageStats(isAdmin: boolean = false): Promise<ApiTriageStats> {
    const prefix = isAdmin ? '/admin' : '/doctor';
    return request<ApiTriageStats>(`${prefix}/triage/stats`, { method: 'GET' });
  },

  async submitDoctorReview(
    caseId: string,
    payload: {
      status: 'PENDING_REVIEW' | 'REVIEWED' | 'REQUIRES_FOLLOWUP' | 'URGENT';
      doctorNotes?: string;
      clinicalRecommendations?: string;
      followUpRequired: boolean;
    },
    isAdmin: boolean = false,
    isUpdate: boolean = false
  ): Promise<ApiDoctorReview> {
    const prefix = isAdmin ? '/admin' : '/doctor';
    return request<ApiDoctorReview>(`${prefix}/cases/${encodeURIComponent(caseId)}/review`, {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generateCaseReport(caseId: string, isAdmin: boolean = false): Promise<ApiGeneratedReport> {
    const prefix = isAdmin ? '/admin' : '/doctor';
    return request<ApiGeneratedReport>(
      `${prefix}/cases/${encodeURIComponent(caseId)}/generate-report`,
      { method: 'POST' }
    );
  },

  async getCaseReport(caseId: string, isAdmin: boolean = false): Promise<ApiGeneratedReport> {
    const prefix = isAdmin ? '/admin' : '/doctor';
    return request<ApiGeneratedReport>(`${prefix}/cases/${encodeURIComponent(caseId)}/report`, {
      method: 'GET',
    });
  },

  async generatePatientCaseReport(caseId: string): Promise<ApiGeneratedReport> {
    return request<ApiGeneratedReport>(
      `/cases/${encodeURIComponent(caseId)}/generate-report`,
      { method: 'POST' }
    );
  },

  async getPatientCaseReport(caseId: string): Promise<ApiGeneratedReport> {
    return request<ApiGeneratedReport>(
      `/cases/${encodeURIComponent(caseId)}/report`,
      { method: 'GET' }
    );
  },

  async getDoctorCaseReports(caseId: string): Promise<ApiMedicalReport[]> {
    return request<ApiMedicalReport[]>(`/doctor/cases/${encodeURIComponent(caseId)}/reports`, {
      method: 'GET',
    });
  },

  async getDoctorReportSignedUrl(
    caseId: string,
    reportId: string,
    expiresInSeconds: number = 300
  ): Promise<ApiSignedUrlResponse> {
    return request<ApiSignedUrlResponse>(
      `/doctor/cases/${encodeURIComponent(caseId)}/reports/${encodeURIComponent(reportId)}/signed-url?expiresInSeconds=${expiresInSeconds}`,
      { method: 'GET' }
    );
  },

  async downloadDoctorReport(caseId: string, reportId: string): Promise<Blob> {
    return request<Blob>(
      `/doctor/cases/${encodeURIComponent(caseId)}/reports/${encodeURIComponent(reportId)}/download`,
      {
        method: 'GET',
        headers: { Accept: 'application/octet-stream' },
      }
    );
  },

  async deleteDoctorReportAdmin(caseId: string, reportId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/doctor/cases/${encodeURIComponent(caseId)}/reports/${encodeURIComponent(reportId)}`,
      { method: 'DELETE' }
    );
  },
};
