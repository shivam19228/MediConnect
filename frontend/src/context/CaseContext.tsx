import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PatientCase, LanguageCode, MedicalReportMetadata } from '../types/case';
import { caseService } from '../services/caseService';
import { VOICE_PROMPTS } from '../data/translations';
import { voiceService } from '../services/voiceService';

interface CaseContextType {
  activeDraft: Partial<PatientCase>;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  updateDraft: (partial: Partial<PatientCase>) => void;
  clearDraft: () => void;
  submitActiveCase: (userInfo?: { name?: string; phone?: string }) => Promise<PatientCase>;
  syncDraftToBackend: (userInfo?: { name?: string; phone?: string }) => Promise<string>;
  addUploadedReport: (report: MedicalReportMetadata, previewBlobUrl?: string) => void;
  removeUploadedReport: (reportId: string) => Promise<void>;
  // Voice Assistant Guidance helpers
  assistantPrompt: string;
  setAssistantPrompt: (text: string) => void;
  playAssistantGuidance: (overrideText?: string) => void;
  stopAssistantSpeech: () => void;
  isAssistantSpeaking: boolean;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDraft, setActiveDraft] = useState<Partial<PatientCase>>(() => caseService.getActiveDraft());
  const [language, setLanguageState] = useState<LanguageCode>(() => (activeDraft.language as LanguageCode) || 'hi');
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState<boolean>(false);

  useEffect(() => {
    // Sync draft language if draft changes
    if (activeDraft.language && activeDraft.language !== language) {
      setLanguageState(activeDraft.language);
    }
  }, [activeDraft.language, language]);

  const setLanguage = (newLang: LanguageCode) => {
    setLanguageState(newLang);
    updateDraft({ language: newLang });
  };

  const updateDraft = useCallback((partial: Partial<PatientCase>) => {
    const updated = caseService.updateActiveDraft(partial);
    setActiveDraft({ ...updated });
  }, []);

  const clearDraft = () => {
    caseService.clearActiveDraft();
    setActiveDraft(caseService.getActiveDraft());
  };

  const syncDraftToBackend = async (userInfo?: { name?: string; phone?: string }): Promise<string> => {
    const caseId = await caseService.syncDraftToBackend(activeDraft, userInfo);
    updateDraft({ id: caseId });
    return caseId;
  };

  const submitActiveCase = async (userInfo?: { name?: string; phone?: string }): Promise<PatientCase> => {
    const submitted = await caseService.submitCaseToBackend(activeDraft, userInfo);
    setActiveDraft(caseService.getActiveDraft());
    return submitted;
  };

  const addUploadedReport = (report: MedicalReportMetadata, previewBlobUrl?: string) => {
    if (previewBlobUrl) {
      caseService.registerInMemoryPreview(report.id, previewBlobUrl);
    }
    const currentList = activeDraft.uploadedReports || [];
    const updatedList = [...currentList, report];
    updateDraft({ uploadedReports: updatedList });
  };

  const removeUploadedReport = async (reportId: string) => {
    if (activeDraft.id && !activeDraft.id.startsWith('mock-')) {
      try {
        await caseService.deleteReportFromBackend(activeDraft.id, reportId);
      } catch (e) {
        console.warn('Failed to delete report from backend', e);
      }
    }
    const currentList = activeDraft.uploadedReports || [];
    const updatedList = currentList.filter((r) => r.id !== reportId);
    updateDraft({ uploadedReports: updatedList });
  };

  const playAssistantGuidance = (overrideText?: string) => {
    const textToSpeak = overrideText || assistantPrompt || (language === 'hi' ? VOICE_PROMPTS.hi.welcome : VOICE_PROMPTS.en.welcome);
    setIsAssistantSpeaking(true);
    voiceService.speak(
      textToSpeak,
      language,
      () => setIsAssistantSpeaking(false),
      () => setIsAssistantSpeaking(false)
    );
  };

  const stopAssistantSpeech = () => {
    voiceService.stopSpeaking();
    setIsAssistantSpeaking(false);
  };

  return (
    <CaseContext.Provider
      value={{
        activeDraft,
        language,
        setLanguage,
        updateDraft,
        clearDraft,
        submitActiveCase,
        syncDraftToBackend,
        addUploadedReport,
        removeUploadedReport,
        assistantPrompt,
        setAssistantPrompt,
        playAssistantGuidance,
        stopAssistantSpeech,
        isAssistantSpeaking,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = (): CaseContextType => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
};
