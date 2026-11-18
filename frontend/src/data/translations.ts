import { LanguageCode } from '../types/case';

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  speechCode: string;
  sampleGreeting: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechCode: 'hi-IN',
    sampleGreeting: 'नमस्ते! मेडीकनेक्ट में आपका स्वागत है।',
    region: 'North & Central India',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechCode: 'en-IN',
    sampleGreeting: 'Welcome to MediConnect voice assistance.',
    region: 'Pan India & Global',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechCode: 'bn-IN',
    sampleGreeting: 'নমস্কার! মেডিকানেক্টে আপনাকে স্বাগতম।',
    region: 'West Bengal & Tripura',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechCode: 'ta-IN',
    sampleGreeting: 'வணக்கம்! மெடிகனெக்ட்டுக்கு உங்களை வரவேற்கிறோம்.',
    region: 'Tamil Nadu & Puducherry',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechCode: 'te-IN',
    sampleGreeting: 'నమస్కారం! మెడికనెక్ట్‌కు స్వాగతం.',
    region: 'Andhra Pradesh & Telangana',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechCode: 'mr-IN',
    sampleGreeting: 'नमस्कार! मेडीकनेक्ट मध्ये आपले स्वागत आहे.',
    region: 'Maharashtra',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechCode: 'gu-IN',
    sampleGreeting: 'નમસ્તે! મેડીકનેક્ટમાં આપનું સ્વાગત છે.',
    region: 'Gujarat',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechCode: 'pa-IN',
    sampleGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਡੀਕਨੈਕਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।',
    region: 'Punjab',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechCode: 'kn-IN',
    sampleGreeting: 'ನಮಸ್ಕಾರ! ಮೆಡಿಕನೆಕ್ಟ್‌ಗೆ ಸ್ವಾಗತ.',
    region: 'Karnataka',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    speechCode: 'ml-IN',
    sampleGreeting: 'നമസ്കാരം! മെഡികണക്ടിലേക്ക് സ്വാഗതം.',
    region: 'Kerala',
  },
];

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  heroHeading: string;
  heroSubheading: string;
  startHealthCheck: string;
  continueHealthCheck: string;
  myReports: string;
  myHistory: string;
  login: string;
  logout: string;
  patientDashboard: string;
  welcomePatient: string;
  selectLanguage: string;
  voiceGuide: string;
  listenQuestion: string;
  speakAnswer: string;
  listening: string;
  stopListening: string;
  speechUnavailable: string;
  next: string;
  previous: string;
  skip: string;
  saveAndContinue: string;
  emergencyTitle: string;
  emergencyAlert: string;
  emergencyCall: string;
  demoNotice: string;
  generateCaseReport: string;
  chiefComplaint: string;
}

export const TRANSLATIONS: Record<'en' | 'hi', TranslationDictionary> = {
  en: {
    appName: 'MediConnect',
    tagline: 'AI-Powered Multilingual Patient Case-Taking System',
    heroHeading: 'Your Health Story, Understood.',
    heroSubheading:
      'Tell us how you feel in your own language. MediConnect helps organize your symptoms and medical history so your doctor can understand your case more easily.',
    startHealthCheck: 'Start Your Health Check',
    continueHealthCheck: 'Continue Previous Check',
    myReports: 'My Medical Reports',
    myHistory: 'My Health History',
    login: 'Login / Sign In',
    logout: 'Logout',
    patientDashboard: 'Patient Health Portal',
    welcomePatient: 'Namaste! How are you feeling today?',
    selectLanguage: 'Choose Your Preferred Language',
    voiceGuide: 'Voice Assistant Guidance',
    listenQuestion: 'Read question aloud',
    speakAnswer: 'Answer with Voice',
    listening: 'Listening to you... Speak clearly',
    stopListening: 'Stop Listening',
    speechUnavailable:
      'Voice input is not supported in this browser. You can type or tap the large buttons below.',
    next: 'Next Step',
    previous: 'Previous',
    skip: 'Skip this question',
    saveAndContinue: 'Save & Continue',
    emergencyTitle: 'Urgent Medical Attention Notice',
    emergencyAlert:
      'If you have severe chest pain, extreme breathlessness, or sudden weakness, do not wait for this questionnaire. Please seek emergency medical care immediately.',
    emergencyCall: 'Call National Emergency Helpline: 112',
    demoNotice:
      'Preliminary clinical intake draft synthesized from your questionnaire responses and uploaded documents. This summary will be submitted to your attending physician for verification.',
    generateCaseReport: 'Generate My Case Report',
    chiefComplaint: 'Chief Health Problem',
  },
  hi: {
    appName: 'मेडीकनेक्ट',
    tagline: 'एआई-संचालित बहुभाषी रोगी केस-टेकिंग प्रणाली',
    heroHeading: 'आपकी सेहत की बात, सीधी और आसान।',
    heroSubheading:
      'अपनी भाषा में बताएं कि आपको क्या परेशानी है। मेडीकनेक्ट आपकी तकलीफ और पुरानी रिपोर्ट को व्यवस्थित करता है ताकि डॉक्टर आपकी बीमारी को आसानी से समझ सकें।',
    startHealthCheck: 'स्वास्थ्य जाँच शुरू करें',
    continueHealthCheck: 'पिछली जाँच जारी रखें',
    myReports: 'मेरी मेडिकल रिपोर्टें',
    myHistory: 'मेरा स्वास्थ्य इतिहास',
    login: 'लॉग इन करें',
    logout: 'लॉग आउट',
    patientDashboard: 'रोगी स्वास्थ्य पोर्टल',
    welcomePatient: 'नमस्ते! आज आपकी तबीयत कैसी है?',
    selectLanguage: 'अपनी भाषा का चयन करें',
    voiceGuide: 'आवाज सहायक मार्गदर्शन',
    listenQuestion: 'प्रश्न सुनकर समझें',
    speakAnswer: 'बोलकर उत्तर दें',
    listening: 'हम आपकी बात सुन रहे हैं... साफ बोलें',
    stopListening: 'सुनना बंद करें',
    speechUnavailable:
      'इस ब्राउज़र में वॉइस रिकॉग्निशन उपलब्ध नहीं है। आप नीचे दिए गए बड़े बटनों को छूकर उत्तर चुन सकते हैं।',
    next: 'आगे बढ़ें',
    previous: 'पीछे जाएं',
    skip: 'यह सवाल छोड़ें',
    saveAndContinue: 'सहेजें और आगे बढ़ें',
    emergencyTitle: 'आपातकालीन चिकित्सा चेतावनी',
    emergencyAlert:
      'यदि आपको सीने में अत्यधिक तेज दर्द, सांस लेने में गंभीर तकलीफ, या शरीर के किसी हिस्से में अचानक कमजोरी है, तो तुरंत आपातकालीन सहायता लें। इस फॉर्म का इंतजार न करें।',
    emergencyCall: 'राष्ट्रीय आपातकालीन सेवा: 112 पर कॉल करें',
    demoNotice:
      'प्रश्नावली और अपलोड किए गए दस्तावेजों से तैयार किया गया प्रारंभिक नैदानिक सारांश। यह जानकारी आपके चिकित्सक को समीक्षा के लिए भेजी जाएगी।',
    generateCaseReport: 'मेरी रिपोर्ट तैयार करें',
    chiefComplaint: 'मुख्य समस्या',
  },
};

/**
 * Standard Voice Prompts for Guidance Component
 */
export const VOICE_PROMPTS = {
  hi: {
    welcome: 'नमस्ते! मैं आपकी सहायता करूँगा। पहले अपनी भाषा चुनिए।',
    symptoms: 'अब बताइए, आपको क्या परेशानी हो रही है? आप नीचे दिए गए विकल्पों में से चुन सकते हैं या बोल सकते हैं।',
    micInstruction: 'अगर आप बोलकर जवाब देना चाहते हैं, तो माइक्रोफ़ोन वाले बटन पर क्लिक कीजिए।',
    uploadInstruction: 'अपनी पुरानी मेडिकल रिपोर्ट अपलोड करने के लिए यहाँ क्लिक करें।',
    historyInstruction: 'क्या आपको पहले से कोई बीमारी है या कोई दवा ले रहे हैं? यहाँ बताएं।',
    reviewInstruction: 'कृपया अपने जवाबों की जाँच कर लें। फिर नीचे दिया गया बटन दबाकर रिपोर्ट तैयार करें।',
    disclaimer: 'यह सहायक सिर्फ दिशा-निर्देश देने के लिए है, यह डॉक्टर का विकल्प नहीं है।',
  },
  en: {
    welcome: 'Hello! I will guide you through each step. First, choose your language.',
    symptoms: 'Tell me what health problem you are experiencing. You can tap an option or speak.',
    micInstruction: 'Press the microphone button to answer by speaking in your natural voice.',
    uploadInstruction: 'Select this button to upload your previous medical reports or prescription photos.',
    historyInstruction: 'Please let us know if you take any regular medicines or have existing health conditions.',
    reviewInstruction: 'Please review all your collected answers. Then tap Generate My Case Report.',
    disclaimer: 'This assistant guides navigation. It does not provide medical diagnoses or replace a doctor.',
  },
};
