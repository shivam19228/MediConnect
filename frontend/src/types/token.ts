export interface TokenData {
  tokenNumber: string; // e.g. 'MC-20261024-0001'
  caseId: string;
  patientId: string;
  patientName: string;
  submittedAt: string; // ISO 8601 string
  dayOfWeek: string; // e.g. 'Saturday'
  formattedDate: string; // e.g. '24 October 2026'
  formattedTime: string; // e.g. '05:30 AM'
  status: string; // e.g. 'Submitted — Awaiting Doctor Review'
  uploadedReportCount: number;
  department?: string;
  locale?: string;
}
