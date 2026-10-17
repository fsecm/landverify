/**
 * Bank Check Page (Bank Mortgage Module)
 * Allows financial institutions and sub-registrars to check and record land mortgages.
 * Automatically flags DOUBLE_MORTGAGE alerts when a plot has two or more active loans.
 */

import React, { useState } from 'react';
import {
  Landmark,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  Building,
  Unlock,
  Lock,
} from 'lucide-react';
import { Mortgage, Plot, Alert, Language } from '../types';
import { translations } from '../utils/translations';
import { checkDoubleMortgageAlerts } from '../utils/fraud';
import { saveStoredMortgages, saveStoredAlerts } from '../utils/storage';
import { logActivity } from '../utils/activity';
import { PageId } from '../components/Sidebar';

interface BankCheckProps {
  mortgages: Mortgage[];
  plots: Plot[];
  alerts: Alert[];
  lang: Language;
  onMortgagesUpdated: (updated: Mortgage[], newAlerts: Alert[]) => void;
  onNavigate: (page: PageId, extra?: { plotId?: string; token?: string }) => void;
}

export const BankCheck: React.FC<BankCheckProps> = ({
  mortgages,
  plots,
  alerts,
  lang,
  onMortgagesUpdated,
  onNavigate,
}) => {
  const t = translations[lang];

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'released'>('all');

  // New Mortgage Form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formPlotId, setFormPlotId] = useState<string>(plots[0]?.plotId || '');
  const [formBankName, setFormBankName] = useState<string>('Sonar Bangla Commercial Bank (Dummy)');
  const [formAmount, setFormAmount] = useState<number>(5000000);
  const [formBranch, setFormBranch] = useState<string>('Dhaka Main Branch');
  const [formDeedNo, setFormDeedNo] = useState<string>(`MORT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);

  // Compute stats
  const activeMortgages = mortgages.filter((m) => m.status === 'active');
  const releasedMortgages = mortgages.filter((m) => m.status === 'released');
  const totalActiveExposureBDT = activeMortgages.reduce((acc, curr) => acc + curr.loanAmountBDT, 0);

  // Identify plots with double mortgages
  const activeCountByPlot = new Map<string, number>();
  activeMortgages.forEach((m) => {
    activeCountByPlot.set(m.plotId, (activeCountByPlot.get(m.plotId) || 0) + 1);
  });
  const doubleMortgagePlots = Array.from(activeCountByPlot.entries())
    .filter(([_, count]) => count >= 2)
    .map(([plotId]) => plotId);

  // Handle release mortgage
  const handleReleaseMortgage = (mortgageId: string) => {
    const updated = mortgages.map((m) => {
      if (m.id === mortgageId) {
        return { ...m, status: 'released' as const };
      }
      return m;
    });

    // Recheck double mortgage alerts
    const newAlerts = checkDoubleMortgageAlerts(updated, alerts);
    saveStoredMortgages(updated);
    saveStoredAlerts([...newAlerts, ...alerts]);

    logActivity(
      'MORTGAGE_RELEASED',
      'Bank Officer',
      'Mortgage Encumbrance Released',
      `Loan satisfaction confirmed for mortgage ${mortgageId}. Title encumbrance cleared.`,
      'SUCCESS'
    );

    onMortgagesUpdated(updated, [...newAlerts, ...alerts]);
  };

  // Handle create new mortgage
  const handleAddMortgage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlotId || !formBankName || formAmount <= 0) {
      alert('Please fill in all mortgage fields with valid loan amount.');
      return;
    }

    const newMortgage: Mortgage = {
      id: `MORT-${Date.now()}`,
      plotId: formPlotId,
      bankName: formBankName,
      loanAmountBDT: Number(formAmount),
      mortgageDate: new Date().toISOString().split('T')[0],
      status: 'active',
      branch: formBranch,
      mortgageDeedNo: formDeedNo,
      registeredAt: new Date().toISOString(),
    };

    const updated = [newMortgage, ...mortgages];

    // Run double mortgage check immediately
    const doubleAlerts = checkDoubleMortgageAlerts(updated, alerts);
    const combinedAlerts = doubleAlerts.length > 0 ? [...doubleAlerts, ...alerts] : alerts;

    saveStoredMortgages(updated);
    saveStoredAlerts(combinedAlerts);

    logActivity(
      'MORTGAGE_CREATED',
      'Bank Officer',
      'Bank Mortgage Registered',
      `New mortgage of BDT ${formAmount.toLocaleString()} recorded for Plot ${formPlotId} with ${formBankName}.`,
      doubleAlerts.length > 0 ? 'WARNING' : 'INFO',
      formPlotId
    );

    onMortgagesUpdated(updated, combinedAlerts);
    setShowAddForm(false);
  };

  // Filtered list
  const filteredMortgages = mortgages.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        m.plotId.toLowerCase().includes(q) ||
        m.bankName.toLowerCase().includes(q) ||
        (m.branch && m.branch.toLowerCase().includes(q)) ||
        (m.mortgageDeedNo && m.mortgageDeedNo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
              {lang === 'bn' ? 'ব্যাংক মর্টগেজ অনুসন্ধান' : 'Bank Due Diligence'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Inter-Bank Land Lien & Encumbrance Registry</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {lang === 'bn' ? 'ব্যাংক চেক ও দ্বৈত মর্টগেজ শনাক্তকরণ' : 'Bank Check & Mortgage Registry'}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {lang === 'bn'
              ? 'ভূমি বন্ধক রেখে একাধিক ব্যাংক থেকে দ্বৈত ঋণ গ্রহণ শনাক্তকরণ ও লিয়েন যাচাই পোর্টাল।'
              : 'Detect duplicate active bank liens on the same land plot before approving loan disbursements.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Register Bank Mortgage'}</span>
        </button>
      </div>

      {/* DOUBLE MORTGAGE WARNING BANNER IF DETECTED */}
      {doubleMortgagePlots.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <h3 className="text-base font-extrabold text-red-950 uppercase tracking-wide">
                  CRITICAL FRAUD ALERT: DOUBLE MORTGAGES DETECTED ({doubleMortgagePlots.length} Plots)
                </h3>
                <p className="text-xs text-red-800 mt-0.5">
                  The following land plots have multiple overlapping active mortgages without formal loan release certificates:
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {doubleMortgagePlots.map((pid) => (
                  <button
                    key={pid}
                    onClick={() => {
                      setSearchTerm(pid);
                      onNavigate('plotCheck', { plotId: pid });
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center space-x-1 shadow-xs"
                  >
                    <span>{pid}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Recorded Mortgages
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {mortgages.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Active Encumbrances
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {activeMortgages.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
            Double Mortgage Conflicts
          </span>
          <span className="text-2xl font-black text-red-600 mt-1 block">
            {doubleMortgagePlots.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Total Active Bank Exposure
          </span>
          <span className="text-xl font-black text-emerald-800 mt-1 block truncate">
            BDT {(totalActiveExposureBDT / 10000000).toFixed(2)} Crore
          </span>
        </div>
      </div>

      {/* Register New Mortgage Collapsible Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-400 shadow-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Landmark className="w-5 h-5 text-blue-700" />
              <span>Register New Bank Mortgage / Lien</span>
            </h3>
            <span className="text-xs text-slate-400">Inter-Bank Financial System</span>
          </div>

          <form onSubmit={handleAddMortgage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Plot ID <span className="text-red-500">*</span>
                </label>
                <select
                  value={formPlotId}
                  onChange={(e) => setFormPlotId(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {plots.map((p) => (
                    <option key={p.plotId} value={p.plotId}>
                      {p.plotId} - {p.currentOwner} ({p.mouza})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Name (Dummy) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Loan Amount in BDT <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={100000}
                  step={50000}
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Branch Location
                </label>
                <input
                  type="text"
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mortgage Deed Ref Number
                </label>
                <input
                  type="text"
                  value={formDeedNo}
                  onChange={(e) => setFormDeedNo(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Save & Register Mortgage Lien
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Plot ID, Bank Name, or Deed Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs shrink-0">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
          >
            <option value="all">All ({mortgages.length})</option>
            <option value="active">Active Only ({activeMortgages.length})</option>
            <option value="released">Released ({releasedMortgages.length})</option>
          </select>
        </div>
      </div>

      {/* Mortgages Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredMortgages.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Landmark className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No mortgage records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Plot ID</th>
                  <th className="py-3 px-4 font-bold">Bank Name</th>
                  <th className="py-3 px-4 font-bold">Branch</th>
                  <th className="py-3 px-4 font-bold">Loan Amount</th>
                  <th className="py-3 px-4 font-bold">Mortgage Date</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMortgages.map((m) => {
                  const isDouble = doubleMortgagePlots.includes(m.plotId) && m.status === 'active';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isDouble ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <button
                          onClick={() => onNavigate('plotCheck', { plotId: m.plotId })}
                          className="text-blue-700 hover:text-blue-900 hover:underline flex items-center space-x-1"
                        >
                          <span>{m.plotId}</span>
                        </button>
                        {isDouble && (
                          <span className="block text-[9px] text-red-600 font-bold uppercase tracking-tight">
                            ⚠ Double Mortgage
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {m.bankName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {m.branch || 'Principal Branch'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        BDT {m.loanAmountBDT.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {m.mortgageDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            m.status === 'active'
                              ? isDouble
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {m.status === 'active' ? (isDouble ? 'ACTIVE (CONFLICT)' : 'ACTIVE LIEN') : 'RELEASED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {m.status === 'active' ? (
                          <button
                            onClick={() => handleReleaseMortgage(m.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs"
                            title="Mark loan fully paid and release mortgage lien"
                          >
                            Release Lien
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Cleared</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
