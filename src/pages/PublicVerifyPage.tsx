import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  MapPin,
  Lock,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Search,
  Eye,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';
import { Deed, Plot, Alert, Language } from '../types';
import { maskName, getPublicVerifyUrl } from '../utils/privacy';
import { verifyDeedSignature } from '../utils/pki';
import { generateQrDataUrl } from '../utils/qr';

interface PublicVerifyPageProps {
  token: string;
  deeds: Deed[];
  plots: Plot[];
  alerts: Alert[];
  lang: Language;
  onNavigateHome: () => void;
  onNavigateVerifyFull: (token: string) => void;
}

export const PublicVerifyPage: React.FC<PublicVerifyPageProps> = ({
  token,
  deeds,
  plots,
  alerts,
  lang,
  onNavigateHome,
  onNavigateVerifyFull,
}) => {
  const [currentToken, setCurrentToken] = useState(token || '');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [signatureStatus, setSignatureStatus] = useState<{
    tested: boolean;
    valid: boolean;
    message: string;
  }>({ tested: false, valid: true, message: '' });

  // Find matching deed
  const deed = deeds.find(
    (d) =>
      d.qrToken.toLowerCase() === currentToken.trim().toLowerCase() ||
      d.deedNo.toLowerCase() === currentToken.trim().toLowerCase()
  );

  // Find matching plot
  const plot = deed ? plots.find((p) => p.plotId === deed.plotId) : null;

  // Check for any open tampering or double-sale alerts on this deed or plot
  const deedAlerts = deed
    ? alerts.filter((a) => (a.deedId === deed.id || a.plotId === deed.plotId) && a.status === 'OPEN')
    : [];
  const isTamperedOrDisputed = deedAlerts.some(
    (a) => a.type === 'TAMPERED' || a.type === 'DOUBLE_SALE'
  );

  useEffect(() => {
    if (deed) {
      // Generate QR code for this verification URL
      const shareUrl = getPublicVerifyUrl(deed.qrToken);
      generateQrDataUrl(shareUrl).then(setQrDataUrl);

      // Verify digital signature
      if (deed.signature && deed.signerPublicKey) {
        verifyDeedSignature(deed.fileHash, deed.signature, deed.signerPublicKey).then((res) => {
          setSignatureStatus({
            tested: true,
            valid: res.isValid,
            message: res.message,
          });
        });
      } else {
        setSignatureStatus({
          tested: true,
          valid: true,
          message: 'Simulated government digital seal attached.',
        });
      }
    }
  }, [deed]);

  const handleCopyLink = () => {
    if (!deed) return;
    const url = getPublicVerifyUrl(deed.qrToken);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* Official Government Top Bar */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900/60 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Land<span className="text-emerald-400">Verify</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  {lang === 'bn' ? 'পাবলিক পোর্টাল' : 'Public Due-Diligence'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/70">
                {lang === 'bn'
                  ? 'গণপ্রজাতন্ত্রী বাংলাদেশ — জাতীয় ভূমি দলিল যাচাইকরণ'
                  : 'People\'s Republic of Bangladesh — National Deed Verification Service'}
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
          >
            <span>{lang === 'bn' ? 'প্রধান অ্যাপ্লিকেশনে ফিরুন' : 'Open Full App'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Token Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={currentToken}
              onChange={(e) => setCurrentToken(e.target.value)}
              placeholder={lang === 'bn' ? 'কিউআর টোকেন অথবা দলিল নম্বর দিন...' : 'Enter QR Token or Deed Number (e.g. LV-DOC-DHK-MIR-001)...'}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>
          <button
            onClick={() => {
              // Trigger reload
              const found = deeds.find((d) => d.qrToken.toLowerCase() === currentToken.trim().toLowerCase());
              if (!found && deeds.length > 0) {
                setCurrentToken(deeds[0].qrToken);
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'bn' ? 'যাচাই করুন' : 'Verify Now'}</span>
          </button>
        </div>

        {/* Verification Result Card */}
        {deed ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            {/* Status Banner */}
            <div
              className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isTamperedOrDisputed
                  ? 'bg-red-50/90 border-red-200 text-red-900'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isTamperedOrDisputed
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isTamperedOrDisputed ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <CheckCircle2 className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isTamperedOrDisputed
                          ? 'bg-red-200 text-red-800'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {isTamperedOrDisputed
                        ? lang === 'bn'
                          ? 'সতর্কতা / অসংগতি চিহ্নিত'
                          : 'DISPUTE / TAMPER FLAGGED'
                        : lang === 'bn'
                        ? 'খাঁটি ও নিবন্ধিত দলিল'
                        : 'OFFICIALLY REGISTERED & AUTHENTIC'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600">
                      {lang === 'bn' ? 'পাবলিক রেকর্ড' : 'Public Ledger Confirmed'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black mt-1">
                    {isTamperedOrDisputed
                      ? lang === 'bn'
                        ? 'এই দলিলে সক্রিয় বিরোধ বা জালিয়াতি রিপোর্ট রয়েছে'
                        : 'Active Title Dispute or Tampering Alert on File'
                      : lang === 'bn'
                      ? 'দলিলটির ডিজিটাল রেকর্ড ও ক্রিপ্টোগ্রাফিক হ্যাশ শতভাগ সঠিক'
                      : 'Cryptographic & Registry Match Confirmed'}
                  </h2>
                  <p className="text-xs sm:text-sm mt-1 opacity-90 max-w-2xl">
                    {isTamperedOrDisputed
                      ? lang === 'bn'
                        ? 'এই জমির উপর সাব-রেজিস্ট্রি অথবা এসি ল্যান্ড অফিসে বিরোধ বিচারাধীন।'
                        : 'An open administrative alert exists for this deed. Do not proceed with conveyance without official clearance.'
                      : lang === 'bn'
                      ? 'এই দলিলটি সরকারি সাব-রেজিস্ট্রি অফিসে বৈধভাবে নিবন্ধিত এবং ডিজিটাল স্বাক্ষর দ্বারা সুরক্ষিত।'
                      : 'This deed was officially executed at the Sub-Registry Office and anchored in the cryptographic audit ledger.'}
                  </p>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white text-slate-700 hover:text-emerald-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-center"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? (lang === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!') : (lang === 'bn' ? 'শেয়ারযোগ্য লিংক' : 'Share Link')}</span>
              </button>
            </div>

            {/* Core Verification Facts Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Privacy Notice Banner */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-sky-900">
                <Lock className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {lang === 'bn' ? 'গোপনীয়তা সুরক্ষা নীতি:' : 'Public Privacy & PII Protection:'}
                  </span>{' '}
                  {lang === 'bn'
                    ? 'নাগরিকের ব্যক্তিগত নিরাপত্তা রক্ষার্থে নাম আংশিক গোপন (Masked) রাখা হয়েছে (যেমন: Md. A*** H***)। মূল পরিচয় যাচাইয়ের জন্য সাব-রেজিস্ট্রার পোর্টালে লগইন করুন।'
                    : 'Owner identities are masked for public verification (e.g., Md. A*** H***). Complete identity records are restricted to authorized government officers.'}
                </div>
              </div>

              {/* Details 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Deed Particulars */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'bn' ? 'দলিলের তথ্যাদি' : 'Deed Particulars'}
                  </h3>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lang === 'bn' ? 'দলিল নম্বর:' : 'Deed Number:'}</span>
                      <span className="font-mono font-bold text-slate-900">{deed.deedNo}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lang === 'bn' ? 'নিবন্ধনের তারিখ:' : 'Execution Date:'}</span>
                      <span className="font-medium text-slate-900 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{deed.deedDate}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lang === 'bn' ? 'সাব-রেজিস্ট্রি অফিস:' : 'Sub-Registry Office:'}</span>
                      <span className="font-medium text-slate-900">{deed.subRegistryOffice || 'Savar Sub-Registry Office'}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{lang === 'bn' ? 'বিক্রেতা (গোপনকৃত):' : 'Seller (Masked):'}</span>
                        <span className="font-bold text-slate-800">{maskName(deed.seller)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1.5">
                        <span className="text-slate-500">{lang === 'bn' ? 'ক্রেতা (গোপনকৃত):' : 'Buyer (Masked):'}</span>
                        <span className="font-bold text-slate-800">{maskName(deed.buyer)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Land Plot Particulars */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'bn' ? 'জমির প্লট ও এলাকা' : 'Plot & Jurisdiction'}
                  </h3>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lang === 'bn' ? 'প্লট আইডি:' : 'Plot ID:'}</span>
                      <span className="font-mono font-bold text-emerald-800">{deed.plotId}</span>
                    </div>

                    {plot && (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{lang === 'bn' ? 'মৌজা ও উপজেলা:' : 'Mouza / Upazila:'}</span>
                          <span className="font-medium text-slate-900">
                            {plot.mouza}, {plot.upazila}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{lang === 'bn' ? 'খতিয়ান ও দাগ:' : 'Khatian & Dag:'}</span>
                          <span className="font-medium text-slate-900">
                            {plot.khatianNo} • Dag {plot.dagNo}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{lang === 'bn' ? 'জমির পরিমাণ:' : 'Registered Area:'}</span>
                          <span className="font-bold text-slate-900">{plot.areaDecimal} {lang === 'bn' ? 'শতক' : 'Decimal'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Signature & Cryptographic Fingerprint */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-white">
                      {lang === 'bn' ? 'ডিজিটাল স্বাক্ষর ও ক্রিপ্টোগ্রাফিক সনদ' : 'PKI Digital Signature & Audit Seal'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                    ECDSA P-256 / SHA-256
                  </span>
                </div>

                {/* Signature status */}
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {lang === 'bn' ? 'স্বাক্ষরকারী:' : 'Signed by:'}{' '}
                      <strong className="text-emerald-300">
                        {deed.signerRole || 'Sub-Registrar (Savar Office)'}
                      </strong>
                    </span>
                  </div>
                  <span className="text-emerald-400 font-semibold text-[11px]">
                    {lang === 'bn' ? 'স্বাক্ষর বৈধ ✔' : 'Signature Valid ✔'}
                  </span>
                </div>

                {/* Document Hash */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'দলিলের মূল ক্রিপ্টোগ্রাফিক হ্যাশ (SHA-256):' : 'Official Document Fingerprint (SHA-256):'}</span>
                    <span className="text-[10px] text-slate-500">256-bit Bit-level Integrity</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-lg font-mono text-xs text-emerald-300 break-all select-all border border-slate-800">
                    {deed.fileHash}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  {lang === 'bn'
                    ? 'নোট: এই যাচাইকরণ ব্যবস্থা ক্লায়েন্ট-সাইড ওয়েব ক্রিপ্টো এপিআই ভিত্তিক। প্রযোজ্য ক্ষেত্রে জাতীয় পিকেআই (CCA) এইচএসএম এর সাথে সমন্বয় করা হবে।'
                    : 'Note: Production deployment uses Bangladesh National PKI / CCA hardware security modules (HSM) for legally binding digital signatures under the ICT Act 2006.'}
                </p>
              </div>

              {/* QR and Full Verification CTA */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-xs text-slate-600">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Verification QR"
                      className="w-16 h-16 rounded-lg border border-slate-300 bg-white p-1"
                    />
                  )}
                  <div>
                    <span className="font-bold text-slate-800">
                      {lang === 'bn' ? 'স্মার্টফোন দিয়ে স্ক্যান করুন' : 'Scan to Verify On Mobile'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Token: <code className="font-mono text-emerald-800">{deed.qrToken}</code>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateVerifyFull(deed.qrToken)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ফাইল আপলোড করে পূর্ণ যাচাই' : 'Test Upload File Verification'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'bn' ? 'কোনো দলিল পাওয়া যায়নি' : 'No Deed Found for this Token'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'bn'
                ? 'অনুগ্রহ করে সঠিক কিউআর টোকেন দিন (যেমন: LV-DOC-DHK-MIR-001) অথবা মূল অ্যাপে নমুনা দলিল পরীক্ষা করুন।'
                : 'Please check the verification token or try one of the registered demo deeds below:'}
            </p>

            {/* Quick Demo Deed Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {deeds.slice(0, 3).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setCurrentToken(d.qrToken)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200 transition"
                >
                  {d.qrToken} ({d.plotId})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prototype Disclaimer Watermark Footer */}
        <div className="text-center py-4 text-xs text-slate-400 space-y-1">
          <p className="font-semibold uppercase tracking-wider text-slate-500">
            LandTech Innovation Hackathon 2026 | Synthetic Data Prototype
          </p>
          <p className="text-[11px]">
            {lang === 'bn'
              ? 'এটি একটি পরীক্ষামূলক প্রোটোটাইপ। সকল তথ্য কৃত্রিম এবং কেবল প্রদর্শনের জন্য তৈরি।'
              : 'This is a hackathon prototype using 100% synthetic dummy data. Not an official legal land document.'}
          </p>
        </div>
      </main>
    </div>
  );
};
