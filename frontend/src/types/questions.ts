export type QuestionType =
  | 'single-choice'
  | 'multi-choice'
  | 'scale'
  | 'duration'
  | 'text'
  | 'yes-no';

export interface QuestionOption {
  id: string;
  label: string;
  hindiLabel: string;
  icon?: string;
  isEmergencyFlag?: boolean;
}

export interface Question {
  id: string;
  category: string;
  text: string;
  hindiText: string;
  type: QuestionType;
  options?: QuestionOption[];
  required?: boolean;
  helpText?: string;
  helpTextHindi?: string;
  minScale?: number;
  maxScale?: number;
  scaleLabels?: { min: string; minHindi: string; max: string; maxHindi: string };
  dependsOnSymptom?: string; // e.g. 'fever', 'headache'
  isEmergencyCheck?: boolean;
}

export interface SymptomCategory {
  id: string;
  name: string;
  hindiName: string;
  iconName: string;
  description: string;
  descriptionHindi: string;
  isEmergencyWarning?: boolean;
}
