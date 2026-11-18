import { Question, QuestionOption } from '../types/questions';
import { SYMPTOM_CATEGORIES } from '../data/symptomQuestions';

/**
 * Normalizes text by trimming, converting to lower case, and removing excessive punctuation.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent symptom matching for Step A (Primary Health Concern).
 * Matches spoken Hindi / English phrases to SYMPTOM_CATEGORIES ids.
 */
export function matchSymptomsFromSpeech(speech: string): string[] {
  const norm = normalizeText(speech);
  const matched: Set<string> = new Set();

  const rules: { id: string; keywords: string[] }[] = [
    {
      id: 'fever',
      keywords: [
        'बुखार', 'ताप', 'गरम', 'तप', 'फीवर', 'कंपकंपी', 'ठंड लग', 'हरारत',
        'fever', 'temperature', 'chills', 'shivering', 'hot body', 'pyrexia', 'high temp',
      ],
    },
    {
      id: 'headache',
      keywords: [
        'सिरदर्द', 'सिर दर्द', 'माथा दर्द', 'सिर में दर्द', 'सर दर्द', 'माथा', 'आधा सीसी',
        'headache', 'head ache', 'head pain', 'migraine', 'throbbing head',
      ],
    },
    {
      id: 'cough_cold',
      keywords: [
        'खांसी', 'जुकाम', 'सर्दी', 'गला', 'खराश', 'बलगम', 'छींक', 'कफ', 'गले में खराश', 'नाक बह',
        'cough', 'cold', 'sore throat', 'throat', 'sneeze', 'sneezing', 'runny nose', 'phlegm', 'mucus',
      ],
    },
    {
      id: 'stomach_pain',
      keywords: [
        'पेट दर्द', 'पेट में दर्द', 'पेट', 'मरोड़', 'गैस', 'कब्ज', 'अपच', 'एसिडिटी', 'पेट खराब',
        'stomach', 'abdomen', 'tummy', 'belly', 'cramps', 'abdominal pain', 'gastric', 'bloating',
      ],
    },
    {
      id: 'chest_discomfort',
      keywords: [
        'छाती', 'सीने', 'सीना', 'दिल', 'छाती में दर्द', 'सीने में दर्द', 'भारीपन', 'छाती में दबाव',
        'chest', 'chest pain', 'chest pressure', 'heart pain', 'heaviness in chest', 'tightness in chest',
      ],
    },
    {
      id: 'breathing_difficulty',
      keywords: [
        'सांस', 'दम', 'सांस फूल', 'हांफ', 'सांस लेने में तकलीफ', 'सांस नहीं आ रही', 'घुटन',
        'breath', 'breathing', 'shortness of breath', 'wheezing', 'difficulty breathing', 'breathless',
      ],
    },
    {
      id: 'skin_problem',
      keywords: [
        'त्वचा', 'खुजली', 'चकत्ते', 'दाने', 'फुंसी', 'स्किन', 'खारिश', 'फोड़े',
        'skin', 'itching', 'rash', 'rashes', 'boils', 'spots', 'skin allergy', 'redness',
      ],
    },
    {
      id: 'joint_body_pain',
      keywords: [
        'बदन दर्द', 'जोड़ों', 'कमर', 'घुटनों', 'मांसपेशी', 'हाथ पैर', 'कमर दर्द', 'जोड़ों में दर्द',
        'body pain', 'joint pain', 'body ache', 'back pain', 'knee pain', 'muscle ache', 'leg pain',
      ],
    },
    {
      id: 'vomiting_diarrhea',
      keywords: [
        'उल्टी', 'दस्त', 'दस्त लगना', 'जी मिचलाना', 'लूज मोशन', 'कै', 'पेट खराब',
        'vomit', 'vomiting', 'nausea', 'loose motion', 'loose motions', 'diarrhea', 'upset tummy',
      ],
    },
    {
      id: 'weakness_dizziness',
      keywords: [
        'कमजोरी', 'चक्कर', 'थकान', 'सुस्ती', 'बेहोशी', 'आंखों के आगे अंधेरा',
        'weakness', 'dizzy', 'dizziness', 'tired', 'tiredness', 'fatigue', 'faint', 'spinning head',
      ],
    },
  ];

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (norm.includes(kw.toLowerCase())) {
        matched.add(rule.id);
        break;
      }
    }
  }

  return Array.from(matched);
}

/**
 * Matches spoken answer to a single-choice question options.
 */
export function matchSingleChoiceOption(speech: string, options: QuestionOption[]): string | null {
  const norm = normalizeText(speech);

  // 1. Direct match on option label or hindiLabel
  for (const opt of options) {
    const labelNorm = normalizeText(opt.label);
    const hindiNorm = normalizeText(opt.hindiLabel);
    if (norm.includes(labelNorm) || norm.includes(hindiNorm)) {
      return opt.id;
    }
  }

  // 2. Common yes/no mapping
  if (norm.match(/^(yes|yeah|yep|yup|haan|ha|हाँ|हां|सही|बिल्कुल)$/i) || norm.includes('हाँ') || norm.includes('हां')) {
    const yesOpt = options.find((o) => o.id === 'yes' || o.id.includes('yes') || o.label.toLowerCase() === 'yes');
    if (yesOpt) return yesOpt.id;
  }
  if (norm.match(/^(no|nope|nah|nahi|nahin|नहीं|ना|नाही)$/i) || norm.includes('नहीं') || norm.includes('ना')) {
    const noOpt = options.find((o) => o.id === 'no' || o.id.includes('no') || o.label.toLowerCase() === 'no');
    if (noOpt) return noOpt.id;
  }

  // 3. Duration keywords mapping
  if (norm.includes('घंटे') || norm.includes('hour') || norm.includes('aaj') || norm.includes('आज')) {
    const opt = options.find((o) => o.id.includes('hour') || o.id.includes('today'));
    if (opt) return opt.id;
  }
  if (norm.includes('दिन') || norm.includes('day') || norm.includes('kal') || norm.includes('कल')) {
    const opt = options.find((o) => o.id.includes('day') || o.id.includes('few_days'));
    if (opt) return opt.id;
  }
  if (norm.includes('हफ्ता') || norm.includes('week') || norm.includes('सात दिन')) {
    const opt = options.find((o) => o.id.includes('week'));
    if (opt) return opt.id;
  }
  if (norm.includes('महीना') || norm.includes('month') || norm.includes('काफी दिन') || norm.includes('पुरानी')) {
    const opt = options.find((o) => o.id.includes('more') || o.id.includes('month'));
    if (opt) return opt.id;
  }

  // 4. Progression keywords mapping
  if (norm.includes('सुधार') || norm.includes('better') || norm.includes('behtar') || norm.includes('ठीक')) {
    const opt = options.find((o) => o.id.includes('better'));
    if (opt) return opt.id;
  }
  if (norm.includes('बिगड़') || norm.includes('worse') || norm.includes('kharab') || norm.includes('ज्यादा')) {
    const opt = options.find((o) => o.id.includes('worse'));
    if (opt) return opt.id;
  }
  if (norm.includes('वैसा') || norm.includes('same') || norm.includes('waisa') || norm.includes('बराबर')) {
    const opt = options.find((o) => o.id.includes('same'));
    if (opt) return opt.id;
  }

  // 5. Recurrence mapping
  if (norm.includes('पहली') || norm.includes('first') || norm.includes('pehli')) {
    const opt = options.find((o) => o.id.includes('first'));
    if (opt) return opt.id;
  }
  if (norm.includes('पहले भी') || norm.includes('repeat') || norm.includes('baar') || norm.includes('बार-बार')) {
    const opt = options.find((o) => o.id.includes('recurrent') || o.id.includes('yes'));
    if (opt) return opt.id;
  }

  return null;
}

/**
 * Matches spoken answer to a scale value between min and max (e.g. 1 to 10).
 */
export function matchScaleValue(speech: string, min = 1, max = 10): number | null {
  const norm = normalizeText(speech);

  // Check digits directly
  const digitMatch = norm.match(/\b([1-9]|10)\b/);
  if (digitMatch) {
    const val = parseInt(digitMatch[1], 10);
    if (val >= min && val <= max) return val;
  }

  // Hindi and English number words mapping
  const numberWords: Record<string, number> = {
    'one': 1, 'एक': 1,
    'two': 2, 'दो': 2,
    'three': 3, 'तीन': 3,
    'four': 4, 'चार': 4,
    'five': 5, 'पांच': 5, 'पाँच': 5,
    'six': 6, 'छह': 6, 'छः': 6,
    'seven': 7, 'सात': 7,
    'eight': 8, 'आठ': 8,
    'nine': 9, 'नौ': 9,
    'ten': 10, 'दस': 10,
  };

  for (const [word, val] of Object.entries(numberWords)) {
    if (new RegExp(`\\b${word}\\b`).test(norm)) {
      if (val >= min && val <= max) return val;
    }
  }

  // Qualitative words mapping
  if (norm.includes('हल्का') || norm.includes('mild') || norm.includes('कम') || norm.includes('थोड़ा')) {
    return 3;
  }
  if (norm.includes('मध्यम') || norm.includes('moderate') || norm.includes('medium') || norm.includes('बीच का')) {
    return 5;
  }
  if (norm.includes('तेज') || norm.includes('severe') || norm.includes('बहुत') || norm.includes('ज्यादा')) {
    return 8;
  }
  if (norm.includes('असहनीय') || norm.includes('extreme') || norm.includes('worst')) {
    return 10;
  }

  return null;
}

/**
 * Matches medical history pre-existing conditions from speech.
 */
export function matchMedicalConditionsFromSpeech(speech: string): string[] {
  const norm = normalizeText(speech);
  const matched: Set<string> = new Set();

  if (norm.includes('शुगर') || norm.includes('sugar') || norm.includes('diabetes') || norm.includes('डायबिटीज')) {
    matched.add('diabetes');
  }
  if (norm.includes('बीपी') || norm.includes('bp') || norm.includes('blood pressure') || norm.includes('ब्लड प्रेशर') || norm.includes('हाई बीपी')) {
    matched.add('hypertension');
  }
  if (norm.includes('अस्थमा') || norm.includes('asthma') || norm.includes('दमा') || norm.includes('सांस की बीमारी')) {
    matched.add('asthma');
  }
  if (norm.includes('हार्ट') || norm.includes('heart') || norm.includes('दिल') || norm.includes('हृदय')) {
    matched.add('heart');
  }
  if (norm.includes('थायरॉइड') || norm.includes('thyroid')) {
    matched.add('thyroid');
  }
  if (norm.includes('कोई नहीं') || norm.includes('कुछ नहीं') || norm.includes('none') || norm.includes('no condition') || norm.includes('नहीं है')) {
    matched.add('none');
  }

  return Array.from(matched);
}

/**
 * Matches allergies from speech.
 */
export function matchAllergiesFromSpeech(speech: string): string[] {
  const norm = normalizeText(speech);
  const matched: Set<string> = new Set();

  if (norm.includes('सल्फा') || norm.includes('sulfa')) {
    matched.add('Sulfa Drugs');
  }
  if (norm.includes('पेनिसिलिन') || norm.includes('penicillin') || norm.includes('एंटीबायोटिक') || norm.includes('antibiotic')) {
    matched.add('Penicillin / Antibiotics');
  }
  if (norm.includes('धूल') || norm.includes('dust') || norm.includes('पराग') || norm.includes('pollen')) {
    matched.add('Dust & Pollen');
  }
  if (norm.includes('खाना') || norm.includes('food') || norm.includes('भोजन')) {
    matched.add('Certain Foods');
  }
  if (norm.includes('कोई एलर्जी नहीं') || norm.includes('कुछ नहीं') || norm.includes('no allergy') || norm.includes('नहीं है')) {
    matched.add('No known allergies');
  }

  return Array.from(matched);
}
