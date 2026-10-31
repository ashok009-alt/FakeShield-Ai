export interface LanguageSample {
  id: string;
  label: string;
  language: string;
  native: string;
  text: string;
}

/** Illustrative scam texts written for this demo, one per supported script. */
export const languageSamples: LanguageSample[] = [
  {
    id: "hi-kyc",
    label: "Fake bank KYC",
    language: "Hindi",
    native: "हिन्दी",
    text: `प्रिय ग्राहक, आपका बैंक खाता आज ही बंद हो जाएगा क्योंकि केवाईसी लंबित है। तुरंत इस लिंक पर क्लिक करें और ओटीपी साझा करें। अन्यथा खाता स्थायी रूप से बंद कर दिया जाएगा। - ग्राहक सेवा`,
  },
  {
    id: "bn-lottery",
    label: "Lottery win",
    language: "Bengali",
    native: "বাংলা",
    text: `প্রিয় গ্রাহক, আপনি লটারি জিতেছেন! পুরস্কার পেতে আজই আপনার আধার এবং ওটিপি পাঠান। এটি শেষ সতর্কতা, নাহলে পুরস্কার বাতিল হবে।`,
  },
  {
    id: "ta-electricity",
    label: "Electricity cut",
    language: "Tamil",
    native: "தமிழ்",
    text: `அன்பான வாடிக்கையாளரே, உங்கள் மின்சாரம் இன்று இரவு துண்டிக்கப்படும். பில் நிலுவையில் உள்ளது. உடனடியாக இந்த இணைப்பை கிளிக் செய்து பணம் செலுத்துங்கள், இல்லையெனில் மின் இணைப்பு நிறுத்தப்படும்.`,
  },
  {
    id: "te-arrest",
    label: "Digital arrest",
    language: "Telugu",
    native: "తెలుగు",
    text: `ప్రియమైన వినియోగదారు, మీ ఆధార్ కార్డుపై కేసు నమోదైంది. పోలీసు అరెస్టు చేస్తారు. వెంటనే ఓటీపీ ఇవ్వండి మరియు డబ్బు బదిలీ చేయండి, లేకపోతే కోర్టుకు వెళ్తారు.`,
  },
  {
    id: "hinglish",
    label: "Hinglish KYC",
    language: "Hinglish",
    native: "Hinglish",
    text: `Aapka khata band ho jayega. Turant OTP bhejo aur link kholo, paisa transfer karo abhi. Customer care se baat karo warna account permanently block ho jayega.`,
  },
  {
    id: "gu-untranslated",
    label: "Gujarati message",
    language: "Gujarati",
    native: "ગુજરાતી",
    text: `પ્રિય ગ્રાહક, તમારું ખાતું બંધ થઈ જશે. તરત જ લિંક પર ક્લિક કરો અને OTP મોકલો. આ તમારી છેલ્લી ચેતવણી છે.`,
  },
];
