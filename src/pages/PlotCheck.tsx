/**
 * Plot Check Page ("Check Before You Buy" / Citizen Due Diligence)
 * Features:
 * - 0-100 Dynamic Risk Score Gauge with color-coded severity
 * - "Why this score?" itemized point additions
 * - CS / SA / RS / BS historical survey comparison table with discrepancy detection
 * - Bank mortgage lien status and double mortgage warnings
 * - Extended plot metadata: Khas land, Court case, and Government acquisition status
 */

import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  User,
  Layers,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  Info,
  Download,
  Landmark,
  Scale,
  Building,
  HelpCircle,
  FileCheck2,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { Alert, Deed, Mutation, Plot, Mortgage, Language } from '../types';
import { translations } from '../utils/translations';
import { calculatePlotRiskScore, checkKhatianSurveyMismatches } from '../utils/fraud';
import { PageId } from '../components/Sidebar';
import { exportDeedsToCSV } from '../utils/storage';

interface PlotCheckProps {
  plots: Plot[];
  deeds: Deed[];
  mutations: Mutation[];
  mortgages: Mortgage[];
  alerts: Alert[];
  lang: Language;
  onNavigate: (page: PageId, extra?: { plotId?: string; token?: string }) => void;
  initialPlotId?: string;
}

export const PlotCheck: React.FC<PlotCheckProps> = ({
  plots,
  deeds,
  mutations,
  mortgages = [],
  alerts,
  lang,
  onNavigate,
  initialPlotId,
}) => {
  const t = translations[lang];

  // Default to initialPlotId, or DHK-MIR-004, or the first plot
  const defaultId = initialPlotId || (plots.some((p) => p.plotId === 'DHK-MIR-004') ? 'DHK-MIR-004' : plots[0]?.plotId || '');
  const [selectedPlotId, setSelectedPlotId] = useState<string>(defaultId);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected plot
  const plot = plots.find((p) => p.plotId === selectedPlotId) || plots[0];

  // Deeds for this plot
  const plotDeeds = deeds.filter((d) => d.plotId === plot?.plotId);

  // Mutations for this plot
  const plotMutations = mutations.filter((m) => m.plotId === plot?.plotId);

  // Mortgages for this plot
  const plotMortgages = mortgages.filter((m) => m.plotId === plot?.plotId);
  const activePlotMortgages = plotMortgages.filter((m) => m.status === 'active');

  // Alerts for this plot
  const plotAlerts = alerts.filter((a) => a.plotId === plot?.plotId);
  const openAlerts = plotAlerts.filter((a) => a.status === 'OPEN');

  // Dynamic 0-100 Risk Score calculation
  const riskAssessment = plot
    ? calculatePlotRiskScore(plot, alerts, deeds, mutations, mortgages, false)
    : { score: 0, level: 'SAFE' as const, breakdown: [], summary: '' };

  // Survey discrepancy check
  const surveyMismatch = plot ? checkKhatianSurveyMismatches(plot) : { hasMismatch: false, discrepancies: [] };

  // Gauge Color
  const getScoreColor = (score: number) => {
    if (score > 60) return { text: 'text-red-600', bg: 'bg-red-600', ring: 'stroke-red-500', badge: 'bg-red-100 text-red-900 border-red-300' };
    if (score > 25) return { text: 'text-amber-600', bg: 'bg-amber-600', ring: 'stroke-amber-500', badge: 'bg-amber-100 text-amber-900 border-amber-300' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-600', ring: 'stroke-emerald-500', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
  };

  const scoreTheme = getScoreColor(riskAssessment.score);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            {lang === 'bn' ? 'ক্রেতার সুরক্ষা ও ঝুঁকি নিরীক্ষা' : 'Buyer Due Diligence & Risk Audit'}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Full Title Search • Multi-Department Registry Cross-Reference</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
          {t.plotCheck.title}
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          {t.plotCheck.subtitle}
        </p>
      </div>

      {/* Quick Selection Pills & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t.plotCheck.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.plotCheck.selectPlot}:
            </span>
            <select
              value={selectedPlotId}
              onChange={(e) => setSelectedPlotId(e.target.value)}
              className="py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden max-w-xs truncate"
            >
              {plots
                .filter((p) => {
                  if (!searchTerm.trim()) return true;
                  const q = searchTerm.toLowerCase();
                  return (
                    p.plotId.toLowerCase().includes(q) ||
                    p.currentOwner.toLowerCase().includes(q) ||
                    p.mouza.toLowerCase().includes(q)
                  );
                })
                .map((p) => (
                  <option key={p.plotId} value={p.plotId}>
                    {p.plotId} - {p.mouza} ({p.currentOwner})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Quick Demo Case Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Inspection Scenarios:</span>

          <button
            onClick={() => setSelectedPlotId('DHK-MIR-001')}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
              selectedPlotId === 'DHK-MIR-001'
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            DHK-MIR-001 (Safe 0/100)
          </button>

          <button
            onClick={() => setSelectedPlotId('DHK-MIR-004')}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
              selectedPlotId === 'DHK-MIR-004'
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
            }`}
          >
            DHK-MIR-004 (Double Sale ⚠)
          </button>

          <button
            onClick={() => setSelectedPlotId('DHK-SAV-016')}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
              selectedPlotId === 'DHK-SAV-016'
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
            }`}
          >
            DHK-SAV-016 (Double Mortgage ⚠)
          </button>

          <button
            onClick={() => setSelectedPlotId('DHK-SAV-018')}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
              selectedPlotId === 'DHK-SAV-018'
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            DHK-SAV-018 (State Khas Land)
          </button>

          <button
            onClick={() => setSelectedPlotId('DHK-AMN-022')}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
              selectedPlotId === 'DHK-AMN-022'
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            DHK-AMN-022 (Court Suit Pending)
          </button>
        </div>
      </div>

      {plot ? (
        <div className="space-y-6">
          {/* Main Top Grid: Plot Overview + 0-100 Risk Gauge */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Plot Meta Details (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-lg shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                        {plot.plotId}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs uppercase">
                        {plot.landType} Land
                      </span>
                      {plot.isKhasLand && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider animate-pulse">
                          Government Khas Property
                        </span>
                      )}
                      {plot.courtCaseStatus === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] uppercase">
                          Court Injunction Active
                        </span>
                      )}
                      {plot.govAcquisitionStatus === 'acquired' && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-700 text-white font-bold text-[10px] uppercase">
                          Acquired by State
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {plot.mouza} Mouza • {plot.upazila} Upazila • {plot.district} District • {plot.division} Division
                    </p>
                  </div>
                </div>

                {/* Plot Particulars 4-Box Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t.plotCheck.currentOwner}
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                      {plot.currentOwner}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Khatian & Dag
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                      {plot.khatianNo} / {plot.dagNo}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t.plotCheck.area}
                    </span>
                    <span className="text-sm font-bold text-emerald-800 mt-0.5 block">
                      {plot.areaDecimal} Decimal (শতক)
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Survey Khatian Type
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {plot.khatianType} Survey
                    </span>
                  </div>
                </div>

                {/* Special Flags Notice */}
                {(plot.isKhasLand || plot.courtCaseStatus !== 'none' || plot.govAcquisitionStatus !== 'none') && (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Legal Title Notices:</span>
                    </div>
                    {plot.isKhasLand && (
                      <p className="ml-5 text-[11px]">
                        • <strong>Khas Land:</strong> Registered as State Government property (Ministry of Land). Private deeds are legally invalid.
                      </p>
                    )}
                    {plot.caseDetails && (
                      <p className="ml-5 text-[11px]">
                        • <strong>Judicial Case:</strong> {plot.caseDetails}
                      </p>
                    )}
                    {plot.acquisitionDetails && (
                      <p className="ml-5 text-[11px]">
                        • <strong>State Acquisition:</strong> {plot.acquisitionDetails}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 0-100 Risk Gauge Box (4 cols) */}
              <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Title Risk Evaluation Gauge
                </span>

                {/* Gauge Graphic */}
                <div className="relative w-36 h-36 flex items-center justify-center my-1">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="10"
                    />
                    {/* Gauge Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * riskAssessment.score) / 100}
                      strokeLinecap="round"
                      className={`transition-all duration-700 ${scoreTheme.text}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black font-mono tracking-tight ${scoreTheme.text}`}>
                      {riskAssessment.score}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      / 100 Risk
                    </span>
                  </div>
                </div>

                {/* Final Risk Badge */}
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${scoreTheme.badge}`}>
                    {riskAssessment.level === 'SAFE'
                      ? t.plotCheck.safeBadge
                      : riskAssessment.level === 'REVIEW'
                      ? t.plotCheck.reviewBadge
                      : t.plotCheck.riskyBadge}
                  </span>
                </div>
              </div>
            </div>

            {/* "Why this score?" Breakdown Panel */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-emerald-700" />
                  <span>Why this score? (Itemized Risk Points)</span>
                </h4>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  Total Penalties: +{riskAssessment.score} pts
                </span>
              </div>

              {riskAssessment.breakdown.length === 0 ? (
                <div className="text-xs text-emerald-800 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero risk penalties detected. Full title deed, Khatian, and approved mutation intact with no legal or mortgage encumbrances.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {riskAssessment.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{item.label}</span>
                        <span className="text-[11px] text-slate-600 block">{item.description}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold text-xs shrink-0">
                        +{item.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HISTORICAL SURVEY COMPARISON TABLE (CS / SA / RS / BS) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-emerald-700" />
                  <span>Historical Khatian Survey Chain (CS → SA → RS → BS)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological progression across British Cadastral (CS), State Acquisition (SA), Revisional (RS), and City (BS) surveys.
                </p>
              </div>

              {surveyMismatch.hasMismatch && (
                <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                  ⚠ Area Discrepancy Flagged
                </span>
              )}
            </div>

            {plot.surveys && plot.surveys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Survey</th>
                      <th className="py-2.5 px-3 font-bold">Year</th>
                      <th className="py-2.5 px-3 font-bold">Khatian / Dag</th>
                      <th className="py-2.5 px-3 font-bold">Recorded Owner</th>
                      <th className="py-2.5 px-3 font-bold">Area (Decimal)</th>
                      <th className="py-2.5 px-3 font-bold">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plot.surveys.map((survey, sIdx) => (
                      <tr key={sIdx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold">
                            {survey.surveyType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">{survey.year}</td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {survey.khatianNo} (Dag {survey.dagNo})
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{survey.recordedOwner}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                          {survey.areaDecimal} Decimal
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Archived Record
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No historical surveys recorded.</p>
            )}

            {surveyMismatch.hasMismatch && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold">Survey Discrepancy Detail:</span>
                {surveyMismatch.discrepancies.map((d, i) => (
                  <p key={i} className="text-[11px]">• {d}</p>
                ))}
              </div>
            )}
          </div>

          {/* BANK MORTGAGE & LIEN STATUS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Landmark className="w-5 h-5 text-blue-700" />
                  <span>Bank Mortgage & Encumbrance Status</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inter-bank lien checks to prevent purchasing land under pending loan foreclosures.
                </p>
              </div>

              <button
                onClick={() => onNavigate('bankCheck')}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold underline"
              >
                Open Bank Module
              </button>
            </div>

            {plotMortgages.length === 0 ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No bank mortgages recorded. Title is free of institutional loan encumbrances.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {plotMortgages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                      m.status === 'active'
                        ? activePlotMortgages.length >= 2
                          ? 'bg-red-50 border-red-300'
                          : 'bg-amber-50 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{m.bankName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'active' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {m.status === 'active' ? 'ACTIVE LOAN' : 'RELEASED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                        Mortgage Ref: {m.mortgageDeedNo || m.id} • Registered: {m.mortgageDate}
                      </p>
                    </div>

                    <div className="font-mono font-bold text-slate-900">
                      BDT {m.loanAmountBDT.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Deeds on this Plot */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">
                {t.plotCheck.deedsHeader} ({plotDeeds.length})
              </h4>
              <div className="flex items-center space-x-2">
                {plotDeeds.length > 0 && (
                  <button
                    onClick={() =>
                      exportDeedsToCSV(
                        plotDeeds,
                        `landverify_plot_${plot.plotId}_deeds_${new Date().toISOString().split('T')[0]}.csv`
                      )
                    }
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-300 transition"
                    title="Export deeds for this plot as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'bn' ? 'প্লট দলিল CSV' : 'Export CSV'}</span>
                  </button>
                )}
                <span className="text-xs text-slate-400">Sub-Registry Records</span>
              </div>
            </div>

            {plotDeeds.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">{t.plotCheck.noDeeds}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Deed No</th>
                      <th className="py-2.5 px-3 font-bold">Seller</th>
                      <th className="py-2.5 px-3 font-bold">Buyer</th>
                      <th className="py-2.5 px-3 font-bold">Date</th>
                      <th className="py-2.5 px-3 font-bold">QR Token</th>
                      <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plotDeeds.map((deed) => (
                      <tr key={deed.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-bold font-mono text-slate-900">{deed.deedNo}</td>
                        <td className="py-3 px-3 text-slate-700">{deed.seller}</td>
                        <td className="py-3 px-3 text-slate-900 font-semibold">{deed.buyer}</td>
                        <td className="py-3 px-3 text-slate-500">{deed.deedDate}</td>
                        <td className="py-3 px-3 font-mono text-emerald-800">{deed.qrToken}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onNavigate('verify', { token: deed.qrToken })}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition"
                          >
                            <span>Verify File</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AC Land Mutation Records */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">
                {t.plotCheck.mutationsHeader} ({plotMutations.length})
              </h4>
              <span className="text-xs text-slate-400">Assistant Commissioner (Land) Records</span>
            </div>

            {plotMutations.length === 0 ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold">Notice:</span> {t.plotCheck.noMutations} A deed without an AC Land mutation leaves the buyer without recognized mutation (নামজারি/খারিজ) in the Upazila land office.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Mutation Case</th>
                      <th className="py-2.5 px-3 font-bold">New Owner (নামজারি)</th>
                      <th className="py-2.5 px-3 font-bold">Order Date</th>
                      <th className="py-2.5 px-3 font-bold">AC Land Office</th>
                      <th className="py-2.5 px-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plotMutations.map((mut) => (
                      <tr key={mut.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-bold font-mono text-slate-900">
                          {mut.mutationCaseNo || mut.id}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{mut.newOwner}</td>
                        <td className="py-3 px-3 text-slate-500">{mut.date}</td>
                        <td className="py-3 px-3 text-slate-600">{mut.acLandOffice || 'Mirpur Revenue Circle'}</td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              mut.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : mut.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                          >
                            {mut.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">Plot not found. Please pick another Plot ID.</div>
      )}
    </div>
  );
};
