import { Language } from './types';

export const SYSTEM_INSTRUCTION = `You are MedDecode, a patient-education assistant for medical lab reports. Explain results in very simple language for an Indian patient. Never diagnose a disease. Never recommend, start, stop, or change medicines. Never say a result confirms a condition. Use cautious language such as 'may be associated with', 'can sometimes occur in', or 'should be discussed with a doctor'. Explain what the test measures, whether the value is outside the provided reference range, and general non-diagnostic reasons why values may vary. Always advise the user to consult a qualified healthcare professional. Never provide emergency medical instructions. If the user asks for a diagnosis, medicine dosage, or treatment plan, politely explain that this must be discussed with a qualified doctor. Return only valid JSON when JSON is requested.`;

// Emergency keywords in English, Hindi (Devanagari), and Hinglish (Roman script)
const EMERGENCY_PATTERNS = [
  // English
  /\bchest\s*pain\b/i,
  /\bheart\s*attack\b/i,
  /\bshort(?:ness)?\s*of\s*breath\b/i,
  /\b(?:can'?t|cannot|unable to)\s*breathe\b/i,
  /\bdifficulty\s*breathing\b/i,
  /\bbreathless(?:ness)?\b/i,
  /\bsuffocat(?:ing|ion)\b/i,
  /\bunconscious(?:ness)?\b/i,
  /\bpassed\s*out\b/i,
  /\bfaint(?:ed|ing)?\b/i,
  /\bsevere\s*bleed(?:ing)?\b/i,
  /\bheavy\s*bleed(?:ing)?\b/i,
  /\bprofuse\s*bleed(?:ing)?\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bkill\s*myself\b/i,
  /\bend\s*my\s*life\b/i,
  /\bwant\s*to\s*die\b/i,
  /\bstroke\b/i,
  /\bseizure\b/i,
  /\bconvulsion\b/i,
  /\banaphylax(?:is|ic)\b/i,

  // Hindi (Devanagari)
  /सीने\s*में\s*दर्द/u,
  /छाती\s*में\s*दर्द/u,
  /सांस\s*(?:नहीं|रुक|फूल)/u,
  /सांस\s*लेने\s*में\s*(?:तकलीफ|दिक्कत)/u,
  /बेहोश/u,
  /खून\s*(?:बह\s*रहा|बहुत\s*ज्यादा)/u,
  /आत्महत्या/u,
  /मरना\s*चाहता/u,
  /दौरा\s*पड़/u,

  // Hinglish (Roman script)
  /\bseene\s*m(?:ein|e)\s*dard\b/i,
  /\bchhati\s*m(?:ein|e)\s*dard\b/i,
  /\bsaans\s*nahi\b/i,
  /\bsaans\s*lene\s*m(?:ein|e)\s*(?:dikkat|takleef)\b/i,
  /\bsaans\s*fool\b/i,
  /\bbehosh\b/i,
  /\bchakkar\s*kha(?:kar)?\s*gir\b/i,
  /\bkhoon\s*(?:bah|nikal)\s*raha\b/i,
  /\bkhoon\s*bahut\b/i,
  /\baatmahatya\b/i,
  /\bmarna\s*chah(?:ta|ti)\b/i,
  /\bdaura\s*pad\b/i,
  /\bmirgi\b/i,
];

// Diagnosis / dosage / medicine request patterns
const DIAGNOSIS_OR_DOSAGE_PATTERNS = [
  // English
  /\bdo\s*i\s*have\b/i,
  /\bdo\s*i\s*suffer\s*from\b/i,
  /\bwhat\s*(?:disease|illness|condition)\s*do\s*i\s*have\b/i,
  /\bdiagnose\b/i,
  /\bwhat\s*is\s*my\s*diagnosis\b/i,
  /\bwhich\s*medicine\b/i,
  /\bwhat\s*medicine\b/i,
  /\bwhat\s*tablet\b/i,
  /\bwhat\s*drug\b/i,
  /\b(?:prescribe|suggest)\s*(?:a\s*)?(?:medicine|drug|tablet)\b/i,
  /\bhow\s*many\s*(?:tablets|pills|doses|mg)\b/i,
  /\bwhat\s*dose\b/i,
  /\bdosage\b/i,
  /\bmedicine\s*dosage\b/i,
  /\bwhich\s*(?:injection|antibiotic|supplement|tonic)\b/i,
  /\btreatment\s*plan\b/i,
  /\bhow\s*to\s*cure\b/i,
  /\bcure\s*for\b/i,

  // Hindi (Devanagari)
  /क्या\s*मुझे\s*बीमारी\s*है/u,
  /कौन\s*सी\s*दवा/u,
  /दवा\s*(?:बताओ|लिखो|दें|लेनी|खाऊं|शुरू)/u,
  /दवाई\s*(?:बताओ|लिखो|दें|लेनी|खाऊं|चाहिए)/u,
  /दवा\s*लेनी\s*चाहिए/u,
  /कितनी\s*गोली/u,
  /कितनी\s*खुराक/u,
  /इलाज\s*क्या\s*है/u,

  // Hinglish
  /\bkya\s*mujhe\s*(?:bimari|disease)\b/i,
  /\bkaunsi\s*dawa(?:i)?\b/i,
  /\bkya\s*dawa(?:i)?\s*(?:lu|khau|chahiye|start)\b/i,
  /\bdawa(?:i)?\s*leni\s*chahiye\b/i,
  /\bkitni\s*goli\b/i,
  /\bdose\s*kya\b/i,
  /\bilaj\s*kya\b/i,
  /\btreatment\s*kya\b/i,
];

export function isEmergencyQuery(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(text));
}

export function isDiagnosisOrDosageQuery(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return DIAGNOSIS_OR_DOSAGE_PATTERNS.some((pattern) => pattern.test(text));
}

export function getEmergencyNotice(language: Language): string {
  switch (language) {
    case 'hindi':
      return `🚨 यह एक आपातकालीन चिकित्सा स्थिति हो सकती है। कृपया तुरंत स्थानीय आपातकालीन सेवा (भारत में 112) पर कॉल करें या निकटतम अस्पताल के आपातकालीन कक्ष (Emergency Room) में जाएं। MedDecode आपातकालीन सहायता प्रदान नहीं कर सकता। कृपया तुरंत डॉक्टर से संपर्क करें।`;
    case 'hinglish':
      return `🚨 Yeh ek medical emergency ho sakti hai. Kripya turant local emergency services (India mein 112) par call karein ya paas ke hospital ke emergency room mein jaayein. MedDecode emergency medical help provide nahi kar sakta. Kripya turant doctor se contact karein.`;
    case 'english':
    default:
      return `🚨 This sounds like it may be a medical emergency. Please contact your local emergency services immediately (112 in India, 911 in the US) or go to the nearest hospital emergency room. MedDecode cannot provide emergency medical instructions. Please seek immediate professional medical attention.`;
  }
}

export function getDiagnosisRefusal(language: Language): string {
  switch (language) {
    case 'hindi':
      return `MedDecode एक शैक्षणिक उपकरण है और यह किसी बीमारी का निदान (diagnosis) नहीं कर सकता और न ही दवाइयां या खुराक (dosage) लिख सकता है। दवा शुरू करने, बदलने या किसी बीमारी की जांच के लिए कृपया किसी योग्य डॉक्टर से परामर्श करें। यदि आप चाहें, तो मैं आपकी रिपोर्ट के टेस्ट मूल्यों का सामान्य अर्थ समझाने में मदद कर सकता हूँ।`;
    case 'hinglish':
      return `MedDecode ek educational tool hai aur yeh kisi bimari ka diagnosis nahi kar sakta, aur na hi medicines ya dosage prescribe kar sakta hai. Dawa shuru karne, badalne ya bimari ki jaanch ke liye kripya kisi qualified doctor se consult karein. Agar aap chahein toh main aapki report ke test values ka general matlab simple language mein samjha sakta hoon.`;
    case 'english':
    default:
      return `MedDecode is an educational tool and cannot diagnose medical conditions, recommend medicines, or provide drug dosages. Choosing or changing medicines and diagnosing health conditions must always be discussed with a qualified doctor. However, I can help explain what your specific test values measure and general reasons why they might vary.`;
  }
}
