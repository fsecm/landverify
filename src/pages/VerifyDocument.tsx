import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Search,
  RefreshCw,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Deed, Alert, Plot, Language } from '../types';
import { translations } from '../utils/translations';
import { computeFileHash, computeStringHash, compareHashes } from '../utils/hash';
import { createTamperedAlert } from '../utils/fraud';
import {
  SAMPLE_DEED_CONTENT_001,
  SAMPLE_DEED_CONTENT_001_TAMPERED,
  saveStoredAlerts,
  incrementVerifiedCount,
} from '../utils/storage';
import { logActivity } from '../utils/activity';
import { VerificationCertificateModal } from '../components/VerificationCertificateModal';

interface VerifyDocumentProps {
  deeds: Deed[];
  alerts: Alert[];
  plots?: Plot[];
  lang: Language;
  onAlertCreated: (newAlerts: Alert[]) => void;
  onOpenSampleModal: () => void;
  initialToken?: string;
}

type VerificationStatus = 'IDLE' | 'AUTHENTIC' | 'TAMPERED' | 'NOT_FOUND';

export const VerifyDocument: React.FC<VerifyDocumentProps> = ({
  deeds,
  alerts,
  plots = [],
  lang,
  onAlertCreated,
  onOpenSampleModal,
  initialToken = '',
}) => {
  const t = translations[lang];

  // Form states
  const [qrToken, setQrToken] = useState<string>(initialToken);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);

  // Result states
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('IDLE');
  const [matchedDeed, setMatchedDeed] = useState<Deed | null>(null);
  const [computedFileHash, setComputedFileHash] = useState<string>('');
  const [storedRecordHash, setStoredRecordHash] = useState<string>('');

  // Handle uploaded file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setVerificationStatus('IDLE');
    }
  };

  // Quick helper: Load Authentic Sample Deed 001 into state
  const handleLoadAuthenticSample = () => {
    setQrToken('LV-DOC-DHK-MIR-001');
    const blob = new Blob([SAMPLE_DEED_CONTENT_001], { type: 'text/plain' });
    const file = new File([blob], 'Sample_Deed_DHK-MIR-001_Authentic.txt', { type: 'text/plain' });
    setSelectedFile(file);
    setVerificationStatus('IDLE');
  };

  // Quick helper: Load Tampered Sample Deed into state
  const handleLoadTamperedSample = () => {
    setQrToken('LV-DOC-DHK-MIR-001');
    const blob = new Blob([SAMPLE_DEED_CONTENT_001_TAMPERED], { type: 'text/plain' });
    const file = new File([blob], 'Sample_Deed_DHK-MIR-001_Tampered.txt', { type: 'text/plain' });
    setSelectedFile(file);
    setVerificationStatus('IDLE');
  };

  // Run verification algorithm
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrToken.trim()) {
      alert('Please enter or scan a deed QR Token.');
      return;
    }
    if (!selectedFile) {
      alert('Please upload the deed file (PDF, TXT, or Image) to verify.');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('IDLE');

    try {
      // Step 1: Compute SHA-256 of the uploaded file bytes
      const fileHash = await computeFileHash(selectedFile);
      setComputedFileHash(fileHash);

      // Step 2: Query registry for the token
      const deed = deeds.find((d) => d.qrToken.trim() === qrToken.trim());

      if (!deed) {
        // Case 3: Token not found
        setMatchedDeed(null);
        setStoredRecordHash('');
        setVerificationStatus('NOT_FOUND');
      } else {
        setMatchedDeed(deed);
        setStoredRecordHash(deed.fileHash);

        // Step 3: Compare hashes
        const isMatch = compareHashes(fileHash, deed.fileHash);

        if (isMatch) {
          // Case 1: AUTHENTIC
          setVerificationStatus('AUTHENTIC');
          incrementVerifiedCount();
          logActivity(
            'VERIFICATION_ATTEMPTED',
            'Public Citizen',
            'Deed Cryptographically Authenticated',
            `Deed ${deed.deedNo} for Plot ${deed.plotId} verified with bit-for-bit SHA-256 match.`,
            'SUCCESS',
            deed.plotId,
            deed.id
          );
          // Trigger confetti for genuine verification
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#059669', '#10b981', '#34d399', '#0284c7'],
            });
          } catch {
            // Ignore confetti errors
          }
        } else {
          // Case 2: TAMPERED!
          setVerificationStatus('TAMPERED');
          // Automatically create a TAMPERED alert in the review queue
          const newAlert = createTamperedAlert(deed.plotId, deed.deedNo, deed.fileHash, fileHash);
          const updatedAlerts = [newAlert, ...alerts];
          saveStoredAlerts(updatedAlerts);
          onAlertCreated(updatedAlerts);
          logActivity(
            'VERIFICATION_ATTEMPTED',
            'Public Citizen',
            'Deed Tampering Flagged',
            `Tampered deed detected for Plot ${deed.plotId}. Uploaded file SHA-256 differed from Sub-Registry record.`,
            'DANGER',
            deed.plotId,
            deed.id
          );
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      alert('Error computing cryptographic hash. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper to render hash diff highlighting differences
  const renderHashDiff = (expected: string, computed: string) => {
    const charsA = expected.split('');
    const charsB = computed.split('');
    const maxLength = Math.max(charsA.length, charsB.length);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        {/* Official Hash */}
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
            {t.verify.expectedHashLabel}
          </div>
          <div className="break-all leading-relaxed text-slate-700 bg-slate-50 p-2 rounded-lg">
            {expected}
          </div>
        </div>

        {/* Uploaded Hash with differences highlighted */}
        <div className="p-3 bg-white rounded-xl border border-red-200">
          <div className="text-[10px] uppercase font-bold text-red-600 mb-1">
            {t.verify.uploadedHashLabel}
          </div>
          <div className="break-all leading-relaxed bg-red-50/60 p-2 rounded-lg">
            {Array.from({ length: maxLength }).map((_, i) => {
              const charA = charsA[i] || '';
              const charB = charsB[i] || '';
              const isDifferent = charA !== charB;

              return (
                <span
                  key={i}
                  className={
                    isDifferent
                      ? 'bg-red-500 text-white font-extrabold px-0.5 rounded-xs'
                      : 'text-slate-700'
                  }
                >
                  {charB}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            {lang === 'bn' ? 'সার্বজনীন যাচাই সেবা' : 'Public Due Diligence'}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Zero-Trust Cryptographic Engine</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
          {t.verify.title}
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          {t.verify.subtitle}
        </p>
      </div>

      {/* Main Grid: Input Form + Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Form (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'bn' ? 'দলিল যাচাই ফরম' : 'Document Verification Form'}
            </h3>
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SHA-256</span>
            </span>
          </div>

          {/* Quick Demo Pre-load buttons */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{t.verify.sampleHelpTitle}</span>
              <button
                onClick={onOpenSampleModal}
                className="text-emerald-700 hover:text-emerald-800 text-[11px] underline"
              >
                Kit Details
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleLoadAuthenticSample}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Test Authentic</span>
              </button>
              <button
                type="button"
                onClick={handleLoadTamperedSample}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Test Tampered</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {/* QR Token input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.verify.tokenInput} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={t.verify.tokenPlaceholder}
                  value={qrToken}
                  onChange={(e) => {
                    setQrToken(e.target.value);
                    setVerificationStatus('IDLE');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* File Upload input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.verify.fileInput} <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center transition bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="file"
                  id="verify-file-upload"
                  accept=".pdf,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="verify-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-full">
                    {selectedFile ? (
                      <span className="text-blue-700 font-bold truncate block">
                        {selectedFile.name}
                      </span>
                    ) : (
                      'Select signed deed file to check'
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    PDF, TXT, Scanned image
                  </span>
                </label>
              </div>
            </div>

            {/* Verify Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-900/20 hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculating SHA-256 Digest...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.verify.verifyBtn}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Verification Big Result Card (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col">
          {verificationStatus === 'IDLE' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Awaiting Deed Document & Token
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enter a QR token and select the deed document on the left, then click verify to check authenticity against the Sub-Registry cryptographic ledger.
              </p>
            </div>
          )}

          {/* GREEN AUTHENTIC CARD */}
          {verificationStatus === 'AUTHENTIC' && matchedDeed && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-md flex-1 flex flex-col justify-between space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                      VERIFICATION SUCCESS
                    </span>
                    <h3 className="text-2xl font-black text-emerald-950 tracking-tight mt-0.5">
                      {t.verify.statusAuthentic}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-emerald-900 font-medium mt-3 leading-relaxed">
                  {t.verify.authenticDesc}
                </p>

                {/* Deed details */}
                <div className="mt-4 p-4 bg-white/90 rounded-xl border border-emerald-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Deed Number:
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {matchedDeed.deedNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Plot ID:
                    </span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {matchedDeed.plotId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Execution Date:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {matchedDeed.deedDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Seller:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {matchedDeed.seller}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Buyer:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {matchedDeed.buyer}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Sub-Registry:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {matchedDeed.subRegistryOffice || 'Mirpur Sub-Registry'}
                    </span>
                  </div>
                </div>

                {/* Matching Hash display */}
                <div className="mt-4 p-3 bg-white/90 rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                    <span>Cryptographic Fingerprint (SHA-256):</span>
                    <span className="text-emerald-700">Bit-for-Bit 100% Match ✔</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-800 break-all bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                    {computedFileHash}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200">
                {t.verify.diffExplanation}
              </div>

              {/* Certificate Download Action */}
              <button
                type="button"
                onClick={() => setIsCertModalOpen(true)}
                className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer hover:shadow-md"
                title="Generate printable A4 deed verification certificate"
              >
                <Download className="w-4 h-4" />
                <span>
                  {lang === 'bn' 
                    ? 'যাচাইকরণ সনদ ডাউনলোড / প্রিন্ট করুন (A4 Certificate)' 
                    : 'Download Official Verification Certificate (Printable A4)'}
                </span>
              </button>
            </div>
          )}

          {/* RED TAMPERED CARD */}
          {verificationStatus === 'TAMPERED' && matchedDeed && (
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 shadow-md flex-1 flex flex-col justify-between space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-600 text-white rounded-2xl shadow-sm">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-800 bg-red-200/70 px-2 py-0.5 rounded">
                      INTEGRITY VIOLATION DETECTED
                    </span>
                    <h3 className="text-2xl font-black text-red-950 tracking-tight mt-0.5">
                      {t.verify.statusTampered}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-red-900 font-medium mt-3 leading-relaxed">
                  {t.verify.tamperedDesc}
                </p>

                {/* Side-by-side hash comparison highlighting differences */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-bold text-red-950">
                    Side-by-Side Cryptographic Hash Comparison:
                  </div>
                  {renderHashDiff(storedRecordHash, computedFileHash)}
                </div>

                {/* Tamper Alert Notice */}
                <div className="mt-4 p-3.5 bg-red-100/80 border border-red-300 rounded-xl flex items-start space-x-2 text-xs text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">System Alert Generated:</span> A TAMPERED incident has been immediately logged for Plot {matchedDeed.plotId} in the Sub-Registrar Review Queue.
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-red-800 bg-red-100/50 p-2.5 rounded-xl border border-red-200">
                {t.verify.diffExplanation}
              </div>
            </div>
          )}

          {/* GRAY NOT FOUND CARD */}
          {verificationStatus === 'NOT_FOUND' && (
            <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-6 shadow-md flex-1 flex flex-col justify-between space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-slate-500 text-white rounded-2xl shadow-sm">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      NO MATCH IN REGISTRY
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {t.verify.statusNotFound}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                  {t.verify.notFoundDesc}
                </p>

                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Requested Token:
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {qrToken}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Uploaded File SHA-256:
                    </span>
                    <span className="font-mono text-[11px] text-slate-700 break-all">
                      {computedFileHash}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-200/60 p-2.5 rounded-xl">
                Tip: Click "Test Authentic" or "Sample Deeds" at the top to load a known synthetic token and deed.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable A4 Certificate Modal */}
      {matchedDeed && (
        <VerificationCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          deed={matchedDeed}
          plot={plots?.find((p) => p.plotId === matchedDeed.plotId)}
          verifiedHash={computedFileHash}
          lang={lang}
        />
      )}
    </div>
  );
};
