import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck, Shield, AlertTriangle, CheckCircle, XCircle, Search,
  Upload, FileText, Bot, User, Send, ArrowRight, RefreshCw, Mail,
  Phone, Building2, MapPin, Eye, ExternalLink, HelpCircle, Check,
  X, AlertCircle, Sparkles, Printer, ChevronRight, Download, Lock,
  ShieldCheck, ShieldAlert, Award, FileQuestion, ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  verificationService,
  SAMPLE_REFERENCE_PROPERTIES,
  DEMO_SCENARIOS
} from '../../services/verification.service';
import type {
  DocumentVerificationReport,
  OwnerVerificationRequest,
  Property
} from '../../models/property.models';
import { aiService } from '../../services/ai.service';
import logo from '../../assets/logo.png';

interface Props {
  onBack?: () => void;
  initialProperty?: Property | null;
}

type StepType = 'search' | 'upload' | 'report' | 'owner_verify';

export const DocumentVerificationHub: React.FC<Props> = ({ onBack, initialProperty }) => {
  const [currentStep, setCurrentStep] = useState<StepType>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(SAMPLE_REFERENCE_PROPERTIES[0]);

  // Upload Form State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>(['SALE_DEED', 'PATTA']);
  const [manualDetails, setManualDetails] = useState({
    claimedOwnerName: selectedProperty.registeredOwner,
    claimedSurveyNo: selectedProperty.surveyNumber,
    claimedArea: selectedProperty.area,
    claimedPrice: selectedProperty.price
  });

  const [activeScenario, setActiveScenario] = useState<keyof typeof DEMO_SCENARIOS>('GENUINE_MATCH');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<DocumentVerificationReport | null>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Owner Verification State
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerRejectReason, setOwnerRejectReason] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Keep manual details synced when property changes
  useEffect(() => {
    setManualDetails({
      claimedOwnerName: selectedProperty.registeredOwner,
      claimedSurveyNo: selectedProperty.surveyNumber,
      claimedArea: selectedProperty.area,
      claimedPrice: selectedProperty.price
    });
  }, [selectedProperty]);

  // Load existing reports if any
  useEffect(() => {
    const saved = verificationService.getSavedReports();
    if (saved.length > 0 && !currentReport) {
      // Optional: keep latest
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  // Quick Preset Selector for Major Project Demo
  const handleApplyPreset = (scenario: keyof typeof DEMO_SCENARIOS) => {
    setActiveScenario(scenario);
    if (scenario === 'GENUINE_MATCH') {
      setSelectedProperty(SAMPLE_REFERENCE_PROPERTIES[0]);
      setSelectedDocTypes(['SALE_DEED', 'PATTA', 'EC']);
      setManualDetails({
        claimedOwnerName: 'K. Venkata Ramanathan',
        claimedSurveyNo: '342/A',
        claimedArea: 2.5,
        claimedPrice: 3500000
      });
    } else if (scenario === 'DISCREPANCY_FLAGGED') {
      setSelectedProperty(SAMPLE_REFERENCE_PROPERTIES[1]);
      setSelectedDocTypes(['SALE_DEED']);
      setManualDetails({
        claimedOwnerName: 'Anand K. Deshmukh',
        claimedSurveyNo: '118/2C (Mismatched)',
        claimedArea: 3.2, // 3.2 acres claimed vs 1.8 in record
        claimedPrice: 7500000
      });
    } else if (scenario === 'FAKE_SELLER_KEY_SCENARIO') {
      setSelectedProperty(SAMPLE_REFERENCE_PROPERTIES[2]);
      setSelectedDocTypes(['SALE_DEED', 'PATTA']);
      setManualDetails({
        claimedOwnerName: 'Rajendra S. Patil',
        claimedSurveyNo: '79/1-A',
        claimedArea: 0.75,
        claimedPrice: 6800000
      });
    }
    setCurrentStep('upload');
  };

  // Run Document Verification Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 1200)); // smooth realistic UI transition

    let extracted: any;
    if (activeScenario === 'GENUINE_MATCH') {
      extracted = {
        ownerName: selectedProperty.registeredOwner,
        surveyNo: selectedProperty.surveyNumber,
        area: selectedProperty.area,
        location: `${selectedProperty.village}, ${selectedProperty.district}`,
        deedNumber: 'DOC-2024-REG-8821',
        registrationDate: '12-Mar-2021',
        priorOwners: ['Late K. S. Ramanathan (Inheritance Grant 1998)'],
        rawExcerpt: `REGISTERED TITLE DEED: Conveyance of Agricultural land in Sy No ${selectedProperty.surveyNumber}, measuring ${selectedProperty.area} Acres, in favour of ${selectedProperty.registeredOwner}.`
      };
    } else if (activeScenario === 'DISCREPANCY_FLAGGED') {
      extracted = {
        ownerName: 'Anand Kumar Deshmukh & Bros (Unregistered)',
        surveyNo: '118/2C', // mismatch vs 118/2B
        area: 3.2, // mismatch vs 1.8
        location: `${selectedProperty.village}, ${selectedProperty.district}`,
        deedNumber: 'UNVERIFIED-DEED-2023',
        registrationDate: '05-Jan-2023',
        priorOwners: [],
        rawExcerpt: `AGREEMENT OF SALE: Claiming area of 3.20 Acres in Sy No 118/2C. SRO seal unclear.`
      };
    } else {
      // Fake Seller Scenario: Exact replica documents matching public info
      extracted = {
        ownerName: selectedProperty.registeredOwner,
        surveyNo: selectedProperty.surveyNumber,
        area: selectedProperty.area,
        location: `${selectedProperty.village}, ${selectedProperty.district}`,
        deedNumber: 'DOC-2022-PUN-4091',
        registrationDate: '18-Aug-2022',
        priorOwners: ['M/s Sahyadri Agro Developers (1995)'],
        rawExcerpt: `REGISTERED DEED COPY: Perfect match with revenue register for Sy No ${selectedProperty.surveyNumber}, ${selectedProperty.area} Acres, registered to ${selectedProperty.registeredOwner}.`
      };
    }

    const docNames = uploadedFiles.length > 0
      ? uploadedFiles.map(f => f.name)
      : ['Registered_Sale_Deed_Copy.pdf', 'Patta_Passbook_Extract.pdf'];

    const report = await verificationService.generateVerificationReport({
      propertyRef: selectedProperty,
      uploadedDocNames: docNames,
      uploadedDocTypes: selectedDocTypes,
      extractedDetails: extracted,
      buyerEnteredDetails: manualDetails,
      scenarioPreset: activeScenario
    });

    setCurrentReport(report);
    setIsAnalyzing(false);
    setCurrentStep('report');

    // Initialize AI Chat greeting with report context
    setChatMessages([
      {
        role: 'assistant',
        content: `👋 **Hello! I am LandLens AI Assistant.**\n\nI have analyzed your uploaded documents for **${selectedProperty.title}** (Survey No: **${selectedProperty.surveyNumber}**).\n\n• **Document Status:** ${report.overallDocumentStatus.replace(/_/g, ' ')}\n• **Extracted Owner:** ${extracted.ownerName}\n• **Extracted Extent:** ${extracted.area} Acres\n\nFeel free to ask why any field was flagged, inquire about missing certificates, or ask about Stage 2 Original Owner Verification!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Request Original Owner Verification
  const handleRequestOwnerVerification = () => {
    if (!currentReport) return;
    const req = verificationService.requestOwnerVerification(currentReport.id, 'Pavan Stark (Buyer)');
    setCurrentReport(prev => prev ? { ...prev, ownerVerification: req } : null);
    setShowEmailPreview(true);
  };

  // Process Genuine Owner Decision (APPROVE / REJECT)
  const handleOwnerDecision = (decision: 'APPROVE' | 'REJECT') => {
    if (!currentReport?.ownerVerification) return;
    const { report } = verificationService.processOwnerResponse(
      currentReport.ownerVerification.id,
      decision,
      ownerRejectReason || undefined
    );
    if (report) {
      setCurrentReport(report);
    }
    setIsOwnerModalOpen(false);
  };

  // AI Chat message send
  const handleSendChatMessage = async (textToSend?: string) => {
    const q = textToSend || chatInput.trim();
    if (!q || isChatLoading) return;

    const userMsg = {
      role: 'user' as const,
      content: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsChatLoading(true);

    // Smart contextual prompt for LandLens document evaluation
    const docContext = currentReport
      ? `Property: ${currentReport.propertyDetails.title} (Survey No: ${currentReport.propertyDetails.surveyNumber}, ${currentReport.propertyDetails.area} Acres, Reg Owner: ${currentReport.propertyDetails.registeredOwner})
Document Status: ${currentReport.overallDocumentStatus}
Matches: ${currentReport.matches.map(m => `${m.field}: ${m.isMatch ? 'MATCH' : 'MISMATCH'}`).join(', ')}
Discrepancies: ${currentReport.discrepancies.map(d => `${d.title} - ${d.explanation}`).join(' | ') || 'None'}
Missing Info: ${currentReport.missingInformation.map(m => m.item).join(', ') || 'None'}
Stage 2 Owner Verification Status: ${currentReport.ownerVerification?.status || 'Not Requested'}`
      : 'General Land Document Verification';

    const systemPrompt = `You are LandLens AI Verification Assistant. Answer the buyer's query directly based on the verified property document report.
Rules:
1. Concise, direct, and under 120 words.
2. Use Markdown tables when listing parameters.
3. If asked about fake sellers, clarify that matching documents do NOT prove seller identity, which is why Stage 2 Original Owner Verification is essential.
Context:
${docContext}`;

    try {
      const history = chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const responseText = await aiService.generateResponse(q, systemPrompt, history);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: responseText || 'Based on the uploaded deed and government land ledger, all extracted parameters are shown in your Verification Report above.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `### 📋 Verification Findings\n\n| Parameter | Document Extracted | Government Record |\n| :--- | :--- | :--- |\n| **Survey No** | ${currentReport?.uploadedDocumentDetails.extractedSurveyNo || '342/A'} | ${currentReport?.propertyDetails.surveyNumber || '342/A'} |\n| **Area Extent** | ${currentReport?.uploadedDocumentDetails.extractedArea || '2.5'} Acres | ${currentReport?.propertyDetails.area || '2.5'} Acres |\n| **Owner** | ${currentReport?.uploadedDocumentDetails.extractedOwnerName} | ${currentReport?.propertyDetails.registeredOwner} |\n\n${currentReport?.discrepancies.length ? '⚠️ Please resolve the flagged discrepancies before signing any deed.' : '✅ Document information matches public land records. Ensure you complete Stage 2 Original Owner Verification.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const filteredProperties = SAMPLE_REFERENCE_PROPERTIES.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.surveyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.registeredOwner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* ── TOP HEADER BAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  LandLens Document & Owner Verification Hub
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase tracking-wider">
                    2-Stage Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Dual-Layer Property Document AI Cross-Check & Registered Owner Authorization
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition border border-indigo-200 shadow-xs"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>AI Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── WORKFLOW STEPPER BANNER ── */}
      <div className="bg-slate-900 text-white py-4 px-4 shadow-inner">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 pb-1">
            {[
              { id: 'search', num: '1', title: 'Search Property & Contact Seller' },
              { id: 'upload', num: '2', title: 'Upload Documents & Details' },
              { id: 'report', num: '3', title: 'AI Verification Report (Layer 1)' },
              { id: 'owner_verify', num: '4', title: 'Owner Authorization (Layer 2)' }
            ].map((step, idx) => {
              const isActive = currentStep === step.id;
              const isDone = (currentStep === 'upload' && idx === 0) ||
                             (currentStep === 'report' && idx <= 1) ||
                             (currentStep === 'owner_verify' && idx <= 2) ||
                             (currentReport?.ownerVerification?.status === 'APPROVED');
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (step.id === 'search') setCurrentStep('search');
                    else if (step.id === 'upload') setCurrentStep('upload');
                    else if (step.id === 'report' && currentReport) setCurrentStep('report');
                    else if (step.id === 'owner_verify' && currentReport) setCurrentStep('owner_verify');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : isDone
                      ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive ? 'bg-white text-blue-700' : isDone ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {isDone && !isActive ? '✓' : step.num}
                  </span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">

        {/* DEMO SCENARIO QUICK LAUNCHER (MAJOR PROJECT SHOWCASE TOOLBAR) */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Major Project Live Demonstration Presets
                </h2>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Click any preset to instantly simulate end-to-end buyer workflows and the critical fake-seller scenario.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleApplyPreset('GENUINE_MATCH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  activeScenario === 'GENUINE_MATCH'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>1. Genuine Land Deal</span>
              </button>

              <button
                onClick={() => handleApplyPreset('DISCREPANCY_FLAGGED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  activeScenario === 'DISCREPANCY_FLAGGED'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>2. Discrepant / Tampered Deed</span>
              </button>

              <button
                onClick={() => handleApplyPreset('FAKE_SELLER_KEY_SCENARIO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  activeScenario === 'FAKE_SELLER_KEY_SCENARIO'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm animate-pulse'
                    : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                }`}
                title="Crucial Project Requirement: Forged documents with matching info rejected by original owner"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>3. Fake-Seller Scenario (Section 8)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── STEP 1: PROPERTY SEARCH & SELLER CONTACT DETAILS ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {currentStep === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 1: Search Property & View Owner / Seller Contact</h2>
                  <p className="text-xs text-slate-500">
                    Search for a registered land parcel to inspect state records and contact the seller outside LandLens to receive deed documents.
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Survey No, Owner, District..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Property Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {filteredProperties.map((prop) => {
                  const isSelected = selectedProperty.id === prop.id;
                  return (
                    <div
                      key={prop.id}
                      onClick={() => setSelectedProperty(prop)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {prop.propertyCode}
                          </span>
                          <span className="text-xs font-black text-emerald-700">
                            ₹{(prop.price / 100000).toFixed(1)} Lakhs
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{prop.title}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {prop.village}, {prop.district}, {prop.state}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Survey Number</span>
                            <span className="font-bold text-slate-800">{prop.surveyNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Area Extent</span>
                            <span className="font-bold text-slate-800">{prop.area} Acres</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Reg Owner: <strong className="text-slate-800">{prop.registeredOwner}</strong>
                        </span>
                        {isSelected && (
                          <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                            Selected <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seller / Original Owner Contact Sheet */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Associated Seller & Registered Landowner Contact Details
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Requirement Flow: Buyer contacts seller outside LandLens and receives the property documents
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Contact Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seller / Representative */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Listing Seller / Representative
                  </span>
                  <p className="text-sm font-bold text-slate-900">{selectedProperty.sellerContact.name}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${selectedProperty.sellerContact.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      {selectedProperty.sellerContact.phone}
                    </a>
                    <a
                      href={`mailto:${selectedProperty.sellerContact.email}`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      Email Seller
                    </a>
                  </div>
                </div>

                {/* Registered Landowner in Government Ledger */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider block">
                    Official Registered Title Holder (Revenue Records)
                  </span>
                  <p className="text-sm font-bold text-slate-900">{selectedProperty.registeredOwner}</p>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" /> {selectedProperty.ownerEmail}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" /> {selectedProperty.ownerPhone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Next Action:</strong> Once you have received the deed, patta, or survey documents from the seller outside LandLens, proceed to Step 2 to upload and verify them.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition"
                >
                  <span>Proceed to Document Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── STEP 2: DOCUMENT UPLOAD & MANUAL DETAILS ENTRY ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 2: Upload Received Documents & Claimed Property Details</h2>
                  <p className="text-xs text-slate-500">
                    Target Property: <strong className="text-slate-800">{selectedProperty.title}</strong> (Survey No: {selectedProperty.surveyNumber}, SRO: {selectedProperty.sroOffice})
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep('search')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Change Property
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/60 transition cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  onChange={e => {
                    if (e.target.files) {
                      setUploadedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} Document(s) Selected`
                    : 'Drag and Drop Property Documents or Browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Sale Deed, Patta Passbook (ROR 1B), Encumbrance Certificate (EC), Survey Map (PDF, PNG, JPG)
                </p>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {uploadedFiles.map((file, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Types Checkbox Selection */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Document Types Included in this Dossier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'SALE_DEED', label: 'Registered Sale Deed' },
                    { key: 'PATTA', label: 'Patta Passbook / ROR 1B' },
                    { key: 'EC', label: 'Encumbrance Certificate (EC)' },
                    { key: 'SURVEY_MAP', label: 'Survey Village Map' }
                  ].map(doc => {
                    const isChecked = selectedDocTypes.includes(doc.key);
                    return (
                      <button
                        type="button"
                        key={doc.key}
                        onClick={() => {
                          setSelectedDocTypes(prev =>
                            isChecked ? prev.filter(k => k !== doc.key) : [...prev, doc.key]
                          );
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{doc.label}</span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isChecked && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manual Details Entered by Buyer */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Buyer-Entered Details (From Seller's verbal / written claim)
                  </h3>
                  <span className="text-[10px] text-slate-400">Used for 3-way cross-comparison</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Claimed Owner Name</label>
                    <input
                      type="text"
                      value={manualDetails.claimedOwnerName}
                      onChange={e => setManualDetails({ ...manualDetails, claimedOwnerName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Claimed Survey Number</label>
                    <input
                      type="text"
                      value={manualDetails.claimedSurveyNo}
                      onChange={e => setManualDetails({ ...manualDetails, claimedSurveyNo: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Claimed Area (Acres)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualDetails.claimedArea}
                      onChange={e => setManualDetails({ ...manualDetails, claimedArea: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Claimed Price (₹)</label>
                    <input
                      type="number"
                      value={manualDetails.claimedPrice}
                      onChange={e => setManualDetails({ ...manualDetails, claimedPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Run Verification Button */}
              <div className="pt-2">
                <button
                  disabled={isAnalyzing}
                  onClick={handleRunAnalysis}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Extracting OCR Data & Cross-Comparing Reference Records...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Analyze Documents & Generate Verification Report (Stage 1)</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── STEP 3 & 4: EXPLAINABLE VERIFICATION REPORT (LAYER 1) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(currentStep === 'report' || currentStep === 'owner_verify') && currentReport && (
          <div className="space-y-6">

            {/* Top Status Banner */}
            <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden ${
              currentReport.overallDocumentStatus === 'CONSISTENT'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : currentReport.overallDocumentStatus === 'DISCREPANCIES_FOUND'
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-blue-50/80 border-blue-200 text-blue-950'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                    currentReport.overallDocumentStatus === 'CONSISTENT'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                      : currentReport.overallDocumentStatus === 'DISCREPANCIES_FOUND'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  }`}>
                    {currentReport.overallDocumentStatus === 'CONSISTENT' ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white border border-current uppercase">
                        Stage 1: Document Verification Report
                      </span>
                      <span className="text-[10px] text-slate-500">ID: {currentReport.id}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black mt-0.5">
                      {currentReport.overallDocumentStatus === 'CONSISTENT'
                        ? 'Document Data Appears Consistent with Reference Records'
                        : currentReport.overallDocumentStatus === 'DISCREPANCIES_FOUND'
                        ? 'Discrepancies Detected Across Uploaded Documents'
                        : 'Incomplete Document Dossier'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                    <span>Ask AI Assistant</span>
                  </button>
                </div>
              </div>

              {/* AI Summary Card */}
              <div className="mt-4 p-4 rounded-2xl bg-white/90 border border-current/20 text-xs sm:text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentReport.aiSummary}</ReactMarkdown>
              </div>

              {/* CRITICAL TWO-STAGE NOTICE */}
              <div className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700 shadow-2xs">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Important Safety Rule:</strong> A matching document report confirms data consistency only; it does <em>not</em> prove the seller is genuine. To confirm the seller is authorized by the registered landowner, proceed to <strong>Stage 2: Original Owner Verification</strong>.
                </p>
              </div>
            </div>

            {/* 3-WAY CROSS-COMPARISON MATRIX TABLE */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Parameter-by-Parameter Cross-Comparison Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparing Uploaded Document Extracts vs State Government Reference Ledger
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  {currentReport.matches.filter(m => m.isMatch).length} / {currentReport.matches.length} Matches
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-3 rounded-l-xl">Verified Parameter</th>
                      <th className="p-3">Uploaded Document Extract</th>
                      <th className="p-3">Government Registry Record</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 rounded-r-xl">Audit Findings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentReport.matches.map((m, idx) => (
                      <tr key={idx} className={m.isMatch ? 'hover:bg-slate-50/60' : 'bg-rose-50/30'}>
                        <td className="p-3 font-bold text-slate-900">{m.field}</td>
                        <td className="p-3 font-mono text-slate-700 font-medium">{m.documentValue}</td>
                        <td className="p-3 font-mono text-slate-700 font-medium">{m.recordValue}</td>
                        <td className="p-3 text-center">
                          {m.isMatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" /> MATCH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                              <X className="w-3 h-3" /> MISMATCH
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 text-[11px] leading-relaxed">{m.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DISCREPANCIES & WHY IT WAS FLAGGED */}
            {currentReport.discrepancies.length > 0 && (
              <div className="bg-rose-50/70 rounded-3xl p-6 border border-rose-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-extrabold text-rose-900">
                    Potential Discrepancies & Risk Explanations ({currentReport.discrepancies.length})
                  </h3>
                </div>

                <div className="grid gap-3 pt-1">
                  {currentReport.discrepancies.map((disc, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-rose-900">{disc.title}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {disc.severity} RISK
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{disc.explanation}</p>
                      <div className="text-[11px] pt-1 flex gap-4 text-slate-500 font-mono">
                        <span>Document: <strong className="text-rose-700">{disc.documentValue}</strong></span>
                        <span>Official Ledger: <strong className="text-emerald-700">{disc.recordValue}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IDENTIFIED MISSING INFORMATION CHECKLIST */}
            {currentReport.missingInformation.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <FileQuestion className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Missing Information & Document Checklist ({currentReport.missingInformation.length})
                  </h3>
                </div>
                <div className="grid gap-2.5 pt-1">
                  {currentReport.missingInformation.map((miss, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        miss.importance === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{miss.item}</strong>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            miss.importance === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {miss.importance}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{miss.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* ── STAGE 2: ORIGINAL OWNER VERIFICATION CTA BOX ── */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-800/40 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                      Stage 2 Verification Layer
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black mt-1">
                    Original Owner Verification
                  </h3>
                  <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
                    Did the genuine owner authorize these documents? LandLens will notify the registered landowner (<strong>{currentReport.propertyDetails.registeredOwner}</strong>) to confirm or reject this transaction.
                  </p>
                </div>

                {/* Status Badge */}
                <div>
                  {!currentReport.ownerVerification ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-800 text-indigo-300 text-xs font-bold border border-indigo-700/50">
                      Stage 2: Not Yet Requested
                    </span>
                  ) : currentReport.ownerVerification.status === 'REQUESTED_PENDING' ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Email Sent • Awaiting Owner
                    </span>
                  ) : currentReport.ownerVerification.status === 'APPROVED' ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Original Owner Authorized ✓
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-400" /> Owner REJECTED ❌ (Fake Seller Blocked)
                    </span>
                  )}
                </div>
              </div>

              {/* Status Outcome Explanation */}
              {currentReport.ownerVerification?.status === 'APPROVED' && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Transaction Authorized by Registered Owner</span>
                  </div>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    {currentReport.ownerVerification.registeredOwner.name} responded: "{currentReport.ownerVerification.ownerRemarks}"
                  </p>
                  <p className="text-[11px] text-emerald-300 font-semibold pt-1">
                    ✓ Confirmation recorded in LandLens ledger. You may now proceed with official registration at {currentReport.propertyDetails.sroOffice}.
                  </p>
                </div>
              )}

              {currentReport.ownerVerification?.status === 'REJECTED' && (
                <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <span>UNAUTHORIZED SELLER DETECTED & BLOCKED</span>
                  </div>
                  <p className="text-xs text-rose-100 leading-relaxed">
                    <strong>Genuine Owner Statement:</strong> "{currentReport.ownerVerification.ownerRemarks}"
                  </p>
                  <div className="p-3 rounded-xl bg-black/40 text-xs border border-rose-800 text-rose-200">
                    🚨 <strong>Audit Protection Action:</strong> The seller ({currentReport.ownerVerification.sellerContact.name} • {currentReport.ownerVerification.sellerContact.email}) has been automatically flagged and blocked in LandLens. Do not transfer funds.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!currentReport.ownerVerification ? (
                  <button
                    onClick={handleRequestOwnerVerification}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Request Original Owner Verification</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 w-full">
                    {/* Live Simulation Trigger (For demoing owner approval/rejection) */}
                    <button
                      onClick={() => setIsOwnerModalOpen(true)}
                      className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-md"
                    >
                      <User className="w-4 h-4" />
                      <span>Simulate Registered Owner Response (APPROVE / REJECT)</span>
                    </button>

                    <button
                      onClick={() => setShowEmailPreview(true)}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition border border-indigo-900"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Sent Email Notification</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: SIMULATE REGISTERED OWNER ACTION (STAGE 2) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOwnerModalOpen && currentReport?.ownerVerification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Registered Landowner Verification Portal
                  </h3>
                </div>
                <button
                  onClick={() => setIsOwnerModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <p>
                  <strong>Logged-in Landowner:</strong> {currentReport.ownerVerification.registeredOwner.name} ({currentReport.ownerVerification.registeredOwner.email})
                </p>
                <p>
                  <strong>Survey Number:</strong> {currentReport.propertyDetails.surveyNumber} ({currentReport.propertyDetails.village}, {currentReport.propertyDetails.district})
                </p>
                <p>
                  <strong>Listing Seller Claiming Authority:</strong> {currentReport.ownerVerification.sellerContact.name} ({currentReport.ownerVerification.sellerContact.phone})
                </p>
                <p>
                  <strong>Prospective Buyer:</strong> {currentReport.ownerVerification.buyerName}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Original Owner Confirmation Question:</p>
                <p>
                  "Did you provide or authorize the property documents for Survey No. {currentReport.propertyDetails.surveyNumber} to this seller for sale?"
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-600">Owner Remarks / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Yes, I authorized them / No, I never authorized anyone!"
                  value={ownerRejectReason}
                  onChange={e => setOwnerRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={() => handleOwnerDecision('APPROVE')}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>APPROVE (Authorized)</span>
                </button>

                <button
                  onClick={() => handleOwnerDecision('REJECT')}
                  className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>REJECT (Unauthorized / Fake)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: EMAIL NOTIFICATION PREVIEW (STAGE 2) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEmailPreview && currentReport?.ownerVerification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Email Sent to Registered Owner
                  </h3>
                </div>
                <button
                  onClick={() => setShowEmailPreview(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2 border border-slate-800">
                <p className="text-slate-400">To: {currentReport.ownerVerification.registeredOwner.email}</p>
                <p className="text-slate-400">Subject: [LandLens Action Required] Property Document Authorization for Survey No. {currentReport.propertyDetails.surveyNumber}</p>
                <div className="pt-2 border-t border-slate-800 text-slate-200 space-y-2">
                  <p>Dear {currentReport.ownerVerification.registeredOwner.name},</p>
                  <p>A prospective buyer ({currentReport.ownerVerification.buyerName}) has submitted property documents for Survey No. <strong>{currentReport.propertyDetails.surveyNumber}</strong> in {currentReport.propertyDetails.village}.</p>
                  <p>Listing Seller: <strong>{currentReport.ownerVerification.sellerContact.name}</strong></p>
                  <p className="text-amber-300">Please click below to confirm if you provided or authorized these documents:</p>
                  <div className="pt-2 flex gap-2">
                    <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded text-[10px]">[ APPROVE ]</span>
                    <span className="px-3 py-1 bg-rose-600 text-white font-bold rounded text-[10px]">[ REJECT ]</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setShowEmailPreview(false);
                    setIsOwnerModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Open Registered Owner Action Portal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── AI ASSISTANT SIDEBAR / CHAT MODAL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold">LandLens AI Assistant</h3>
                  <p className="text-[10px] text-blue-300">Context: {selectedProperty.title} (Sy No: {selectedProperty.surveyNumber})</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
              {[
                'Why was area flagged?',
                'What is the survey number in deed?',
                'What documents are missing?',
                'Can a seller fake documents?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChatMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition shrink-0 shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      AI
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs'
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    <span className={`block text-[9px] mt-1 ${msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>LandLens AI is thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a question about the document report..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition shadow-2xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
