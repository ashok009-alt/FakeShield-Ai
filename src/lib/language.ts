import type { LanguageMeta } from "./analysis/types";

export type LanguageCode = "hi" | "bn" | "ta" | "te" | "gu" | "kn" | "ml" | "pa" | "ur" | "hinglish" | "en";

interface ScriptDefinition {
  code: LanguageCode;
  label: string;
  nativeName: string;
  script: string;
  range: RegExp;
}

export const SCRIPTS: ScriptDefinition[] = [
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", script: "Devanagari", range: /[\u0900-\u097F]/g },
  { code: "bn", label: "Bengali", nativeName: "বাংলা", script: "Bengali", range: /[\u0980-\u09FF]/g },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்", script: "Tamil", range: /[\u0B80-\u0BFF]/g },
  { code: "te", label: "Telugu", nativeName: "తెలుగు", script: "Telugu", range: /[\u0C00-\u0C7F]/g },
  { code: "gu", label: "Gujarati", nativeName: "ગુજરાતી", script: "Gujarati", range: /[\u0A80-\u0AFF]/g },
  { code: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada", range: /[\u0C80-\u0CFF]/g },
  { code: "ml", label: "Malayalam", nativeName: "മലയാളം", script: "Malayalam", range: /[\u0D00-\u0D7F]/g },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ", script: "Gurmukhi", range: /[\u0A00-\u0A7F]/g },
  { code: "ur", label: "Urdu", nativeName: "اردو", script: "Arabic", range: /[\u0600-\u06FF]/g },
];

export interface LanguageDetection {
  code: LanguageCode;
  label: string;
  nativeName: string;
  script: string;
  confidence: number;
  isLatin: boolean;
}

const HINGLISH_MARKERS = [
  "aapka",
  "aapke",
  "khata",
  "khaata",
  "band ho",
  "turant",
  "jaldi",
  "paisa",
  "paise",
  "bhejein",
  "bhejo",
  "kholen",
  "inam",
  "jeet",
  "giraftar",
  "pulish",
  "sarkari",
  "kripya",
  "abhi",
  "nahi to",
  "OTP bhejo",
  "link kholo",
];

export function detectLanguage(text: string): LanguageDetection {
  const sample = text.slice(0, 6000);
  let best: { def: ScriptDefinition; count: number } | null = null;

  for (const def of SCRIPTS) {
    const count = (sample.match(def.range) ?? []).length;
    if (count >= 4 && (!best || count > best.count)) {
      best = { def, count };
    }
  }

  if (best) {
    const nonSpace = sample.replace(/\s/g, "").length || 1;
    return {
      code: best.def.code,
      label: best.def.label,
      nativeName: best.def.nativeName,
      script: best.def.script,
      confidence: Math.min(0.99, 0.72 + best.count / nonSpace),
      isLatin: false,
    };
  }

  const lower = sample.toLowerCase();
  const hits = HINGLISH_MARKERS.filter((marker) => lower.includes(marker)).length;
  if (hits >= 2) {
    return {
      code: "hinglish",
      label: "Hinglish",
      nativeName: "Hinglish",
      script: "Latin",
      confidence: Math.min(0.9, 0.55 + hits * 0.08),
      isLatin: true,
    };
  }

  return {
    code: "en",
    label: "English",
    nativeName: "English",
    script: "Latin",
    confidence: 0.9,
    isLatin: true,
  };
}

export type GlossCategory =
  | "otp"
  | "kyc"
  | "payment"
  | "urgency"
  | "impersonation"
  | "prize"
  | "arrest"
  | "link";

interface GlossEntry {
  language: LanguageCode;
  category: GlossCategory;
  terms: string[];
  english: string;
}

export const CATEGORY_LABEL: Record<GlossCategory, string> = {
  otp: "OTP or code request",
  kyc: "KYC or identity request",
  payment: "money request",
  urgency: "urgency",
  impersonation: "authority impersonation",
  prize: "prize claim",
  arrest: "arrest threat",
  link: "link request",
};

/** Phrase-level glossary. This is a labelled term dictionary, not a full translation model. */
const GLOSSARY: GlossEntry[] = [
  // Hindi
  { language: "hi", category: "impersonation", terms: ["प्रिय ग्राहक", "प्रिय उपयोगकर्ता"], english: "Dear customer" },
  { language: "hi", category: "impersonation", terms: ["ग्राहक सेवा", "कस्टमर केयर"], english: "customer care" },
  { language: "hi", category: "impersonation", terms: ["बैंक", "बैंकिंग"], english: "bank" },
  { language: "hi", category: "impersonation", terms: ["पुलिस", "साइबर सेल", "साइबर क्राइम"], english: "police cyber cell" },
  { language: "hi", category: "impersonation", terms: ["सरकार", "विभाग", "आयकर विभाग", "आयकर"], english: "government income tax department" },
  { language: "hi", category: "kyc", terms: ["केवाईसी", "केवायसी"], english: "KYC" },
  { language: "hi", category: "kyc", terms: ["आधार", "आधार कार्ड"], english: "Aadhaar" },
  { language: "hi", category: "kyc", terms: ["पैन कार्ड", "पैन"], english: "PAN" },
  { language: "hi", category: "otp", terms: ["ओटीपी", "वन टाइम पासवर्ड", "सत्यापन कोड"], english: "OTP verification code" },
  { language: "hi", category: "otp", terms: ["पासवर्ड", "पिन", "सीवीवी"], english: "password PIN" },
  { language: "hi", category: "urgency", terms: ["तुरंत", "फौरन", "अभी"], english: "immediately" },
  { language: "hi", category: "urgency", terms: ["आज ही", "आज"], english: "today" },
  { language: "hi", category: "urgency", terms: ["अंतिम चेतावनी", "अंतिम सूचना"], english: "last warning" },
  { language: "hi", category: "urgency", terms: ["चेतावनी", "सूचना"], english: "warning notice" },
  { language: "hi", category: "urgency", terms: ["स्थायी रूप से", "हमेशा के लिए"], english: "permanently" },
  { language: "hi", category: "urgency", terms: ["बंद हो जाएगा", "बंद कर दिया जाएगा", "निलंबित"], english: "will be blocked suspended" },
  { language: "hi", category: "urgency", terms: ["बंद", "लंबित", "पेंडिंग"], english: "blocked pending" },
  { language: "hi", category: "payment", terms: ["भुगतान", "पैसे", "पैसा", "राशि", "शुल्क"], english: "payment money amount fee" },
  { language: "hi", category: "payment", terms: ["स्थानांतरित", "ट्रांसफर", "जमा"], english: "transfer deposit" },
  { language: "hi", category: "payment", terms: ["यूपीआई", "क्यूआर कोड"], english: "UPI QR code" },
  { language: "hi", category: "prize", terms: ["पुरस्कार", "इनाम", "लॉटरी", "लकी ड्रॉ"], english: "prize lottery lucky draw" },
  { language: "hi", category: "prize", terms: ["जीत", "जीता", "विजेता"], english: "won winner" },
  { language: "hi", category: "arrest", terms: ["गिरफ्तारी", "गिरफ्तार", "गिरफ़्तार"], english: "arrest" },
  { language: "hi", category: "arrest", terms: ["मुकदमा", "एफआईआर", "कोर्ट"], english: "lawsuit FIR court" },
  { language: "hi", category: "link", terms: ["इस लिंक पर क्लिक करें", "लिंक पर क्लिक करें"], english: "click this link" },
  { language: "hi", category: "link", terms: ["लिंक", "क्लिक"], english: "link click" },
  { language: "hi", category: "link", terms: ["साझा करें", "शेयर करें", "भेजें"], english: "share send" },
  { language: "hi", category: "kyc", terms: ["सत्यापित करें", "सत्यापन", "अपडेट करें"], english: "verify update" },
  { language: "hi", category: "payment", terms: ["निवेश", "मुनाफा", "गारंटी"], english: "investment profit guarantee" },
  { language: "hi", category: "payment", terms: ["नौकरी", "काम", "घर से"], english: "job work from home" },
  { language: "hi", category: "payment", terms: ["पार्सल", "डिलीवरी", "कूरियर"], english: "parcel delivery courier" },
  { language: "hi", category: "payment", terms: ["बिजली", "बिल"], english: "electricity bill" },
  { language: "hi", category: "impersonation", terms: ["खाता संख्या", "खाते", "खाता"], english: "account number account" },
  { language: "hi", category: "payment", terms: ["धोखाधड़ी", "घोटाला", "ठगी"], english: "fraud scam" },
  { language: "hi", category: "urgency", terms: ["नहीं तो", "अन्यथा"], english: "otherwise" },
  { language: "hi", category: "urgency", terms: ["कृपया", "करें", "और", "आपका", "आपके", "आपकी", "है", "होगा", "जाएगा", "के लिए", "में", "पर", "से", "को"], english: "" },

  // Bengali
  { language: "bn", category: "impersonation", terms: ["প্রিয় গ্রাহক", "প্রিয় ব্যবহারকারী"], english: "Dear customer" },
  { language: "bn", category: "impersonation", terms: ["ব্যাংক", "ব্যাঙ্ক"], english: "bank" },
  { language: "bn", category: "impersonation", terms: ["পুলিশ", "সাইবার সেল"], english: "police cyber cell" },
  { language: "bn", category: "impersonation", terms: ["সরকার", "বিভাগ", "আয়কর"], english: "government income tax department" },
  { language: "bn", category: "kyc", terms: ["কেওয়াইসি", "কেওয়াইসি আপডেট"], english: "KYC" },
  { language: "bn", category: "kyc", terms: ["আধার", "আধার কার্ড"], english: "Aadhaar" },
  { language: "bn", category: "otp", terms: ["ওটিপি", "ভেরিফিকেশন কোড"], english: "OTP verification code" },
  { language: "bn", category: "otp", terms: ["পাসওয়ার্ড", "পিন"], english: "password PIN" },
  { language: "bn", category: "urgency", terms: ["এখনই", "অবিলম্বে", "তাড়াতাড়ি"], english: "immediately" },
  { language: "bn", category: "urgency", terms: ["আজ"], english: "today" },
  { language: "bn", category: "urgency", terms: ["চূড়ান্ত সতর্কতা", "শেষ সতর্কতা"], english: "last warning" },
  { language: "bn", category: "urgency", terms: ["সতর্কতা", "বিজ্ঞপ্তি"], english: "warning notice" },
  { language: "bn", category: "urgency", terms: ["স্থায়ীভাবে"], english: "permanently" },
  { language: "bn", category: "urgency", terms: ["বন্ধ হয়ে যাবে", "বন্ধ হবে", "নিলম্বিত"], english: "will be blocked suspended" },
  { language: "bn", category: "urgency", terms: ["বন্ধ", "বাকি আছে", "পেন্ডিং"], english: "blocked pending" },
  { language: "bn", category: "payment", terms: ["টাকা", "পেমেন্ট", "অর্থ", "ফি", "চার্জ"], english: "money payment fee charge" },
  { language: "bn", category: "payment", terms: ["ট্রান্সফার", "জমা"], english: "transfer deposit" },
  { language: "bn", category: "prize", terms: ["পুরস্কার", "লটারি", "লাকি ড্র"], english: "prize lottery lucky draw" },
  { language: "bn", category: "prize", terms: ["জিতেছেন", "বিজয়ী"], english: "won winner" },
  { language: "bn", category: "arrest", terms: ["গ্রেফতার", "গ্রেপ্তার"], english: "arrest" },
  { language: "bn", category: "arrest", terms: ["মামলা", "এফআইআর", "আদালত"], english: "lawsuit FIR court" },
  { language: "bn", category: "link", terms: ["এই লিঙ্কে ক্লিক করুন", "লিঙ্কে ক্লিক করুন"], english: "click this link" },
  { language: "bn", category: "link", terms: ["লিঙ্ক", "ক্লিক"], english: "link click" },
  { language: "bn", category: "link", terms: ["শেয়ার", "পাঠান", "পাঠিয়ে দিন"], english: "share send" },
  { language: "bn", category: "kyc", terms: ["যাচাই", "ভেরিফাই", "আপডেট"], english: "verify update" },
  { language: "bn", category: "payment", terms: ["বিনিয়োগ", "মুনাফা", "গ্যারান্টি"], english: "investment profit guarantee" },
  { language: "bn", category: "payment", terms: ["চাকরি", "কাজ", "বাড়ি থেকে"], english: "job work from home" },
  { language: "bn", category: "payment", terms: ["পার্সেল", "ডেলিভারি", "কুরিয়ার"], english: "parcel delivery courier" },
  { language: "bn", category: "payment", terms: ["বিদ্যুৎ", "বিল"], english: "electricity bill" },
  { language: "bn", category: "impersonation", terms: ["অ্যাকাউন্ট", "অ্যাকাউন্ট নম্বর"], english: "account number account" },
  { language: "bn", category: "payment", terms: ["প্রতারণা", "স্ক্যাম"], english: "fraud scam" },
  { language: "bn", category: "urgency", terms: ["নাহলে", "অন্যথায়"], english: "otherwise" },
  { language: "bn", category: "urgency", terms: ["এবং", "আপনার", "আমাদের", "করুন", "হবে", "আছে", "জন্য", "থেকে", "এই"], english: "" },

  // Tamil
  { language: "ta", category: "impersonation", terms: ["அன்பான வாடிக்கையாளரே", "அன்பான பயனர்"], english: "Dear customer" },
  { language: "ta", category: "impersonation", terms: ["வங்கி"], english: "bank" },
  { language: "ta", category: "impersonation", terms: ["காவல்துறை", "சைபர் க்ரைம்"], english: "police cyber cell" },
  { language: "ta", category: "impersonation", terms: ["அரசு", "துறை", "வருமான வரி"], english: "government income tax department" },
  { language: "ta", category: "kyc", terms: ["கேஒய்சி"], english: "KYC" },
  { language: "ta", category: "kyc", terms: ["ஆதார்", "ஆதார் அட்டை"], english: "Aadhaar" },
  { language: "ta", category: "otp", terms: ["ஓடிபி", "சரிபார்ப்பு குறியீடு"], english: "OTP verification code" },
  { language: "ta", category: "otp", terms: ["கடவுச்சொல்", "பின்"], english: "password PIN" },
  { language: "ta", category: "urgency", terms: ["இப்போதே", "உடனடியாக", "விரைவாக"], english: "immediately" },
  { language: "ta", category: "urgency", terms: ["இன்று"], english: "today" },
  { language: "ta", category: "urgency", terms: ["இறுதி எச்சரிக்கை"], english: "last warning" },
  { language: "ta", category: "urgency", terms: ["எச்சரிக்கை", "அறிவிப்பு"], english: "warning notice" },
  { language: "ta", category: "urgency", terms: ["நிரந்தரமாக"], english: "permanently" },
  { language: "ta", category: "urgency", terms: ["மூடப்படும்", "நிறுத்தப்படும்"], english: "will be blocked suspended" },
  { language: "ta", category: "urgency", terms: ["நிலுவையில்", "பெண்டிங்"], english: "pending" },
  { language: "ta", category: "payment", terms: ["பணம்", "கட்டணம்", "தொகை"], english: "money payment amount" },
  { language: "ta", category: "payment", terms: ["பணம் செலுத்த", "பரிமாற்றம்", "வைப்பு"], english: "payment transfer deposit" },
  { language: "ta", category: "prize", terms: ["பரிசு", "லாட்டரி", "அதிர்ஷ்ட குலுக்கல்"], english: "prize lottery lucky draw" },
  { language: "ta", category: "prize", terms: ["வென்றீர்கள்", "வெற்றியாளர்"], english: "won winner" },
  { language: "ta", category: "arrest", terms: ["கைது", "கைதுசெய்"], english: "arrest" },
  { language: "ta", category: "arrest", terms: ["வழக்கு", "எஃப்ஐஆர்", "நீதிமன்றம்"], english: "lawsuit FIR court" },
  { language: "ta", category: "link", terms: ["இந்த இணைப்பை கிளிக் செய்து", "இணைப்பை கிளிக் செய்"], english: "click this link" },
  { language: "ta", category: "link", terms: ["இணைப்பை", "கிளிக்"], english: "link click" },
  { language: "ta", category: "link", terms: ["பகிரவும்", "அனுப்பவும்"], english: "share send" },
  { language: "ta", category: "kyc", terms: ["சரிபார்க்க", "சரிபார்ப்பு", "புதுப்பிக்க"], english: "verify update" },
  { language: "ta", category: "payment", terms: ["முதலீடு", "லாபம்", "உத்தரவாதம்"], english: "investment profit guarantee" },
  { language: "ta", category: "payment", terms: ["வேலை", "வேலை வாய்ப்பு", "வீட்டிலிருந்து"], english: "job work from home" },
  { language: "ta", category: "payment", terms: ["பார்சல்", "டெலிவரி", "கூரியர்"], english: "parcel delivery courier" },
  { language: "ta", category: "payment", terms: ["மின்சாரம்", "பில்"], english: "electricity bill" },
  { language: "ta", category: "impersonation", terms: ["கணக்கு", "கணக்கு எண்"], english: "account number account" },
  { language: "ta", category: "payment", terms: ["மோசடி"], english: "fraud scam" },
  { language: "ta", category: "urgency", terms: ["இல்லையெனில்", "அல்லது"], english: "otherwise" },
  { language: "ta", category: "urgency", terms: ["மற்றும்", "உங்கள்", "என்று", "உள்ளது", "என", "ஒரு", "இந்த"], english: "" },

  // Telugu
  { language: "te", category: "impersonation", terms: ["ప్రియమైన వినియోగదారు", "ప్రియమైన కస్టమర్"], english: "Dear customer" },
  { language: "te", category: "impersonation", terms: ["బ్యాంకు", "బ్యాంక్"], english: "bank" },
  { language: "te", category: "impersonation", terms: ["పోలీసు", "సైబర్ క్రైమ్"], english: "police cyber cell" },
  { language: "te", category: "impersonation", terms: ["ప్రభుత్వం", "శాఖ", "ఆదాయపు పన్ను"], english: "government income tax department" },
  { language: "te", category: "kyc", terms: ["కేవైసీ"], english: "KYC" },
  { language: "te", category: "kyc", terms: ["ఆధార్", "ఆధార్ కార్డు"], english: "Aadhaar" },
  { language: "te", category: "otp", terms: ["ఓటీపీ", "ధృవీకరణ కోడ్"], english: "OTP verification code" },
  { language: "te", category: "otp", terms: ["పాస్‌వర్డ్", "పిన్"], english: "password PIN" },
  { language: "te", category: "urgency", terms: ["వెంటనే", "ఇప్పుడే", "త్వరగా"], english: "immediately" },
  { language: "te", category: "urgency", terms: ["ఈరోజు"], english: "today" },
  { language: "te", category: "urgency", terms: ["చివరి హెచ్చరిక"], english: "last warning" },
  { language: "te", category: "urgency", terms: ["హెచ్చరిక", "నోటీసు"], english: "warning notice" },
  { language: "te", category: "urgency", terms: ["శాశ్వతంగా"], english: "permanently" },
  { language: "te", category: "urgency", terms: ["మూసివేయబడుతుంది", "నిలిపివేయబడుతుంది"], english: "will be blocked suspended" },
  { language: "te", category: "urgency", terms: ["పెండింగ్‌లో", "పెండింగ్"], english: "pending" },
  { language: "te", category: "payment", terms: ["డబ్బు", "చెల్లింపు", "మొత్తం", "రుసుము"], english: "money payment amount fee" },
  { language: "te", category: "payment", terms: ["బదిలీ", "జమా"], english: "transfer deposit" },
  { language: "te", category: "prize", terms: ["బహుమతి", "లాటరీ", "లక్కీ డ్రా"], english: "prize lottery lucky draw" },
  { language: "te", category: "prize", terms: ["గెలుచుకున్నారు", "విజేత"], english: "won winner" },
  { language: "te", category: "arrest", terms: ["అరెస్టు", "అరెస్ట్"], english: "arrest" },
  { language: "te", category: "arrest", terms: ["కేసు", "ఎఫ్ఐఆర్", "కోర్టు"], english: "lawsuit FIR court" },
  { language: "te", category: "link", terms: ["ఈ లింక్‌ను క్లిక్ చేయండి", "లింక్‌ను క్లిక్ చేయండి"], english: "click this link" },
  { language: "te", category: "link", terms: ["లింక్‌ను", "క్లిక్"], english: "link click" },
  { language: "te", category: "link", terms: ["షేర్ చేయండి", "పంపండి"], english: "share send" },
  { language: "te", category: "kyc", terms: ["ధృవీకరించండి", "ధృవీకరణ", "అప్‌డేట్"], english: "verify update" },
  { language: "te", category: "payment", terms: ["పెట్టుబడి", "లాభం", "హామీ"], english: "investment profit guarantee" },
  { language: "te", category: "payment", terms: ["ఉద్యోగం", "పని", "ఇంటి నుండి"], english: "job work from home" },
  { language: "te", category: "payment", terms: ["పార్సెల్", "డెలివరీ", "కూరియర్"], english: "parcel delivery courier" },
  { language: "te", category: "payment", terms: ["విద్యుత్", "బిల్లు"], english: "electricity bill" },
  { language: "te", category: "impersonation", terms: ["ఖాతా", "ఖాతా నంబర్"], english: "account number account" },
  { language: "te", category: "payment", terms: ["మోసం"], english: "fraud scam" },
  { language: "te", category: "urgency", terms: ["లేకపోతే"], english: "otherwise" },
  { language: "te", category: "urgency", terms: ["మరియు", "మీ", "ఉంది", "అని", "ఈ"], english: "" },
];

export interface GlossResult {
  gloss: string;
  categories: GlossCategory[];
  matchedTerms: string[];
  coverage: number;
  partial: boolean;
}

const CATEGORY_ORDER: GlossCategory[] = [
  "otp",
  "kyc",
  "urgency",
  "impersonation",
  "payment",
  "prize",
  "arrest",
  "link",
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function translateForAnalysis(text: string, detection = detectLanguage(text)): GlossResult {
  if (detection.code === "en") {
    return { gloss: text, categories: [], matchedTerms: [], coverage: 0, partial: false };
  }

  const entries = GLOSSARY.filter((entry) => entry.language === detection.code).sort(
    (a, b) => longestTerm(b) - longestTerm(a)
  );

  let gloss = text;
  const categories = new Set<GlossCategory>();
  const matchedLabels = new Set<string>();
  let matchedCharacters = 0;

  for (const entry of entries) {
    for (const term of entry.terms) {
      const regex = new RegExp(escapeRegex(term), "gi");
      const matches = gloss.match(regex);
      if (!matches) continue;
      if (entry.english) {
        matchedCharacters += term.length * matches.length;
        categories.add(entry.category);
        matchedLabels.add(CATEGORY_LABEL[entry.category]);
        gloss = gloss.replace(regex, entry.english);
      } else {
        gloss = gloss.replace(regex, " ");
      }
    }
  }

  const nativeCharacters = (text.match(/[^\x00-\x7F]/g) ?? []).length || 1;
  const coverage = Math.min(1, matchedCharacters / nativeCharacters);
  const orderedCategories = CATEGORY_ORDER.filter((category) => categories.has(category));

  if (orderedCategories.length > 0) {
    gloss += `\n\n[Regional-language scan: the message includes ${orderedCategories
      .map((category) => CATEGORY_LABEL[category])
      .join(", ")}.]`;
  }

  return {
    gloss: gloss.replace(/[ \t]+/g, " ").trim(),
    categories: orderedCategories,
    matchedTerms: [...matchedLabels],
    coverage: Math.round(coverage * 100) / 100,
    partial: coverage < 0.45 || orderedCategories.length === 0,
  };
}

function longestTerm(entry: GlossEntry): number {
  return Math.max(...entry.terms.map((term) => term.length));
}

export function toLanguageMeta(
  detection: LanguageDetection,
  result: GlossResult
): LanguageMeta {
  return {
    code: detection.code,
    label: detection.label,
    script: detection.script,
    translated: result.gloss,
    partial: result.partial,
    matchedTerms: result.matchedTerms,
    coverage: result.coverage,
  };
}
