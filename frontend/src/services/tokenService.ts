import { TokenData } from '../types/token';
import { PatientCase } from '../types/case';

const TOKEN_COUNTER_PREFIX = 'mediconnect_token_seq_';

export class TokenService {
  /**
   * Returns a YYYYMMDD string for the given date in local timezone
   */
  public getDateKey(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Generates a readable, sequential, collision-resistant token number:
   * Format: MC-YYYYMMDD-XXXX (e.g. MC-20261024-0001)
   */
  public generateNextTokenNumber(submissionDate: Date = new Date()): string {
    const dateKey = this.getDateKey(submissionDate);
    const storageKey = `${TOKEN_COUNTER_PREFIX}${dateKey}`;

    let nextNumber = 1;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          nextNumber = parsed + 1;
        }
      }
      localStorage.setItem(storageKey, String(nextNumber));
    } catch (e) {
      console.warn('LocalStorage error reading token counter, using fallback', e);
      nextNumber = Math.floor(1000 + Math.random() * 9000);
    }

    const paddedSeq = String(nextNumber).padStart(4, '0');
    return `MC-${dateKey}-${paddedSeq}`;
  }

  /**
   * Formats the submission timestamp into readable day, date, and time.
   * Respects patient's language locale where supported.
   */
  public formatSubmissionTimestamp(
    date: Date = new Date(),
    languageCode: string = 'en'
  ): { dayOfWeek: string; formattedDate: string; formattedTime: string; locale: string } {
    const localeMap: Record<string, string> = {
      hi: 'hi-IN',
      en: 'en-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      pa: 'pa-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
    };

    const targetLocale = localeMap[languageCode] || 'en-IN';

    try {
      const dayOfWeek = new Intl.DateTimeFormat(targetLocale, { weekday: 'long' }).format(date);
      const formattedDate = new Intl.DateTimeFormat(targetLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
      const formattedTime = new Intl.DateTimeFormat(targetLocale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);

      return { dayOfWeek, formattedDate, formattedTime, locale: targetLocale };
    } catch (e) {
      // Clean fallback if locale formatting encounters browser limitation
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const dayOfWeek = days[date.getDay()];
      const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedTime = `${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`;

      return { dayOfWeek, formattedDate, formattedTime, locale: 'en-IN' };
    }
  }

  /**
   * Creates a TokenData object for a submitted case.
   * Ensures IDEMPOTENCY: If the case already has a token, reuse it without regenerating!
   */
  public createTokenForCase(
    caseData: Partial<PatientCase>,
    submissionDate: Date = new Date()
  ): TokenData {
    // If case already has an authoritative token, preserve and return it directly
    if (caseData.tokenData && caseData.tokenData.tokenNumber) {
      return caseData.tokenData;
    }

    if (caseData.tokenNumber && caseData.createdAt) {
      const existingDate = new Date(caseData.createdAt);
      const { dayOfWeek, formattedDate, formattedTime, locale } = this.formatSubmissionTimestamp(
        existingDate,
        caseData.language || 'en'
      );
      return {
        tokenNumber: caseData.tokenNumber,
        caseId: caseData.id || `case-${Date.now()}`,
        patientId: caseData.patientId || 'pat-demo',
        patientName: caseData.patientName || 'Patient',
        submittedAt: caseData.createdAt,
        dayOfWeek,
        formattedDate,
        formattedTime,
        status: 'Submitted — Awaiting Doctor Review',
        uploadedReportCount: caseData.uploadedReports?.length || 0,
        department: 'General Medicine & Triage',
        locale,
      };
    }

    const tokenNumber = this.generateNextTokenNumber(submissionDate);
    const isoTimestamp = submissionDate.toISOString();
    const { dayOfWeek, formattedDate, formattedTime, locale } = this.formatSubmissionTimestamp(
      submissionDate,
      caseData.language || 'en'
    );

    const tokenData: TokenData = {
      tokenNumber,
      caseId: caseData.id || `case-${Date.now()}`,
      patientId: caseData.patientId || `pat-${Date.now().toString().slice(-4)}`,
      patientName: caseData.patientName || 'Sunita Devi',
      submittedAt: isoTimestamp,
      dayOfWeek,
      formattedDate,
      formattedTime,
      status: 'Submitted — Awaiting Doctor Review',
      uploadedReportCount: caseData.uploadedReports?.length || 0,
      department: 'General Medicine & Triage',
      locale,
    };

    return tokenData;
  }

  /**
   * Generates a plain-text printable receipt suitable for download or offline saving.
   * Omits sensitive medical answers while keeping official verification tokens.
   */
  public generateReceiptText(token: TokenData): string {
    return `
============================================================
              MEDICONNECT HEALTHCARE SYSTEMS
               OFFICIAL CASE INTAKE RECEIPT
============================================================

TOKEN NUMBER:    ${token.tokenNumber}
CASE REFERENCE:  ${token.caseId}
STATUS:          ${token.status}

PATIENT INFORMATION:
------------------------------------------------------------
Patient Name:    ${token.patientName}
Patient ID:      ${token.patientId}
Department:      ${token.department || 'General Medicine & Triage'}

SUBMISSION DETAILS:
------------------------------------------------------------
Day:             ${token.dayOfWeek}
Date:            ${token.formattedDate}
Time:            ${token.formattedTime}
Attached Reports: ${token.uploadedReportCount} file(s)

IMPORTANT NOTICE FOR PATIENTS:
------------------------------------------------------------
1. This token confirms your symptom intake was successfully
   recorded and queued for physician review.
2. This receipt is an intake confirmation token, NOT a confirmed
   hospital appointment or guaranteed time slot.
3. If your symptoms worsen or you experience severe chest pain,
   extreme breathlessness, or sudden weakness, do not wait.
   Call National Emergency Helpline 112 or visit the nearest
   emergency hospital immediately.

Receipt Issued: ${token.submittedAt}
Verification ID: ${token.tokenNumber}
============================================================
`.trim();
  }
}

export const tokenService = new TokenService();
