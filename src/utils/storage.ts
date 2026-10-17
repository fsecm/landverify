/**
 * Storage and Demo Data Seeding Utility
 * Manages localStorage persistence for plots, deeds, mutations, mortgages, ledger, alerts, and activities.
 * Generates ~30 realistic synthetic plots across 4 mouzas with planted problem cases.
 */

import {
  Alert,
  Deed,
  LedgerEntry,
  Mutation,
  Plot,
  Mortgage,
  ActivityLogItem,
  SurveyRecord,
} from '../types';
import { computeStringHash } from './hash';
import { runSystemWideMismatchAudit, checkDoubleMortgageAlerts } from './fraud';
import { getStoredActivities, saveStoredActivities, logActivity } from './activity';
import { deedsToCSV, triggerCSVDownload, downloadDeedsCSV } from './export.js';

const STORAGE_KEYS = {
  PLOTS: 'landverify_plots_v2',
  DEEDS: 'landverify_deeds_v2',
  MUTATIONS: 'landverify_mutations_v2',
  MORTGAGES: 'landverify_mortgages_v2',
  LEDGER: 'landverify_ledger_v2',
  ALERTS: 'landverify_alerts_v2',
  VERIFIED_COUNT: 'landverify_verified_count_v2',
  LANGUAGE: 'landverify_language_v2',
};

// ---------------------------------------------------------
// SAMPLE DEED TEXT CONTENTS FOR VERIFICATION TESTS
// ---------------------------------------------------------
export const SAMPLE_DEED_CONTENT_001 = `================================================================================
                    GOVERNMENT OF BANGLADESH - SUB-REGISTRY
                      DEED OF SALE (সাফ কবলা দলিল) - SYNTHETIC PROTOTYPE
================================================================================
Deed Registration No: DEED-2026-MIR-001
Sub-Registry Office: Mirpur, Dhaka
Execution Date: 2026-02-15

PLOT PARTICULARS:
- Plot Identification: DHK-MIR-001
- Division: Dhaka | District: Dhaka | Upazila: Mirpur | Mouza: Senpara Parbata
- Khatian Type: RS | Khatian No: RS-4102 | Dag No: 5042
- Land Classification: Commercial / Viti
- Area: 6.50 Decimal (ছয় দশমিক পাঁচ শূন্য শতক)

PARTIES:
- First Party (Seller): Md. Aminul Haque (Dummy - Synthetic Record)
  NID: 1985-0000-0000-0001 | S/O: Late Abdul Gafur
- Second Party (Buyer): Farzana Yasmin (Dummy - Synthetic Record)
  NID: 1992-0000-0000-0002 | D/O: Dr. M. Rahman

CONSIDERATION & TERMS:
Total Consideration: BDT 6,500,000 (Sixty-Five Lakh Taka Only)
Full payment received via Pay Order PO-8921-2026, Sonali Bank Ltd.
Possession delivered with unencumbered, peaceful title.

[STAMP & SEAL: SUB-REGISTRAR MIRPUR - OFFICIAL SYNTHETIC DUMMY DOCUMENT]
================================================================================`;

export const SAMPLE_DEED_CONTENT_002 = `================================================================================
                    GOVERNMENT OF BANGLADESH - SUB-REGISTRY
                      DEED OF SALE (সাফ কবলা দলিল) - SYNTHETIC PROTOTYPE
================================================================================
Deed Registration No: DEED-2026-SAV-014
Sub-Registry Office: Savar, Dhaka
Execution Date: 2026-03-01

PLOT PARTICULARS:
- Plot Identification: DHK-SAV-014
- Division: Dhaka | District: Dhaka | Upazila: Savar | Mouza: Savar Cantonment
- Khatian Type: BS | Khatian No: BS-8920 | Dag No: 3108
- Land Classification: Residential / Bari
- Area: 4.25 Decimal (চার দশমিক দুই পাঁচ শতক)

PARTIES:
- First Party (Seller): Kamrul Hasan (Dummy - Synthetic Record)
- Second Party (Buyer): Nusrat Jahan (Dummy - Synthetic Record)

CONSIDERATION & TERMS:
Total Consideration: BDT 4,200,000 (Forty-Two Lakh Taka Only)
Title fully transferred with all easement and municipal rights.
================================================================================`;

export const SAMPLE_DEED_CONTENT_001_TAMPERED = `================================================================================
                    GOVERNMENT OF BANGLADESH - SUB-REGISTRY
                      DEED OF SALE (সাফ কবলা দলিল) - SYNTHETIC PROTOTYPE
================================================================================
Deed Registration No: DEED-2026-MIR-001
Sub-Registry Office: Mirpur, Dhaka
Execution Date: 2026-02-15

PLOT PARTICULARS:
- Plot Identification: DHK-MIR-001
- Division: Dhaka | District: Dhaka | Upazila: Mirpur | Mouza: Senpara Parbata
- Khatian Type: RS | Khatian No: RS-4102 | Dag No: 5042
- Land Classification: Commercial / Viti
- Area: 9.50 Decimal (নয় দশমিক পাঁচ শূন্য শতক) [TAMPERED: Land area forged from 6.50 to 9.50]

PARTIES:
- First Party (Seller): Md. Aminul Haque (Dummy - Synthetic Record)
  NID: 1985-0000-0000-0001 | S/O: Late Abdul Gafur
- Second Party (Buyer): Farzana Yasmin (Dummy - Synthetic Record)
  NID: 1992-0000-0000-0002 | D/O: Dr. M. Rahman

CONSIDERATION & TERMS:
Total Consideration: BDT 6,500,000 (Sixty-Five Lakh Taka Only)
Full payment received via Pay Order PO-8921-2026, Sonali Bank Ltd.
Possession delivered with unencumbered, peaceful title.

[STAMP & SEAL: SUB-REGISTRAR MIRPUR - OFFICIAL SYNTHETIC DUMMY DOCUMENT]
================================================================================`;

// ---------------------------------------------------------
// GETTERS AND SETTERS
// ---------------------------------------------------------

export function getStoredPlots(): Plot[] {
  const data = localStorage.getItem(STORAGE_KEYS.PLOTS);
  return data ? JSON.parse(data) : [];
}

export function saveStoredPlots(plots: Plot[]): void {
  localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
}

export function getStoredDeeds(): Deed[] {
  const data = localStorage.getItem(STORAGE_KEYS.DEEDS);
  return data ? JSON.parse(data) : [];
}

export function saveStoredDeeds(deeds: Deed[]): void {
  localStorage.setItem(STORAGE_KEYS.DEEDS, JSON.stringify(deeds));
}

export function getStoredMutations(): Mutation[] {
  const data = localStorage.getItem(STORAGE_KEYS.MUTATIONS);
  return data ? JSON.parse(data) : [];
}

export function saveStoredMutations(mutations: Mutation[]): void {
  localStorage.setItem(STORAGE_KEYS.MUTATIONS, JSON.stringify(mutations));
}

export function getStoredMortgages(): Mortgage[] {
  const data = localStorage.getItem(STORAGE_KEYS.MORTGAGES);
  return data ? JSON.parse(data) : [];
}

export function saveStoredMortgages(mortgages: Mortgage[]): void {
  localStorage.setItem(STORAGE_KEYS.MORTGAGES, JSON.stringify(mortgages));
}

export function getStoredLedger(): LedgerEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.LEDGER);
  return data ? JSON.parse(data) : [];
}

export function saveStoredLedger(ledger: LedgerEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
}

export function getStoredAlerts(): Alert[] {
  const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
  return data ? JSON.parse(data) : [];
}

export function saveStoredAlerts(alerts: Alert[]): void {
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
}

export function getVerifiedCount(): number {
  const count = localStorage.getItem(STORAGE_KEYS.VERIFIED_COUNT);
  return count ? parseInt(count, 10) : 0;
}

export function incrementVerifiedCount(): number {
  const current = getVerifiedCount();
  const next = current + 1;
  localStorage.setItem(STORAGE_KEYS.VERIFIED_COUNT, next.toString());
  return next;
}

export function getStoredLanguage(): 'en' | 'bn' {
  const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  return lang === 'bn' ? 'bn' : 'en';
}

export function saveStoredLanguage(lang: 'en' | 'bn'): void {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
}

/**
 * Resets all stored application data.
 */
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PLOTS);
  localStorage.removeItem(STORAGE_KEYS.DEEDS);
  localStorage.removeItem(STORAGE_KEYS.MUTATIONS);
  localStorage.removeItem(STORAGE_KEYS.MORTGAGES);
  localStorage.removeItem(STORAGE_KEYS.LEDGER);
  localStorage.removeItem(STORAGE_KEYS.ALERTS);
  localStorage.removeItem(STORAGE_KEYS.VERIFIED_COUNT);
  localStorage.removeItem('landverify_activity_log_v1');
}

/**
 * Exports all system datasets as a structured JSON file for backup and judges inspection.
 */
export function exportAllDataAsJSON(): void {
  const backup = {
    app: 'LandVerify Bangladesh E-Governance Prototype',
    version: '2.0.0',
    disclaimer: 'SYNTHETIC PROTOTYPE DUMMY DATA ONLY',
    exportedAt: new Date().toISOString(),
    plots: getStoredPlots(),
    deeds: getStoredDeeds(),
    mutations: getStoredMutations(),
    mortgages: getStoredMortgages(),
    ledger: getStoredLedger(),
    alerts: getStoredAlerts(),
    activities: getStoredActivities(),
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `landverify_full_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports system data from a JSON file string, validates structure, and saves to localStorage.
 */
export function importAllDataFromJSON(jsonText: string): {
  success: boolean;
  message: string;
  data?: {
    plots: Plot[];
    deeds: Deed[];
    mutations: Mutation[];
    mortgages: Mortgage[];
    ledger: LedgerEntry[];
    alerts: Alert[];
  };
} {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !Array.isArray(parsed.plots) || !Array.isArray(parsed.deeds)) {
      return { success: false, message: 'Invalid JSON format: missing required plots or deeds arrays.' };
    }

    saveStoredPlots(parsed.plots || []);
    saveStoredDeeds(parsed.deeds || []);
    saveStoredMutations(parsed.mutations || []);
    saveStoredMortgages(parsed.mortgages || []);
    saveStoredLedger(parsed.ledger || []);
    saveStoredAlerts(parsed.alerts || []);
    if (Array.isArray(parsed.activities)) {
      saveStoredActivities(parsed.activities);
    }

    logActivity(
      'DATA_IMPORTED',
      'System Auditor',
      'System Data Restored from JSON',
      `Imported ${parsed.plots.length} plots and ${parsed.deeds.length} deeds from backup file.`,
      'SUCCESS'
    );

    return {
      success: true,
      message: `Successfully imported ${parsed.plots.length} plots, ${parsed.deeds.length} deeds, and ${parsed.alerts?.length || 0} alerts.`,
      data: {
        plots: parsed.plots || [],
        deeds: parsed.deeds || [],
        mutations: parsed.mutations || [],
        mortgages: parsed.mortgages || [],
        ledger: parsed.ledger || [],
        alerts: parsed.alerts || [],
      },
    };
  } catch (err: any) {
    return { success: false, message: `Failed to parse JSON file: ${err.message}` };
  }
}

// ---------------------------------------------------------
// SEED DEMO DATA (~30 plots across 4 mouzas with planted cases)
// ---------------------------------------------------------
export async function seedDemoData(): Promise<{
  plots: Plot[];
  deeds: Deed[];
  mutations: Mutation[];
  mortgages: Mortgage[];
  ledger: LedgerEntry[];
  alerts: Alert[];
}> {
  const sampleHash001 = await computeStringHash(SAMPLE_DEED_CONTENT_001);
  const sampleHash002 = await computeStringHash(SAMPLE_DEED_CONTENT_002);

  // 4 Core Mouzas across Dhaka & Savar Upazilas
  const mouzaNames = [
    { mouza: 'Senpara Parbata', upazila: 'Mirpur', kType: 'RS' as const },
    { mouza: 'Savar Cantonment', upazila: 'Savar', kType: 'BS' as const },
    { mouza: 'Amin Bazar', upazila: 'Savar', kType: 'SA' as const },
    { mouza: 'Dhanmondi R/A', upazila: 'Dhanmondi', kType: 'RS' as const },
  ];

  const dummyOwners = [
    'Farzana Yasmin (Dummy)',
    'Nusrat Jahan (Dummy)',
    'Kazi Mahbub Alam (Dummy)',
    'Rafiqul Islam (Dummy)', // Planted Double Sale
    'Syed Tariqul Hasan (Dummy)',
    'Shamsul Huda Chowdhury (Dummy)',
    'Shahidul Karim (Dummy)', // Planted Mismatch
    'Mostafizur Rahman (Dummy)',
    'Begum Rokeya Akter (Dummy)',
    'Asaduzzaman Khan (Dummy)', // Planted No Mutation
    'Nazrul Islam Talukdar (Dummy)',
    'Matiur Rahman (Dummy)',
    'Jamil Ahmed (Dummy)',
    'Dr. Shahabuddin (Dummy)',
    'Golam Kibria (Dummy)',
    'Enamul Haque (Dummy)', // Planted Double Mortgage
    'Tahmina Begum (Dummy)',
    'Ministry of Land (State Khas Dummy)', // Planted Khas land
    'Rezaul Karim (Dummy)',
    'Faridul Alam (Dummy)',
    'Sultana Kamal (Dummy)',
    'Delwar Hossain (Dummy)', // Planted Court Injunction
    'Kabir Bin Anwar (Dummy)',
    'Ayesha Siddiqua (Dummy)',
    'Bangladesh Bridges Authority (Gov Acquired Dummy)', // Planted Gov Acquired
    'Manzurul Ahsan (Dummy)',
    'Zulfiqar Ali (Dummy)',
    'Sharmin Sultana (Dummy)',
    'Abul Khair Chowdhury (Dummy)', // Planted Survey Mismatch
    'Nasir Uddin Patwary (Dummy)',
  ];

  const rawPlots: Plot[] = [];

  for (let i = 1; i <= 30; i++) {
    const pad = i.toString().padStart(3, '0');
    const mouzaObj = mouzaNames[(i - 1) % mouzaNames.length];
    const prefix = mouzaObj.upazila === 'Mirpur' ? 'DHK-MIR' : mouzaObj.upazila === 'Savar' ? 'DHK-SAV' : 'DHK-DHN';
    const plotId = `${prefix}-${pad}`;
    const owner = dummyOwners[i - 1];

    // Determine special planted conditions
    const isDoubleSale = plotId === 'DHK-MIR-004';
    const isMismatch = plotId === 'DHK-MIR-007';
    const isNoMutation = plotId === 'DHK-MIR-010';
    const isDoubleMortgage = i === 16;
    const isKhas = i === 18;
    const isCourtCase = i === 22;
    const isGovAcquired = i === 25;
    const isSurveyMismatch = i === 29;

    const landType = (['residential', 'commercial', 'agricultural', 'pond'] as const)[(i - 1) % 4];
    const baseArea = Number((3.5 + ((i * 3.7) % 7)).toFixed(2));

    // Historical CS -> SA -> RS -> BS surveys
    const surveys: SurveyRecord[] = [
      {
        surveyType: 'CS',
        year: 1940,
        recordedOwner: `Late Abdul Gafur ${i} (Ancestor Dummy)`,
        areaDecimal: isSurveyMismatch ? 12.0 : baseArea,
        khatianNo: `CS-${800 + i}`,
        dagNo: `${1000 + i * 2}`,
        notes: 'Cadastral Survey 1940 record',
      },
      {
        surveyType: 'SA',
        year: 1956,
        recordedOwner: `Late Mokhlesur Rahman (Heir Dummy)`,
        areaDecimal: isSurveyMismatch ? 10.5 : baseArea,
        khatianNo: `SA-${1200 + i}`,
        dagNo: `${2000 + i * 2}`,
        notes: 'State Acquisition Survey 1956',
      },
      {
        surveyType: 'RS',
        year: 1988,
        recordedOwner: isMismatch ? 'Shahidul Karim (Dummy)' : owner,
        areaDecimal: baseArea,
        khatianNo: `RS-${4000 + i}`,
        dagNo: `${5000 + i * 3}`,
        notes: 'Revisional Survey 1988',
      },
      {
        surveyType: 'BS',
        year: 2012,
        recordedOwner: owner,
        areaDecimal: baseArea,
        khatianNo: `BS-${9000 + i}`,
        dagNo: `${8000 + i * 3}`,
        notes: 'City Survey (BS) 2012 finalized',
      },
    ];

    rawPlots.push({
      plotId,
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: mouzaObj.upazila,
      mouza: mouzaObj.mouza,
      khatianType: mouzaObj.kType,
      khatianNo: `${mouzaObj.kType}-${3000 + i * 17}`,
      dagNo: `${5000 + i * 13}`,
      landType: isKhas ? 'pond' : landType,
      areaDecimal: baseArea,
      currentOwner: owner,
      isKhasLand: isKhas,
      govAcquisitionStatus: isGovAcquired ? 'acquired' : i === 12 ? 'proposed' : 'none',
      courtCaseStatus: isCourtCase ? 'pending' : i === 8 ? 'disposed' : 'none',
      caseDetails: isCourtCase ? 'Civil Title Suit 41/2025 at Joint District Judge Court, Savar (Stay Order active)' : undefined,
      acquisitionDetails: isGovAcquired ? 'Acquired under Gazetted Notice LA-14/2023 for Dhaka-Aricha Expressway Expansion' : i === 12 ? 'Proposed Acquisition under Section 4 Notice for Metro Line 5 Extension' : undefined,
      surveys,
    });
  }

  // Pre-configured Deeds
  const deeds: Deed[] = [
    {
      id: 'DEED-001',
      deedNo: 'DEED-2026-MIR-001',
      plotId: 'DHK-MIR-001',
      seller: 'Md. Aminul Haque (Dummy)',
      buyer: 'Farzana Yasmin (Dummy)',
      deedDate: '2026-02-15',
      fileName: 'Sample_Deed_DHK-MIR-001_Authentic.txt',
      fileHash: sampleHash001,
      qrToken: 'LV-DOC-DHK-MIR-001',
      createdAt: '2026-02-15T10:00:00.000Z',
      subRegistryOffice: 'Mirpur Sub-Registry',
      considerationAmountBDT: 6500000,
    },
    {
      id: 'DEED-002',
      deedNo: 'DEED-2026-SAV-014',
      plotId: 'DHK-SAV-014',
      seller: 'Kamrul Hasan (Dummy)',
      buyer: 'Nusrat Jahan (Dummy)',
      deedDate: '2026-03-01',
      fileName: 'Sample_Deed_DHK-SAV-014_Authentic.txt',
      fileHash: sampleHash002,
      qrToken: 'LV-DOC-DHK-SAV-014',
      createdAt: '2026-03-01T11:30:00.000Z',
      subRegistryOffice: 'Savar Sub-Registry',
      considerationAmountBDT: 4200000,
    },
    {
      id: 'DEED-003',
      deedNo: 'DEED-2025-MIR-119',
      plotId: 'DHK-MIR-003',
      seller: 'Abdul Karim (Dummy)',
      buyer: 'Kazi Mahbub Alam (Dummy)',
      deedDate: '2025-11-20',
      fileName: 'deed_DHK-MIR-003.pdf',
      fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      qrToken: 'LV-DOC-DHK-MIR-003',
      createdAt: '2025-11-20T09:15:00.000Z',
      subRegistryOffice: 'Mirpur Sub-Registry',
      considerationAmountBDT: 5000000,
    },
    // Planted Double Sale on DHK-MIR-004
    {
      id: 'DEED-004-A',
      deedNo: 'DEED-2026-RAM-088',
      plotId: 'DHK-MIR-004',
      seller: 'Rafiqul Islam (Dummy)',
      buyer: 'Anisur Rahman (Dummy)',
      deedDate: '2026-01-10',
      fileName: 'deed_DHK-MIR-004_first.pdf',
      fileHash: '38294a5e2f7b8c9d0123456789abcdef0123456789abcdef0123456789abcdef',
      qrToken: 'LV-DOC-DHK-MIR-004A',
      createdAt: '2026-01-10T10:00:00.000Z',
      subRegistryOffice: 'Ramna Sub-Registry',
      considerationAmountBDT: 7500000,
    },
    {
      id: 'DEED-004-B',
      deedNo: 'DEED-2026-RAM-142',
      plotId: 'DHK-MIR-004',
      seller: 'Rafiqul Islam (Dummy)',
      buyer: 'Kabir Hossain (Dummy)',
      deedDate: '2026-03-12',
      fileName: 'deed_DHK-MIR-004_second.pdf',
      fileHash: '9a8b7c6d5e4f3a2b10987654321fedcba987654321fedcba987654321fedcba9',
      qrToken: 'LV-DOC-DHK-MIR-004B',
      createdAt: '2026-03-12T14:45:00.000Z',
      subRegistryOffice: 'Ramna Sub-Registry',
      considerationAmountBDT: 8000000,
    },
    // Planted Mismatch on DHK-MIR-007
    {
      id: 'DEED-007',
      deedNo: 'DEED-2026-UTT-209',
      plotId: 'DHK-MIR-007',
      seller: 'Habibur Rahman (Dummy)',
      buyer: 'Tanvir Ahmed (Dummy)',
      deedDate: '2026-02-02',
      fileName: 'deed_DHK-MIR-007.pdf',
      fileHash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
      qrToken: 'LV-DOC-DHK-MIR-007',
      createdAt: '2026-02-02T13:20:00.000Z',
      subRegistryOffice: 'Uttara Sub-Registry',
      considerationAmountBDT: 5800000,
    },
    // Planted Missing Mutation on DHK-MIR-010
    {
      id: 'DEED-010',
      deedNo: 'DEED-2026-PAL-045',
      plotId: 'DHK-MIR-010',
      seller: 'Asaduzzaman Khan (Dummy)',
      buyer: 'Fariha Sultana (Dummy)',
      deedDate: '2026-01-25',
      fileName: 'deed_DHK-MIR-010.pdf',
      fileHash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
      qrToken: 'LV-DOC-DHK-MIR-010',
      createdAt: '2026-01-25T15:30:00.000Z',
      subRegistryOffice: 'Pallabi Sub-Registry',
      considerationAmountBDT: 6200000,
    },
    {
      id: 'DEED-016',
      deedNo: 'DEED-2025-SAV-490',
      plotId: 'DHK-SAV-016',
      seller: 'Sirajul Islam (Dummy)',
      buyer: 'Enamul Haque (Dummy)',
      deedDate: '2025-07-15',
      fileName: 'deed_DHK-SAV-016.pdf',
      fileHash: '1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e',
      qrToken: 'LV-DOC-DHK-SAV-016',
      createdAt: '2025-07-15T11:00:00.000Z',
      subRegistryOffice: 'Savar Sub-Registry',
      considerationAmountBDT: 5200000,
    },
  ];

  // AC Land Mutation Records
  const mutations: Mutation[] = [
    {
      id: 'MUT-001',
      plotId: 'DHK-MIR-001',
      deedId: 'DEED-001',
      newOwner: 'Farzana Yasmin (Dummy)',
      status: 'APPROVED',
      date: '2026-02-28',
      mutationCaseNo: 'MUT-MIR-2026-042',
      acLandOffice: 'Mirpur Revenue Circle',
    },
    {
      id: 'MUT-002',
      plotId: 'DHK-SAV-014',
      deedId: 'DEED-002',
      newOwner: 'Nusrat Jahan (Dummy)',
      status: 'APPROVED',
      date: '2026-03-15',
      mutationCaseNo: 'MUT-SAV-2026-079',
      acLandOffice: 'Savar Revenue Circle',
    },
    {
      id: 'MUT-003',
      plotId: 'DHK-MIR-003',
      deedId: 'DEED-003',
      newOwner: 'Kazi Mahbub Alam (Dummy)',
      status: 'APPROVED',
      date: '2025-12-05',
      mutationCaseNo: 'MUT-MIR-2025-912',
      acLandOffice: 'Mirpur Revenue Circle',
    },
    {
      id: 'MUT-004-A',
      plotId: 'DHK-MIR-004',
      deedId: 'DEED-004-A',
      newOwner: 'Anisur Rahman (Dummy)',
      status: 'PENDING',
      date: '2026-01-20',
      mutationCaseNo: 'MUT-RAM-2026-011',
      acLandOffice: 'Ramna Revenue Circle',
    },
    {
      id: 'MUT-007',
      plotId: 'DHK-MIR-007',
      deedId: 'DEED-007',
      newOwner: 'Shahidul Karim (Dummy)', // Mismatched from deed buyer Tanvir Ahmed
      status: 'APPROVED',
      date: '2026-02-18',
      mutationCaseNo: 'MUT-UTT-2026-155',
      acLandOffice: 'Uttara Revenue Circle',
    },
    {
      id: 'MUT-016',
      plotId: 'DHK-SAV-016',
      deedId: 'DEED-016',
      newOwner: 'Enamul Haque (Dummy)',
      status: 'APPROVED',
      date: '2025-08-01',
      mutationCaseNo: 'MUT-SAV-2025-502',
      acLandOffice: 'Savar Revenue Circle',
    },
  ];

  // Bank Mortgages (Planting Double Mortgage on DHK-SAV-016)
  const mortgages: Mortgage[] = [
    {
      id: 'MORT-001',
      plotId: 'DHK-SAV-016',
      bankName: 'Sonar Bangla Commercial Bank (Dummy)',
      loanAmountBDT: 4500000,
      mortgageDate: '2025-09-10',
      status: 'active',
      branch: 'Savar Branch',
      mortgageDeedNo: 'MORT-SAV-2025-102',
      registeredAt: '2025-09-10T10:00:00.000Z',
    },
    {
      id: 'MORT-002',
      plotId: 'DHK-SAV-016',
      bankName: 'Dhaka National Bank (Dummy)',
      loanAmountBDT: 3800000,
      mortgageDate: '2026-01-15',
      status: 'active', // SECOND ACTIVE MORTGAGE -> TRIGGERS DOUBLE_MORTGAGE!
      branch: 'Mirpur Principal Branch',
      mortgageDeedNo: 'MORT-DHK-2026-044',
      registeredAt: '2026-01-15T14:30:00.000Z',
    },
    {
      id: 'MORT-003',
      plotId: 'DHK-MIR-005',
      bankName: 'Pubali Trust Bank (Dummy)',
      loanAmountBDT: 6000000,
      mortgageDate: '2024-05-12',
      status: 'released', // RELEASED
      branch: 'Dhanmondi Branch',
      mortgageDeedNo: 'MORT-DHN-2024-811',
      registeredAt: '2024-05-12T09:00:00.000Z',
    },
    {
      id: 'MORT-004',
      plotId: 'DHK-MIR-001',
      bankName: 'Agrani Islamic Bank (Dummy)',
      loanAmountBDT: 3000000,
      mortgageDate: '2025-01-10',
      status: 'released', // RELEASED
      branch: 'Mirpur Branch',
      mortgageDeedNo: 'MORT-MIR-2025-021',
      registeredAt: '2025-01-10T12:00:00.000Z',
    },
    {
      id: 'MORT-005',
      plotId: 'DHK-DHN-028',
      bankName: 'Padma Rural Bank (Dummy)',
      loanAmountBDT: 5000000,
      mortgageDate: '2025-11-04',
      status: 'active',
      branch: 'Karwan Bazar Branch',
      mortgageDeedNo: 'MORT-KB-2025-901',
      registeredAt: '2025-11-04T15:00:00.000Z',
    },
  ];

  // Hash-Chained Audit Ledger
  const ledger: LedgerEntry[] = [];
  const eventsToChain = [
    { plotId: 'DHK-MIR-001', deedId: 'DEED-001', eventType: 'DEED_REGISTERED' as const, createdAt: '2026-02-15T10:00:00.000Z', note: 'Deed executed at Mirpur Sub-Registry' },
    { plotId: 'DHK-MIR-001', deedId: 'DEED-001', eventType: 'MUTATION_APPROVED' as const, createdAt: '2026-02-28T14:30:00.000Z', note: 'AC Land approved mutation to Farzana Yasmin' },
    { plotId: 'DHK-SAV-014', deedId: 'DEED-002', eventType: 'DEED_REGISTERED' as const, createdAt: '2026-03-01T11:30:00.000Z', note: 'Deed executed at Savar Sub-Registry' },
    { plotId: 'DHK-SAV-014', deedId: 'DEED-002', eventType: 'MUTATION_APPROVED' as const, createdAt: '2026-03-15T16:00:00.000Z', note: 'Mutation approved' },
    { plotId: 'DHK-MIR-004', deedId: 'DEED-004-A', eventType: 'DEED_REGISTERED' as const, createdAt: '2026-01-10T10:00:00.000Z', note: 'Deed registered to Anisur Rahman' },
    { plotId: 'DHK-MIR-004', deedId: 'DEED-004-B', eventType: 'DEED_REGISTERED' as const, createdAt: '2026-03-12T14:45:00.000Z', note: 'Conflicting deed registered to Kabir Hossain' },
    { plotId: 'DHK-MIR-004', deedId: 'DEED-004-B', eventType: 'ALERT_FLAGGED' as const, createdAt: '2026-03-12T14:46:00.000Z', note: 'DOUBLE_SALE detected by automated barrier' },
    { plotId: 'DHK-MIR-007', deedId: 'DEED-007', eventType: 'DEED_REGISTERED' as const, createdAt: '2026-02-02T13:20:00.000Z', note: 'Deed registered to Tanvir Ahmed' },
    { plotId: 'DHK-MIR-007', deedId: 'DEED-007', eventType: 'MUTATION_APPROVED' as const, createdAt: '2026-02-18T14:00:00.000Z', note: 'Mutation filed with divergent name Shahidul Karim' },
    { plotId: 'DHK-SAV-016', deedId: 'DEED-016', eventType: 'DEED_REGISTERED' as const, createdAt: '2025-07-15T11:00:00.000Z', note: 'Deed registered to Enamul Haque' },
    { plotId: 'DHK-SAV-016', deedId: 'DEED-016', eventType: 'MORTGAGE_REGISTERED' as const, createdAt: '2025-09-10T10:00:00.000Z', note: 'Mortgage registered with Sonar Bangla Commercial Bank' },
    { plotId: 'DHK-SAV-016', deedId: 'DEED-016', eventType: 'MORTGAGE_REGISTERED' as const, createdAt: '2026-01-15T14:30:00.000Z', note: 'Second mortgage registered with Dhaka National Bank' },
    { plotId: 'DHK-SAV-016', deedId: 'DEED-016', eventType: 'ALERT_FLAGGED' as const, createdAt: '2026-01-15T14:31:00.000Z', note: 'DOUBLE_MORTGAGE detected across banking network' },
  ];

  const plotChains: Record<string, string> = {};
  for (let i = 0; i < eventsToChain.length; i++) {
    const item = eventsToChain[i];
    const prevHash = plotChains[item.plotId] || 'GENESIS';
    const payload = `${prevHash}${item.plotId}${item.deedId}${item.eventType}${item.createdAt}`;
    const recordHash = await computeStringHash(payload);
    plotChains[item.plotId] = recordHash;

    ledger.push({
      id: `LEDGER-SEED-${i + 1}`,
      plotId: item.plotId,
      deedId: item.deedId,
      eventType: item.eventType,
      prevHash,
      recordHash,
      createdAt: item.createdAt,
      note: item.note,
    });
  }

  // Initial Seeded Alerts
  const alerts: Alert[] = [
    {
      id: 'ALERT-SEED-004',
      plotId: 'DHK-MIR-004',
      type: 'DOUBLE_SALE',
      description: 'DOUBLE_SALE CONFLICT: Plot DHK-MIR-004 was sold to Anisur Rahman and then re-sold to Kabir Hossain without legal mutation.',
      status: 'OPEN',
      createdAt: '2026-03-12T14:46:00.000Z',
      deedId: 'DEED-004-B',
    },
    {
      id: 'ALERT-SEED-007',
      plotId: 'DHK-MIR-007',
      type: 'MISMATCH',
      description: "MISMATCH (OWNER DIVERGENCE): Deed DEED-2026-UTT-209 names buyer 'Tanvir Ahmed (Dummy)', but AC Land Mutation records 'Shahidul Karim (Dummy)'.",
      status: 'OPEN',
      createdAt: '2026-02-18T14:05:00.000Z',
      deedId: 'DEED-007',
    },
    {
      id: 'ALERT-SEED-010',
      plotId: 'DHK-MIR-010',
      type: 'MISMATCH',
      description: "MISMATCH (NO MUTATION): Deed DEED-2026-PAL-045 has no corresponding AC Land Mutation record (খারিজবিহীন জমি).",
      status: 'OPEN',
      createdAt: '2026-01-25T15:35:00.000Z',
      deedId: 'DEED-010',
    },
    {
      id: 'ALERT-SEED-016',
      plotId: 'DHK-SAV-016',
      type: 'DOUBLE_MORTGAGE',
      description: 'DOUBLE_MORTGAGE: Plot DHK-SAV-016 is mortgaged simultaneously to Sonar Bangla Commercial Bank and Dhaka National Bank (Total BDT 8.3M) without loan release!',
      status: 'OPEN',
      createdAt: '2026-01-15T14:31:00.000Z',
    },
    {
      id: 'ALERT-SEED-018',
      plotId: 'DHK-SAV-018',
      type: 'KHAS_DISPUTE',
      description: 'KHAS LAND ATTEMPTED SALE: Plot DHK-SAV-018 is registered State Khas Property (Ministry of Land). Private conveyance illegal.',
      status: 'OPEN',
      createdAt: '2026-02-10T11:00:00.000Z',
    },
    {
      id: 'ALERT-SEED-022',
      plotId: 'DHK-AMN-022',
      type: 'COURT_INJUNCTION',
      description: 'COURT INJUNCTION: Plot DHK-AMN-022 has an active Title Suit (TS 41/2025) and stay order at Joint District Judge Court, Savar.',
      status: 'OPEN',
      createdAt: '2026-02-20T09:30:00.000Z',
    },
  ];

  // Initial Activity Log
  const activities: ActivityLogItem[] = [
    {
      id: 'ACT-INIT-1',
      timestamp: '2026-03-12T14:46:00.000Z',
      actionType: 'DEED_REGISTERED',
      actorRole: 'Sub-Registrar',
      title: 'Planted Double Sale Flagged',
      details: 'Attempted registration of Deed DEED-2026-RAM-142 triggered DOUBLE_SALE alert on Plot DHK-MIR-004.',
      status: 'DANGER',
      plotId: 'DHK-MIR-004',
      deedId: 'DEED-004-B',
    },
    {
      id: 'ACT-INIT-2',
      timestamp: '2026-03-01T11:30:00.000Z',
      actionType: 'DEED_REGISTERED',
      actorRole: 'Sub-Registrar',
      title: 'Deed Registered & Chained',
      details: 'Deed DEED-2026-SAV-014 successfully registered for Plot DHK-SAV-014.',
      status: 'SUCCESS',
      plotId: 'DHK-SAV-014',
      deedId: 'DEED-002',
    },
    {
      id: 'ACT-INIT-3',
      timestamp: '2026-02-15T10:00:00.000Z',
      actionType: 'DEED_REGISTERED',
      actorRole: 'Sub-Registrar',
      title: 'Deed Registered & Chained',
      details: 'Deed DEED-2026-MIR-001 executed from Md. Aminul Haque to Farzana Yasmin.',
      status: 'SUCCESS',
      plotId: 'DHK-MIR-001',
      deedId: 'DEED-001',
    },
    {
      id: 'ACT-INIT-4',
      timestamp: '2026-01-15T14:31:00.000Z',
      actionType: 'MORTGAGE_CREATED',
      actorRole: 'Bank Officer',
      title: 'Double Mortgage Flagged',
      details: 'Dhaka National Bank recorded mortgage on DHK-SAV-016 while Sonar Bangla Bank mortgage active.',
      status: 'WARNING',
      plotId: 'DHK-SAV-016',
    },
  ];

  saveStoredPlots(rawPlots);
  saveStoredDeeds(deeds);
  saveStoredMutations(mutations);
  saveStoredMortgages(mortgages);
  saveStoredLedger(ledger);
  saveStoredAlerts(alerts);
  saveStoredActivities(activities);
  localStorage.setItem(STORAGE_KEYS.VERIFIED_COUNT, '3');

  return {
    plots: rawPlots,
    deeds,
    mutations,
    mortgages,
    ledger,
    alerts,
  };
}

/**
 * Initializes data if not already present in localStorage.
 */
export async function initializeDataIfEmpty(): Promise<{
  plots: Plot[];
  deeds: Deed[];
  mutations: Mutation[];
  mortgages: Mortgage[];
  ledger: LedgerEntry[];
  alerts: Alert[];
}> {
  const plots = getStoredPlots();
  if (plots.length === 0) {
    return await seedDemoData();
  }
  return {
    plots,
    deeds: getStoredDeeds(),
    mutations: getStoredMutations(),
    mortgages: getStoredMortgages(),
    ledger: getStoredLedger(),
    alerts: getStoredAlerts(),
  };
}

/**
 * Exports deeds list as CSV for offline analysis.
 */
export function exportDeedsToCSV(deeds: Deed[], filename?: string): void {
  downloadDeedsCSV(deeds, filename);
}
