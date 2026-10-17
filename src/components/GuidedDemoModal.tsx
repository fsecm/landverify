/**
 * Guided Demo Component
 * Interactive step-by-step tour that walks hackathon judges and testers through the entire story:
 * 1. Overview & Dashboard
 * 2. Deed Registration & Pre-Check Barrier
 * 3. Cryptographic Verification & Certificate
 * 4. Document Tampering Detection
 * 5. Double-Sale Conflict on DHK-MIR-004
 * 6. Ownership Timeline & Hash-Chain Audit
 * 7. Bank Check & Double Mortgage on DHK-SAV-016
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Pause,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  History,
  Landmark,
  FileCheck2,
} from 'lucide-react';
import { PageId } from './Sidebar';
import { Language } from '../types';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId, extra?: { plotId?: string; token?: string }) => void;
  lang: Language;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  lang,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);

  const steps = [
    {
      title: lang === 'bn' ? '১. জাতীয় ভূমি ড্যাশবোর্ড ও মেট্রিক্স' : '1. E-Governance Dashboard & Fraud Overview',
      page: 'dashboard' as PageId,
      extra: undefined,
      description:
        lang === 'bn'
          ? 'ড্যাশবোর্ডে ৩০টি সিন্থেটিক প্লট, নিবন্ধিত দলিল এবং সক্রিয় জালিয়াতি সতর্কতার পরিসংখ্যান প্রদর্শিত হয়। বিচারকদের জন্য দ্রুত দৃশ্যকল্প শর্টকাট উপলব্ধ।'
          : 'High-level real-time metrics across 30 synthetic plots and 4 mouzas. Recharts visualization tracks open fraud alerts by category.',
      actionNote: 'Notice the alert breakdown chart and planted scenario cards on the right.',
    },
    {
      title: lang === 'bn' ? '২. সাব-রেজিস্ট্রার পোর্টাল: দলিল নিবন্ধন' : '2. Sub-Registry Officer: Deed Registration',
      page: 'register' as PageId,
      extra: undefined,
      description:
        lang === 'bn'
          ? 'দলিল নিবন্ধনের সময় ব্রাউজারের Web Crypto API দ্বারা দলিলের প্রতিটি বাইটের SHA-256 হ্যাশ তৈরি হয় এবং স্বয়ংক্রিয় জালিয়াতি ফিল্টার মালিকানা যাচাই করে।'
          : 'Sub-registry entry portal. Automatically computes 256-bit SHA-256 document fingerprint and blocks unauthorized sellers before saving.',
      actionNote: 'Try entering an unauthorized seller name to witness the instant red fraud barrier.',
    },
    {
      title: lang === 'bn' ? '৩. নাগরিক দলিল যাচাই ও ডিজিটাল সনদ' : '3. Citizen Verification & Digital Certificate',
      page: 'verify' as PageId,
      extra: { token: 'LV-DOC-DHK-MIR-001' },
      description:
        lang === 'bn'
          ? 'কিউআর টোকেন ও মূল দলিল আপলোড করে খাঁটি (AUTHENTIC) স্ট্যাটাস ও অফিশিয়াল A4 ভেরিফিকেশন সার্টিফিকেট প্রিন্ট করা যায়।'
          : 'Public citizen portal. Evaluates uploaded deed bytes against Sub-Registry records. Bit-for-bit matches generate printable A4 certificates.',
      actionNote: 'Click "Test Authentic" on this page to view the green verification match.',
    },
    {
      title: lang === 'bn' ? '৪. জাল দলিল ও টেম্পারিং শনাক্তকরণ' : '4. Document Tampering & Avalanche Effect',
      page: 'verify' as PageId,
      extra: { token: 'LV-DOC-DHK-MIR-001' },
      description:
        lang === 'bn'
          ? 'দলিলে জমির পরিমাণ ৬.৫০ শতক থেকে ৯.৫০ শতকে জালিয়াতি করায় হ্যাশ অমিল শনাক্ত হয়েছে এবং অবিলম্বে TAMPERED অ্যালার্ট কিউতে জমা হয়েছে!'
          : 'Uploaded document with a single altered character (forged area 6.50 -> 9.50 dec). Triggers instant RED TAMPERED violation with side-by-side hash diff.',
      actionNote: 'Click "Test Tampered" to see the character diff visualizer in action.',
    },
    {
      title: lang === 'bn' ? '৫. জমি কেনার আগে যাচাই: প্লট DHK-MIR-004' : '5. Check Before You Buy: Double Sale (DHK-MIR-004)',
      page: 'plotCheck' as PageId,
      extra: { plotId: 'DHK-MIR-004' },
      description:
        lang === 'bn'
          ? 'একই জমি আনিসুর রহমান ও কবির হোসেনের কাছে দুইবার বিক্রয় করায় দ্বৈত বিক্রয় অ্যালার্ট ও উচ্চ ঝুঁকি (HIGH RISK) স্কোর প্রদর্শিত হচ্ছে।'
          : 'Planted Double Sale conflict. Rafiqul Islam sold the plot to Anisur Rahman, then overlappingly re-sold to Kabir Hossain. Risk score evaluates to HIGH RISK.',
      actionNote: 'Inspect the 0-100 Risk Gauge and "Why this score?" itemized justification.',
    },
    {
      title: lang === 'bn' ? '৬. মালিকানা টাইমলাইন ও অপরিবর্তনীয় হ্যাশ-চেইন' : '6. Ownership Timeline & Hash-Chain Audit',
      page: 'timeline' as PageId,
      extra: { plotId: 'DHK-MIR-001' },
      description:
        lang === 'bn'
          ? 'প্রতিটি ব্লক SHA-256(prevHash + plotId + deedId + eventType + createdAt) সূত্রে আবদ্ধ। "Simulate Tampering" বাটনে ক্লিক করে ডেটাবেজ জালিয়াতি পরীক্ষা করুন।'
          : 'Sequential cryptographic audit trail. Click "Simulate Ledger Tampering" to secretly alter a record and watch the audit algorithm catch the broken link!',
      actionNote: 'Click "Simulate Ledger Tampering" to demonstrate tamper-evidence for judges.',
    },
    {
      title: lang === 'bn' ? '৭. ব্যাংক চেক: দ্বৈত বন্ধকী শনাক্তকরণ (DHK-SAV-016)' : '7. Bank Check: Double Mortgage (DHK-SAV-016)',
      page: 'bankCheck' as PageId,
      extra: { plotId: 'DHK-SAV-016' },
      description:
        lang === 'bn'
          ? 'প্লট DHK-SAV-016 একই সাথে সোনার বাংলা ব্যাংক এবং ঢাকা ন্যাশনাল ব্যাংকে বন্ধক রেখে ঋণ নেওয়ায় DOUBLE_MORTGAGE ফ্ল্যাগ সক্রিয় হয়েছে।'
          : 'Multi-bank lien registry. Plot DHK-SAV-016 has 2 simultaneous active loans totaling BDT 8.3M without release, raising automated DOUBLE_MORTGAGE alert.',
      actionNote: 'Banks can verify encumbrances before loan disbursement to stop multi-crore mortgage fraud.',
    },
  ];

  // Navigate when step changes
  useEffect(() => {
    if (isOpen) {
      const step = steps[currentStep];
      onNavigate(step.page, step.extra);
    }
  }, [currentStep, isOpen]);

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && isAutoPlay) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          setIsAutoPlay(false);
          return prev;
        });
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isOpen, isAutoPlay, steps.length]);

  if (!isOpen) return null;

  const current = steps[currentStep];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-lg w-full bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
      {/* Tour Header */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 flex items-center justify-between border-b border-emerald-800/40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Interactive Guided Demo Tour
            </span>
            <div className="text-[10px] text-slate-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              isAutoPlay ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isAutoPlay ? 'Pause Auto-Advance' : 'Auto-Play Tour'}
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tour Step Body */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-extrabold text-white">
          {current.title}
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          {current.description}
        </p>

        {/* Action Callout */}
        <div className="p-2.5 bg-emerald-950/60 border border-emerald-700/50 rounded-xl text-[11px] text-emerald-300 flex items-start space-x-2">
          <span className="font-bold uppercase tracking-wider text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 shrink-0">
            TRY THIS
          </span>
          <span>{current.actionNote}</span>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center space-x-1.5 pt-1">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tour Navigation Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="text-[10px] text-slate-500 font-mono">
          {currentStep + 1} / {steps.length}
        </span>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <span>Next Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <span>Finish Tour</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
