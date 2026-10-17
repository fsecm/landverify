import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  XCircle,
  Building2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Mutation, Plot, Deed, Language, MutationStage, UserRole } from '../types';
import { translations } from '../utils/translations';
import { saveStoredMutations, saveStoredAlerts, saveStoredLedger } from '../utils/storage';
import { appendLedgerEntry } from '../utils/ledger';
import { logActivity } from '../utils/activity';

interface MutationQueueProps {
  mutations: Mutation[];
  plots: Plot[];
  deeds: Deed[];
  currentRole: UserRole;
  lang: Language;
  onMutationsUpdated: (updatedMutations: Mutation[]) => void;
  onNavigate: (page: any, extra?: { plotId?: string; token?: string }) => void;
}

export const MutationQueue: React.FC<MutationQueueProps> = ({
  mutations,
  plots,
  deeds,
  currentRole,
  lang,
  onMutationsUpdated,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    mutation: Mutation;
    action: 'HEARING' | 'APPROVE' | 'REJECT';
  } | null>(null);
  const [hearingDateInput, setHearingDateInput] = useState<string>('2026-03-25');
  const [actionNoteInput, setActionNoteInput] = useState<string>('');

  const isACLandOrAdmin = currentRole === 'ac_land' || currentRole === 'admin';

  // Calculate statistics
  const totalCount = mutations.length;
  const submittedCount = mutations.filter((m) => (m.stage || 'SUBMITTED') === 'SUBMITTED').length;
  const underReviewCount = mutations.filter((m) => m.stage === 'UNDER_REVIEW').length;
  const hearingCount = mutations.filter((m) => m.stage === 'HEARING').length;
  const approvedCount = mutations.filter((m) => m.stage === 'APPROVED' || m.status === 'APPROVED').length;
  const rejectedCount = mutations.filter((m) => m.stage === 'REJECTED' || m.status === 'REJECTED').length;
  const divergenceCount = mutations.filter((m) => m.isDivergentApplicant).length;

  // Filter mutations
  const filteredMutations = mutations.filter((m) => {
    const stage = m.stage || (m.status === 'APPROVED' ? 'APPROVED' : 'SUBMITTED');
    if (filterStage === 'DIVERGENT' && !m.isDivergentApplicant) return false;
    if (filterStage !== 'ALL' && filterStage !== 'DIVERGENT' && stage !== filterStage) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCase = (m.mutationCaseNo || '').toLowerCase().includes(q);
      const matchPlot = m.plotId.toLowerCase().includes(q);
      const matchOwner = m.newOwner.toLowerCase().includes(q);
      const matchApplicant = (m.applicantName || '').toLowerCase().includes(q);
      return matchCase || matchPlot || matchOwner || matchApplicant;
    }
    return true;
  });

  const getStageBadge = (stage: MutationStage) => {
    switch (stage) {
      case 'SUBMITTED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: lang === 'bn' ? 'দাখিলকৃত' : 'Submitted',
          icon: Clock,
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: lang === 'bn' ? 'পর্যালোচনায়' : 'Under Review',
          icon: Compass,
        };
      case 'HEARING':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: lang === 'bn' ? 'শুনানি নির্ধারিত' : 'Hearing Scheduled',
          icon: Calendar,
        };
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: lang === 'bn' ? 'অনুমোদিত' : 'Approved',
          icon: CheckCircle2,
        };
      case 'REJECTED':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          label: lang === 'bn' ? 'বাতিল' : 'Rejected',
          icon: XCircle,
        };
    }
  };

  const handleAdvanceToReview = (mutation: Mutation) => {
    const now = new Date().toISOString();
    const updatedHistory = [
      ...(mutation.history || []),
      {
        stage: 'UNDER_REVIEW' as MutationStage,
        timestamp: now,
        note: 'Revenue Inspector assigned to verify field boundaries and Khatian records.',
        actor: currentRole === 'admin' ? 'System Administrator' : 'AC Land Officer (Upazila)',
      },
    ];

    const updated = mutations.map((m) =>
      m.id === mutation.id
        ? {
            ...m,
            stage: 'UNDER_REVIEW' as MutationStage,
            history: updatedHistory,
          }
        : m
    );

    saveStoredMutations(updated);
    onMutationsUpdated(updated);
    logActivity(
      'MUTATION_ADVANCED',
      'AC Land Officer',
      `Mutation Case ${mutation.mutationCaseNo || mutation.id} Advanced to Under Review`,
      `Inspector initiated survey verification on Plot ${mutation.plotId}.`,
      'INFO',
      mutation.plotId,
      mutation.deedId
    );
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { mutation, action } = actionModal;
    const now = new Date().toISOString();

    if (action === 'HEARING') {
      const updatedHistory = [
        ...(mutation.history || []),
        {
          stage: 'HEARING' as MutationStage,
          timestamp: now,
          note: `Public hearing scheduled for ${hearingDateInput}. Notice issued to boundary neighbors. ${actionNoteInput}`,
          actor: currentRole === 'admin' ? 'System Administrator' : 'AC Land Officer',
        },
      ];

      const updated = mutations.map((m) =>
        m.id === mutation.id
          ? {
              ...m,
              stage: 'HEARING' as MutationStage,
              hearingDate: hearingDateInput,
              history: updatedHistory,
            }
          : m
      );

      saveStoredMutations(updated);
      onMutationsUpdated(updated);
      logActivity(
        'MUTATION_ADVANCED',
        'AC Land Officer',
        `Hearing Scheduled for Mutation Case ${mutation.mutationCaseNo || mutation.id}`,
        `Date set for ${hearingDateInput} at Upazila Land Office.`,
        'INFO',
        mutation.plotId,
        mutation.deedId
      );
    } else if (action === 'APPROVE') {
      const updatedHistory = [
        ...(mutation.history || []),
        {
          stage: 'APPROVED' as MutationStage,
          timestamp: now,
          note: `Mutation granted under Section 143 of SAT Act. New Khatian issued to ${mutation.newOwner}. ${actionNoteInput}`,
          actor: currentRole === 'admin' ? 'System Administrator' : 'AC Land Officer',
        },
      ];

      const updated = mutations.map((m) =>
        m.id === mutation.id
          ? {
              ...m,
              stage: 'APPROVED' as MutationStage,
              status: 'APPROVED' as const,
              history: updatedHistory,
            }
          : m
      );

      saveStoredMutations(updated);
      onMutationsUpdated(updated);

      // Append to ledger
      try {
        const rawLedger = JSON.parse(localStorage.getItem('landverify_ledger') || '[]');
        const { updatedLedger } = await appendLedgerEntry(
          rawLedger,
          mutation.plotId,
          mutation.deedId,
          'MUTATION_APPROVED',
          `AC Land officially approved title mutation to '${mutation.newOwner}'`
        );
        saveStoredLedger(updatedLedger);
      } catch (e) {
        console.error('Failed to append ledger for mutation approval', e);
      }

      logActivity(
        'MUTATION_APPROVED',
        'AC Land Officer',
        `Mutation APPROVED: Case ${mutation.mutationCaseNo || mutation.id}`,
        `Ownership legally transferred to ${mutation.newOwner} on Plot ${mutation.plotId}.`,
        'SUCCESS',
        mutation.plotId,
        mutation.deedId
      );
    } else if (action === 'REJECT') {
      const updatedHistory = [
        ...(mutation.history || []),
        {
          stage: 'REJECTED' as MutationStage,
          timestamp: now,
          note: `Mutation rejected: ${actionNoteInput || 'Defective chain of title or ownership dispute unresolved.'}`,
          actor: currentRole === 'admin' ? 'System Administrator' : 'AC Land Officer',
        },
      ];

      const updated = mutations.map((m) =>
        m.id === mutation.id
          ? {
              ...m,
              stage: 'REJECTED' as MutationStage,
              status: 'REJECTED' as const,
              history: updatedHistory,
            }
          : m
      );

      saveStoredMutations(updated);
      onMutationsUpdated(updated);
      logActivity(
        'MUTATION_REJECTED',
        'AC Land Officer',
        `Mutation REJECTED: Case ${mutation.mutationCaseNo || mutation.id}`,
        `Reason: ${actionNoteInput || 'Document discrepancy / dispute'} on Plot ${mutation.plotId}.`,
        'DANGER',
        mutation.plotId,
        mutation.deedId
      );
    }

    setActionModal(null);
    setActionNoteInput('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              {lang === 'bn' ? 'ই-নামজারি পাইপলাইন' : 'E-Mutation Governance Pipeline'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Assistant Commissioner Land (AC Land) & Upazila Revenue Circle
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            {lang === 'bn' ? 'ই-নামজারি আবেদন ও ট্র্যাকিং' : 'E-Mutation Workflow & Hearing Queue'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {lang === 'bn'
              ? 'সাব-রেজিস্ট্রি থেকে দলিল নিবন্ধিত হওয়া মাত্র স্বয়ংক্রিয়ভাবে ই-নামজারি ফাইল তৈরি হয়। সহকারী কমিশনার (ভূমি) ধাপে ধাপে যাচাই, শুনানি এবং খতিয়ান অনুমোদনের মাধ্যমে নামজারি সম্পন্ন করেন।'
              : 'Real-time e-Mutation lifecycle automatically triggered upon deed registration. AC Land officers manage stage verification, schedule hearings, and flag applicant-buyer discrepancies.'}
          </p>
        </div>

        {/* Role permission indicator */}
        <div className="flex items-center space-x-2 shrink-0">
          <div
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
              isACLandOrAdmin
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              {isACLandOrAdmin
                ? lang === 'bn'
                  ? 'এসি ল্যান্ড অ্যাকশন সক্রিয়'
                  : 'AC Land Actions Active'
                : lang === 'bn'
                ? 'শুধুমাত্র দেখার অনুমতি (ভিউ মোড)'
                : 'Read-Only (Switch to AC Land role to advance)'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {lang === 'bn' ? 'মোট আবেদন' : 'Total Cases'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            {lang === 'bn' ? 'দাখিলকৃত' : 'Submitted'}
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">{submittedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            {lang === 'bn' ? 'পর্যালোচনায়' : 'Under Review'}
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">{underReviewCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
            {lang === 'bn' ? 'শুনানি পর্যায়' : 'Hearings'}
          </span>
          <div className="text-2xl font-black text-purple-700 mt-1">{hearingCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            {lang === 'bn' ? 'অনুমোদিত' : 'Approved'}
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
            {lang === 'bn' ? 'অসংগতি চিহ্নিত' : 'Divergent'}
          </span>
          <div className="text-2xl font-black text-red-700 mt-1">{divergenceCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Stage Filter Buttons */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: lang === 'bn' ? 'সবগুলো' : 'All' },
            { id: 'SUBMITTED', label: lang === 'bn' ? 'দাখিলকৃত' : 'Submitted' },
            { id: 'UNDER_REVIEW', label: lang === 'bn' ? 'পর্যালোচনায়' : 'In Review' },
            { id: 'HEARING', label: lang === 'bn' ? 'শুনানি' : 'Hearing' },
            { id: 'APPROVED', label: lang === 'bn' ? 'অনুমোদিত' : 'Approved' },
            { id: 'DIVERGENT', label: lang === 'bn' ? '⚠️ অসংগতি ফ্ল্যাগ' : '⚠️ Divergent' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStage(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStage === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'কেস নং, প্লট বা আবেদনকারী খুঁজুন...' : 'Search case, plot, or applicant...'}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Mutation Cases List */}
      <div className="space-y-4">
        {filteredMutations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">
              {lang === 'bn' ? 'কোনো নামজারি কেস পাওয়া যায়নি' : 'No Mutation Cases Match This Filter'}
            </p>
          </div>
        ) : (
          filteredMutations.map((mutation) => {
            const currentStage: MutationStage =
              mutation.stage || (mutation.status === 'APPROVED' ? 'APPROVED' : 'SUBMITTED');
            const badge = getStageBadge(currentStage);
            const BadgeIcon = badge.icon;
            const isExpanded = expandedCaseId === mutation.id;

            // Find matching deed
            const deed = deeds.find((d) => d.id === mutation.deedId);
            const plot = plots.find((p) => p.plotId === mutation.plotId);
            const applicantName = mutation.applicantName || mutation.newOwner;
            const deedBuyerName = deed?.buyer || mutation.newOwner;
            const isMismatch = mutation.isDivergentApplicant || applicantName !== deedBuyerName;

            return (
              <div
                key={mutation.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition overflow-hidden"
              >
                {/* Card Main Bar */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Case Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {mutation.mutationCaseNo || mutation.id}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <button
                          onClick={() => onNavigate('plotCheck', { plotId: mutation.plotId })}
                          className="font-mono text-xs font-bold text-emerald-800 hover:underline flex items-center space-x-1"
                        >
                          <span>{mutation.plotId}</span>
                          <ExternalLink className="w-3 h-3 inline" />
                        </button>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {mutation.acLandOffice || 'Upazila Land Office'}
                        </span>
                        {isMismatch && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-bold border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>{lang === 'bn' ? 'আবেদনকারী বনাম দলিল ক্রেতা অমিল!' : 'Applicant Mismatch!'}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-600 flex-wrap">
                        <span>
                          <strong>{lang === 'bn' ? 'আবেদনকারী:' : 'Applicant:'}</strong>{' '}
                          <span className="text-slate-900 font-bold">{applicantName}</span>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>
                          <strong>{lang === 'bn' ? 'দলিলের ক্রেতা:' : 'Deed Buyer:'}</strong>{' '}
                          <span className="text-slate-900 font-medium">{deedBuyerName}</span>
                        </span>
                        {mutation.hearingDate && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-purple-700 font-semibold flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5 inline" />
                              <span>Hearing: {mutation.hearingDate}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Stage Badge & Officer Actions */}
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </div>

                      {/* AC Land Action Buttons */}
                      {isACLandOrAdmin && currentStage !== 'APPROVED' && currentStage !== 'REJECTED' && (
                        <div className="flex items-center space-x-1.5">
                          {currentStage === 'SUBMITTED' && (
                            <button
                              onClick={() => handleAdvanceToReview(mutation)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              {lang === 'bn' ? 'পর্যালোচনায় নিন' : 'Move to Review'}
                            </button>
                          )}

                          {currentStage === 'UNDER_REVIEW' && (
                            <button
                              onClick={() => setActionModal({ mutation, action: 'HEARING' })}
                              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? 'শুনানি নির্ধারণ' : 'Set Hearing'}</span>
                            </button>
                          )}

                          {currentStage === 'HEARING' && (
                            <button
                              onClick={() => setActionModal({ mutation, action: 'APPROVE' })}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? 'অনুমোদন' : 'Approve Title'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActionModal({ mutation, action: 'REJECT' })}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg text-xs font-medium border border-slate-200 transition"
                          >
                            {lang === 'bn' ? 'বাতিল' : 'Reject'}
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedCaseId(isExpanded ? null : mutation.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="View Stepper & History"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 4-Step Visual Pipeline Stepper */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {/* Step 1: Submitted */}
                      <div
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                          currentStage === 'SUBMITTED'
                            ? 'bg-blue-50 border-blue-300 font-bold text-blue-900 shadow-2xs'
                            : currentStage === 'UNDER_REVIEW' || currentStage === 'HEARING' || currentStage === 'APPROVED'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-1 text-[11px]">
                          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold">1</span>
                          <span>{lang === 'bn' ? 'দাখিলকৃত' : 'Submitted'}</span>
                        </div>
                      </div>

                      {/* Step 2: Under Review */}
                      <div
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                          currentStage === 'UNDER_REVIEW'
                            ? 'bg-amber-50 border-amber-300 font-bold text-amber-900 shadow-2xs'
                            : currentStage === 'HEARING' || currentStage === 'APPROVED'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-1 text-[11px]">
                          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold">2</span>
                          <span>{lang === 'bn' ? 'ফিল্ড যাচাই' : 'Under Review'}</span>
                        </div>
                      </div>

                      {/* Step 3: Hearing */}
                      <div
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                          currentStage === 'HEARING'
                            ? 'bg-purple-50 border-purple-300 font-bold text-purple-900 shadow-2xs'
                            : currentStage === 'APPROVED'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-1 text-[11px]">
                          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold">3</span>
                          <span>{lang === 'bn' ? 'শুনানি' : 'Hearing'}</span>
                        </div>
                      </div>

                      {/* Step 4: Approved / Rejected */}
                      <div
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                          currentStage === 'APPROVED'
                            ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                            : currentStage === 'REJECTED'
                            ? 'bg-red-600 text-white font-bold border-red-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-1 text-[11px]">
                          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold">4</span>
                          <span>
                            {currentStage === 'REJECTED'
                              ? lang === 'bn' ? 'বাতিল' : 'Rejected'
                              : lang === 'bn' ? 'খতিয়ান জারি' : 'Approved'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Stage History and Details */}
                {isExpanded && (
                  <div className="bg-slate-50/90 p-5 sm:p-6 border-t border-slate-200 text-xs space-y-4">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      {lang === 'bn' ? 'ই-নামজারি প্রক্রিয়াকরণ লগ ও শুনানির বিবরণ' : 'Audit Timeline & Stage History'}
                    </h4>

                    <div className="space-y-3">
                      {(mutation.history || [
                        {
                          stage: currentStage,
                          timestamp: mutation.date || new Date().toISOString(),
                          note: `Mutation application processed at ${mutation.acLandOffice || 'Revenue Circle'}`,
                          actor: 'AC Land Revenue Officer',
                        },
                      ]).map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-3 bg-white p-3 rounded-xl border border-slate-200/80">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{item.stage}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-0.5">{item.note}</p>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                              Actor: {item.actor}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Dialog Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {actionModal.action === 'HEARING'
                ? lang === 'bn'
                  ? 'শুনানির তারিখ নির্ধারণ করুন'
                  : 'Schedule Public Hearing'
                : actionModal.action === 'APPROVE'
                ? lang === 'bn'
                  ? 'ই-নামজারি ও খতিয়ান অনুমোদন'
                  : 'Approve Title Mutation'
                : lang === 'bn'
                ? 'নামজারি আবেদন বাতিল'
                : 'Reject Mutation Case'}
            </h3>

            <p className="text-xs text-slate-600">
              Case: <strong className="font-mono text-slate-900">{actionModal.mutation.mutationCaseNo || actionModal.mutation.id}</strong>{' '}
              on Plot <strong className="font-mono text-emerald-800">{actionModal.mutation.plotId}</strong>.
            </p>

            {actionModal.action === 'HEARING' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'শুনানির তারিখ:' : 'Hearing Date:'}
                </label>
                <input
                  type="date"
                  value={hearingDateInput}
                  onChange={(e) => setHearingDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'bn' ? 'অফিসিয়াল আদেশ / মন্তব্য:' : 'Official Order / Remarks:'}
              </label>
              <textarea
                value={actionNoteInput}
                onChange={(e) => setActionNoteInput(e.target.value)}
                rows={3}
                placeholder={lang === 'bn' ? 'মন্তব্য বা আদেশের কপি লিখুন...' : 'Enter official decree notes or rejection reasons...'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition shadow-xs ${
                  actionModal.action === 'APPROVE'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : actionModal.action === 'REJECT'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-purple-700 hover:bg-purple-800'
                }`}
              >
                {lang === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
