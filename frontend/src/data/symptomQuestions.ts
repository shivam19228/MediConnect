import { SymptomCategory, Question } from '../types/questions';

/**
 * MediConnect Configurable Symptom Question Engine
 * NOTE: This is a demo rule system for information collection, NOT a medical diagnostic engine.
 */

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'fever',
    name: 'Fever',
    hindiName: 'बुखार',
    iconName: 'Thermometer',
    description: 'High body temperature, feeling hot, shivering or chills',
    descriptionHindi: 'शरीर गर्म होना, कंपकंपी लगना या पसीना आना',
  },
  {
    id: 'headache',
    name: 'Headache',
    hindiName: 'सिरदर्द',
    iconName: 'Brain',
    description: 'Pain, pressure or throbbing anywhere in the head',
    descriptionHindi: 'सिर में भारीपन, तेज दर्द या तनाव महसूस होना',
  },
  {
    id: 'cough_cold',
    name: 'Cough or Cold',
    hindiName: 'खांसी या जुकाम',
    iconName: 'Wind',
    description: 'Sneezing, runny nose, throat irritation or coughing',
    descriptionHindi: 'छींकें, बहती नाक, गले में खराश या सूखी/बलगम वाली खांसी',
  },
  {
    id: 'stomach_pain',
    name: 'Stomach Pain',
    hindiName: 'पेट दर्द',
    iconName: 'CircleDot',
    description: 'Cramps, sharp ache or bloating in the abdomen',
    descriptionHindi: 'पेट में मरोड़, तेज दर्द, भारीपन या गैस',
  },
  {
    id: 'chest_discomfort',
    name: 'Chest Discomfort',
    hindiName: 'छाती में बेचैनी या दर्द',
    iconName: 'HeartPulse',
    description: 'Heaviness, pressure or pain in the chest area',
    descriptionHindi: 'छाती में भारीपन, दबाव या दर्द',
    isEmergencyWarning: true,
  },
  {
    id: 'breathing_difficulty',
    name: 'Breathing Difficulty',
    hindiName: 'सांस लेने में तकलीफ',
    iconName: 'Activity',
    description: 'Shortness of breath, wheezing or tightness in chest',
    descriptionHindi: 'सांस फूलना, तेजी से सांस लेना या घुटन',
    isEmergencyWarning: true,
  },
  {
    id: 'skin_problem',
    name: 'Skin Problem',
    hindiName: 'त्वचा की समस्या',
    iconName: 'SunMedium',
    description: 'Rashes, itching, redness, boils or bumps',
    descriptionHindi: 'खुजली, लाल दाने, चकत्ते या फुंसी',
  },
  {
    id: 'joint_body_pain',
    name: 'Joint or Body Pain',
    hindiName: 'जोड़ों या बदन में दर्द',
    iconName: 'PersonStanding',
    description: 'Aching knees, back, neck, muscles or overall body ache',
    descriptionHindi: 'घुटनों, कमर, मांसपेशियों या पूरे बदन में दर्द',
  },
  {
    id: 'vomiting_diarrhea',
    name: 'Vomiting or Diarrhea',
    hindiName: 'उल्टी या दस्त',
    iconName: 'Droplets',
    description: 'Nausea, throwing up, loose motions or dehydration',
    descriptionHindi: 'जी मिचलाना, उल्टी आना या दस्त होना',
  },
  {
    id: 'weakness_dizziness',
    name: 'Weakness or Dizziness',
    hindiName: 'कमजोरी या चक्कर आना',
    iconName: 'ZapOff',
    description: 'Tiredness, loss of energy, feeling faint or spinning',
    descriptionHindi: 'थकान, ऊर्जा की कमी, चक्कर या धुंधला दिखना',
  },
  {
    id: 'other',
    name: 'Other Health Problem',
    hindiName: 'अन्य परेशानी',
    iconName: 'HelpCircle',
    description: 'Any other discomfort you want to describe to your doctor',
    descriptionHindi: 'कोई अन्य समस्या जो आप डॉक्टर को बताना चाहते हैं',
  },
];

export const SYMPTOM_FOLLOWUP_QUESTIONS: Record<string, Question[]> = {
  fever: [
    {
      id: 'fever_duration',
      category: 'fever',
      text: 'When did the fever start?',
      hindiText: 'बुखार कब से शुरू हुआ है?',
      type: 'single-choice',
      options: [
        { id: 'today', label: 'Today (within 24 hours)', hindiLabel: 'आज ही (पिछले 24 घंटे में)' },
        { id: '2_3_days', label: '2 to 3 days ago', hindiLabel: '2 से 3 दिन पहले' },
        { id: '4_7_days', label: '4 to 7 days ago', hindiLabel: '4 से 7 दिन पहले' },
        { id: 'more_week', label: 'More than a week ago', hindiLabel: 'एक हफ्ते से अधिक समय से' },
      ],
      required: true,
    },
    {
      id: 'fever_pattern',
      category: 'fever',
      text: 'Is the fever constant or does it come and go?',
      hindiText: 'क्या बुखार लगातार बना रहता है या उतर-चढ़कर आता है?',
      type: 'single-choice',
      options: [
        { id: 'constant', label: 'Constant (always feels hot)', hindiLabel: 'लगातार बना रहता है' },
        { id: 'comes_goes', label: 'Comes and goes (intermittent)', hindiLabel: 'उतर-चढ़कर आता है' },
        { id: 'mostly_evening', label: 'Rises mostly in evening/night', hindiLabel: 'ज्यादातर शाम या रात को बढ़ता है' },
      ],
    },
    {
      id: 'fever_temperature',
      category: 'fever',
      text: 'Have you measured your body temperature with a thermometer?',
      hindiText: 'क्या आपने थर्मामीटर से बुखार नापा है?',
      type: 'single-choice',
      options: [
        { id: 'not_measured', label: 'No, just feels warm to touch', hindiLabel: 'नहीं, केवल छूने पर गर्म महसूस होता है' },
        { id: 'mild_99_100', label: 'Yes, 99°F to 100°F (Mild)', hindiLabel: 'हाँ, 99°F से 100°F (हल्का बुखार)' },
        { id: 'high_101_103', label: 'Yes, 101°F to 103°F (Moderate to High)', hindiLabel: 'हाँ, 101°F से 103°F (तेज बुखार)' },
        { id: 'very_high_104', label: 'Yes, Above 103°F (Very High)', hindiLabel: 'हाँ, 103°F से अधिक (अत्यधिक तेज)' },
      ],
    },
    {
      id: 'fever_associated',
      category: 'fever',
      text: 'Do you also have shivering chills, body ache, or sweating?',
      hindiText: 'क्या आपको कंपकंपी, बदन दर्द या पसीना भी आता है?',
      type: 'multi-choice',
      options: [
        { id: 'chills', label: 'Shivering or chills', hindiLabel: 'कंपकंपी लगना' },
        { id: 'body_ache', label: 'Severe body ache', hindiLabel: 'पूरे बदन में तेज दर्द' },
        { id: 'profuse_sweating', label: 'Profuse sweating', hindiLabel: 'बहुत पसीना आना' },
        { id: 'none', label: 'None of these', hindiLabel: 'इनमें से कोई नहीं' },
      ],
    },
    {
      id: 'fever_trajectory',
      category: 'fever',
      text: 'Is the fever getting better, worse, or staying the same?',
      hindiText: 'क्या बुखार पहले से कम हो रहा है, बढ़ रहा है, या वैसा ही है?',
      type: 'single-choice',
      options: [
        { id: 'worse', label: 'Getting worse', hindiLabel: 'बढ़ रहा है' },
        { id: 'same', label: 'Staying the same', hindiLabel: 'वैसा ही है' },
        { id: 'better', label: 'Getting slightly better', hindiLabel: 'थोड़ा कम हो रहा है' },
      ],
    },
  ],

  headache: [
    {
      id: 'headache_duration',
      category: 'headache',
      text: 'When did the headache start?',
      hindiText: 'सिरदर्द कब से शुरू हुआ है?',
      type: 'single-choice',
      options: [
        { id: 'sudden_today', label: 'Suddenly today', hindiLabel: 'आज अचानक शुरू हुआ' },
        { id: 'few_days', label: 'Since 2 to 3 days', hindiLabel: '2-3 दिन से' },
        { id: 'chronic_weeks', label: 'Frequent episodes for weeks/months', hindiLabel: 'कई हफ्तों या महीनों से बार-बार होता है' },
      ],
      required: true,
    },
    {
      id: 'headache_location',
      category: 'headache',
      text: 'Where do you feel the pain in your head?',
      hindiText: 'सिर में दर्द किस जगह महसूस होता है?',
      type: 'single-choice',
      options: [
        { id: 'forehead', label: 'Forehead and temples', hindiLabel: 'माथे और कनपटियों पर' },
        { id: 'one_side', label: 'One side of the head only', hindiLabel: 'सिर के केवल एक तरफ (आधा सिर)' },
        { id: 'back_neck', label: 'Back of head and neck', hindiLabel: 'सिर के पीछे और गर्दन में' },
        { id: 'entire_head', label: 'All over the head', hindiLabel: 'पूरे सिर में भारीपन' },
      ],
    },
    {
      id: 'headache_severity',
      category: 'headache',
      text: 'How severe is the headache?',
      hindiText: 'सिरदर्द कितना तेज है?',
      type: 'single-choice',
      options: [
        { id: 'mild', label: 'Mild (can do normal work)', hindiLabel: 'हल्का (कामकाज कर पा रहे हैं)' },
        { id: 'moderate', label: 'Moderate (disturbs focus and rest)', hindiLabel: 'मध्यम (आराम और ध्यान में रुकावट)' },
        { id: 'severe', label: 'Severe (unbearable, need dark room)', hindiLabel: 'अत्यधिक तेज (सहन करना मुश्किल)' },
      ],
    },
    {
      id: 'headache_associated',
      category: 'headache',
      text: 'Do you also experience nausea, vomiting, vision changes, or dizziness?',
      hindiText: 'क्या उल्टी जैसा लगना, आँखों के आगे धुंधलापन या चक्कर भी आता है?',
      type: 'multi-choice',
      options: [
        { id: 'nausea_vomiting', label: 'Nausea or vomiting', hindiLabel: 'जी मिचलाना या उल्टी' },
        { id: 'light_sound_sensitivity', label: 'Sensitivity to light or sound', hindiLabel: 'रोशनी या आवाज से परेशानी' },
        { id: 'vision_blur', label: 'Blurry or altered vision', hindiLabel: 'धुंधला दिखना' },
        { id: 'dizziness', label: 'Dizziness or imbalance', hindiLabel: 'चक्कर आना' },
        { id: 'none', label: 'None of these', hindiLabel: 'कोई नहीं' },
      ],
    },
  ],

  cough_cold: [
    {
      id: 'cough_duration',
      category: 'cough_cold',
      text: 'When did the cough or cold start?',
      hindiText: 'खांसी या जुकाम कब से शुरू हुआ?',
      type: 'single-choice',
      options: [
        { id: '1_3_days', label: '1 to 3 days ago', hindiLabel: '1 से 3 दिन पहले' },
        { id: '1_2_weeks', label: '1 to 2 weeks ago', hindiLabel: '1 से 2 हफ्ते पहले' },
        { id: 'more_3_weeks', label: 'More than 3 weeks ago', hindiLabel: '3 हफ्ते से भी अधिक समय से' },
      ],
    },
    {
      id: 'cough_type',
      category: 'cough_cold',
      text: 'Is the cough dry, or are you coughing up phlegm/mucus?',
      hindiText: 'क्या यह सूखी खांसी है, या बलगम/कफ आ रहा है?',
      type: 'single-choice',
      options: [
        { id: 'dry', label: 'Dry cough (scratchy throat, no phlegm)', hindiLabel: 'सूखी खांसी (बिना कफ के)' },
        { id: 'wet_clear', label: 'Cough with clear/white phlegm', hindiLabel: 'सफेद/साफ बलगम के साथ' },
        { id: 'wet_yellow_green', label: 'Cough with yellow or greenish phlegm', hindiLabel: 'पीला या हरा बलगम आ रहा है' },
        { id: 'blood_in_cough', label: 'Traces of blood in sputum', hindiLabel: 'बलगम में खून के निशान', isEmergencyFlag: true },
      ],
    },
    {
      id: 'cough_associated',
      category: 'cough_cold',
      text: 'Do you also have a sore throat, runny nose, or fever?',
      hindiText: 'क्या गले में दर्द, बहती नाक या बुखार भी है?',
      type: 'multi-choice',
      options: [
        { id: 'sore_throat', label: 'Pain or scratchiness while swallowing', hindiLabel: 'निगलने में गले में दर्द' },
        { id: 'runny_nose', label: 'Sneezing or runny nose', hindiLabel: 'छींकें या बहती नाक' },
        { id: 'chest_congestion', label: 'Chest tightness or congestion', hindiLabel: 'छाती में जकड़न' },
        { id: 'fever', label: 'Fever', hindiLabel: 'बुखार' },
      ],
    },
    {
      id: 'cough_breathing_check',
      category: 'cough_cold',
      text: 'Are you having any difficulty breathing or shortness of breath?',
      hindiText: 'क्या आपको सांस लेने में तकलीफ या सांस फूलने की समस्या हो रही है?',
      type: 'single-choice',
      options: [
        { id: 'no_breathing_problem', label: 'No, breathing is normal', hindiLabel: 'नहीं, सांस सामान्य है' },
        { id: 'mild_when_walking', label: 'Mild shortness of breath while walking', hindiLabel: 'चलने-फिरने पर थोड़ी सांस फूलती है' },
        { id: 'severe_at_rest', label: 'Yes, difficulty breathing even while resting', hindiLabel: 'हाँ, बैठे रहने पर भी सांस लेने में बहुत दिक्कत', isEmergencyFlag: true },
      ],
    },
  ],

  stomach_pain: [
    {
      id: 'stomach_location',
      category: 'stomach_pain',
      text: 'Where does your stomach hurt?',
      hindiText: 'पेट में दर्द किस हिस्से में हो रहा है?',
      type: 'single-choice',
      options: [
        { id: 'upper_stomach', label: 'Upper abdomen (near chest/ribs)', hindiLabel: 'ऊपरी पेट में (छाती के नीचे)' },
        { id: 'around_navel', label: 'Around the belly button', hindiLabel: 'नाभि के आस-पास' },
        { id: 'lower_stomach', label: 'Lower abdomen / bladder area', hindiLabel: 'निचले पेट में' },
        { id: 'right_lower', label: 'Right lower side (sharp pain)', hindiLabel: 'दाईं तरफ नीचे (अचानक तेज दर्द)' },
        { id: 'all_over', label: 'All over the abdomen', hindiLabel: 'पूरे पेट में मरोड़ या फैलाव' },
      ],
    },
    {
      id: 'stomach_nature',
      category: 'stomach_pain',
      text: 'Is the pain constant, or does it come and go in cramps?',
      hindiText: 'क्या दर्द लगातार बना रहता है, या मरोड़ के साथ आता-जाता है?',
      type: 'single-choice',
      options: [
        { id: 'crampy', label: 'Crampy, comes and goes (spasms)', hindiLabel: 'मरोड़ के साथ आता-जाता है' },
        { id: 'constant_burning', label: 'Constant burning sensation (acidity)', hindiLabel: 'लगातार जलन या एसिडिटी' },
        { id: 'constant_dull', label: 'Constant dull heavy ache', hindiLabel: 'लगातार धीमा या भारी दर्द' },
        { id: 'sharp_stabbing', label: 'Sharp stabbing pain', hindiLabel: 'अत्यधिक तेज चुभन जैसा दर्द' },
      ],
    },
    {
      id: 'stomach_food_relation',
      category: 'stomach_pain',
      text: 'Does the pain become worse after eating?',
      hindiText: 'क्या खाना खाने के बाद दर्द और बढ़ जाता है?',
      type: 'single-choice',
      options: [
        { id: 'worse_after_food', label: 'Yes, worse right after eating', hindiLabel: 'हाँ, खाना खाते ही बढ़ जाता है' },
        { id: 'better_after_food', label: 'Feels better after eating', hindiLabel: 'खाना खाने से आराम मिलता है' },
        { id: 'no_relation', label: 'No relation to food', hindiLabel: 'खाने से कोई फर्क नहीं पड़ता' },
      ],
    },
    {
      id: 'stomach_associated',
      category: 'stomach_pain',
      text: 'Do you also have vomiting, loose motions (diarrhea), or fever?',
      hindiText: 'क्या आपको उल्टी, दस्त, या बुखार की भी शिकायत है?',
      type: 'multi-choice',
      options: [
        { id: 'vomiting', label: 'Vomiting or nausea', hindiLabel: 'उल्टी या जी मिचलाना' },
        { id: 'loose_motions', label: 'Loose watery motions', hindiLabel: 'पतले दस्त' },
        { id: 'constipation', label: 'Severe constipation or unable to pass gas', hindiLabel: 'कब्ज या पेट फूलना' },
        { id: 'fever', label: 'Fever', hindiLabel: 'बुखार' },
        { id: 'none', label: 'None', hindiLabel: 'कोई नहीं' },
      ],
    },
  ],

  chest_discomfort: [
    {
      id: 'chest_nature',
      category: 'chest_discomfort',
      text: 'What kind of feeling are you having in your chest?',
      hindiText: 'छाती में आपको कैसा महसूस हो रहा है?',
      type: 'single-choice',
      options: [
        { id: 'heavy_pressure', label: 'Heavy pressure or squeezing like weight on chest', hindiLabel: 'छाती पर भारी वजन या दबाव जैसा', isEmergencyFlag: true },
        { id: 'burning_heartburn', label: 'Burning sensation rising into throat (heartburn)', hindiLabel: 'खट्टी डकार या छाती में जलन' },
        { id: 'sharp_with_breath', label: 'Sharp pain when taking a deep breath or coughing', hindiLabel: 'गहरी सांस लेने या खांसने पर सुई जैसा दर्द' },
      ],
      required: true,
      isEmergencyCheck: true,
    },
    {
      id: 'chest_radiation',
      category: 'chest_discomfort',
      text: 'Does the pain spread to your left arm, neck, jaw, or back?',
      hindiText: 'क्या दर्द बाएं हाथ, जबड़े, गर्दन या पीठ की तरफ फैल रहा है?',
      type: 'single-choice',
      options: [
        { id: 'yes_arm_jaw', label: 'Yes, spreading to left arm / jaw / back', hindiLabel: 'हाँ, बाएं हाथ, जबड़े या पीठ में दर्द फैल रहा है', isEmergencyFlag: true },
        { id: 'no_local', label: 'No, pain stays in one small spot only', hindiLabel: 'नहीं, दर्द एक ही जगह रहता है' },
      ],
      isEmergencyCheck: true,
    },
  ],

  breathing_difficulty: [
    {
      id: 'breathing_onset',
      category: 'breathing_difficulty',
      text: 'When and how did the breathing difficulty start?',
      hindiText: 'सांस लेने में दिक्कत कब और कैसे शुरू हुई?',
      type: 'single-choice',
      options: [
        { id: 'sudden_severe', label: 'Started suddenly within minutes or hours', hindiLabel: 'अचानक कुछ मिनटों या घंटों में शुरू हुई', isEmergencyFlag: true },
        { id: 'gradual_days', label: 'Gradually increasing over 2-3 days with cold/cough', hindiLabel: '2-3 दिनों में खांसी-जुकाम के साथ धीरे-धीरे बढ़ी' },
        { id: 'known_asthma', label: 'Recurrent wheezing episode (known asthma/allergy)', hindiLabel: 'दमा/अस्थमा के पुराने दौरे जैसा' },
      ],
      isEmergencyCheck: true,
    },
    {
      id: 'breathing_severity',
      category: 'breathing_difficulty',
      text: 'Can you speak full sentences without pausing for breath?',
      hindiText: 'क्या आप बिना रुके पूरा वाक्य बोल पा रहे हैं?',
      type: 'single-choice',
      options: [
        { id: 'can_speak', label: 'Yes, I can speak normally', hindiLabel: 'हाँ, सामान्य रूप से बोल पा रहे हैं' },
        { id: 'cannot_speak_words', label: 'No, having to pause after every 1-2 words', hindiLabel: 'नहीं, एक-दो शब्द बोलने पर ही सांस फूल जाती है', isEmergencyFlag: true },
      ],
      isEmergencyCheck: true,
    },
  ],

  skin_problem: [
    {
      id: 'skin_location',
      category: 'skin_problem',
      text: 'Which part of the body is affected?',
      hindiText: 'शरीर के किस हिस्से की त्वचा प्रभावित है?',
      type: 'single-choice',
      options: [
        { id: 'face_neck', label: 'Face and neck', hindiLabel: 'चेहरा और गर्दन' },
        { id: 'hands_arms', label: 'Hands and arms', hindiLabel: 'हाथ और बाहें' },
        { id: 'legs_feet', label: 'Legs and feet', hindiLabel: 'पैर और तलवे' },
        { id: 'chest_back', label: 'Chest, stomach or back', hindiLabel: 'छाती, पेट या पीठ' },
        { id: 'all_over_body', label: 'All over the body', hindiLabel: 'पूरे शरीर पर' },
      ],
    },
    {
      id: 'skin_appearance',
      category: 'skin_problem',
      text: 'What does the skin problem look like or feel like?',
      hindiText: 'त्वचा पर क्या लक्षण दिखाई या महसूस हो रहे हैं?',
      type: 'multi-choice',
      options: [
        { id: 'itching', label: 'Intense itching', hindiLabel: 'तेज खुजली' },
        { id: 'red_rash', label: 'Red spots or raised rash', hindiLabel: 'लाल चकत्ते या दाने' },
        { id: 'swelling_pain', label: 'Swelling, tenderness or burning', hindiLabel: 'सूजन या जलन/दर्द' },
        { id: 'blister_pus', label: 'Blister with fluid or pus', hindiLabel: 'पानी या मवाद वाला फफोला' },
      ],
    },
    {
      id: 'skin_spreading',
      category: 'skin_problem',
      text: 'Is the skin problem spreading to other areas?',
      hindiText: 'क्या यह परेशानी शरीर के दूसरे हिस्सों में फैल रही है?',
      type: 'single-choice',
      options: [
        { id: 'spreading_fast', label: 'Yes, spreading rapidly', hindiLabel: 'हाँ, तेजी से फैल रही है' },
        { id: 'slow_spread', label: 'Spreading slowly', hindiLabel: 'धीरे-धीरे फैल रही है' },
        { id: 'not_spreading', label: 'Staying in the same area', hindiLabel: 'उसी जगह पर सीमित है' },
      ],
    },
  ],

  joint_body_pain: [
    {
      id: 'joint_area',
      category: 'joint_body_pain',
      text: 'Which joints or parts of your body hurt?',
      hindiText: 'शरीर के कौन-से जोड़ या हिस्से में दर्द है?',
      type: 'multi-choice',
      options: [
        { id: 'knees', label: 'Knees', hindiLabel: 'घुटने' },
        { id: 'lower_back', label: 'Lower back / spine', hindiLabel: 'कमर या रीढ़ की हड्डी' },
        { id: 'shoulders_neck', label: 'Shoulders and neck', hindiLabel: 'कंधे और गर्दन' },
        { id: 'hands_wrists', label: 'Hands, fingers or wrists', hindiLabel: 'हाथ, कलाई या उंगलियां' },
        { id: 'all_muscles', label: 'All over body muscles', hindiLabel: 'पूरे शरीर की मांसपेशियों में दर्द' },
      ],
    },
    {
      id: 'joint_swelling',
      category: 'joint_body_pain',
      text: 'Is there noticeable swelling, warmth, or redness around the painful area?',
      hindiText: 'क्या दर्द वाली जगह पर सूजन, लालिमा या गर्माहट है?',
      type: 'single-choice',
      options: [
        { id: 'swelling_present', label: 'Yes, noticeable swelling or warmth', hindiLabel: 'हाँ, सूजन या गर्माहट है' },
        { id: 'pain_only', label: 'Pain only, no visible swelling', hindiLabel: 'सिर्फ दर्द है, सूजन नहीं' },
        { id: 'morning_stiffness', label: 'Joints are stiff in the morning', hindiLabel: 'सुबह उठने पर जोड़ अकड़े रहते हैं' },
      ],
    },
    {
      id: 'joint_movement',
      category: 'joint_body_pain',
      text: 'Does walking, standing, or bending make the pain worse?',
      hindiText: 'क्या चलने, खड़े होने या झुकने से दर्द बढ़ जाता है?',
      type: 'single-choice',
      options: [
        { id: 'worse_with_movement', label: 'Worse when moving or walking', hindiLabel: 'चलने-फिरने पर बढ़ जाता है' },
        { id: 'worse_with_rest', label: 'Worse after resting still', hindiLabel: 'आराम करने या बैठने के बाद ज्यादा दर्द' },
        { id: 'constant_ache', label: 'Hurts constantly regardless of posture', hindiLabel: 'हर समय लगातार दर्द रहता है' },
      ],
    },
  ],

  vomiting_diarrhea: [
    {
      id: 'vomit_frequency',
      category: 'vomiting_diarrhea',
      text: 'How many times have you vomited or had loose motions today?',
      hindiText: 'आज आपको कितनी बार उल्टी या दस्त हुए हैं?',
      type: 'single-choice',
      options: [
        { id: '1_2_times', label: '1 to 2 times', hindiLabel: '1 से 2 बार' },
        { id: '3_5_times', label: '3 to 5 times', hindiLabel: '3 से 5 बार' },
        { id: 'more_6_times', label: 'More than 5 times (severe frequency)', hindiLabel: '5 बार से अधिक (बार-बार)', isEmergencyFlag: true },
      ],
    },
    {
      id: 'dehydration_check',
      category: 'vomiting_diarrhea',
      text: 'Are you able to keep water or liquids down?',
      hindiText: 'क्या आप पानी या ओआरएस (ORS) पी पा रहे हैं या वह भी निकल जाता है?',
      type: 'single-choice',
      options: [
        { id: 'can_drink', label: 'Yes, can drink water and ORS', hindiLabel: 'हाँ, पानी और तरल पदार्थ पी पा रहे हैं' },
        { id: 'vomiting_all_liquids', label: 'No, throwing up even plain water', hindiLabel: 'नहीं, पानी भी पीते ही उल्टी हो जाती है' },
        { id: 'severe_thirst_dizziness', label: 'Extreme dry mouth, sunken eyes, no urination', hindiLabel: 'मुंह बहुत सूख रहा है, पेशाब नहीं हुआ', isEmergencyFlag: true },
      ],
    },
  ],

  weakness_dizziness: [
    {
      id: 'weakness_nature',
      category: 'weakness_dizziness',
      text: 'How does the weakness or dizziness feel?',
      hindiText: 'कमजोरी या चक्कर का अनुभव कैसा होता है?',
      type: 'single-choice',
      options: [
        { id: 'room_spinning', label: 'The room feels like it is spinning (vertigo)', hindiLabel: 'कमरा या दुनिया घूमती हुई लगती है' },
        { id: 'faint_standing', label: 'Feeling lightheaded when suddenly standing up', hindiLabel: 'अचानक खड़े होने पर अंधेरा छाना' },
        { id: 'extreme_fatigue', label: 'Heavy total body fatigue and lack of energy', hindiLabel: 'शरीर में बिल्कुल जान न रहना, अत्यधिक थकान' },
      ],
    },
  ],

  other: [
    {
      id: 'other_description',
      category: 'other',
      text: 'Please describe the health problem you are facing in your own words.',
      hindiText: 'कृपया अपनी परेशानी के बारे में अपने शब्दों में बताएं।',
      type: 'text',
      required: true,
      helpText: 'You can use the microphone button to speak or type your answer.',
      helpTextHindi: 'आप बोलने के लिए माइक्रोफ़ोन बटन दबा सकते हैं या टाइप कर सकते हैं।',
    },
  ],
};

/**
 * Shared Core Clinical Questions asked for all cases
 */
export const SHARED_CORE_QUESTIONS: Question[] = [
  {
    id: 'shared_duration',
    category: 'shared',
    text: 'How long have you had this primary problem overall?',
    hindiText: 'यह समस्या कुल मिलाकर कितने समय से है?',
    type: 'single-choice',
    options: [
      { id: 'few_hours', label: 'Just a few hours', hindiLabel: 'कुछ ही घंटों से' },
      { id: '1_2_days', label: '1 to 2 days', hindiLabel: '1-2 दिन से' },
      { id: '3_7_days', label: '3 to 7 days', hindiLabel: '3 से 7 दिन से' },
      { id: 'few_weeks', label: '2 to 4 weeks', hindiLabel: '2 से 4 हफ्ते से' },
      { id: 'months', label: 'More than a month', hindiLabel: 'एक महीने से अधिक' },
    ],
    required: true,
  },
  {
    id: 'shared_severity',
    category: 'shared',
    text: 'On a scale from 1 to 10, how severe is your discomfort right now?',
    hindiText: '1 से 10 के पैमाने पर, आपकी तकलीफ अभी कितनी तेज है?',
    type: 'scale',
    minScale: 1,
    maxScale: 10,
    scaleLabels: {
      min: 'Mild Discomfort (1)',
      minHindi: 'हल्की तकलीफ (1)',
      max: 'Extreme Pain / Distress (10)',
      maxHindi: 'अत्यधिक तेज दर्द या बेचैनी (10)',
    },
    required: true,
  },
  {
    id: 'shared_progression',
    category: 'shared',
    text: 'Is your condition getting better, getting worse, or staying about the same?',
    hindiText: 'आपकी हालत पहले से सुधर रही है, बिगड़ रही है, या वैसी ही है?',
    type: 'single-choice',
    options: [
      { id: 'getting_worse', label: 'Getting worse day by day', hindiLabel: 'दिन-ब-दिन बिगड़ रही है' },
      { id: 'staying_same', label: 'Staying about the same', hindiLabel: 'लगभग वैसी ही है' },
      { id: 'improving', label: 'Slowly improving', hindiLabel: 'धीरे-धीरे सुधर रही है' },
    ],
  },
  {
    id: 'shared_prior_episodes',
    category: 'shared',
    text: 'Have you ever had this exact same problem in the past?',
    hindiText: 'क्या आपको पहले भी कभी बिल्कुल यही परेशानी हुई थी?',
    type: 'yes-no',
    options: [
      { id: 'yes', label: 'Yes, this has happened before', hindiLabel: 'हाँ, पहले भी ऐसा हो चुका है' },
      { id: 'no', label: 'No, this is the very first time', hindiLabel: 'नहीं, यह पहली बार हुआ है' },
      { id: 'unsure', label: 'Not sure / Cannot recall', hindiLabel: 'याद नहीं / पक्का नहीं पता' },
    ],
  },
  {
    id: 'shared_relief_triggers',
    category: 'shared',
    text: 'Does anything make your symptoms feel better or worse?',
    hindiText: 'क्या किसी चीज से आराम मिलता है या तकलीफ और बढ़ जाती है?',
    type: 'text',
    helpText: 'e.g. resting, taking paracetamol, drinking warm water, eating spicy food, walking',
    helpTextHindi: 'जैसे: आराम करने से, गर्म पानी पीने से, कोई दवा लेने से, या चलने से',
  },
];
