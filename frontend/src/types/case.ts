import { TokenData } from './token';

export type LanguageCode =
  | 'hi' // Hindi
  | 'en' // English
  | 'bn' // Bengali
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'pa' // Punjabi
  | 'kn' // Kannada
  | 'ml'; // Malayalam

export type SeverityLevel = 'Mild' | 'Moderate' | 'Severe';

export type ReviewStatus = 'PENDING_REVIEW' | 'REVIEWED' | 'REQUIRES_FOLLOWUP' | 'URGENT';

export interface MedicalReportMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  previewUrl?: string; // in-memory preview for images
  isImage: boolean;
}

export interface MedicalHistory {
  conditions: string[];
  medications: string;
  allergies: string;
  pastSurgeries: string;
  familyHistory: string;
  provided: boolean;
}

export interface SymptomAnswer {
  questionId: string;
  questionText: string;
  answer: string | string[];
  audioUsed?: boolean;
}

export interface GeneratedCaseReport {
  patientInfo: {
    name: string;
    demoId: string;
    age?: number;
    gender?: string;
  };
  selectedLanguage: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  symptomDurationAndSeverity: string;
  associatedSymptoms: string[];
  relevantMedicalHistory: string;
  currentMedicines: string;
  knownAllergies: string;
  previousMedicalReports: {
    name: string;
    type: string;
    sizeFormatted: string;
    extractionNote: string;
  }[];
  patientReportedInformation: string[];
  missingOrUnansweredInformation: string[];
  itemsRequiringDoctorReview: string[];
  generatedAt: string;
  isDemoGenerated: boolean;
}

export interface DoctorReview {
  status: ReviewStatus;
  doctorNotes: string;
  followUpRequired: boolean;
  clinicalRecommendations?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PatientCase {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  tokenNumber?: string;
  tokenData?: TokenData;
  language: LanguageCode;
  primarySymptoms: string[];
  symptomAnswers: Record<string, any>;
  severity: SeverityLevel;
  duration: string;
  medicalHistory: MedicalHistory;
  uploadedReports: MedicalReportMetadata[];
  generatedReport?: GeneratedCaseReport;
  doctorReview?: DoctorReview;
  createdAt: string;
  updatedAt: string;
  isEmergencyFlagged?: boolean;
}

