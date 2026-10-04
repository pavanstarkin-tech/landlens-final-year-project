import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertTriangle, FileText,
  UserCheck, ShieldCheck, ChevronRight, HelpCircle,
  ArrowRight, Download, ExternalLink, Info, Check, ShieldAlert
} from 'lucide-react';
import type { Property, PropertyDocument } from '../../models/property.models';

interface GovernmentServiceGuidanceProps {
  property?: Property | null;
  documents?: PropertyDocument[];
  onOpenAiAssistant?: () => void;
}

export const GovernmentServiceGuidance: React.FC<GovernmentServiceGuidanceProps> = ({
  property,
  documents = [],
  onOpenAiAssistant
}) => {
  const isApproved = property?.status === 'APPROVED';
  const isRejected = property?.status === 'REJECTED';
  const [activeStep, setActiveStep] = useState<number>(isApproved ? 5 : 3);
  const [selectedDocChecklist, setSelectedDocChecklist] = useState<Record<string, boolean>>({
    patta: true,
    ec: true,
    tax: true,
    survey: false
  });

  const steps = [
    {
      id: 1,
      shortTitle: 'AI Analysis',
      title: 'Automated OCR & Spatial Check',
      status: 'completed',
      badgeText: 'Completed',
      details: 'OCR extracted Survey Number, extent, boundary points, and cross-referenced with public land registry tables.'
    },
    {
      id: 2,
      shortTitle: 'Trust Score',
      title: 'AI Trust Score (88/100)',
      status: 'completed',
      badgeText: '88/100',
      details: 'AI Land Trust Score computed at 88/100. No major overlapping polygon claims detected within 500m radius.'
    },
    {
      id: 3,
      shortTitle: 'Doc Checklist',
      title: 'Citizen Document Verification',
      status: isApproved ? 'completed' : 'current',
      badgeText: 'Mandatory',
      details: 'Verify submitted Patta passbook, 15-year Encumbrance Certificate (EC), mutation copy, and property tax receipt.'
    },
    {
      id: 4,
      shortTitle: 'Officer Review',
      title: 'Revenue Inspector / Tehsildar',
      status: isApproved ? 'completed' : isRejected ? 'rejected' : 'current',
      badgeText: 'Officer Action',
      details: 'Assigned Revenue Officer examines AI report, spatial coordinates, and physical boundary records for official determination.'
    },
    {
      id: 5,
      shortTitle: 'Certification',
      title: 'Final Revenue Certification',
      status: isApproved ? 'completed' : isRejected ? 'rejected' : 'pending',
      badgeText: isApproved ? 'Verified' : isRejected ? 'Declined' : 'Pending',
      details: isApproved
        ? 'Government Verified badge issued. Immutable digital audit record stored in state registry.'
        : 'Final state certification pending authorized officer determination.'
    }
  ];

  const toggleDoc = (key: string) => {
    setSelectedDocChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentStepData = steps[activeStep - 1] || steps[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* ── COMPACT HEADER ── */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800 shrink-0">
              Workflow
            </span>
            <span className="text-[11px] text-slate-400 truncate">Citizen Verification Roadmap</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
            What Should I Do Next?
          </h3>
        </div>

        {onOpenAiAssistant && (
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI Guide</span>
            <span className="sm:hidden text-[11px]">Ask AI</span>
          </button>
        )}
      </div>

      {/* ── HORIZONTAL STEPPER NAVIGATION PILLS ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {steps.map((step) => {
          const isSelected = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : step.status === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isSelected
                    ? 'bg-white text-blue-600 font-extrabold'
                    : step.status === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {step.status === 'completed' && !isSelected ? '✓' : step.id}
              </span>
              <span>{step.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* ── COMPACT ACTIVE STEP DETAIL VIEW ── */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded">
                Step {activeStep}
              </span>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {currentStepData.title}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentStepData.details}
            </p>
          </div>

          {activeStep === 3 ? (
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shrink-0 space-y-1.5 w-full sm:w-60">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase block">
                Required Checklist:
              </span>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { key: 'patta', label: 'Patta / Passbook' },
                  { key: 'ec', label: '15-Year EC Copy' },
                  { key: 'tax', label: 'Property Tax Receipt' }
                ].map(doc => (
                  <label
                    key={doc.key}
                    onClick={() => toggleDoc(doc.key)}
                    className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedDocChecklist[doc.key]}
                      onChange={() => {}}
                      className="rounded text-blue-600 w-3 h-3"
                    />
                    <span>{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 self-start">
              Status: <span className="font-bold text-blue-600 dark:text-blue-400">{currentStepData.badgeText}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPACT 1-LINE CITIZEN ADVISORY ── */}
      <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-2 text-[10px] text-amber-800 dark:text-amber-300">
        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="truncate">
          AI pre-screens records; final Patta & title certification is sealed by the State Revenue Department.
        </span>
      </div>
    </div>
  );
};

