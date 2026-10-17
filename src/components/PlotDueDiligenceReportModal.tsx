import React, { useEffect, useState } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  MapPin,
  CheckCircle2,
  Clock,
  Landmark,
  FileCheck2,
} from 'lucide-react';
import { Plot, Deed, Mutation, Mortgage, Alert, Language } from '../types';
import { calculatePlotRiskScore } from '../utils/fraud';
import { verifyPlotChain } from '../utils/ledger';
import { generateQrDataUrl } from '../utils/qr';
import { getPublicVerifyUrl } from '../utils/privacy';

interface PlotDueDiligenceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: Plot | null;
  deeds: Deed[];
  mutations: Mutation[];
  mortgages: Mortgage[];
  alerts: Alert[];
  lang: Language;
}

export const PlotDueDiligenceReportModal: React.FC<PlotDueDiligenceReportModalProps> = ({
  isOpen,
  onClose,
  plot,
  deeds,
  mutations,
  mortgages,
  alerts,
  lang,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  if (!isOpen || !plot) return null;

  const plotDeeds = deeds.filter((d) => d.plotId === plot.plotId);
  const plotMutations = mutations.filter((m) => m.plotId === plot.plotId);
  const plotMortgages = mortgages.filter((m) => m.plotId === plot.plotId);
  const plotAlerts = alerts.filter((a) => a.plotId === plot.plotId);

  // Raw ledger from localStorage
  const rawLedger = JSON.parse(
    localStorage.getItem('landverify_ledger_v2') || localStorage.getItem('landverify_ledger') || '[]'
  );
  const chainResult = verifyPlotChain(rawLedger, plot.plotId);
  const riskAssessment = calculatePlotRiskScore(
    plot,
    plotAlerts,
    plotDeeds,
    plotMutations,
    plotMortgages,
    !chainResult.isValid
  );

  useEffect(() => {
    const reportUrl = `${window.location.origin}${window.location.pathname}#/verify/${plot.plotId}`;
    generateQrDataUrl(reportUrl).then(setQrDataUrl);
  }, [plot]);

  const handlePrint = () => {
    window.print();
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'SAFE':
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'REVIEW':
        return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'RISKY':
        return 'text-red-700 bg-red-50 border-red-300';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-4 flex flex-col overflow-hidden max-h-[95vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              {lang === 'bn' ? 'জমির পূর্ণাঙ্গ অনুসন্ধান রিপোর্ট (A4 Print)' : 'Plot Due-Diligence Certificate & Title Audit Report'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF সংরক্ষণ' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Report Content */}
        <div className="p-8 sm:p-10 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 font-sans space-y-6">
          {/* Watermark for Screen & Print */}
          <div className="border-4 border-double border-slate-300 p-6 sm:p-8 rounded-2xl relative bg-white">
            {/* Diagonal Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none rotate-[-25deg]">
              <span className="text-7xl font-black tracking-widest text-slate-900 uppercase">
                SYNTHETIC PROTOTYPE
              </span>
            </div>

            {/* Official Header */}
            <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1 relative">
              <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-widest">
                <span>Government of the People's Republic of Bangladesh</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Official Land Title Due-Diligence Report
              </h1>
              <p className="text-xs text-slate-600">
                Joint Electronic Land Records System • Ministry of Land & Sub-Registry Interoperability Portal
              </p>
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Report Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • Ref ID: LV-REP-{plot.plotId}-{Date.now().toString().slice(-4)}
              </div>
            </div>

            {/* Plot Identity & Risk Gauge Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 pb-2">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Plot Identification:
                  </span>
                  <span className="font-mono text-base font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                    {plot.plotId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Division / District:</span>{' '}
                    <strong className="text-slate-800">{plot.division} / {plot.district}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Upazila / Mouza:</span>{' '}
                    <strong className="text-slate-800">{plot.upazila} / {plot.mouza}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Khatian & Dag:</span>{' '}
                    <strong className="text-slate-800">{plot.khatianNo} (Dag #{plot.dagNo})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Area & Land Type:</span>{' '}
                    <strong className="text-slate-800">{plot.areaDecimal} Decimal ({plot.landType})</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Current Recorded Legal Owner:</span>{' '}
                    <strong className="text-emerald-900 text-sm font-bold">{plot.currentOwner}</strong>
                  </div>
                </div>
              </div>

              {/* Risk Score Stamp */}
              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getRiskColor(riskAssessment.level)}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Citizen Risk Score
                </span>
                <div className="text-3xl font-black my-0.5">
                  {riskAssessment.score}<span className="text-base font-medium">/100</span>
                </div>
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/80 border border-current">
                  {riskAssessment.level}
                </span>
                <span className="text-[10px] opacity-80 mt-1">
                  {chainResult.isValid ? 'Ledger Chain Intact ✔' : 'Chain Broken ✘'}
                </span>
              </div>
            </div>

            {/* Special Administrative Flags */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className={`p-2 rounded-lg border text-center font-medium ${plot.isKhasLand ? 'bg-red-50 text-red-800 border-red-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                Khas Property: {plot.isKhasLand ? 'YES (State Property)' : 'NO'}
              </div>
              <div className={`p-2 rounded-lg border text-center font-medium ${plot.govAcquisitionStatus !== 'none' ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                Acquisition: {plot.govAcquisitionStatus.toUpperCase()}
              </div>
              <div className={`p-2 rounded-lg border text-center font-medium ${plot.courtCaseStatus !== 'none' ? 'bg-red-50 text-red-800 border-red-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                Court Suit: {plot.courtCaseStatus.toUpperCase()}
              </div>
            </div>

            {/* Section: Cadastral Survey Records */}
            {plot.surveys && plot.surveys.length > 0 && (
              <div className="pt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b pb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Historical Survey Chain (CS ➔ SA ➔ RS ➔ BS)</span>
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Survey</th>
                      <th className="p-2 border-r border-slate-200">Year</th>
                      <th className="p-2 border-r border-slate-200">Recorded Owner</th>
                      <th className="p-2 border-r border-slate-200">Khatian / Dag</th>
                      <th className="p-2">Area (Dec)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plot.surveys.map((s, idx) => (
                      <tr key={idx} className="border-t border-slate-200">
                        <td className="p-2 font-bold border-r border-slate-200">{s.surveyType}</td>
                        <td className="p-2 border-r border-slate-200">{s.year}</td>
                        <td className="p-2 border-r border-slate-200">{s.recordedOwner}</td>
                        <td className="p-2 border-r border-slate-200">{s.khatianNo} / #{s.dagNo}</td>
                        <td className="p-2 font-bold">{s.areaDecimal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section: Registered Deeds */}
            <div className="pt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b pb-1">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Sub-Registry Registered Deeds ({plotDeeds.length})</span>
              </h3>
              {plotDeeds.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No registered deeds found on file for this plot.</p>
              ) : (
                <div className="space-y-1.5">
                  {plotDeeds.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{d.deedNo}</span>{' '}
                        <span className="text-slate-500">({d.deedDate})</span>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Seller: <strong>{d.seller}</strong> ➔ Buyer: <strong>{d.buyer}</strong>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-500">
                        Hash: {d.fileHash.slice(0, 16)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Bank Mortgages & Liens */}
            <div className="pt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b pb-1">
                <Landmark className="w-3.5 h-3.5 text-slate-500" />
                <span>Bank Collateral Liens ({plotMortgages.length})</span>
              </h3>
              {plotMortgages.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No bank mortgage encumbrances recorded.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {plotMortgages.map((m) => (
                    <div key={m.id} className={`p-2.5 rounded-lg border ${m.status === 'active' ? 'bg-amber-50/80 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-center justify-between">
                        <strong className="text-xs">{m.bankName}</strong>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.status === 'active' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                          {m.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] mt-1">
                        BDT {m.loanAmountBDT.toLocaleString()} • Date: {m.mortgageDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Open Alerts & Flags */}
            {plotAlerts.length > 0 && (
              <div className="pt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center space-x-1.5 border-b border-red-200 pb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Active Title Alerts & Disputes ({plotAlerts.length})</span>
                </h3>
                <div className="space-y-1.5">
                  {plotAlerts.map((a) => (
                    <div key={a.id} className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-900">
                      <strong>[{a.type}]</strong> {a.description} ({a.status})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer with QR Code & Synthetic Disclaimer */}
            <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase text-slate-900">
                  Authentication & Legal Disclaimer
                </div>
                <p className="text-[10px] text-slate-500 max-w-lg leading-relaxed">
                  This document was generated using LandVerify's cryptographic audit ledger (SHA-256 Web Crypto hash-chaining).
                  <strong> SYNTHETIC PROTOTYPE:</strong> All citizen names, Khatians, and survey records are fictitious dummy data created for the LandTech Innovation Hackathon 2026. Not admissible as a court title certificate.
                </p>
              </div>

              {qrDataUrl && (
                <div className="shrink-0 text-center">
                  <img src={qrDataUrl} alt="Verify QR" className="w-20 h-20 border border-slate-300 p-1 bg-white mx-auto rounded" />
                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">Scan to verify</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
