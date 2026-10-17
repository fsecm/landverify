/**
 * Printable A4 Verification Certificate Modal
 * Generates an official, high-fidelity certificate for authenticated deeds.
 * Includes @media print stylesheet for clean A4 printing without web UI chrome.
 */

import React, { useEffect, useState } from 'react';
import { Printer, X, Download, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import { Deed, Plot, Language } from '../types';
import { generateQrDataUrl } from '../utils/qr';

interface VerificationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  deed: Deed;
  plot?: Plot;
  verifiedHash: string;
  lang: Language;
}

export const VerificationCertificateModal: React.FC<VerificationCertificateModalProps> = ({
  isOpen,
  onClose,
  deed,
  plot,
  verifiedHash,
  lang,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const certId = `CERT-${deed.plotId}-${Date.now().toString().slice(-6)}`;
  const certDate = new Date().toLocaleString();

  useEffect(() => {
    if (isOpen && deed.qrToken) {
      generateQrDataUrl(deed.qrToken).then(setQrUrl);
    }
  }, [isOpen, deed.qrToken]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-300 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">
              {lang === 'bn' ? 'মুদ্রণযোগ্য দলিল যাচাইকরণ সনদ' : 'Printable Verification Certificate'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF সংরক্ষণ' : 'Print / Save as PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 CERTIFICATE BODY */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-[#fdfdfb] text-slate-900 print:p-0 print:m-0 print:overflow-visible">
          {/* Watermark / Border Frame */}
          <div className="border-4 border-double border-emerald-900 p-8 rounded-xl relative bg-white shadow-xs">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-800" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-800" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-800" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-800" />

            {/* Header */}
            <div className="text-center space-y-1.5 pb-6 border-b-2 border-emerald-900/30">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center font-black text-xl shadow-inner border border-emerald-700">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-emerald-950 font-serif">
                People's Republic of Bangladesh
              </h2>
              <h3 className="text-sm sm:text-base font-bold text-slate-700 uppercase tracking-widest">
                Directorate of Registration • E-Governance Cryptographic Verification
              </h3>
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-widest rounded-full border border-emerald-300 mt-1">
                Official Digital Deed Authenticity Certificate
              </div>
            </div>

            {/* Prominent Mandatory Prototype Notice */}
            <div className="my-4 py-2 px-3 bg-amber-50 border border-amber-300 rounded-lg text-center text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              ⚠ Synthetic prototype, not a legal document. Generated for hackathon demonstration.
            </div>

            {/* Certificate Metadata */}
            <div className="flex justify-between items-center text-xs text-slate-600 pb-4 font-mono">
              <div>
                <span className="font-semibold text-slate-400">Certificate No: </span>
                <span className="font-bold text-slate-900">{certId}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400">Issued On: </span>
                <span className="font-bold text-slate-900">{certDate}</span>
              </div>
            </div>

            {/* Certified statement */}
            <p className="text-xs text-slate-800 leading-relaxed text-justify mb-5">
              This is to certify that the cryptographic byte-stream fingerprint of the document submitted for verification 
              has been mathematically evaluated and verified against the Sub-Registry immutable ledger records. 
              The SHA-256 digest matches the original execution record bit-for-bit with zero detected discrepancies.
            </p>

            {/* Deed & Plot Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Deed Number</span>
                <span className="font-mono font-bold text-sm text-slate-950">{deed.deedNo}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plot Identifier</span>
                <span className="font-mono font-bold text-sm text-emerald-800">{deed.plotId}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Seller Full Name</span>
                <span className="font-semibold text-slate-900">{deed.seller}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Buyer Full Name</span>
                <span className="font-semibold text-slate-900">{deed.buyer}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sub-Registry Office</span>
                <span className="font-semibold text-slate-900">{deed.subRegistryOffice || 'Mirpur Sub-Registry'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Execution Date</span>
                <span className="font-semibold text-slate-900">{deed.deedDate}</span>
              </div>
              {plot && (
                <>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Mouza & Upazila</span>
                    <span className="font-semibold text-slate-900">{plot.mouza}, {plot.upazila}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Khatian & Dag No</span>
                    <span className="font-semibold text-slate-900 font-mono">{plot.khatianNo} (Dag {plot.dagNo})</span>
                  </div>
                </>
              )}
            </div>

            {/* Cryptographic SHA-256 Box */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3.5 mb-6 text-xs font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
                  Verified SHA-256 Cryptographic Hash (SubtleCrypto Digest)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded">
                  100% BIT-EXACT MATCH
                </span>
              </div>
              <div className="break-all text-[11px] font-bold text-emerald-950 bg-white p-2 rounded border border-emerald-200">
                {verifiedHash || deed.fileHash}
              </div>
            </div>

            {/* Footer with Signatures & QR Code */}
            <div className="flex items-end justify-between pt-4 border-t border-slate-200">
              {/* QR Token box */}
              <div className="flex items-center space-x-3">
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt="Certificate QR"
                    className="w-20 h-20 border border-slate-300 p-1 rounded-lg bg-white"
                  />
                )}
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  <div className="font-bold text-slate-800">Scan to Verify Online</div>
                  <div>Token: {deed.qrToken}</div>
                  <div className="text-emerald-700 font-semibold">Web Crypto SHA-256</div>
                </div>
              </div>

              {/* Digital Seal & Stamp */}
              <div className="text-center space-y-1">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-emerald-800 flex items-center justify-center text-emerald-900 font-bold text-[9px] uppercase tracking-tighter p-1 transform rotate-[-8deg]">
                  Official Verification Seal
                </div>
                <div className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Sub-Registrar Digital Authority
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
