import { Language, TestStatus, ExplanationResult, ExplainResponse, AskResponse, ReportEntry } from './types';
import { computeTestStatus } from './status';

// ==========================================
// 1. SAMPLE CBC EXPLANATIONS (ENGLISH)
// ==========================================
export const sampleCbcEnglish: ExplanationResult[] = [
  {
    test_name: 'Hemoglobin',
    value: '9.8',
    unit: 'g/dL',
    reference_range: '12.0–15.5 g/dL',
    status: 'low',
    simple_meaning: 'Your hemoglobin level is below the expected range. Hemoglobin is the protein in red blood cells that carries oxygen from your lungs to the rest of your body.',
    what_test_measures: 'Hemoglobin measures the oxygen-carrying capacity of your blood.',
    possible_general_reasons: [
      'Low dietary iron intake or iron deficiency',
      'Vitamin B12 or folate deficiency',
      'Recent blood loss (such as heavy menstrual cycles or internal bleeding)',
      'Underlying chronic inflammatory conditions',
    ],
    questions_for_doctor: [
      'What is the most likely cause of my low hemoglobin?',
      'Should I have serum ferritin, iron, or vitamin B12 levels tested?',
      'Do you recommend dietary adjustments or an iron supplement?',
    ],
    urgency_note: 'A level of 9.8 g/dL is lower than normal and should be reviewed by a doctor to find the cause and agree on next steps.',
  },
  {
    test_name: 'White Blood Cell Count',
    value: '11,200',
    unit: '/µL',
    reference_range: '4,000–11,000 /µL',
    status: 'slightly_high',
    simple_meaning: 'Your white blood cell count is slightly above the reference upper limit. White blood cells are infection-fighting defenders of your immune system.',
    what_test_measures: 'Total white blood cell count assesses immune response and inflammation in the body.',
    possible_general_reasons: [
      'A mild recent bacterial or viral infection',
      'Physical or emotional stress',
      'Mild inflammation or allergic response',
      'Strenuous physical activity shortly before the blood draw',
    ],
    questions_for_doctor: [
      'Does this mild elevation warrant any immediate investigation?',
      'Could this be related to a recent cough, cold, or minor infection?',
      'Would you advise repeating the CBC test in a few weeks?',
    ],
    urgency_note: 'This value is only slightly outside the reference range. It is common and usually not an urgent concern, but should be discussed with your physician.',
  },
  {
    test_name: 'Platelet Count',
    value: '2,40,000',
    unit: '/µL',
    reference_range: '1,50,000–4,10,000 /µL',
    status: 'normal',
    simple_meaning: 'Your platelet count is comfortably within the healthy reference range. Platelets are crucial cell fragments that help your blood clot and heal cuts.',
    what_test_measures: 'Platelets measure your blood’s normal clotting and wound-healing ability.',
    possible_general_reasons: [
      'Normal, healthy bone marrow function',
      'Balanced blood clotting mechanism',
    ],
    questions_for_doctor: [
      'Are my platelets functioning well alongside my other blood counts?',
    ],
    urgency_note: 'This result is completely normal. No special action needed.',
  },
  {
    test_name: 'RBC Count',
    value: '4.1',
    unit: 'million/µL',
    reference_range: '4.2–5.4 million/µL',
    status: 'slightly_low',
    simple_meaning: 'Your total red blood cell count is slightly below the lower reference boundary. Red blood cells transport oxygen and nutrients to tissues.',
    what_test_measures: 'RBC count measures the total number of oxygen-carrying red blood cells in a microliter of blood.',
    possible_general_reasons: [
      'Mild nutritional anemia (iron, folate, or vitamin B12 shortage)',
      'Fluid retention or hydration differences during testing',
      'Minor decrease in red cell production',
    ],
    questions_for_doctor: [
      'Is this mild drop related to my hemoglobin reading?',
      'Are there specific foods I should incorporate into my diet?',
    ],
    urgency_note: 'This is a minor variation close to the threshold. Discuss it in combination with your hemoglobin result.',
  },
  {
    test_name: 'Blood Sugar (Fasting)',
    value: '96',
    unit: 'mg/dL',
    reference_range: '70–100 mg/dL',
    status: 'normal',
    simple_meaning: 'Your fasting blood glucose level is in the healthy normal range (under 100 mg/dL). This indicates good baseline carbohydrate metabolism.',
    what_test_measures: 'Fasting blood glucose measures the concentration of sugar in your blood after an overnight fast of 8 to 12 hours.',
    possible_general_reasons: [
      'Effective insulin sensitivity and glucose regulation',
      'Healthy fasting lifestyle habits',
    ],
    questions_for_doctor: [
      'How frequently do you suggest I screen my fasting glucose and HbA1c?',
    ],
    urgency_note: 'This result is within normal limits. Maintain a balanced diet and regular physical activity.',
  },
];

// ==========================================
// 2. SAMPLE CBC EXPLANATIONS (HINDI)
// ==========================================
export const sampleCbcHindi: ExplanationResult[] = [
  {
    test_name: 'Hemoglobin',
    value: '9.8',
    unit: 'g/dL',
    reference_range: '12.0–15.5 g/dL',
    status: 'low',
    simple_meaning: 'आपका हीमोग्लोबिन स्तर सामान्य सीमा से कम है। हीमोग्लोबिन लाल रक्त कोशिकाओं का वह प्रोटीन है जो फेफड़ों से पूरे शरीर में ऑक्सीजन पहुंचाता है।',
    what_test_measures: 'यह परीक्षण आपके रक्त में ऑक्सीजन ले जाने की क्षमता को मापता है।',
    possible_general_reasons: [
      'आहार में आयरन (लोहा) की कमी',
      'विटामिन B12 या फोलिक एसिड की कमी',
      'मासिक धर्म में अधिक रक्तस्राव या आंतरिक रक्त की हानि',
      'कोई पुरानी स्वास्थ्य समस्या जो रक्त निर्माण को प्रभावित करती है',
    ],
    questions_for_doctor: [
      'मेरे कम हीमोग्लोबिन का मुख्य कारण क्या हो सकता है?',
      'क्या मुझे सीरम आयरन या विटामिन B12 की जांच करानी चाहिए?',
      'क्या मुझे भोजन में बदलाव या आयरन सप्लीमेंट की आवश्यकता है?',
    ],
    urgency_note: '9.8 g/dL का स्तर सामान्य से कम है। कारण जानने और उचित सलाह के लिए कृपया डॉक्टर से परामर्श करें।',
  },
  {
    test_name: 'White Blood Cell Count',
    value: '11,200',
    unit: '/µL',
    reference_range: '4,000–11,000 /µL',
    status: 'slightly_high',
    simple_meaning: 'आपकी सफेद रक्त कोशिकाओं (WBC) की संख्या सामान्य सीमा से थोड़ी सी अधिक है। ये कोशिकाएं शरीर की रोग प्रतिरोधक क्षमता का हिस्सा हैं।',
    what_test_measures: 'WBC काउंट शरीर में संक्रमण और सूजन के खिलाफ प्रतिरक्षा प्रणाली की प्रतिक्रिया को मापता है।',
    possible_general_reasons: [
      'हाल ही में हुआ कोई हल्का संक्रमण (जैसे सर्दी, खांसी या वायरल बुखार)',
      'शारीरिक या मानसिक तनाव',
      'एलर्जी या शरीर में हल्की सूजन',
      'परीक्षण से पहले भारी व्यायाम',
    ],
    questions_for_doctor: [
      'क्या यह थोड़ा बढ़ा हुआ मान चिंता का विषय है?',
      'क्या यह हाल ही में हुए किसी हल्के संक्रमण के कारण हो सकता है?',
      'क्या कुछ हफ़्तों बाद इस टेस्ट को दोबारा दोहराना चाहिए?',
    ],
    urgency_note: 'यह मान सामान्य से केवल थोड़ा अधिक है। यह आम तौर पर चिंताजनक नहीं होता, लेकिन डॉक्टर से चर्चा करनी चाहिए।',
  },
  {
    test_name: 'Platelet Count',
    value: '2,40,000',
    unit: '/µL',
    reference_range: '1,50,000–4,10,000 /µL',
    status: 'normal',
    simple_meaning: 'आपकी प्लेटलेट संख्या पूरी तरह से सामान्य सीमा में है। प्लेटलेट्स रक्त के थक्के बनाने और घाव भरने में मदद करते हैं।',
    what_test_measures: 'यह परीक्षण रक्त के जमने (clotting) की सामान्य क्षमता का आकलन करता है।',
    possible_general_reasons: [
      'अस्थि मज्जा (Bone marrow) का स्वस्थ कार्य',
      'रक्त का सामान्य थक्का बनने की प्रणाली',
    ],
    questions_for_doctor: [
      'क्या मेरे अन्य रक्त परीक्षणों के साथ प्लेटलेट्स सामान्य रूप से कार्य कर रहे हैं?',
    ],
    urgency_note: 'यह परिणाम पूरी तरह से सामान्य है। किसी विशेष कदम की आवश्यकता नहीं है।',
  },
  {
    test_name: 'RBC Count',
    value: '4.1',
    unit: 'million/µL',
    reference_range: '4.2–5.4 million/µL',
    status: 'slightly_low',
    simple_meaning: 'आपकी लाल रक्त कोशिकाओं (RBC) की कुल संख्या सामान्य सीमा से थोड़ी सी कम है। ये कोशिकाएं पूरे शरीर में ऑक्सीजन पहुंचाती हैं।',
    what_test_measures: 'यह परीक्षण प्रति माइक्रोलीटर रक्त में लाल रक्त कोशिकाओं की कुल संख्या को मापता है।',
    possible_general_reasons: [
      'हल्की पोषण संबंधी कमी (आयरन, विटामिन B12 या फोलेट)',
      'शरीर में तरल पदार्थ (hydration) का स्तर',
      'रक्त निर्माण में हल्की कमी',
    ],
    questions_for_doctor: [
      'क्या मेरी RBC संख्या में यह कमी हीमोग्लोबिन से जुड़ी है?',
      'मुझे अपने आहार में कौन से खाद्य पदार्थ शामिल करने चाहिए?',
    ],
    urgency_note: 'यह मान सामान्य सीमा के काफी करीब है। इसे अपने हीमोग्लोबिन परिणाम के साथ डॉक्टर से समझें।',
  },
  {
    test_name: 'Blood Sugar (Fasting)',
    value: '96',
    unit: 'mg/dL',
    reference_range: '70–100 mg/dL',
    status: 'normal',
    simple_meaning: 'आपका खाली पेट ब्लड शुगर सामान्य और स्वस्थ सीमा (100 mg/dL से कम) में है। यह अच्छे ग्लूकोज नियंत्रण को दर्शाता है।',
    what_test_measures: 'यह परीक्षण 8 से 12 घंटे के उपवास के बाद रक्त में ग्लूकोज (शर्करा) की मात्रा को मापता है।',
    possible_general_reasons: [
      'इंसुलिन का प्रभावी कार्य और संतुलित मेटाबॉलिज्म',
      'संतुलित खान-पान की आदतें',
    ],
    questions_for_doctor: [
      'मुझे कितनी बार अपना ब्लड शुगर और HbA1c टेस्ट कराना चाहिए?',
    ],
    urgency_note: 'यह मान पूरी तरह सामान्य है। संतुलित आहार और नियमित व्यायाम बनाए रखें।',
  },
];

// ==========================================
// 3. SAMPLE CBC EXPLANATIONS (HINGLISH)
// ==========================================
export const sampleCbcHinglish: ExplanationResult[] = [
  {
    test_name: 'Hemoglobin',
    value: '9.8',
    unit: 'g/dL',
    reference_range: '12.0–15.5 g/dL',
    status: 'low',
    simple_meaning: 'Aapka hemoglobin level normal range se kam hai. Hemoglobin red blood cells ka wo protein hota hai jo body ke organs tak oxygen pahunchata hai.',
    what_test_measures: 'Yeh test aapke blood ki oxygen-carrying capacity ko measure karta hai.',
    possible_general_reasons: [
      'Diet mein iron ki kami (nutritional deficiency)',
      'Vitamin B12 ya folate ki kami',
      'Recent blood loss (jaise heavy periods ya internal bleeding)',
      'Koi chronic condition jo red cell production ko affect kare',
    ],
    questions_for_doctor: [
      'Mera hemoglobin kam hone ka main reason kya ho sakta hai?',
      'Kya mujhe serum ferritin, iron ya vitamin B12 test karwana chahiye?',
      'Kya diet change ya iron supplements ki zaroorat hai?',
    ],
    urgency_note: '9.8 g/dL ka level expected range se kam hai. Kripya iska cause samajhne ke liye doctor se discuss karein.',
  },
  {
    test_name: 'White Blood Cell Count',
    value: '11,200',
    unit: '/µL',
    reference_range: '4,000–11,000 /µL',
    status: 'slightly_high',
    simple_meaning: 'Aapka WBC count normal limit se thoda sa zyada hai. White blood cells immune system ka hissa hote hain jo infection se ladte hain.',
    what_test_measures: 'WBC count body ke immune response aur infection-fighting mechanism ko check karta hai.',
    possible_general_reasons: [
      'Halka infection (jaise cold, viral fever ya cough)',
      'Physical ya mental stress',
      'Halki allergy ya body inflammation',
      'Test se pehle heavy physical exercise',
    ],
    questions_for_doctor: [
      'Kya yeh slight elevation kisi concern ki baat hai?',
      'Kya yeh recent viral infection ya stress ki wajah se ho sakta hai?',
      'Kya kuch time baad repeat test karwana chahiye?',
    ],
    urgency_note: 'Yeh value normal se sirf thodi si zyada hai. Aamtaur par tension ki baat nahi hoti, par doctor se consult karna achha hai.',
  },
  {
    test_name: 'Platelet Count',
    value: '2,40,000',
    unit: '/µL',
    reference_range: '1,50,000–4,10,000 /µL',
    status: 'normal',
    simple_meaning: 'Aapka platelet count completely normal range mein hai. Platelets blood clotting aur chot theek karne ke liye zaroori hote hain.',
    what_test_measures: 'Platelets blood ki normal clotting ability ko measure karte hain.',
    possible_general_reasons: [
      'Healthy bone marrow function',
      'Normal blood clotting system',
    ],
    questions_for_doctor: [
      'Kya meri platelet report mere baki blood tests ke saath balanced hai?',
    ],
    urgency_note: 'Yeh result perfectly normal hai. Kisi special action ki zaroorat nahi hai.',
  },
  {
    test_name: 'RBC Count',
    value: '4.1',
    unit: 'million/µL',
    reference_range: '4.2–5.4 million/µL',
    status: 'slightly_low',
    simple_meaning: 'Aapka red blood cell count normal boundary se thoda sa kam hai. RBCs oxygen transport karte hain.',
    what_test_measures: 'Yeh test blood mein oxygen le jaane wale red cells ki total quantity measure karta hai.',
    possible_general_reasons: [
      'Halki nutritional deficiency (iron ya B12 ki kami)',
      'Body hydration levels ka asar',
      'Red cells ka production thoda slow hona',
    ],
    questions_for_doctor: [
      'Kya yeh slight drop mere low hemoglobin se connected hai?',
      'Mujhe apni diet mein kaunse healthy food add karne chahiye?',
    ],
    urgency_note: 'Yeh value threshold ke kaafi kareeb hai. Isko apne low hemoglobin ke context mein doctor se samjhein.',
  },
  {
    test_name: 'Blood Sugar (Fasting)',
    value: '96',
    unit: 'mg/dL',
    reference_range: '70–100 mg/dL',
    status: 'normal',
    simple_meaning: 'Aapka fasting blood sugar level normal aur healthy range (100 mg/dL se kam) mein hai. Yeh good carbohydrate metabolism show karta hai.',
    what_test_measures: 'Fasting glucose 8-12 ghante fast ke baad blood sugar concentration ko measure karta hai.',
    possible_general_reasons: [
      'Effective insulin sensitivity aur balanced sugar control',
      'Healthy fasting routine',
    ],
    questions_for_doctor: [
      'Mujhe kitne time baad routine fasting sugar aur HbA1c repeat check karwana chahiye?',
    ],
    urgency_note: 'Yeh test normal limits mein hai. Balanced diet aur regular exercise maintain rakhein.',
  },
];

// ==========================================
// 4. GENERIC FALLBACK FOR ARBITRARY TESTS
// ==========================================
export function getGenericTestExplanation(
  test_name: string,
  value: string,
  unit: string,
  reference_range: string,
  status: TestStatus,
  language: Language
): ExplanationResult {
  const displayUnit = unit ? ` ${unit}` : '';
  const rangeInfo = reference_range ? ` (reference: ${reference_range})` : '';

  if (language === 'hindi') {
    const hindiStatusMap: Record<TestStatus, { title: string; meaning: string; note: string }> = {
      normal: {
        title: 'सामान्य (Normal)',
        meaning: `${test_name} का परिणाम सामान्य सीमा में है। इसका मान ${value}${displayUnit} है${rangeInfo}।`,
        note: 'यह मान सामान्य सीमा के भीतर है। कोई तात्कालिक चिंता नहीं दिखती।',
      },
      slightly_high: {
        title: 'थोड़ा अधिक (Slightly High)',
        meaning: `${test_name} का मान (${value}${displayUnit}) अपेक्षित संदर्भ सीमा से थोड़ा सा अधिक है${rangeInfo}।`,
        note: 'यह मान सीमा से थोड़ा ही ऊपर है। डॉक्टर से जांच कराएं कि क्या यह अस्थायी कारणों से हुआ है।',
      },
      slightly_low: {
        title: 'थोड़ा कम (Slightly Low)',
        meaning: `${test_name} का मान (${value}${displayUnit}) संदर्भ सीमा के निचले छोर से थोड़ा सा कम है${rangeInfo}।`,
        note: 'यह मान सामान्य सीमा से थोड़ा कम है। अपने डॉक्टर से इस पर सामान्य सलाह लें।',
      },
      high: {
        title: 'अधिक (High)',
        meaning: `${test_name} का स्तर (${value}${displayUnit}) प्रदान की गई संदर्भ सीमा से अधिक है${rangeInfo}।`,
        note: 'यह मान सामान्य से अधिक है। इसके संभावित कारणों और आगे की जांच के लिए डॉक्टर से अवश्य मिलें।',
      },
      low: {
        title: 'कम (Low)',
        meaning: `${test_name} का स्तर (${value}${displayUnit}) प्रदान की गई संदर्भ सीमा से कम दर्ज किया गया है${rangeInfo}।`,
        note: 'यह मान सामान्य से कम है। कृपया अपने स्वास्थ्य इतिहास के संदर्भ में डॉक्टर से बात करें।',
      },
      unclear: {
        title: 'अस्पष्ट (Unclear)',
        meaning: `${test_name} का मान ${value}${displayUnit} है। संदर्भ सीमा स्पष्ट न होने के कारण स्थिति की पुष्टि नहीं हो सकी।`,
        note: 'कृपया अपनी लैब रिपोर्ट की मूल संदर्भ सीमा की डॉक्टर से पुष्टि करें।',
      },
    };

    const s = hindiStatusMap[status] || hindiStatusMap.unclear;
    return {
      test_name,
      value,
      unit,
      reference_range,
      status,
      simple_meaning: s.meaning,
      what_test_measures: `${test_name} शरीर के संबंधित अंगों या प्रणालियों की नियमित स्थिति का मूल्यांकन करने के लिए मापा जाता है।`,
      possible_general_reasons: [
        'खान-पान और दैनिक दिनचर्या में बदलाव',
        'शरीर में अस्थायी तनाव या हालिया हल्का संक्रमण',
        'दवाइयां या परीक्षण के समय शरीर का हाइड्रेशन स्तर',
        'व्यक्तिगत जैविक भिन्नताएं',
      ],
      questions_for_doctor: [
        `मेरे ${test_name} के परिणाम का मेरे संपूर्ण स्वास्थ्य के लिए क्या अर्थ है?`,
        'क्या मुझे इस टेस्ट को दोबारा दोहराने या कोई अतिरिक्त जांच कराने की आवश्यकता है?',
      ],
      urgency_note: s.note,
    };
  }

  if (language === 'hinglish') {
    const hinglishStatusMap: Record<TestStatus, { meaning: string; note: string }> = {
      normal: {
        meaning: `${test_name} ka result normal expected range ke andar hai. Value ${value}${displayUnit} hai${rangeInfo}.`,
        note: 'Yeh value normal limits mein hai. Koi immediate concern nahi hai.',
      },
      slightly_high: {
        meaning: `${test_name} ka value (${value}${displayUnit}) reference range se thoda sa zyada hai${rangeInfo}.`,
        note: 'Yeh level normal se thoda sa upar hai. Doctor se discuss karein ki kya yeh temporary reasons se hai.',
      },
      slightly_low: {
        meaning: `${test_name} ka value (${value}${displayUnit}) normal lower bound se thoda sa kam hai${rangeInfo}.`,
        note: 'Yeh value threshold ke kareeb kam hai. Doctor se is par routine guidance lein.',
      },
      high: {
        meaning: `${test_name} ka level (${value}${displayUnit}) provided reference range se zyada hai${rangeInfo}.`,
        note: 'Yeh value normal se elevated hai. Reason samajhne ke liye doctor se zaroor consult karein.',
      },
      low: {
        meaning: `${test_name} ka level (${value}${displayUnit}) reference range se kam paya gaya hai${rangeInfo}.`,
        note: 'Yeh value normal se kam hai. Please apne doctor se comprehensive evaluation ke liye baat karein.',
      },
      unclear: {
        meaning: `${test_name} ka value ${value}${displayUnit} hai. Reference range clear na hone se status verify nahi ho saka.`,
        note: 'Kripya original lab sheet se reference range doctor ko dikhakar verify karein.',
      },
    };

    const s = hinglishStatusMap[status] || hinglishStatusMap.unclear;
    return {
      test_name,
      value,
      unit,
      reference_range,
      status,
      simple_meaning: s.meaning,
      what_test_measures: `${test_name} body ke specific organ ya biochemical process ki health ko assess karta hai.`,
      possible_general_reasons: [
        'Dietary habits ya lifestyle changes',
        'Temporary physical stress ya recent minor illness',
        'Medications ya hydration levels',
        'Individual physiological variation',
      ],
      questions_for_doctor: [
        `Mera ${test_name} result meri overall health ke hisaab se kaisa hai?`,
        'Kya mujhe koi follow-up test ya specific lifestyle changes karne chahiye?',
      ],
      urgency_note: s.note,
    };
  }

  // Default: English
  const englishStatusMap: Record<TestStatus, { meaning: string; note: string }> = {
    normal: {
      meaning: `Your ${test_name} result of ${value}${displayUnit} falls comfortably within the standard reference range${rangeInfo}.`,
      note: 'This result is within normal limits. No immediate concern.',
    },
    slightly_high: {
      meaning: `Your ${test_name} reading of ${value}${displayUnit} is slightly above the reference upper limit${rangeInfo}.`,
      note: 'This reading is only mildly elevated. Discuss with your doctor whether any temporary factors contributed.',
    },
    slightly_low: {
      meaning: `Your ${test_name} reading of ${value}${displayUnit} is slightly below the reference lower bound${rangeInfo}.`,
      note: 'This reading is slightly under the baseline. Review with your physician for routine context.',
    },
    high: {
      meaning: `Your ${test_name} reading of ${value}${displayUnit} is above the provided reference range${rangeInfo}.`,
      note: 'This value is higher than normal. Please consult your doctor to determine the underlying cause and any next steps.',
    },
    low: {
      meaning: `Your ${test_name} reading of ${value}${displayUnit} is below the provided reference range${rangeInfo}.`,
      note: 'This value is lower than normal. Please share this result with your healthcare professional for proper evaluation.',
    },
    unclear: {
      meaning: `Your ${test_name} is ${value}${displayUnit}. The reference range could not be automatically evaluated.`,
      note: 'Please verify the reference range on your original laboratory printout with your doctor.',
    },
  };

  const s = englishStatusMap[status] || englishStatusMap.unclear;
  return {
    test_name,
    value,
    unit,
    reference_range,
    status,
    simple_meaning: s.meaning,
    what_test_measures: `${test_name} assesses relevant biological markers to assist healthcare professionals in evaluating organ health and body functions.`,
    possible_general_reasons: [
      'Dietary factors and daily nutrient intake',
      'Recent physical exertion or emotional stress',
      'Hydration level at the time of sampling',
      'Natural biological day-to-day fluctuations',
    ],
    questions_for_doctor: [
      `What does my ${test_name} result indicate in light of my overall health?`,
      'Would you recommend repeating this test or running any complementary investigations?',
    ],
    urgency_note: s.note,
  };
}

// ==========================================
// 5. GET COMPLETE DEMO EXPLANATION RESPONSE
// ==========================================
export function getDemoExplainResponse(
  tests: { test_name: string; value: string; unit: string; reference_range: string }[],
  language: Language
): ExplainResponse {
  // Check if this matches the sample CBC tests
  const isSampleCbc =
    tests.length === 5 &&
    tests.some((t) => t.test_name.toLowerCase().includes('hemoglobin')) &&
    tests.some((t) => t.test_name.toLowerCase().includes('platelet'));

  let results: ExplanationResult[];

  if (isSampleCbc) {
    if (language === 'hindi') {
      results = sampleCbcHindi;
    } else if (language === 'hinglish') {
      results = sampleCbcHinglish;
    } else {
      results = sampleCbcEnglish;
    }
  } else {
    // Arbitrary tests: generate per-test explanation using computed status
    results = tests.map((t) => {
      const status = computeTestStatus(t.value, t.reference_range);
      return getGenericTestExplanation(t.test_name, t.value, t.unit, t.reference_range, status, language);
    });
  }

  // Summary counts
  const normalCount = results.filter((r) => r.status === 'normal').length;
  const attentionCount = results.filter((r) =>
    ['high', 'low', 'slightly_high', 'slightly_low'].includes(r.status)
  ).length;
  const unclearCount = results.filter((r) => r.status === 'unclear').length;

  let overall_summary: string;
  if (language === 'hindi') {
    overall_summary = isSampleCbc
      ? `आपकी रिपोर्ट में कुल 5 टेस्ट हैं। अधिकांश मान सामान्य सीमा के करीब हैं। हीमोग्लोबिन (9.8 g/dL) सामान्य सीमा से कम है, RBC काउंट (4.1 million/µL) थोड़ा कम है, और WBC काउंट (11,200 /µL) थोड़ा सा बढ़ा हुआ है। प्लेटलेट और ब्लड शुगर सामान्य हैं। कृपया कम हीमोग्लोबिन के कारण और उचित मार्गदर्शन के लिए अपने डॉक्टर से परामर्श करें। यह केवल एक शैक्षणिक व्याख्या है, कोई चिकित्सीय निदान नहीं।`
      : `आपकी रिपोर्ट में ${results.length} परीक्षणों का विश्लेषण किया गया है। इनमें से ${normalCount} परीक्षण सामान्य सीमा में हैं और ${attentionCount} परीक्षणों पर ध्यान देने की आवश्यकता हो सकती है। कृपया इन परिणामों को अपने डॉक्टर के साथ विस्तार से साझा करें। यह केवल एक शैक्षणिक उपकरण है और किसी बीमारी की पुष्टि नहीं करता।`;
  } else if (language === 'hinglish') {
    overall_summary = isSampleCbc
      ? `Aapki report mein total 5 tests hain. Majority values normal ke kareeb hain. Hemoglobin (9.8 g/dL) normal range se kam hai, RBC count (4.1 million/µL) thoda kam hai, aur WBC count (11,200 /µL) slightly elevated hai. Platelet count aur fasting sugar perfectly normal hain. Kripya low hemoglobin ke reasons aur correct dietary plan ke liye apne doctor se consult karein. Yeh sirf educational explanation hai, medical diagnosis nahi.`
      : `Aapki report ke ${results.length} tests review kiye gaye hain. Inmein se ${normalCount} tests normal hain aur ${attentionCount} tests par dhyan dene ki zaroorat ho sakti hai. In results ko apne doctor ke saath review karein. Yeh educational explanation hai, medical diagnosis nahi.`;
  } else {
    overall_summary = isSampleCbc
      ? `Your report shows that most values are within or close to healthy ranges. However, your Hemoglobin (9.8 g/dL) is below the normal range, RBC Count (4.1 million/µL) is slightly low, and WBC Count (11,200 /µL) is slightly elevated. Platelets and Fasting Blood Sugar are both within normal limits. Please discuss these results with your doctor, especially the low hemoglobin, to understand the cause and agree on next steps. This is an educational explanation only, not a medical diagnosis.`
      : `Your report contains ${results.length} test result(s). ${normalCount} test(s) are within normal reference ranges, and ${attentionCount} test(s) may need discussion with your healthcare provider. Please consult your doctor for personalized medical evaluation. This is educational guidance only, not a diagnosis.`;
  }

  return {
    results,
    overall_summary,
    summary_counts: {
      total: results.length,
      normal: normalCount,
      needs_attention: attentionCount,
      unclear: unclearCount,
    },
  };
}

// ==========================================
// 6. DEMO ASK RESPONSES
// ==========================================
export function getDemoAskResponse(
  question: string,
  language: Language
): AskResponse {
  const q = question.toLowerCase();

  if (language === 'hindi') {
    if (q.includes('hemoglobin') || q.includes('हीमोग्लोबिन') || q.includes('खून की कमी')) {
      return {
        answer: `कम हीमोग्लोबिन (एनीमिया) यह दर्शाता है कि रक्त में ऑक्सीजन ले जाने की क्षमता कम हो सकती है। इसके सामान्य कारणों में भोजन में आयरन या विटामिन B12 की कमी, अधिक रक्तस्राव या कोई पुरानी स्वास्थ्य समस्या हो सकती है। डॉक्टर आपको आयरन युक्त आहार (जैसे हरी पत्तेदार सब्जियां, दालें, गुड़) या पूरक दवाएं लेने की सलाह दे सकते हैं। किसी भी दवा को शुरू करने से पहले डॉक्टर से परामर्श अवश्य लें।`,
        related_tests: ['Hemoglobin', 'RBC Count'],
        disclaimer: 'यह केवल शैक्षणिक जानकारी है। कृपया उचित चिकित्सा सलाह के लिए डॉक्टर से संपर्क करें।',
      };
    }
    return {
      answer: `आपकी लैब रिपोर्ट के संदर्भ में, प्रयोगशाला के परिणाम संपूर्ण स्वास्थ्य चित्र का केवल एक हिस्सा होते हैं। लक्षण, आयु और व्यक्तिगत स्वास्थ्य इतिहास के आधार पर डॉक्टर सटीक मार्गदर्शन दे सकते हैं। कृपया अपने डॉक्टर से संपर्क करें और उनके साथ यह रिपोर्ट साझा करें।`,
      related_tests: [],
      disclaimer: 'यह केवल शैक्षणिक जानकारी है। यह कोई चिकित्सीय निदान या उपचार सलाह नहीं है।',
    };
  }

  if (language === 'hinglish') {
    if (q.includes('hemoglobin') || q.includes('khoon')) {
      return {
        answer: `Low hemoglobin ka general matlab hota hai ki blood ki oxygen carry karne ki capacity kam ho gayi hai. Iske aam reasons mein diet mein iron ya Vitamin B12 ki kami, blood loss ya koi chronic condition ho sakti hai. Doctor iron-rich diet (jaise palak, anar, daal, jaggery) ya supplements suggest kar sakte hain. Koi bhi supplement lene se pehle doctor se check zaroor karein.`,
        related_tests: ['Hemoglobin', 'RBC Count'],
        disclaimer: 'Yeh educational information hai. Proper medical guidance ke liye doctor se consult karein.',
      };
    }
    return {
      answer: `Lab report ke values ko hamesha patient ke symptoms aur health history ke context mein dekha jata hai. Kisi bhi test result ko akele samajhne ke bajaye apne doctor se discuss karna sabse safe aur sahi tareeqa hai.`,
      related_tests: [],
      disclaimer: 'Yeh educational information hai. Yeh kisi bimari ka diagnosis nahi hai.',
    };
  }

  // English
  if (q.includes('hemoglobin') || q.includes('hb') || q.includes('anemia')) {
    return {
      answer: `Low hemoglobin typically indicates that your red blood cells have reduced oxygen-carrying capacity. Common general reasons include insufficient dietary iron, vitamin B12 or folate deficiency, blood loss, or bone marrow and chronic health conditions. Your doctor may evaluate this further with iron profile tests (ferritin) and recommend tailored dietary adjustments or supplements. Always consult your doctor before starting any supplements.`,
      related_tests: ['Hemoglobin', 'RBC Count'],
      disclaimer: 'This is educational information only. Please consult a qualified doctor for medical advice.',
    };
  }

  if (q.includes('wbc') || q.includes('white blood cell')) {
    return {
      answer: `A mildly elevated white blood cell (WBC) count is very common and often occurs when the immune system responds to mild infections (like a cold), minor inflammation, or physical or emotional stress. It usually resolves on its own once the trigger passes. Your doctor can determine whether any follow-up is needed based on your symptoms.`,
      related_tests: ['White Blood Cell Count'],
      disclaimer: 'Educational information only. Consult a doctor for diagnosis.',
    };
  }

  return {
    answer: `In medical testing, individual lab values are best understood alongside your clinical symptoms, medical history, and physical examination. While lab numbers indicate biochemical trends, only a qualified healthcare professional can evaluate what they mean for your individual care. Please bring your Doctor Discussion Sheet to your next appointment.`,
    related_tests: [],
    disclaimer: 'This is educational information only. It does not replace medical advice from a doctor.',
  };
}
