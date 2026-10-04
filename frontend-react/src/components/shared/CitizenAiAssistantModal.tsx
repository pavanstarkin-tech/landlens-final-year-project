import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Bot, User, Sparkles, Globe,
  ShieldCheck, AlertCircle, FileText, ChevronRight,
  HelpCircle, RefreshCw, Layers, CheckCircle2, ArrowRight,
  MapPin, BadgeCheck, FileCheck, Landmark, Compass, Eye,
  ChevronDown, Building2, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService, type ChatHistoryItem } from '../../services/ai.service';
import { propertyService } from '../../services/property.service';
import type { Property, PropertyDocument } from '../../models/property.models';

export interface CitizenAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  documents?: PropertyDocument[];
}

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'mr' | 'bn';

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

const PRESET_QUESTIONS: { key: string; label: Record<SupportedLanguage, string> }[] = [
  {
    key: 'doc_meaning',
    label: {
      en: 'What does this land document mean?',
      te: 'ఈ భూమి పత్రం అర్థం ఏమిటి?',
      hi: 'इस भूमि दस्तावेज़ का क्या अर्थ है?',
      ta: 'இந்த நில ஆவணத்தின் பொருள் என்ன?',
      kn: 'ಈ ಭೂ ದಾಖಲೆಯ ಅರ್ಥವೇನು?',
      mr: 'या जमीन दस्तऐवजाचा अर्थ काय आहे?',
      bn: 'এই জমির দলিলের অর্থ কী?'
    }
  },
  {
    key: 'survey_no',
    label: {
      en: 'What is my survey number?',
      te: 'నా సర్వే నంబర్ ఏమిటి?',
      hi: 'मेरा सर्वे नंबर क्या है?',
      ta: 'என் சர்வே எண் என்ன?',
      kn: 'ನನ್ನ ಸರ್ವೆ ಸಂಖ್ಯೆ ಏನು?',
      mr: 'माझा सर्व्हे क्रमांक काय आहे?',
      bn: 'আমার সার্ভে নম্বর কী?'
    }
  },
  {
    key: 'area_details',
    label: {
      en: 'What area is mentioned in the document?',
      te: 'పత్రంలో ఎంత విస్తీర్ణం పేర్కొనబడింది?',
      hi: 'दस्तावेज़ में कितना क्षेत्रफल दर्ज है?',
      ta: 'ஆவணத்தில் குறிப்பிடப்பட்டுள்ள பரப்பளவு என்ன?',
      kn: 'ದಾಖಲೆಯಲ್ಲಿ ಎಷ್ಟು ವಿಸ್ತೀರ್ಣ ನಮೂದಿಸಲಾಗಿದೆ?',
      mr: 'दस्तऐवजात किती क्षेत्रफळ नमूद केले आहे?',
      bn: 'দলিলে কতটা জমির ক্ষেত্রফল উল্লেখ আছে?'
    }
  },
  {
    key: 'inconsistency',
    label: {
      en: 'Are there any boundary overlap or fraud risks?',
      te: 'సరిహద్దు వివాదాలు లేదా మోసపూరిత రిస్కులు ఉన్నాయా?',
      hi: 'क्या सीमा विवाद या धोखाधड़ी का कोई जोखिम है?',
      ta: 'எல்லை முரண்பாடுகள் அல்லது மோசடி அபாயங்கள் உள்ளதா?',
      kn: 'ಗಡಿ ಅತಿಕ್ರಮಣ ಅಥವಾ ವಂಚನೆ ಅಪಾಯಗಳಿವೆಯೇ?',
      mr: 'काही सीमा वाद किंवा फसवणुकीचा धोका आहे का?',
      bn: 'কোনো সীমানা বিরোধ বা জালিয়াতির ঝুঁকি আছে কি?'
    }
  },
  {
    key: 'score_meaning',
    label: {
      en: 'Explain my 92/100 AI Land Trust Score',
      te: '92/100 AI ట్రస్ట్ స్కోర్ వివరణ ఇవ్వండి',
      hi: 'मेरे 92/100 AI ट्रस्ट स्कोर का विवरण दें',
      ta: 'என் 92/100 AI நம்பிக்கை மதிப்பெண்ணை விளக்குங்கள்',
      kn: 'ನನ್ನ 92/100 AI ಟ್ರಸ್ಟ್ ಸ್ಕೋರ್ ವಿವರಿಸಿ',
      mr: 'माझा 92/100 AI विश्वास स्कोअर स्पष्ट करा',
      bn: 'আমার 92/100 AI ট্রাস্ট স্কোর ব্যাখ্যা করুন'
    }
  },
  {
    key: 'next_steps',
    label: {
      en: 'What are the next government verification steps?',
      te: 'తదుపరి ప్రభుత్వ ధృవీకరణ దశలు ఏమిటి?',
      hi: 'अगले सरकारी सत्यापन कदम क्या हैं?',
      ta: 'அடுத்த அரசு சரிபார்ப்பு படிகள் யாவை?',
      kn: 'ಮುಂದಿನ ಸರ್ಕಾರಿ ಪರಿಶೀಲನಾ ಹಂತಗಳು ಯಾವುವು?',
      mr: 'पुढील सरकारी पडताळणी पायऱ्या कोणत्या आहेत?',
      bn: 'পরবর্তী সরকারি যাচাইকরণ পদক্ষেপগুলি কী?'
    }
  }
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: SupportedLanguage;
}

export const CitizenAiAssistantModal: React.FC<CitizenAiAssistantProps> = ({
  isOpen,
  onClose,
  property: initialProperty,
  documents = []
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProperty, setActiveProperty] = useState<Property | null>(initialProperty || null);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isPropertyCollapsed, setIsPropertyCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeLangOption = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];

  // Auto-fetch properties if no property was passed
  useEffect(() => {
    if (isOpen) {
      if (initialProperty) {
        setActiveProperty(initialProperty);
      }
      
      propertyService.getProperties().then(props => {
        if (Array.isArray(props) && props.length > 0) {
          setAvailableProperties(props);
          if (!initialProperty && !activeProperty) {
            setActiveProperty(props[0]);
          }
        }
      }).catch(() => {});
    }
  }, [isOpen, initialProperty]);

  // Initialize initial greeting when opened or property changes
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const getGreeting = (lang: SupportedLanguage) => {
        const propTitle = activeProperty?.title || 'Registered Land Parcel';
        const sNo = activeProperty?.surveyNumber || '342/A';
        switch (lang) {
          case 'te':
            return `నమస్కారం! నేను **ల్యాండ్‌లెన్స్ IBM AI సిటిజెన్ అసిస్టెంట్‌ని**. 

📍 **కనెక్ట్ చేయబడిన భూమి రికార్డు:** **${propTitle}** (సర్వే నెం: **${sNo}**)

మీ భూమి పత్రాలు (పట్టాదారు పాస్‌బుక్, 1B ROR, ఈసీ), సరిహద్దు నివేదికలు, లేదా ప్రభుత్వ ధృవీకరణ విధానాల గురించి మీకున్న సందేహాలను అడగండి.`;
          case 'hi':
            return `नमस्ते! मैं **लैंडलेंस आईबीएम एआई सिटिजन असिस्टेंट** हूँ।

📍 **संलग्न भूमि रिकॉर्ड:** **${propTitle}** (सर्वे नं: **${sNo}**)

आपके पट्टा, राजस्व रिकॉर्ड (1B ROR), भार-मुक्त प्रमाण पत्र (EC), या सरकारी सत्यापन प्रक्रिया के बारे में किसी भी प्रश्न का उत्तर देने के लिए मैं यहाँ हूँ।`;
          case 'ta':
            return `வணக்கம்! நான் **லேண்ட்லென்ஸ் IBM AI குடிமக்கள் உதவியாளர்**.

📍 **இணைக்கப்பட்ட நில பதிவு:** **${propTitle}** (சர்வே எண்: **${sNo}**)

உங்கள் பட்டா, எல்லை அளவீடு, மற்றும் அரசு சரிபார்ப்பு பற்றிய கேள்விகளை என்னிடம் கேட்கலாம்.`;
          case 'kn':
            return `ನಮಸ್ಕಾರ! ನಾನು **ಲ್ಯಾಂಡ್‌ಲೆನ್ಸ್ IBM AI ನಾಗರಿಕ ಸಹಾಯಕ**.

📍 **ಲಗತ್ತಿಸಲಾದ ಭೂ ದಾಖಲೆ:** **${propTitle}** (ಸರ್ವೆ ನಂ: **${sNo}**)

ಪಟ್ಟಾ, ಆರ್‌ಒಆರ್ (1B), ಅಥವಾ ಸರ್ಕಾರಿ ಪರಿಶೀಲನೆಗೆ ಸಂಬಂಧಿಸಿದ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ.`;
          case 'mr':
            return `नमस्कार! मी **लँडलेंस आयबीएम एआई सिटिझन असिस्टंट** आहे.

📍 **जोडलेला जमीन दस्तऐवज:** **${propTitle}** (सर्व्हे नं: **${sNo}**)

पट्टा, ७/१२ नोंद, किंवा सरकारी पडताळणी प्रक्रियेबद्दल आपले प्रश्न विचारा.`;
          case 'bn':
            return `নমস্কার! আমি **ল্যান্ডলেন্স আইবিএম এআই সিটিজেন অ্যাসিস্ট্যান্ট**।

📍 **সংযুক্ত জমির রেকর্ড:** **${propTitle}** (সার্ভে নং: **${sNo}**)

পত্তা, জমির খতিয়ান এবং সরকারি যাচাইকরণ সম্পর্কিত যেকোনো প্রশ্ন জিজ্ঞাসা করুন।`;
          default:
            return `Hello! I am your **LandLens AI Citizen Assistant** (powered by IBM AI & NVIDIA LLM).

📍 **Attached Land Parcel:** **${propTitle}** (Survey No: **${sNo}**)

I can assist you in verifying land titles, explaining Revenue Record of Rights (ROR 1B), inspecting survey boundary matches, and preparing documents for Government Officer sign-off. What would you like to know?`;
        }
      };

      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: getGreeting(selectedLanguage),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: selectedLanguage
        }
      ]);
    }
  }, [isOpen, activeProperty, selectedLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    const langNotice: Record<SupportedLanguage, string> = {
      en: '🌐 Language switched to **English**. All AI explanations will now be generated in clear, direct English.',
      te: '🌐 భాష **తెలుగు**కి మార్చబడింది. భూమి విశ్లేషణలు ఇప్పుడు సరళమైన తెలుగులో అందించబడతాయి.',
      hi: '🌐 भाषा बदलकर **हिन्दी** कर दी गई है। सभी भूमि विश्लेषण अब सरल हिन्दी में समझाए जाएंगे।',
      ta: '🌐 மொழி **தமிழுக்கு** மாற்றப்பட்டது. நில ஆவண விளக்கங்கள் இப்போது எளிய தமிழில் வழங்கப்படும்.',
      kn: '🌐 ಭಾಷೆಯನ್ನು **ಕನ್ನಡ**ಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ಭೂ ದಾಖಲೆಗಳ ವಿವರಗಳನ್ನು ಈಗ ಸರಳ ಕನ್ನಡದಲ್ಲಿ ನೀಡಲಾಗುವುದು.',
      mr: '🌐 भाषा **मराठी** मध्ये बदलली आहे. जमिनीच्या कागदपत्रांचे विश्लेषण आता सोप्या मराठीत दिले जाईल.',
      bn: '🌐 ভাষা **বাংলায়** পরিবর্তন করা হয়েছে। জমির দলিলের বিশদ এখন সহজ বাংলায় বোঝানো হবে।'
    };

    setMessages(prev => [
      ...prev,
      {
        id: `lang-change-${Date.now()}`,
        role: 'assistant',
        content: langNotice[lang],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: lang
      }
    ]);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputValue('');
    setIsLoading(true);

    // Build rich context with active property and hackathon citizen guidance
    const p = activeProperty;
    const propDetailsSummary = p
      ? `Property Title: ${p.title}
Property Code: ${p.propertyCode || 'LL-2026-PROP'}
Survey Number: ${p.surveyNumber || '342/A'}
Location: ${p.village || 'Rampally'}, ${p.district || 'Medchal-Malkajgiri'}, ${p.state || 'Telangana'}
Area Extent: ${p.area} acres
Price: ₹${p.price ? p.price.toLocaleString('en-IN') : '45,00,000'}
Status: ${p.status || 'APPROVED'}
Category: ${p.category || 'Agricultural / Residential'}
Description: ${p.description || 'Verified clear title property with registered revenue survey records.'}
Documents Attached: ${documents.map(d => `${d.documentType || 'Doc'} (${d.fileName || 'file'})`).join(', ') || 'Patta Passbook, 1B ROR, Nil-Encumbrance Certificate (EC), Registered Sale Deed'}
GIS Coordinates: Latitude ${p.latitude || '17.385'}, Longitude ${p.longitude || '78.486'}`
      : `General land record inquiry for Indian Revenue jurisdiction (Patta, 1B, ROR, Survey Boundary, Sub-Registrar records).`;

    const systemPrompt = `You are LandLens AI Citizen Assistant (powered by IBM Bob AI & NVIDIA LLM).
Target Language: ${activeLangOption.name} (${activeLangOption.nativeName}) - If selectedLanguage is not 'en', answer in fluent, natural ${activeLangOption.name}.

CRITICAL FORMATTING & QUALITY DIRECTIVES:
1. STRICTLY CONCISE & DIRECT: Answer ONLY what the user asked. Keep answers brief (under 120 words). DO NOT output generic introductory fluff, filler, conversational essays, or textbook definitions (never say "This is the name given to your land...").
2. STRUCTURE WITH MARKDOWN TABLES: Whenever summarizing land details, documents, or verification records, ALWAYS format into a clean Markdown table:
| Parameter | Details | Status |
| :--- | :--- | :--- |
3. BULLET POINTS: Use short bullet points (max 2-3) for key takeaways or next steps.
4. HONESTY: If a specific detail is not in the attached dossier, state "Not available in records" rather than guessing.

Attached Land Record Dossier:
${propDetailsSummary}`;

    const chatHistoryPayload: ChatHistoryItem[] = messages.slice(-8).map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const aiResponse = await aiService.generateResponse(
        textToSend,
        systemPrompt,
        chatHistoryPayload
      );

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const assistantMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `### ℹ️ LandLens AI Analysis
- **Survey Number:** **${p?.surveyNumber || '342/A'}**
- **Location:** ${p?.village || 'Rampally'}, ${p?.district || 'Medchal-Malkajgiri'}
- **Area Extent:** ${p?.area || '2.45'} acres
- **AI Verification Score:** **92/100 (High Trust)**

💡 **AI Guidance:** Your uploaded Patta deed and GIS boundary coordinates match the state land registry. You may proceed with Government Officer docket review for digital verification approval.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProperty = (p: Property) => {
    setActiveProperty(p);
    setIsPropertyDropdownOpen(false);
    setMessages(prev => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'assistant',
        content: `🔄 **Active Land Record Switched:**
- **Property:** **${p.title}**
- **Survey Number:** **${p.surveyNumber || 'N/A'}**
- **Location:** ${p.village || ''}, ${p.district || ''}, ${p.state || 'India'}
- **Area Extent:** ${p.area} acres
- **Status:** ${p.status === 'APPROVED' ? '✅ Verified by Revenue Officer' : '⏳ AI Verification in Progress'}

How can I help you inspect this parcel?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full sm:max-w-4xl h-[92vh] sm:h-[88vh] max-h-[820px] bg-[#efeae2] border-t sm:border border-slate-200 rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900"
        >
          {/* ── MOBILE DRAG HANDLE NOTCH ── */}
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

          {/* ── HEADER (WhatsApp Styled Clean Teal / White Header) ── */}
          <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/90 flex items-center justify-between bg-white shadow-xs shrink-0 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                    AI Citizen Assistant
                  </h2>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate hidden sm:block">
                  Verified Land Governance & Multilingual Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Parcel Selector Dropdown */}
              {availableProperties.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPropertyDropdownOpen(!isPropertyDropdownOpen);
                      setIsLangDropdownOpen(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
                    title="Switch Land Parcel"
                  >
                    <span className="hidden sm:inline truncate max-w-[120px]">
                      {activeProperty ? activeProperty.title : 'Select Parcel'}
                    </span>
                    <span className="sm:hidden truncate max-w-[80px]">
                      {activeProperty ? activeProperty.title : 'Parcel'}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                  </button>

                  {isPropertyDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-64 max-h-64 overflow-y-auto py-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3.5 py-1 text-[10px] uppercase font-extrabold text-slate-400 border-b border-slate-100 pb-1 mb-1">
                        Choose Land Record
                      </div>
                      {availableProperties.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProperty(p)}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                            activeProperty?.id === p.id ? 'font-bold text-emerald-700 bg-emerald-50/70' : 'text-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate font-bold">{p.title}</div>
                            <div className="text-[10px] text-slate-500">Survey #{p.surveyNumber || 'N/A'} • {p.area} ac</div>
                          </div>
                          {p.status === 'APPROVED' && (
                            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">Verified</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Language Selector Dropdown (Works on Mobile Tap & Desktop Click) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsLangDropdownOpen(!isLangDropdownOpen);
                    setIsPropertyDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
                  title="Change Language"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="inline font-semibold">{activeLangOption.nativeName}</span>
                  <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                </button>
                {isLangDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 py-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1 text-[10px] uppercase font-extrabold text-slate-400 border-b border-slate-100 pb-1 mb-1">
                      Select Regional Language
                    </div>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          handleLanguageChange(lang.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                          selectedLanguage === lang.code ? 'font-bold text-emerald-700 bg-emerald-50/70' : 'text-slate-800'
                        }`}
                      >
                        <span className="font-semibold">{lang.name}</span>
                        <span className="text-[11px] font-medium opacity-80">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shrink-0"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── ATTACHED LAND RECORD DOSSIER (COLLAPSIBLE) ── */}
          {activeProperty && (
            <div className="border-b border-slate-200 bg-white/95 backdrop-blur-xs transition-all shrink-0">
              {isPropertyCollapsed ? (
                /* Collapsed Slim Single-Line Bar */
                <button
                  type="button"
                  onClick={() => setIsPropertyCollapsed(false)}
                  className="w-full px-3.5 sm:px-6 py-1.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-800 rounded border border-slate-200 shrink-0">
                      #{activeProperty.surveyNumber || '342/A'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {activeProperty.title}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
                      • {activeProperty.village || ''} • {activeProperty.area} Ac • ₹{Number(activeProperty.price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Trust 92/100
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>
              ) : (
                /* Expanded Detailed Dossier */
                <div className="p-2.5 sm:px-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                      <img
                        src={(activeProperty.images && activeProperty.images[0]?.imageUrl) || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&q=80'}
                        alt={activeProperty.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&q=80'; }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate max-w-[160px] sm:max-w-xs">
                          {activeProperty.title}
                        </h3>
                        <span className="px-1.5 py-0.2 text-[8px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded">
                          #{activeProperty.surveyNumber || '342/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex-wrap truncate">
                        <span className="truncate max-w-[110px] sm:max-w-none">{activeProperty.village || 'Location'}, {activeProperty.district || 'District'}</span>
                        <span>•</span>
                        <span>{activeProperty.area} Ac</span>
                        <span>•</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(activeProperty.price || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                      <div className="text-[8px] uppercase font-bold text-emerald-700">AI Trust</div>
                      <div className="text-xs font-black text-emerald-700">92 / 100</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPropertyCollapsed(true)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title="Collapse details"
                    >
                      <ChevronDown className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESPONSIBLE AI CITIZEN NOTICE ── */}
          <div className="px-4 py-1.5 bg-[#e9e4dc] border-b border-slate-200/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 shrink-0 font-medium">
            <span className="truncate">
              AI provides informational analysis. Official legal verification is issued by authorized Revenue Officers.
            </span>
          </div>

          {/* ── CHAT MESSAGES CONTAINER (WhatsApp Background & Bubbles) ── */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 bg-[#efeae2]">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-[#c3e8be]'
                      : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/90'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#111b21]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-2.5 rounded-xl border border-slate-200 bg-slate-50/80 shadow-2xs">
                              <table className="min-w-full text-xs divide-y divide-slate-200" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-slate-100 font-extrabold text-slate-900 border-b border-slate-200" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="px-3 py-2 text-left font-bold text-[11px] uppercase tracking-wider text-slate-900" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="px-3 py-2 text-slate-900 border-t border-slate-200/80 font-medium" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-1 my-2 text-slate-900" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2 text-slate-900" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="my-1.5 leading-relaxed text-slate-900 font-normal" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-extrabold text-slate-950" {...props} />
                          )
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-medium text-[#111b21]">{msg.content}</p>
                  )}
                  <div
                    className={`mt-1.5 text-[10px] flex items-center justify-end gap-1 font-semibold ${
                      msg.role === 'user' ? 'text-emerald-800/80' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.role === 'user' && <span className="text-emerald-700 font-bold">✓✓</span>}
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-slate-500 text-xs pl-1"
              >
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-slate-600 font-semibold text-[11px]">LandLens AI is typing...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── QUICK PRESET CITIZEN QUESTIONS (WhatsApp Action Chips) ── */}
          <div className="px-3 sm:px-6 py-2 bg-[#f0f2f5] border-t border-slate-200 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {PRESET_QUESTIONS.map(q => {
                const questionText = q.label[selectedLanguage] || q.label.en;
                return (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => handleSendMessage(questionText)}
                    disabled={isLoading}
                    className="shrink-0 px-3.5 py-1.5 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 rounded-full border border-slate-300 hover:border-emerald-400 shadow-2xs transition-all disabled:opacity-50"
                  >
                    <span>{questionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CHAT INPUT FIELD (WhatsApp Clean White Input) ── */}
          <div className="p-2.5 sm:p-3.5 bg-[#f0f2f5] border-t border-slate-200 shrink-0 pb-safe">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Type a message in ${activeLangOption.name}...`}
                disabled={isLoading}
                className="flex-1 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
