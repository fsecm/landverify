/**
 * Sample Deeds & Testing Guide Modal
 * Allows judges and testers to easily download synthetic test deeds, copy tokens,
 * and test both authentic verification and tampering detection.
 */

import React, { useState } from 'react';
import { Download, FileText, Check, ShieldAlert, Sparkles, X, Copy } from 'lucide-react';
import { SAMPLE_DEED_CONTENT_001, SAMPLE_DEED_CONTENT_001_TAMPERED, SAMPLE_DEED_CONTENT_002 } from '../utils/storage';
import { translations } from '../utils/translations';
import { Language } from '../types';

interface SampleDeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const SampleDeedsModal: React.FC<SampleDeedsModalProps> = ({ isOpen, onClose, lang }) => {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const t = translations[lang];

  if (!isOpen) return null;

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <FileText className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {lang === 'bn' ? 'নমুনা দলিল ও যাচাইকরণ পরীক্ষা' : 'Sample Deeds & Verification Test Kit'}
              </h3>
              <p className="text-emerald-100 text-xs mt-1">
                {lang === 'bn' 
                  ? 'হ্যাকাথন বিচারক ও পরীক্ষকদের জন্য তৈরি সিন্থেটিক ফাইল' 
                  : 'Pre-configured synthetic files designed for hackathon demonstration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Guide Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold">
                {lang === 'bn' ? 'কিভাবে পরীক্ষা করবেন?' : 'How to test document integrity in 30 seconds:'}
              </p>
              <ol className="list-decimal ml-4 mt-1.5 space-y-1 text-xs text-emerald-800">
                <li>
                  {lang === 'bn' 
                    ? 'নিচের খাঁটি দলিল (Authentic Deed) ডাউনলোড করুন এবং QR টোকেন কপি করুন।' 
                    : 'Download the Authentic Deed below and copy the QR Token.'}
                </li>
                <li>
                  {lang === 'bn' 
                    ? 'দলিল যাচাই (Verify Document) পেজে গিয়ে টোকেন ও ফাইল দিয়ে পরীক্ষা করুন -> সবুজ খাঁটি (AUTHENTIC) রেজাল্ট আসবে।' 
                    : 'Go to the Verify Document page, upload the file -> See GREEN AUTHENTIC status.'}
                </li>
                <li>
                  {lang === 'bn' 
                    ? 'এরপর টেম্পার করা দলিল (Tampered Deed) আপলোড করুন বা দলিলের যেকোনো একটি অক্ষর বদলে দিন -> লাল বিকৃত (TAMPERED) অ্যালার্ট আসবে!' 
                    : 'Now upload the Tampered Deed (or edit 1 single letter in Notepad) -> Witness instant RED TAMPERED detection!'}
                </li>
              </ol>
            </div>
          </div>

          {/* Test Case 1: Authentic Deed */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-50/80 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    TEST CASE 1: AUTHENTIC
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Plot: DHK-MIR-001</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Sample_Deed_DHK-MIR-001_Authentic.txt
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Official registered deed for Plot DHK-MIR-001. Matching cryptographic SHA-256 hash.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadTextFile(SAMPLE_DEED_CONTENT_001, 'Sample_Deed_DHK-MIR-001_Authentic.txt')}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {/* Token Copy Box */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between bg-white px-3 py-2 rounded-lg border">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">QR Token:</span>
                <span className="font-mono font-semibold text-emerald-700">LV-DOC-DHK-MIR-001</span>
              </div>
              <button
                onClick={() => handleCopy('LV-DOC-DHK-MIR-001', 'token1')}
                className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-emerald-700 font-medium"
              >
                {copiedToken === 'token1' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Case 2: Tampered Deed */}
          <div className="border border-red-200 rounded-xl p-4 bg-red-50/40 hover:bg-red-50/60 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300">
                    TEST CASE 2: TAMPERED FORGERY
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Plot: DHK-MIR-001</span>
                </div>
                <h4 className="text-base font-bold text-red-950 mt-1">
                  Sample_Deed_DHK-MIR-001_Tampered.txt
                </h4>
                <p className="text-xs text-red-800 mt-0.5">
                  Pre-tampered: Land area forged from 6.50 decimal to 9.50 decimal. Triggers SHA-256 hash mismatch!
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadTextFile(SAMPLE_DEED_CONTENT_001_TAMPERED, 'Sample_Deed_DHK-MIR-001_Tampered.txt')}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Tampered .txt</span>
                </button>
              </div>
            </div>

            {/* Token Copy Box */}
            <div className="mt-3 pt-3 border-t border-red-200 flex items-center justify-between bg-white px-3 py-2 rounded-lg border">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Use same token:</span>
                <span className="font-mono font-semibold text-slate-800">LV-DOC-DHK-MIR-001</span>
              </div>
              <button
                onClick={() => handleCopy('LV-DOC-DHK-MIR-001', 'token2')}
                className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-red-700 font-medium"
              >
                {copiedToken === 'token2' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Case 3: Secondary Clean Deed */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-50/80 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    TEST CASE 3: ADDITIONAL CLEAN DEED
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Plot: DHK-MIR-002</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Sample_Deed_DHK-MIR-002_Authentic.txt
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Second sample deed for Paikpara Mouza. Clean ownership and mutation chain.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadTextFile(SAMPLE_DEED_CONTENT_002, 'Sample_Deed_DHK-MIR-002_Authentic.txt')}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between bg-white px-3 py-2 rounded-lg border">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">QR Token:</span>
                <span className="font-mono font-semibold text-blue-700">LV-DOC-DHK-MIR-002</span>
              </div>
              <button
                onClick={() => handleCopy('LV-DOC-DHK-MIR-002', 'token3')}
                className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-blue-700 font-medium"
              >
                {copiedToken === 'token3' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            <span>Cryptographic Web Crypto API (SubtleCrypto)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
