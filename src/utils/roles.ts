import { UserRole, PageId } from '../types';

export interface RoleConfig {
  id: UserRole;
  titleEn: string;
  titleBn: string;
  officeEn: string;
  officeBn: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  avatarColor: string;
  descriptionEn: string;
  descriptionBn: string;
  allowedPages: PageId[];
  defaultPage: PageId;
  auditActorRole: 'Sub-Registrar' | 'AC Land Officer' | 'Bank Officer' | 'Public Citizen' | 'System Auditor';
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  sub_registrar: {
    id: 'sub_registrar',
    titleEn: 'Sub-Registrar',
    titleBn: 'সাব-রেজিস্ট্রার',
    officeEn: 'Sub-Registry Office (Ministry of Law)',
    officeBn: 'সাব-রেজিস্ট্রি অফিস (আইন মন্ত্রণালয়)',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    avatarColor: 'bg-emerald-700 text-white',
    descriptionEn: 'Deed execution, PKI digital signature, document verification, and registration fraud barrier.',
    descriptionBn: 'দলিল সম্পাদন, পিকেআই ডিজিটাল স্বাক্ষর, দলিল যাচাই ও রেজিস্ট্রেশন জালিয়াতি প্রতিরোধ।',
    allowedPages: ['dashboard', 'register', 'verify', 'alerts', 'compare', 'timeline', 'howItWorks'],
    defaultPage: 'dashboard',
    auditActorRole: 'Sub-Registrar',
  },
  ac_land: {
    id: 'ac_land',
    titleEn: 'AC Land Officer',
    titleBn: 'সহকারী কমিশনার (ভূমি)',
    officeEn: 'Upazila Land Office (Ministry of Land)',
    officeBn: 'উপজেলা ভূমি অফিস (ভূমি মন্ত্রণালয়)',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    avatarColor: 'bg-amber-600 text-white',
    descriptionEn: 'E-Mutation processing pipeline, hearing schedules, Khatian mismatch verification, and government title updates.',
    descriptionBn: 'ই-নামজারি পাইপলাইন, শুনানি ব্যবস্থাপনা, খতিয়ান যাচাই ও সরকারি রেকর্ড হালনাগাদ।',
    allowedPages: ['dashboard', 'mutationQueue', 'plotCheck', 'alerts', 'timeline', 'howItWorks'],
    defaultPage: 'mutationQueue',
    auditActorRole: 'AC Land Officer',
  },
  bank_officer: {
    id: 'bank_officer',
    titleEn: 'Bank Credit Officer',
    titleBn: 'ব্যাংক ক্রেডিট অফিসার',
    officeEn: 'Commercial Bank / Mortgage Division',
    officeBn: 'বাণিজ্যিক ব্যাংক / বন্ধকী বিভাগ',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    avatarColor: 'bg-indigo-700 text-white',
    descriptionEn: 'Check collateral titles, detect duplicate active mortgages across banks, and record/release mortgage liens.',
    descriptionBn: 'জমি বন্ধকের বৈধতা যাচাই, দ্বৈত মর্টগেজ শনাক্তকরণ ও লিয়েন রেকর্ড/রিলিজ।',
    allowedPages: ['dashboard', 'plotCheck', 'bankCheck', 'alerts', 'timeline', 'howItWorks'],
    defaultPage: 'bankCheck',
    auditActorRole: 'Bank Officer',
  },
  citizen: {
    id: 'citizen',
    titleEn: 'Citizen / Buyer',
    titleBn: 'নাগরিক / ক্রেতা',
    officeEn: 'Public Citizen Portal',
    officeBn: 'পাবলিক সিটিজেন পোর্টাল',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    badgeText: 'text-sky-800',
    borderColor: 'border-sky-300',
    avatarColor: 'bg-sky-600 text-white',
    descriptionEn: 'Pre-purchase due diligence ("Check Before You Buy"), instant QR deed verification, and printable due diligence reports.',
    descriptionBn: 'জমি কেনার পূর্বে তথ্যাদি যাচাই ("Check Before You Buy") ও দলিলের কিউআর কোড ভেরিফিকেশন।',
    allowedPages: ['dashboard', 'plotCheck', 'verify', 'howItWorks', 'security'],
    defaultPage: 'plotCheck',
    auditActorRole: 'Public Citizen',
  },
  admin: {
    id: 'admin',
    titleEn: 'System Administrator',
    titleBn: 'সিস্টেম অ্যাডমিনিস্ট্রেটর',
    officeEn: 'National Land Records Directorate & Audit',
    officeBn: 'ভূমি রেকর্ড ও জরিপ অধিদপ্তর এবং অডিট',
    badgeBg: 'bg-slate-900 text-slate-100 border-slate-700',
    badgeText: 'text-slate-900',
    borderColor: 'border-slate-800',
    avatarColor: 'bg-slate-900 text-white',
    descriptionEn: 'Complete administrative oversight, system health diagnostics, configurable risk weights, analytics, and full audit logs.',
    descriptionBn: 'সম্পূর্ণ প্রশাসনিক নিয়ন্ত্রণ, সিস্টেম হেলথ মনিটরিং, ঝুঁকি নির্ধারণের মানদণ্ড এবং পূর্ণ অডিট লগ।',
    allowedPages: [
      'dashboard',
      'register',
      'verify',
      'plotCheck',
      'timeline',
      'bankCheck',
      'mutationQueue',
      'alerts',
      'compare',
      'analytics',
      'activityLog',
      'howItWorks',
      'architecture',
      'security',
      'systemHealth',
    ],
    defaultPage: 'dashboard',
    auditActorRole: 'System Auditor',
  },
};

const STORAGE_KEY_ROLE = 'landverify_active_role';

export function getStoredRole(): UserRole {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROLE);
    if (raw && (raw === 'sub_registrar' || raw === 'ac_land' || raw === 'bank_officer' || raw === 'citizen' || raw === 'admin')) {
      return raw as UserRole;
    }
  } catch (e) {
    console.error('Failed to read active role from localStorage', e);
  }
  return 'sub_registrar';
}

export function saveStoredRole(role: UserRole): void {
  try {
    localStorage.setItem(STORAGE_KEY_ROLE, role);
  } catch (e) {
    console.error('Failed to save active role to localStorage', e);
  }
}
