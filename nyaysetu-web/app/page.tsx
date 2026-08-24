"use client";
interface HistoryItem {
  id: number;
  query: string;
  reply: string;
  citations?: string[];
  confidence_score?: number;
  created_at?: string;
}


import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { History, X, Trash2, Plus, LogOut, Globe, ChevronDown, Sun, Moon, FileText, Scale, Volume2, VolumeX, ShieldAlert, Send, User, Copy, Check, ThumbsUp, Home, Shield, Briefcase } from "lucide-react";
import ReactMarkdown from "react-markdown";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const TRANSLATIONS: any = {
  en: {
    tagline: "YOUR AI LEGAL ASSISTANT",
    newChat: "New Chat",
    history: "History",
    recentChats: "Past Consultations",
    noHistory: "No past consultations yet.",
    clearAll: "Clear All",
    placeholder: "E.g., My landlord won't return my deposit...",
    send: "Send",
    generateNotice: "Generate Legal Notice",
    draftFIR: "Draft Police Complaint (FIR)",
    listen: "Listen to Answer",
    stopListen: "Stop Audio",
    voiceInput: "Voice Input (Speak)",
    listening: "Listening...",
    citedAuthorities: "Cited Authorities",
    emptyState: "Ask a legal question to get started...",
    loading: "NyaySetu is reviewing the laws...",
    light: "LIGHT",
    dark: "DARK",
    welcome: "Welcome to NyaySetu",
    loginSub: "Log in to access your secure legal workspace.",
    email: "Email Address",
    password: "Password",
    loginBtn: "Sign In to Workspace",
    noAccount: "Don't have an account? Sign up",
    orUseEmail: "Or use email",
    logout: "Log Out",
    nalsa: "NALSA Legal Aid",
    suggest1Title: "Rental Dispute",
    suggest1Desc: "My landlord won't return my deposit",
    suggest2Title: "Consumer Rights",
    suggest2Desc: "I bought a defective product and the seller refuses a refund",
    suggest3Title: "Workplace Issue",
    suggest3Desc: "I was fired from my job without any prior notice",
    suggest4Title: "RTI Request",
    suggest4Desc: "Draft a formal RTI request to check on my pending passport",
    howCanIHelp: "How can I help you today?",
    helpSub: "I can answer legal questions, draft notices, and guide you."
  },
  hi: {
    tagline: "आपका एआई कानूनी सहायक",
    placeholder: "जैसे, मेरे मकान मालिक ने जमा राशि वापस नहीं की...",
    send: "भेजें",
    generateNotice: "कानूनी नोटिस बनाएं",
    citedAuthorities: "उद्धृत प्राधिकरण",
    emptyState: "शुरू करने के लिए एक कानूनी प्रश्न पूछें...",
    loading: "न्यायसेतु कानूनों की समीक्षा कर रहा है...",
    light: "लाइट",
    dark: "डार्क",
    welcome: "न्यायसेतु में आपका स्वागत है",
    loginSub: "अपने सुरक्षित कानूनी कार्यक्षेत्र तक पहुंचने के लिए लॉग इन करें।",
    email: "ईमेल पता",
    password: "पासवर्ड",
    loginBtn: "कार्यक्षेत्र में लॉग इन करें",
    noAccount: "क्या आपके पास खाता नहीं है? साइन अप करें",
    orUseEmail: "या ईमेल का उपयोग करें",
    logout: "लॉग आउट",
    nalsa: "नालसा कानूनी सहायता",
    suggest1Title: "किराया विवाद",
    suggest1Desc: "मेरा मकान मालिक मेरी जमा राशि वापस नहीं कर रहा है",
    suggest2Title: "उपभोक्ता अधिकार",
    suggest2Desc: "मैंने एक दोषपूर्ण उत्पाद खरीदा और विक्रेता धनवापसी से इनकार कर रहा है",
    suggest3Title: "कार्यस्थल की समस्या",
    suggest3Desc: "मुझे बिना किसी पूर्व सूचना के मेरी नौकरी से निकाल दिया गया",
    suggest4Title: "आरटीआई अनुरोध",
    suggest4Desc: "मेरे लंबित पासपोर्ट की जांच के लिए औपचारिक आरटीआई अनुरोध का मसौदा तैयार करें",
    howCanIHelp: "आज मैं आपकी कैसे मदद कर सकता हूँ?",
    helpSub: "मैं कानूनी सवालों के जवाब दे सकता हूँ, नोटिस का मसौदा तैयार कर सकता हूँ, और आपका मार्गदर्शन कर सकता हूँ।"
  },
  mr: {
    tagline: "तुमचा एआय कायदेशीर सहाय्यक",
    placeholder: "उदा., माझा घरमालक माझी ठेव परत करत नाही...",
    send: "पाठवा",
    generateNotice: "कायदेशीर नोटीस तयार करा",
    draftFIR: "पोलीस तक्रार (FIR) मसुदा तयार करा",
    listen: "उत्तर ऐका",
    stopListen: "ऑडिओ थांबवा",
    voiceInput: "बोलून टाईप करा",
    listening: "ऐकत आहे...",
    citedAuthorities: "नमूद केलेले कायदे",
    emptyState: "सुरू करण्यासाठी कायदेशीर प्रश्न विचारा...",
    loading: "न्यायसेतू कायद्यांचे पुनरावलोकन करत आहे...",
    light: "प्रकाश",
    dark: "अंधार",
    welcome: "न्यायसेतूमध्ये आपले स्वागत आहे",
    loginSub: "तुमच्या सुरक्षित कायदेशीर कार्यक्षेत्रात प्रवेश करण्यासाठी लॉग इन करा.",
    email: "ईमेल पत्ता",
    password: "पासवर्ड",
    loginBtn: "कार्यक्षेत्रात लॉग इन करा",
    noAccount: "तुमचे खाते नाही का? साइन अप करा",
    orUseEmail: "किंवा ईमेल वापरा",
    logout: "लॉग आउट",
    nalsa: "नालसा कायदेशीर मदत",
    suggest1Title: "भाडे विवाद",
    suggest1Desc: "माझा घरमालक माझी ठेव परत करत नाही",
    suggest2Title: "ग्राहक हक्क",
    suggest2Desc: "मी एक सदोष उत्पादन खरेदी केले आणि विक्रेता परतावा देण्यास नकार देत आहे",
    suggest3Title: "कार्यस्थळाची समस्या",
    suggest3Desc: "कोणत्याही पूर्वसूचनेशिवाय मला माझ्या नोकरीवरून काढून टाकण्यात आले",
    suggest4Title: "आरटीआय विनंती",
    suggest4Desc: "माझ्या प्रलंबित पासपोर्टची चौकशी करण्यासाठी औपचारिक आरटीआई विनंती तयार करा",
    howCanIHelp: "आज मी तुम्हाला कशी मदत करू शकतो?",
    helpSub: "मी कायदेशीर प्रश्नांची उत्तरे देऊ शकतो, नोटीस तयार करू शकतो आणि तुम्हाला मार्गदर्शन करू शकतो."
  }
};

const LANGUAGE_LABELS = { en: "English", hi: "हिंदी", mr: "मराठी" };

const LOGO_SRC = "data:image/jpeg;base64,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";

function Logo({ size = 44 }: { size?: number }) {
  return (
    <img
      src={LOGO_SRC}
      alt="NyaySetu logo"
      width={size}
      height={size}
      style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
    />
  );
}

export default function NyaySetuPreview() {
  // Trigger re-render translation

  const [input, setInput] = useState("");
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isGeneratingFIR, setIsGeneratingFIR] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string, citations?: string[], confidence_score?: number}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState<"en"|"hi"|"mr">("en");
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  useEffect(() => {
    const t = localStorage.getItem("nyaysetu_token");
    if (t) {
      setToken(t);
      loadHistory(t);
    }
  }, []);

  const loadHistory = async (t: string) => {
    try {
      const res = await fetch("https://nyaysetu-1qbc.onrender.com/api/history", {
        headers: { "Authorization": `Bearer ${t}` }
      });
      if (res.ok) {
        const hist: HistoryItem[] = await res.json();
        setHistoryList(hist);
      }
    } catch(e) {}
  };

  const openHistoryDrawer = () => {
    setIsHistoryOpen(true);
    const t = token || localStorage.getItem("nyaysetu_token");
    if (t) {
      loadHistory(t);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setMessages([
      { role: "user", content: item.query },
      { role: "ai", content: item.reply, citations: item.citations, confidence_score: item.confidence_score }
    ]);
    setIsHistoryOpen(false);
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all consultation history?")) return;
    setMessages([]);
    setHistoryList([]);
    setIsHistoryOpen(false);
    try {
      if (token) {
        await fetch("https://nyaysetu-1qbc.onrender.com/api/history", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    } catch (e) {}
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://nyaysetu-1qbc.onrender.com/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("nyaysetu_token", data.access_token);
        setToken(data.access_token);
        loadHistory(data.access_token);
      } else {
        alert(data.detail || "Authentication failed");
      }
    } catch (e) {
      alert("Backend not reachable");
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setIsHistoryOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("nyaysetu_token");
    localStorage.removeItem("token");
    setToken(null);
    setMessages([]);
  };

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showGooglePicker, setShowGooglePicker] = useState(false);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };


  

  const handleLanguageChange = (lang: "en" | "hi" | "mr") => {
    setLanguage(lang);
    setLangMenuOpen(false);
  };

  const isDark = theme === "dark";
  const t = TRANSLATIONS[language];

  const palette = {
    pageBg: isDark ? "#160B0D" : "#F6F1E7",
    cardBg: isDark ? "#1F1113" : "#FFFFFF",
    headerBg: isDark ? "#1F1113" : "#FFFFFF",
    border: isDark ? "#3A2226" : "#EAE2D2",
    heading: isDark ? "#F3E7D0" : "#3A1114",
    subtext: isDark ? "#C9A9AC" : "#7A6A55",
    userBubbleBg: isDark ? "#7A1F26" : "#F2C14E",
    userBubbleText: isDark ? "#F7E9DA" : "#3A2A02",
    aiBubbleBg: isDark ? "#3B171B" : "#FBE9C6",
    aiBubbleText: isDark ? "#F1E2D8" : "#4A3A16",
    accent: isDark ? "#7A1F26" : "#E4B441",
    accentText: isDark ? "#F7E9DA" : "#3A2A02",
    pillBg: isDark ? "#2A1518" : "#FFFFFF",
    pillBorder: isDark ? "#4A2B30" : "#E4D9C2",
    inputBg: isDark ? "#241315" : "#FFFFFF",
    inputText: isDark ? "#F1E2D8" : "#1F1B16",
    citationBorder: isDark ? "#7A1F26" : "#E4B441",
    citationText: isDark ? "#C9A9AC" : "#7A6A55",
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://nyaysetu-1qbc.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ query: input, message: input, language: language }),
      });

      const rawText = await response.text();
      let data: any = null;
      try { data = JSON.parse(rawText); } catch { data = { reply: rawText }; }

      if (response.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        setMessages([]);
        return;
      }
      
      if (!response.ok) {
        setMessages([...newMessages, { 
          role: "ai", 
          content: `🚨 Error ${response.status}: Please try again in a moment.` 
        }]);
        setIsLoading(false);
        return;
      }

      const aiReply = data.reply || "Something went wrong. Please try again.";
      setMessages([...newMessages, { 
        role: "ai", 
        content: aiReply,
        citations: data.citations,
        confidence_score: data.confidence_score
      }]);
      
      const newHistItem: HistoryItem = {
        id: Date.now(),
        query: input,
        reply: aiReply,
        citations: data.citations,
        confidence_score: data.confidence_score,
        created_at: "Just now"
      };
      setHistoryList(prev => [newHistItem, ...prev]);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setMessages([...newMessages, { role: "ai", content: "Unable to reach the NyaySetu server. Please check your connection and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Strip markdown formatting before reading aloud
    const clean = text
      .replace(/[*#_`~>|\-]/g, " ")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    
    if (language === "hi") {
      utterance.lang = "hi-IN";
    } else if (language === "mr") {
      utterance.lang = "mr-IN";
    } else {
      utterance.lang = "en-IN";
    }
    
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    
    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(index);
  };

  const handleGenerateFIR = async (text: string) => {
    if (isGeneratingFIR) return;
    setIsGeneratingFIR(true);
    try {
      const res = await fetch("https://nyaysetu-1qbc.onrender.com/api/generate-fir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_description: text, language: language })
      });
      
      if (!res.ok) throw new Error("Failed to generate Police FIR Complaint PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "NyaySetu_Police_FIR_Complaint.pdf";
      a.click();
    } catch (err) {
      console.error(err);
      alert("Error generating the Police FIR Complaint document.");
    } finally {
      setIsGeneratingFIR(false);
    }
  };

    const getActionType = (msg: any): "civil" | "criminal" | "none" => {
    if (!msg || !msg.content || msg.content.includes("🚨")) return "none";
    const text = (msg.content + " " + (msg.citations || []).join(" ")).toLowerCase();
    
    if (text.length < 50 && (text.includes("hello") || text.includes("how can i help") || text.includes("welcome"))) {
      return "none";
    }

    const crimeWords = [
      "stolen", "theft", "snatch", "robbery", "murder", "kidnap", "assault", "harass",
      "cyber", "scam", "fir", "police station", "cctns", "imei", "bns", "ipc", "bnss",
      "bharatiya_nyaya_sanhita", "extortion", "attack", "violence", "threat", "चोरी", "धोखाधड़ी", "धमकी", "अपराध", "गुन्हा", "पोलीस", "तक्रार"
    ];
    
    const civilWords = [
      "rent", "tenant", "landlord", "deposit", "consumer", "refund", "defective",
      "salary", "eviction", "contract", "agreement", "lease", "flat", "cheque",
      "maharashtra_rent_control", "consumer_protection", "transfer_of_property",
      "किराया", "जमानत", "फ्लैट", "मालिक", "उपभोक्ता"
    ];

    const hasCrime = crimeWords.some(w => text.includes(w));
    const hasCivil = civilWords.some(w => text.includes(w));

    // If it is a civil tenancy/consumer/contract matter, strictly show Legal Notice
    if (hasCivil && !text.includes("assault") && !text.includes("stolen") && !text.includes("murder") && !text.includes("snatch")) {
      return "civil";
    }

    // If it is a criminal matter (theft, stolen items, assault, harassment, cyber crime), strictly show Police FIR
    if (hasCrime) {
      return "criminal";
    }

    if (msg.citations && msg.citations.length > 0) {
      if (msg.citations.some((c: string) => c.toLowerCase().includes("nyaya_sanhita"))) {
        return "criminal";
      }
      return "civil";
    }

    return "none";
  };

const handleGenerateNotice = async (text: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("https://nyaysetu-1qbc.onrender.com/api/generate-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_description: text, language: language })
      });
      
      if (!res.ok) throw new Error("Failed to generate PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "NyaySetu_Demand_Notice.pdf";
      a.click();
    } catch (err) {
      console.error(err);
      alert("Error generating the legal notice.");
    } finally {
      setIsGenerating(false);
    }
  };

  
  if (!token) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-4 z-50 overflow-hidden bg-cover bg-center" style={{ background: palette.pageBg }}>
        
        {/* Sleek CSS Grid Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px', color: palette.heading }}>
        </div>

        {/* Top Controls on Login Screen */}
        <div className="absolute top-6 right-6 flex gap-3 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold tracking-wide notranslate backdrop-blur-md hover:bg-black/5 dark:hover:bg-white/10 transition-all shadow-sm"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: palette.pillBorder, color: palette.heading }}
              >
                <Globe size={14} />
                {LANGUAGE_LABELS[language]}
                <ChevronDown size={14} className={`transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {langMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 rounded-xl border shadow-2xl overflow-hidden z-10 notranslate backdrop-blur-xl animate-in fade-in slide-in-from-top-2"
                  style={{ background: isDark ? 'rgba(31, 17, 19, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: palette.pillBorder }}
                >
                  {Object.entries(LANGUAGE_LABELS).map(([lang, label]) => (
                    <button
                      key={lang}
                        onClick={() => handleLanguageChange(lang as "en"|"hi"|"mr")}
                        className="w-full text-left px-4 py-3 text-sm transition-colors font-medium hover:bg-black/5 dark:hover:bg-white/10"
                      style={{
                        color: palette.heading,
                        background: lang === language ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : "transparent",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold tracking-wide notranslate backdrop-blur-md hover:bg-black/5 dark:hover:bg-white/10 transition-all shadow-sm"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: palette.pillBorder, color: palette.heading }}
            >
              {isDark ? <Moon size={14} /> : <Sun size={14} />}
              {isDark ? t.dark : t.light}
            </button>
        </div>

        {/* Enhanced Decorative Background Blobs */}
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-40 animate-pulse pointer-events-none transition-all duration-1000" style={{ background: palette.accent }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-30 pointer-events-none transition-all duration-1000" style={{ background: palette.heading }}></div>

        {/* The Glassmorphism Login Card */}
        <form onSubmit={handleAuth} className="relative z-10 p-10 sm:p-12 rounded-[2.5rem] w-full max-w-[440px] flex flex-col gap-7 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000" 
              style={{ 
                background: isDark ? 'rgba(20, 10, 12, 0.65)' : 'rgba(255, 255, 255, 0.7)', 
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 40px 80px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)'
              }}>
          
          <div className="flex justify-center mb-1 relative">
            <div className="absolute inset-0 bg-white/20 dark:bg-white/5 blur-2xl rounded-full scale-150"></div>
            <div className="relative transform hover:scale-105 transition-transform duration-500 shadow-2xl rounded-full">
              <Logo size={72} />
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight mb-2 bg-clip-text text-transparent" 
                style={{ backgroundImage: `linear-gradient(135deg, ${palette.heading}, ${palette.accent})` }}>
              {t.welcome}
            </h2>
            <p className="text-sm font-semibold opacity-70 tracking-wide" style={{ color: palette.subtext }}>{t.loginSub}</p>
          </div>
          
          {/* Official Google OAuth Button */}
          <div className="flex justify-center w-full mt-1 transform hover:scale-[1.02] transition-transform duration-300">
            <GoogleLogin
              onSuccess={async (credentialResponse: any) => {
                try {
                  const res = await fetch("https://nyaysetu-1qbc.onrender.com/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: credentialResponse.credential })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("nyaysetu_token", data.access_token);
                    setToken(data.access_token);
                    loadHistory(data.access_token);
                  } else {
                    alert("Google Login Failed on Server");
                  }
                } catch(e) {
                  alert("Google Login Error");
                }
              }}
              onError={() => alert("Google Login Failed")}
              useOneTap
              theme={isDark ? "filled_black" : "outline"}
              size="large"
              shape="pill"
              text="continue_with"
              width="340"
            />
          </div>

          <div className="flex items-center gap-4 mt-2 mb-2">
            <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold opacity-50" style={{ color: palette.subtext }}>{t.orUseEmail}</span>
            <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="email" 
                placeholder={t.email} 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                className="w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 transition-all shadow-inner backdrop-blur-sm placeholder:font-medium placeholder:opacity-60" 
                style={{ 
                  background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', 
                  color: palette.inputText, 
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}
                required
              />
            </div>
            <div className="relative group">
              <input 
                type="password" 
                placeholder={t.password} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                className="w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 transition-all shadow-inner backdrop-blur-sm placeholder:font-medium placeholder:opacity-60" 
                style={{ 
                  background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', 
                  color: palette.inputText, 
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 mt-2 rounded-2xl text-white font-extrabold tracking-wide shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
            style={{ 
              background: `linear-gradient(135deg, ${palette.accent}, ${isDark ? '#5A151A' : '#D19C2A'})`,
              boxShadow: `0 10px 25px -5px ${palette.accent}80`
            }}
          >
            {authMode === "login" ? t.loginBtn : "Create Account"}
          </button>
          
          <button 
            type="button" 
            onClick={() => setAuthMode(m => m === "login" ? "register" : "login")} 
            className="text-xs font-bold hover:underline opacity-70 hover:opacity-100 transition-opacity mx-auto"
            style={{ color: palette.heading }}
          >
            {authMode === "login" ? t.noAccount : "Already have an account? Log in"}
          </button>
        </form>

        <div className="absolute bottom-8 flex gap-6 text-[10px] font-black tracking-[0.3em] opacity-30 animate-in fade-in duration-1000 delay-500" style={{ color: palette.heading }}>
          <span>POSTGRESQL DB</span>
          <span>•</span>
          <span>END-TO-END ENCRYPTED</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans transition-colors duration-300 relative overflow-hidden"
      style={{ background: palette.pageBg }}
    >
      {/* Sleek CSS Grid Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px', color: palette.heading }}>
      </div>

      {/* Enhanced Decorative Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-40 animate-pulse pointer-events-none transition-all duration-1000 z-0" style={{ background: palette.accent }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-30 pointer-events-none transition-all duration-1000 z-0" style={{ background: palette.heading }}></div>

      <div
        className="w-full max-w-4xl rounded-[2.5rem] flex flex-col h-[85vh] overflow-hidden transition-all duration-500 relative z-10 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000"
        style={{ 
          background: isDark ? 'rgba(20, 10, 12, 0.65)' : 'rgba(255, 255, 255, 0.7)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'}`,
          boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 40px 80px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
        }}
      >
        <div
          className="flex items-center justify-between px-3 py-2.5 sm:p-5 border-b z-20 backdrop-blur-md"
          style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        >
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 notranslate flex-shrink min-w-0">
            <div className="w-8 h-8 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center">
              <Logo size={32} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold leading-tight truncate" style={{ color: palette.heading }}>
                NyaySetu
              </h1>
              <p className="hidden sm:block text-[11px] tracking-wide font-medium truncate" style={{ color: palette.subtext }}>
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Symmetrical Floating Icon / Pill Bar */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button 
              onClick={openHistoryDrawer}
              className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold notranslate transition-all hover:scale-105 active:scale-95 relative shadow-sm"
              style={{ borderColor: palette.pillBorder, color: palette.heading, background: palette.pillBg }}
              title="Consultation History"
            >
              <History size={13} />
              <span className="hidden sm:inline sm:ml-1.5">{t.history || "History"}</span>
              {historyList.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 sm:hidden animate-pulse"></span>
              )}
            </button>

            <button 
              onClick={handleNewChat}
              className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold notranslate transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{ borderColor: palette.pillBorder, color: palette.heading, background: palette.pillBg }}
              title="New Conversation"
            >
              <Plus size={13} />
              <span className="hidden sm:inline sm:ml-1.5">{t.newChat || "New Chat"}</span>
            </button>

            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold notranslate transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{ borderColor: palette.pillBorder, color: palette.heading, background: palette.pillBg }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline sm:ml-1.5">Log Out</span>
            </button>

            <a 
              href="https://nalsa.gov.in" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold notranslate transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{ borderColor: palette.pillBorder, color: palette.heading, background: palette.pillBg }}
              title="NALSA Human Legal Aid"
            >
              <Scale size={13} />
              <span className="hidden sm:inline sm:ml-1.5">NALSA Legal Aid</span>
            </a>

            <div className="relative">
              <button
                onClick={() => setLangMenuOpen((o) => !o)}
                className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold notranslate transition-all hover:scale-105 active:scale-95 shadow-sm"
                style={{ background: palette.pillBg, borderColor: palette.pillBorder, color: palette.heading }}
                title="Change Language"
              >
                <Globe size={13} className="hidden sm:inline" />
                <span className="hidden sm:inline sm:ml-1.5">{LANGUAGE_LABELS[language]}</span>
                <span className="sm:hidden font-bold text-[10px] uppercase">{language}</span>
                <ChevronDown size={11} className="hidden sm:inline sm:ml-1" />
              </button>
              {langMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-32 rounded-xl border shadow-2xl overflow-hidden z-30 notranslate backdrop-blur-xl animate-in fade-in slide-in-from-top-2"
                  style={{ background: isDark ? 'rgba(31, 17, 19, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderColor: palette.pillBorder }}
                >
                  {Object.entries(LANGUAGE_LABELS).map(([lang, label]) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang as "en"|"hi"|"mr")}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{
                        color: palette.heading,
                        background: lang === language ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : "transparent",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold notranslate transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{ background: palette.pillBg, borderColor: palette.pillBorder, color: palette.heading }}
              title="Toggle Light/Dark Theme"
            >
              {isDark ? <Moon size={13} /> : <Sun size={13} />}
              <span className="hidden sm:inline sm:ml-1.5">{isDark ? t.dark : t.light}</span>
            </button>
          </div>
          <div id="google_translate_element" style={{ display: 'none' }}></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full mt-8 sm:mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="w-16 h-16 rounded-2xl mb-6 shadow-sm flex items-center justify-center border" style={{ background: palette.cardBg, borderColor: palette.border }}>
                 <Logo size={36} />
               </div>
               <h2 className="text-2xl font-bold mb-2 tracking-tight text-center px-4" style={{ color: palette.heading }}>{t.howCanIHelp}</h2>
               <p className="text-sm mb-10 opacity-70 text-center px-4" style={{ color: palette.subtext }}>{t.helpSub}</p>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                 {[
                    { icon: <Home size={18} />, text: "My landlord won't return my deposit", title: "Rental Dispute" },
                    { icon: <Shield size={18} />, text: "I bought a defective product and the seller refuses a refund", title: "Consumer Rights" },
                    { icon: <Briefcase size={18} />, text: "I was fired from my job without any prior notice", title: "Workplace Issue" },
                    { icon: <FileText size={18} />, text: "Draft a formal RTI request to check on my pending passport", title: "RTI Request" }
                 ].map((prompt, i) => (
                   <button
                     key={i}
                     onClick={() => setInput(prompt.text)}
                     className="flex flex-col text-left p-5 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm group"
                     style={{ 
                       background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', 
                       borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
                       color: palette.heading,
                       boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                     }}
                   >
                     <div className="flex items-center gap-2 mb-2" style={{ color: palette.accent }}>
                       {prompt.icon}
                       <span className="font-semibold text-sm">{prompt.title}</span>
                     </div>
                     <span className="text-xs opacity-70 leading-relaxed">{prompt.text}</span>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 max-w-4xl mx-auto w-full group ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className="flex-shrink-0 mt-1">
                {msg.role === "user" ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ background: palette.accent, color: palette.accentText }}>
                    <User size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border" style={{ background: palette.cardBg, borderColor: palette.border }}>
                    <Logo size={20} />
                  </div>
                )}
              </div>

              <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[92%] sm:max-w-[85%]`}>
                <div
                  className="p-4 rounded-2xl leading-relaxed shadow-sm relative group-hover:shadow-lg shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] backdrop-blur-md transition-shadow"
                  style={{
                    background: msg.role === "user" ? palette.userBubbleBg : (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)'),
                    color: msg.role === "user" ? palette.userBubbleText : palette.aiBubbleText,
                    borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                    borderTopLeftRadius: msg.role === "ai" ? 4 : 16,
                  }}
                >
                  <div className="space-y-2 text-[14px] sm:text-[15px] leading-relaxed">
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
              
              {msg.role === "ai" && (
                <div className="flex items-center gap-1 mt-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity px-1">
                  <button 
                    onClick={() => handleSpeak(msg.content, index)} 
                    className="p-1.5 rounded transition-colors text-xs flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10" 
                    style={{ color: speakingIndex === index ? palette.accent : palette.subtext }}
                    title={speakingIndex === index ? (t.stopListen || "Stop Audio") : (t.listen || "Listen to Answer")}
                  >
                    {speakingIndex === index ? <VolumeX size={14} className="text-amber-500 animate-pulse" /> : <Volume2 size={14} />}
                  </button>
                  <button onClick={() => handleCopy(msg.content, index)} className="p-1.5 rounded transition-colors text-xs flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10" style={{ color: palette.subtext }}>
                    {copiedIndex === index ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <button className="p-1.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: palette.subtext }}>
                    <ThumbsUp size={14} />
                  </button>
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div
                  className="mt-2 pl-3 border-l-2 text-xs italic max-w-[80%]"
                  style={{ borderColor: palette.citationBorder, color: palette.citationText }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1 notranslate">
                    <p className="font-semibold not-italic">{t.citedAuthorities}</p>
                    {msg.confidence_score ? (
                      <span className="not-italic bg-green-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center shadow-sm whitespace-nowrap">
                        Match Confidence: {msg.confidence_score}%
                      </span>
                    ) : null}
                  </div>
                  <ul className="space-y-0.5">
                    {msg.citations.map((cite, i) => (
                      <li key={i}>{cite.replace("data/", "")}</li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.role === "ai" && getActionType(msg) !== "none" && (
                <div className="mt-3 flex items-center gap-2">
                  {getActionType(msg) === "civil" && (
                    <button
                      onClick={() => handleGenerateNotice(msg.content)}
                      disabled={isGenerating}
                      className="flex items-center w-fit gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                      style={{ background: palette.accent, color: palette.accentText }}
                    >
                      <FileText size={15} />
                      {isGenerating ? "Drafting Notice..." : (t.generateNotice || "Generate Legal Notice")}
                    </button>
                  )}

                  {getActionType(msg) === "criminal" && (
                    <button
                      onClick={() => handleGenerateFIR(msg.content)}
                      disabled={isGeneratingFIR}
                      className="flex items-center w-fit gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] border"
                      style={{ 
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 
                        color: palette.heading, 
                        borderColor: palette.pillBorder 
                      }}
                    >
                      <ShieldAlert size={15} className="text-red-500" />
                      {isGeneratingFIR ? "Drafting Complaint..." : (t.draftFIR || "Draft Police FIR (BNSS)")}
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-4xl mx-auto w-full">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border animate-pulse" style={{ background: palette.cardBg, borderColor: palette.border }}>
                  <Logo size={20} />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl max-w-[92%] sm:max-w-[85%] shadow-sm" style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)', color: palette.aiBubbleText, borderTopLeftRadius: 4 }}>
                <div className="flex gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: palette.aiBubbleText, animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: palette.aiBubbleText, animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: palette.aiBubbleText, animationDelay: '300ms' }}></span>
              </div>
              <span className="text-sm font-medium animate-pulse">{t.loading}</span>
              </div>
            </div>
          )}
          
          <div className="h-40 sm:h-32"></div> {/* Spacer for floating input */}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-3 pb-5 pt-12 sm:p-6 sm:pt-16 z-20 pointer-events-none" style={{ background: `linear-gradient(to top, ${isDark ? 'rgba(20,10,12,0.95)' : 'rgba(255,255,255,0.95)'} 20%, transparent)` }}>
          <div className="max-w-3xl mx-auto relative flex flex-col items-center pointer-events-auto">
            <div 
              className="flex items-center gap-1.5 sm:gap-2 w-full p-1.5 sm:p-2 rounded-3xl sm:rounded-[1.5rem] shadow-xl sm:shadow-2xl border transition-all focus-within:ring-2 focus-within:ring-opacity-50 focus-within:scale-[1.01]"
              style={{ 
                background: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 20px 40px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
              }}
            >

              
              <input
                type="text"
                className="flex-1 bg-transparent border-none pl-4 sm:pl-5 pr-2 py-2 sm:py-3 focus:outline-none text-[14px] sm:text-[15px]"
                style={{ color: palette.inputText }}
                placeholder={t.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="p-3.5 mr-0.5 rounded-[1.1rem] font-medium disabled:opacity-50 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center shadow-md notranslate"
                style={{ background: `linear-gradient(135deg, ${palette.accent}, ${isDark ? '#5A151A' : '#D19C2A'})`, color: palette.accentText, boxShadow: `0 4px 15px -3px ${palette.accent}80` }}
              >
                <Send size={18} />
              </button>
            </div>
            
            <div className="mt-4 text-center text-[10px] font-medium opacity-60 notranslate" style={{ color: palette.subtext }}>
              NyaySetu is an AI legal assistant for educational purposes. It is not a substitute for professional legal counsel.
            </div>
          </div>
        </div>
      </div>
    
      {/* Slide-out History Drawer (ChatGPT / Gemini style) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsHistoryOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div 
            className="relative w-full max-w-[85vw] sm:max-w-sm h-full flex flex-col p-4 sm:p-5 z-10 shadow-2xl animate-in slide-in-from-left duration-300"
            style={{ 
              background: isDark ? 'rgba(22, 12, 16, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(24px)',
              borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3.5 border-b notranslate" style={{ borderColor: palette.border }}>
              <div className="flex items-center gap-2">
                <History size={18} style={{ color: palette.heading }} />
                <h3 className="font-bold text-sm" style={{ color: palette.heading }}>{t.recentChats || "Past Consultations"}</h3>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: palette.subtext }}
              >
                <X size={16} />
              </button>
            </div>

            {/* New Consultation Button inside Drawer */}
            <button
              onClick={handleNewChat}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border font-semibold text-xs transition-all hover:scale-[1.01] shadow-sm notranslate"
              style={{ background: palette.pillBg, borderColor: palette.pillBorder, color: palette.heading }}
            >
              <Plus size={14} />
              {t.newChat || "New Consultation"}
            </button>

            {/* Past Conversations List */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
              {historyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4 opacity-60 text-xs" style={{ color: palette.subtext }}>
                  <Scale size={28} className="mb-2 opacity-50" />
                  <p>{t.noHistory || "No previous legal consultations found."}</p>
                </div>
              ) : (
                historyList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => handleSelectHistory(item)}
                    className="p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] group text-left relative"
                    style={{
                      background: palette.cardBg,
                      borderColor: palette.border
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium opacity-60" style={{ color: palette.subtext }}>
                        {item.created_at || "Past query"}
                      </span>
                      {item.confidence_score ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-600 text-white">
                          {item.confidence_score}%
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs font-semibold line-clamp-1 group-hover:underline" style={{ color: palette.heading }}>
                      {item.query}
                    </p>
                    <p className="text-[11px] opacity-70 line-clamp-2 mt-0.5 leading-snug" style={{ color: palette.subtext }}>
                      {item.reply}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer (Clear All) */}
            {historyList.length > 0 && (
              <div className="pt-3 border-t mt-auto notranslate" style={{ borderColor: palette.border }}>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                  {t.clearAll || "Clear All History"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}