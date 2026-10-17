import React, { useState, useRef } from 'react';
import {
  MapPin,
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Database,
  RotateCcw,
  CheckCircle2,
  FileText,
  Lock,
  Download,
  Search,
  X,
  ExternalLink,
  Upload,
  FileUp,
  FileDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Alert, Deed, LedgerEntry, Mutation, Plot, Mortgage, Language } from '../types';
import { translations } from '../utils/translations';
import { PageId } from '../components/Sidebar';
import { formatHashShort } from '../utils/hash';
import { deedsToCSV, triggerCSVDownload } from '../utils/export.js';
import { exportAllDataAsJSON, importAllDataFromJSON } from '../utils/storage';

interface DashboardProps {
  plots: Plot[];
  deeds: Deed[];
  mutations: Mutation[];
  ledger: LedgerEntry[];
  alerts: Alert[];
  verifiedCount: number;
  lang: Language;
  onNavigate: (page: PageId, extra?: { plotId?: string; token?: string }) => void;
  onLoadDemo: () => void;
  onResetData: () => void;
  onOpenSampleModal: () => void;
  onDataImported?: (data: {
    plots: Plot[];
    deeds: Deed[];
    mutations: Mutation[];
    mortgages: Mortgage[];
    ledger: LedgerEntry[];
    alerts: Alert[];
  }) => void;
  isSeeding: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plots,
  deeds,
  mutations,
  ledger,
  alerts,
  verifiedCount,
  lang,
  onNavigate,
  onLoadDemo,
  onResetData,
  onOpenSampleModal,
  onDataImported,
  isSeeding,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate counts
  const totalPlots = plots.length;
  const totalDeeds = deeds.length;
  const openAlerts = alerts.filter((a) => a.status === 'OPEN').length;
  
  // Review required: plots with open alerts or pending mutations
  const plotsWithOpenAlerts = new Set(alerts.filter((a) => a.status === 'OPEN').map((a) => a.plotId));
  const plotsWithPendingMutations = new Set(mutations.filter((m) => m.status === 'PENDING').map((m) => m.plotId));
  const reviewRequiredCount = new Set([...plotsWithOpenAlerts, ...plotsWithPendingMutations]).size;

  // Chart data: Alerts by all 6 categories
  const doubleSaleCount = alerts.filter((a) => a.type === 'DOUBLE_SALE').length;
  const mismatchCount = alerts.filter((a) => a.type === 'MISMATCH').length;
  const tamperedCount = alerts.filter((a) => a.type === 'TAMPERED').length;
  const doubleMortgageCount = alerts.filter((a) => a.type === 'DOUBLE_MORTGAGE').length;
  const khasDisputeCount = alerts.filter((a) => a.type === 'KHAS_DISPUTE').length;
  const courtInjunctionCount = alerts.filter((a) => a.type === 'COURT_INJUNCTION').length;

  const chartData = [
    {
      name: lang === 'bn' ? 'দ্বৈত বিক্রয়' : 'Double Sale',
      type: 'DOUBLE_SALE',
      count: doubleSaleCount,
      color: '#ef4444', // Red 500
    },
    {
      name: lang === 'bn' ? 'তথ্য অমিল' : 'Mismatch',
      type: 'MISMATCH',
      count: mismatchCount,
      color: '#f59e0b', // Amber 500
    },
    {
      name: lang === 'bn' ? 'জাল দলিল' : 'Tampered',
      type: 'TAMPERED',
      count: tamperedCount,
      color: '#dc2626', // Red 600
    },
    {
      name: lang === 'bn' ? 'দ্বৈত বন্ধকী' : 'Double Mortgage',
      type: 'DOUBLE_MORTGAGE',
      count: doubleMortgageCount,
      color: '#8b5cf6', // Purple 500
    },
    {
      name: lang === 'bn' ? 'খাস জমি' : 'Khas Land',
      type: 'KHAS_DISPUTE',
      count: khasDisputeCount,
      color: '#0284c7', // Sky 600
    },
    {
      name: lang === 'bn' ? 'মামলা' : 'Injunction',
      type: 'COURT_INJUNCTION',
      count: courtInjunctionCount,
      color: '#d97706', // Amber 600
    },
  ];

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const res = importAllDataFromJSON(content);
      if (res.success && res.data) {
        if (onDataImported) {
          onDataImported(res.data);
        }
        alert(lang === 'bn' ? 'ডাটা সফলভাবে ইমপোর্ট করা হয়েছে!' : res.message);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Recent ledger blocks
  const recentLedger = [...ledger]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Search state to filter the deeds table by Deed No, Seller, or Buyer name
  const [deedSearch, setDeedSearch] = useState<string>('');

  // Filter deeds by Deed No, Seller, or Buyer name
  const filteredDeeds = deeds.filter((d) => {
    if (!deedSearch.trim()) return true;
    const q = deedSearch.toLowerCase().trim();
    const matchDeedNo = d.deedNo.toLowerCase().includes(q);
    const matchSeller = d.seller.toLowerCase().includes(q);
    const matchBuyer = d.buyer.toLowerCase().includes(q);
    return matchDeedNo || matchSeller || matchBuyer;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              {lang === 'bn' ? 'ই-ভূমি পর্যবেক্ষণ' : 'E-Governance Monitor'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Sub-Registry & AC Land Sync</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {t.dashboard.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 flex-wrap gap-y-2">
          {/* Hidden JSON file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => {
              const csvString = deedsToCSV(deeds);
              triggerCSVDownload(csvString, `landverify_deeds_${new Date().toISOString().split('T')[0]}.csv`);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 transition shadow-2xs"
            title="Export all registered deeds as CSV for offline analysis"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportAllDataAsJSON()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-300 transition shadow-2xs"
            title="Export entire system state as JSON backup"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-700" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold border border-purple-300 transition shadow-2xs"
            title="Import system state from JSON backup"
          >
            <FileUp className="w-3.5 h-3.5 text-purple-700" />
            <span>Import JSON</span>
          </button>

          <button
            onClick={onLoadDemo}
            disabled={isSeeding}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding...' : t.dashboard.loadDemo}</span>
          </button>

          <button
            onClick={onResetData}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.dashboard.resetData}</span>
          </button>
        </div>
      </div>

      {/* 5 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Plots */}
        <div
          onClick={() => onNavigate('plotCheck')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.totalPlots}
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700 group-hover:scale-110 transition">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{totalPlots}</div>
          <div className="flex items-center text-xs text-emerald-700 font-medium mt-1">
            <span>Mirpur & Dhaka Mouzas</span>
          </div>
        </div>

        {/* Total Deeds */}
        <div
          onClick={() => onNavigate('register')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.totalDeeds}
            </span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-700 group-hover:scale-110 transition">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{totalDeeds}</div>
          <div className="text-xs text-teal-700 font-medium mt-1">
            <span>Registered Deeds</span>
          </div>
        </div>

        {/* Verified Deeds */}
        <div
          onClick={() => onNavigate('verify')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.verifiedDeeds}
            </span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700 group-hover:scale-110 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-blue-700 mt-3">{verifiedCount}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">
            <span>SHA-256 Verified</span>
          </div>
        </div>

        {/* Open Alerts */}
        <div
          onClick={() => onNavigate('alerts')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-red-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.openAlerts}
            </span>
            <div className="p-2 bg-red-50 rounded-xl text-red-600 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-600 mt-3">{openAlerts}</div>
          <div className="text-xs text-red-600 font-medium mt-1">
            <span>Requires Action</span>
          </div>
        </div>

        {/* Review Required */}
        <div
          onClick={() => onNavigate('plotCheck')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.reviewRequired}
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700 group-hover:scale-110 transition">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-700 mt-3">{reviewRequiredCount}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            <span>Plots Flagged</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Hackathon Test Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart: Alerts by Type */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.dashboard.alertsChartTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' 
                  ? 'স্বয়ংক্রিয়ভাবে চিহ্নিত ভুয়া বা অসঙ্গতিপূর্ণ লেনদেন' 
                  : 'Automated fraud categorization across Sub-Registry records'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>{lang === 'bn' ? 'বিস্তারিত কিউ' : 'View Queue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-emerald-300">{data.name}</p>
                          <p>
                            <span className="text-slate-400">Alerts count:</span>{' '}
                            <span className="font-extrabold text-white text-sm">
                              {data.count}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400">Type: {data.type}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick legend footer for all 6 fraud alert categories */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-red-50 p-2 rounded-xl border border-red-100">
              <span className="block font-bold text-red-700">{doubleSaleCount}</span>
              <span className="text-[10px] text-red-600 truncate block">Double Sale</span>
            </div>
            <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
              <span className="block font-bold text-amber-700">{mismatchCount}</span>
              <span className="text-[10px] text-amber-600 truncate block">Mismatch</span>
            </div>
            <div className="bg-red-50/80 p-2 rounded-xl border border-red-100">
              <span className="block font-bold text-red-800">{tamperedCount}</span>
              <span className="text-[10px] text-red-700 truncate block">Tampered</span>
            </div>
            <div className="bg-purple-50 p-2 rounded-xl border border-purple-100">
              <span className="block font-bold text-purple-700">{doubleMortgageCount}</span>
              <span className="text-[10px] text-purple-600 truncate block">2x Mortgage</span>
            </div>
            <div className="bg-sky-50 p-2 rounded-xl border border-sky-100">
              <span className="block font-bold text-sky-700">{khasDisputeCount}</span>
              <span className="text-[10px] text-sky-600 truncate block">Khas Land</span>
            </div>
            <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200">
              <span className="block font-bold text-amber-800">{courtInjunctionCount}</span>
              <span className="text-[10px] text-amber-700 truncate block">Court Case</span>
            </div>
          </div>
        </div>

        {/* Hackathon Demo Test Shortcuts */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                Hackathon Demo Kit
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>

            <h3 className="text-lg font-bold text-white mt-3">
              {lang === 'bn' ? 'বিচারকদের জন্য দ্রুত পরীক্ষা' : 'Instant Judge Demo Scenarios'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {lang === 'bn' 
                ? 'সরাসরি ক্লিক করে সিস্টেমের স্বয়ংক্রিয় জালিয়াতি প্রতিরোধ পরীক্ষা করুন:'
                : 'Click below to inspect the pre-seeded planted fraud scenarios:'}
            </p>

            <div className="mt-4 space-y-2.5">
              {/* Planted Case 1 */}
              <button
                onClick={() => onNavigate('plotCheck', { plotId: 'DHK-MIR-004' })}
                className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition text-left flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-red-400">DHK-MIR-004</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/30 text-red-200">
                      Double Sale
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Same plot sold twice to two different buyers!
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Planted Case 2 */}
              <button
                onClick={() => onNavigate('plotCheck', { plotId: 'DHK-MIR-007' })}
                className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition text-left flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-amber-400">DHK-MIR-007</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                      Mismatch
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Deed buyer differs from Mutation new owner!
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Planted Case 3 */}
              <button
                onClick={() => onNavigate('plotCheck', { plotId: 'DHK-MIR-010' })}
                className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition text-left flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-amber-400">DHK-MIR-010</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                      No Mutation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Deed registered but zero mutation record exists!
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={onOpenSampleModal}
              className="text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center space-x-1.5 underline underline-offset-4"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নমুনা দলিল ডাউনলোড কিট' : 'Download Sample Test Files'}</span>
            </button>
            <Lock className="w-4 h-4 text-emerald-400/80" />
          </div>
        </div>
      </div>

      {/* Deeds Registry & Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'নিবন্ধিত দলিল রেজিস্টার ও অনুসন্ধান' : 'Registered Deeds Registry & Search'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {filteredDeeds.length} of {deeds.length} {lang === 'bn' ? 'দলিল' : 'Deeds'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'দলিল নম্বর, বিক্রেতা বা ক্রেতার নাম দিয়ে অবিলম্বে অনুসন্ধান করুন।'
                : 'Filter registered land deeds by Deed No, Seller, or Buyer name.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const csvString = deedsToCSV(filteredDeeds);
                triggerCSVDownload(
                  csvString,
                  `landverify_deeds_${deedSearch.trim() ? 'filtered_' : ''}${new Date().toISOString().split('T')[0]}.csv`
                );
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              title="Download CSV for current filtered deeds"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{deedSearch.trim() ? 'Export Filtered CSV' : 'Export Deeds CSV'}</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                lang === 'bn'
                  ? 'দলিল নং, বিক্রেতা, বা ক্রেতার নাম দিয়ে অনুসন্ধান করুন...'
                  : 'Search by Deed No (e.g. DEED-2026), Seller, or Buyer name...'
              }
              value={deedSearch}
              onChange={(e) => setDeedSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
            />
            {deedSearch && (
              <button
                onClick={() => setDeedSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Pill Suggestions */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 shrink-0">
            <span className="text-[11px] font-medium text-slate-400">Suggestions:</span>
            {['Anisur', 'Farzana', 'Rafiqul', 'DEED-2026'].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setDeedSearch(pill)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition ${
                  deedSearch === pill
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Deeds Table */}
        {filteredDeeds.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              No deeds found matching "{deedSearch}"
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Try searching with another Deed number, Seller, or Buyer name.
            </p>
            <button
              onClick={() => setDeedSearch('')}
              className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold rounded-lg transition"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-bold">Deed No</th>
                  <th className="py-2.5 px-3.5 font-bold">Plot ID</th>
                  <th className="py-2.5 px-3.5 font-bold">Seller</th>
                  <th className="py-2.5 px-3.5 font-bold">Buyer</th>
                  <th className="py-2.5 px-3.5 font-bold">Date</th>
                  <th className="py-2.5 px-3.5 font-bold">Cryptographic Hash</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeeds.map((deed) => (
                  <tr key={deed.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                      {deed.deedNo}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-emerald-700">
                      <button
                        onClick={() => onNavigate('plotCheck', { plotId: deed.plotId })}
                        className="hover:underline flex items-center space-x-1"
                        title="View Plot Details"
                      >
                        <span>{deed.plotId}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 inline" />
                      </button>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 font-medium">
                      {deed.seller}
                    </td>
                    <td className="py-3 px-3.5 text-slate-900 font-bold">
                      {deed.buyer}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                      {deed.deedDate}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                      {formatHashShort(deed.fileHash, 6, 6)}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onNavigate('verify', { token: deed.qrToken })}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
                        title="Verify this deed document"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Hash-Chained Audit Ledger Events */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t.dashboard.recentAuditsTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn' 
                ? 'প্রতিটি ব্লক SHA-256 হ্যাশের মাধ্যমে পূর্ববর্তী ব্লকের সাথে সংযুক্ত' 
                : 'Tamper-evident sequence linked by SHA-256(prevHash + plotId + deedId + eventType + createdAt)'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('timeline')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>{lang === 'bn' ? 'সম্পূর্ণ টাইমলাইন' : 'Full Timeline'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {recentLedger.map((block) => (
            <div
              key={block.id}
              onClick={() => onNavigate('timeline', { plotId: block.plotId })}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 p-2 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {block.plotId}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {block.eventType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {block.deedId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {block.note || 'Ledger event cryptographically validated'}
                  </p>
                </div>
              </div>

              <div className="sm:text-right font-mono text-[11px] text-slate-500">
                <div>
                  <span className="text-slate-400">prev: </span>
                  <span className="text-slate-600">{formatHashShort(block.prevHash, 6, 6)}</span>
                </div>
                <div>
                  <span className="text-slate-400">hash: </span>
                  <span className="font-semibold text-emerald-700">{formatHashShort(block.recordHash, 6, 6)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
