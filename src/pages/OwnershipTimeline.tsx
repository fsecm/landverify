import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  Link2,
  Shield,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { LedgerEntry, Plot, Language } from '../types';
import { translations } from '../utils/translations';
import {
  verifyChain,
  simulateLedgerTampering,
  ChainVerificationResult,
} from '../utils/ledger';
import { saveStoredLedger } from '../utils/storage';
import { formatHashShort } from '../utils/hash';

interface OwnershipTimelineProps {
  plots: Plot[];
  ledger: LedgerEntry[];
  lang: Language;
  onLedgerUpdated: (updatedLedger: LedgerEntry[]) => void;
  onRestoreData: () => void;
  initialPlotId?: string;
}

export const OwnershipTimeline: React.FC<OwnershipTimelineProps> = ({
  plots,
  ledger,
  lang,
  onLedgerUpdated,
  onRestoreData,
  initialPlotId,
}) => {
  const t = translations[lang];

  // Default plot
  const [selectedPlotId, setSelectedPlotId] = useState<string>(
    initialPlotId || plots[0]?.plotId || 'DHK-MIR-001'
  );
  const [verificationResult, setVerificationResult] = useState<ChainVerificationResult | null>(null);
  const [isTamperedSimulation, setIsTamperedSimulation] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Run chain verification whenever plot or ledger changes
  useEffect(() => {
    let isCurrent = true;
    const runAudit = async () => {
      setIsVerifying(true);
      const res = await verifyChain(selectedPlotId, ledger);
      if (isCurrent) {
        setVerificationResult(res);
        setIsVerifying(false);
      }
    };
    runAudit();
    return () => {
      isCurrent = false;
    };
  }, [selectedPlotId, ledger]);

  const selectedPlot = plots.find((p) => p.plotId === selectedPlotId) || plots[0];

  // Filter entries for this plot
  const plotLedger = ledger
    .filter((e) => e.plotId === selectedPlotId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Simulate Tampering Action
  const handleSimulateTamper = async () => {
    const { updatedLedger, tamperedEntry } = simulateLedgerTampering(selectedPlotId, ledger);
    if (!tamperedEntry) {
      alert('No ledger entries available for this plot to tamper.');
      return;
    }

    saveStoredLedger(updatedLedger);
    setIsTamperedSimulation(true);
    onLedgerUpdated(updatedLedger);
  };

  // Restore Action
  const handleRestore = () => {
    setIsTamperedSimulation(false);
    onRestoreData();
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            {lang === 'bn' ? 'অপরিবর্তনীয় অডিট ট্রেইল' : 'Immutable Audit Trail'}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Hash-Chained Cryptographic Provenance</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
          {t.timeline.title}
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          {t.timeline.subtitle}
        </p>
      </div>

      {/* Plot Selector & Interactive Tamper Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
            {t.timeline.selectPlot}:
          </label>
          <select
            value={selectedPlotId}
            onChange={(e) => {
              setSelectedPlotId(e.target.value);
              setIsTamperedSimulation(false);
            }}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            {plots.map((p) => (
              <option key={p.plotId} value={p.plotId}>
                {p.plotId} - {p.mouza} (Owner: {p.currentOwner})
              </option>
            ))}
          </select>
        </div>

        {/* Demo Tamper Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateTamper}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            title="Secretly modify historical ledger record to demo mathematical proof of tampering"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>{t.timeline.simulateTamperBtn}</span>
          </button>

          <button
            onClick={handleRestore}
            className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.timeline.restoreBtn}</span>
          </button>
        </div>
      </div>

      {/* HASH-CHAIN INTEGRITY BANNER */}
      {verificationResult && (
        <div
          className={`p-5 rounded-2xl border-2 shadow-sm transition-all animate-in fade-in duration-150 ${
            verificationResult.valid
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : 'bg-red-50 border-red-500 text-red-950'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2.5 rounded-xl text-white shrink-0 mt-0.5 ${
                  verificationResult.valid ? 'bg-emerald-600' : 'bg-red-600 animate-bounce'
                }`}
              >
                {verificationResult.valid ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {verificationResult.valid
                    ? t.timeline.chainValid
                    : t.timeline.chainBroken}
                </h3>
                <p className="text-xs opacity-90 mt-0.5">
                  {verificationResult.valid
                    ? `All ${verificationResult.totalEntries} sequential ledger blocks mathematically verified from GENESIS head. Zero unauthorized tampering detected.`
                    : verificationResult.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono shrink-0 pl-11 md:pl-0">
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-current font-bold">
                Blocks: {verificationResult.totalEntries}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-current font-bold">
                Plot: {selectedPlotId}
              </span>
            </div>
          </div>

          {/* If broken, show detailed diagnostic diff */}
          {!verificationResult.valid && (
            <div className="mt-4 pt-4 border-t border-red-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-white p-3 rounded-xl border border-red-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Expected Cryptographic Hash:
                </span>
                <span className="text-emerald-700 font-bold break-all">
                  {verificationResult.expectedHash}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-red-300">
                <span className="text-[10px] text-red-600 font-bold uppercase block mb-1">
                  Corrupted / Stored Hash:
                </span>
                <span className="text-red-700 font-bold break-all">
                  {verificationResult.actualHash}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explanatory Educational Callout for Judges */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs border border-slate-800">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{t.timeline.whyHashChain}</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                Technical Architecture Note
              </span>
            </h4>
            <p className="leading-relaxed">
              {t.timeline.chainDesc}
            </p>
            <div className="pt-1 flex flex-wrap gap-4 text-[11px] text-emerald-400">
              <span>✔ Zero Gas Fees / Energy Waste</span>
              <span>✔ Instant Sub-Second Audit Computation</span>
              <span>✔ Browser Web Crypto SHA-256</span>
              <span>✔ Sovereign E-Governance Scalability</span>
            </div>
          </div>
        </div>
      </div>

      {/* VERTICAL TIMELINE OF LEDGER BLOCKS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sequential Ledger Blocks for {selectedPlotId}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each block cryptographically encapsulates the exact state and parent hash.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {plotLedger.length} Records
          </span>
        </div>

        {plotLedger.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No ledger entries found for this plot. Register a deed to initialize the chain.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {plotLedger.map((block, index) => {
              const isBrokenBlock =
                verificationResult &&
                !verificationResult.valid &&
                verificationResult.brokenIndex === index;

              return (
                <div key={block.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition ${
                      isBrokenBlock
                        ? 'bg-red-600 border-red-300 text-white animate-pulse'
                        : 'bg-emerald-600 border-emerald-200 text-white'
                    }`}
                  >
                    {isBrokenBlock ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Block Content Card */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border transition ${
                      isBrokenBlock
                        ? 'bg-red-50 border-red-400 shadow-md'
                        : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Block #{index + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            block.eventType === 'ALERT_FLAGGED'
                              ? 'bg-red-100 text-red-800'
                              : block.eventType === 'MUTATION_APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {block.eventType}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium">
                        {new Date(block.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Note & Deed details */}
                    <div className="py-2.5 text-xs text-slate-800 font-medium">
                      {block.note || 'Ledger event recorded.'}
                    </div>

                    {/* Cryptographic Linkages */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 font-mono text-[11px] space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-400 font-medium text-[10px] uppercase">
                          Previous Hash (prevHash):
                        </span>
                        <span
                          className={`font-semibold ${
                            block.prevHash === 'GENESIS'
                              ? 'text-purple-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {block.prevHash === 'GENESIS' ? 'GENESIS (Head)' : block.prevHash}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-medium text-[10px] uppercase">
                          Block Record Hash:
                        </span>
                        <span
                          className={`font-bold break-all ${
                            isBrokenBlock ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {block.recordHash}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
