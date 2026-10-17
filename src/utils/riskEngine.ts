/**
 * Explainable Risk Engine (src/utils/riskEngine.ts)
 * 
 * Configurable multi-factor due-diligence risk scoring engine for land parcels.
 * Implements transparent rule evaluation, customizable weights, and itemized
 * mathematical explanations ("Why this score?").
 */

import {
  Plot,
  Alert,
  Mortgage,
  PlotRiskAssessment,
  RiskScoreBreakdownItem,
  RiskEngineWeights,
  RiskLevel,
} from '../types';
import { checkKhatianSurveyMismatches } from './fraud';

export const DEFAULT_RISK_WEIGHTS: RiskEngineWeights = {
  openAlert: 20,
  doubleSale: 35,
  khasDispute: 40,
  courtInjunction: 25,
  doubleMortgage: 30,
  surveyMismatch: 20,
  activeCourtCase: 25,
  khasLand: 40,
  govAcquisition: 35,
  brokenHashChain: 40,
};

export interface RiskRuleDefinition {
  key: keyof RiskEngineWeights;
  nameEn: string;
  nameBn: string;
  category: 'ALERT' | 'COURT' | 'KHAS' | 'ACQUISITION' | 'MORTGAGE' | 'CHAIN' | 'SURVEY';
  descriptionEn: string;
  descriptionBn: string;
}

export const RISK_RULES_REGISTRY: RiskRuleDefinition[] = [
  {
    key: 'brokenHashChain',
    nameEn: 'Broken Cryptographic Hash Chain',
    nameBn: 'ক্রিপ্টোগ্রাফিক হ্যাশ-চেইন ব্যাহত',
    category: 'CHAIN',
    descriptionEn: 'Historical ownership ledger block alteration or unauthorized record edit detected.',
    descriptionBn: 'মালিকানা লেজারে অননুমোদিত পরিবর্তন বা ব্লকের তথ্য বিকৃতি শনাক্ত।',
  },
  {
    key: 'doubleSale',
    nameEn: 'Double Sale / Competing Conveyance',
    nameBn: 'দ্বৈত বিক্রয় বা একাধিক দলিলের বিরোধ',
    category: 'ALERT',
    descriptionEn: 'The same land parcel was sold to multiple buyers without prior legal mutation.',
    descriptionBn: 'পূর্বে বিক্রি করা জমি বৈধ নামজারি ছাড়া পুনরায় অপর ক্রেতার নিকট বিক্রি।',
  },
  {
    key: 'khasLand',
    nameEn: 'State Vested Khas Land (খাস জমি)',
    nameBn: 'সরকারি খাস জমি',
    category: 'KHAS',
    descriptionEn: 'Land is recorded as Government Khas property. Private conveyance is illegal and void.',
    descriptionBn: 'জমিটি সরকারি খাস খতিয়ানভুক্ত। ব্যক্তিগত মালিকানা হস্তান্তর সম্পূর্ণ বেআইনি।',
  },
  {
    key: 'doubleMortgage',
    nameEn: 'Simultaneous Multi-Bank Double Mortgage',
    nameBn: 'একাধিক ব্যাংকে দ্বৈত বন্ধক (মর্টগেজ)',
    category: 'MORTGAGE',
    descriptionEn: 'Plot pledged as collateral to 2 or more financial institutions without releasing prior liens.',
    descriptionBn: 'পূর্ববর্তী লিয়েন অবমুক্ত না করেই একই জমি পুনরায় অন্য ব্যাংকে বন্ধক।',
  },
  {
    key: 'activeCourtCase',
    nameEn: 'Active Civil Court Litigation / Injunction',
    nameBn: 'আদালতের বিচারাধীন মামলা / নিষেধাজ্ঞা',
    category: 'COURT',
    descriptionEn: 'Subject to active Title Suit or court stay order restraining title transfer.',
    descriptionBn: 'জমির উপর আদালতে দেওয়ানি স্বত্ব মামলা বা হস্তান্তরে নিষেধাজ্ঞা বলবৎ।',
  },
  {
    key: 'govAcquisition',
    nameEn: 'Government Gazetted Acquisition',
    nameBn: 'সরকারি অধিগ্রহণকৃত জমি',
    category: 'ACQUISITION',
    descriptionEn: 'Land acquired by the state under public infrastructure or expressway acquisition notice.',
    descriptionBn: 'সরকারি উন্নয়ন প্রকল্পের জন্য ভূমি হুকুমদখল ও অধিগ্রহণ আইনের আওতায় গৃহীত।',
  },
  {
    key: 'surveyMismatch',
    nameEn: 'Cadastral Survey Area/Owner Mismatch',
    nameBn: 'জরিপ খতিয়ানে জমির পরিমাণ বা মালিকানা অমিল',
    category: 'SURVEY',
    descriptionEn: 'Unexplained area inflation or owner divergence across historical CS ➔ SA ➔ RS ➔ BS surveys.',
    descriptionBn: 'সিএস, এসএ, আরএস ও বিএস জরিপের মধ্যে অস্বাভাবিক জমির পরিমাণের পার্থক্য।',
  },
  {
    key: 'openAlert',
    nameEn: 'Open Administrative Alert',
    nameBn: 'উন্মুক্ত প্রশাসনিক সতর্কতা',
    category: 'ALERT',
    descriptionEn: 'Unresolved sub-registry or AC land title alert pending investigation.',
    descriptionBn: 'সাব-রেজিস্ট্রি অথবা ভূমি অফিসের তদন্তাধীন অমীমাংসিত সতর্কতা।',
  },
];

const STORAGE_KEY_WEIGHTS = 'landverify_risk_weights';

export function getStoredRiskWeights(): RiskEngineWeights {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEIGHTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RISK_WEIGHTS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to read risk weights', e);
  }
  return { ...DEFAULT_RISK_WEIGHTS };
}

export function saveStoredRiskWeights(weights: RiskEngineWeights): void {
  try {
    localStorage.setItem(STORAGE_KEY_WEIGHTS, JSON.stringify(weights));
  } catch (e) {
    console.error('Failed to save risk weights', e);
  }
}

export interface RuleEvaluationDetail {
  rule: RiskRuleDefinition;
  weight: number;
  triggered: boolean;
  actualPointsAdded: number;
  evidence: string;
}

export interface ExplainableRiskResult {
  score: number;
  level: RiskLevel;
  breakdown: RiskScoreBreakdownItem[];
  allRulesEvaluated: RuleEvaluationDetail[];
  summary: string;
}

/**
 * Evaluates all risk rules against a plot and returns an explainable breakdown.
 */
export function evaluatePlotRiskExplainable(
  plot: Plot,
  alerts: Alert[] = [],
  mortgages: Mortgage[] = [],
  isChainBroken = false,
  customWeights?: RiskEngineWeights
): ExplainableRiskResult {
  const weights = customWeights || getStoredRiskWeights();
  const plotAlerts = alerts.filter((a) => a.plotId === plot.plotId && a.status === 'OPEN');
  const activeMortgages = mortgages.filter((m) => m.plotId === plot.plotId && m.status === 'active');
  const surveyMismatch = checkKhatianSurveyMismatches(plot);

  let totalScore = 0;
  const breakdown: RiskScoreBreakdownItem[] = [];
  const allRules: RuleEvaluationDetail[] = [];

  // 1. Broken Hash Chain
  const chainTriggered = isChainBroken;
  const chainWeight = weights.brokenHashChain;
  allRules.push({
    rule: RISK_RULES_REGISTRY.find((r) => r.key === 'brokenHashChain')!,
    weight: chainWeight,
    triggered: chainTriggered,
    actualPointsAdded: chainTriggered ? chainWeight : 0,
    evidence: chainTriggered
      ? 'Cryptographic ledger audit failed: previous block hash does not match current record payload.'
      : 'All historical ownership blocks verified cryptographically intact.',
  });
  if (chainTriggered) {
    totalScore += chainWeight;
    breakdown.push({
      label: 'Cryptographic Hash-Chain Broken',
      points: chainWeight,
      category: 'CHAIN',
      description: 'Historical ledger audit failed. An unauthorized block alteration was detected.',
    });
  }

  // 2. Double Sale
  const doubleSaleAlert = plotAlerts.find((a) => a.type === 'DOUBLE_SALE');
  const doubleSaleTriggered = !!doubleSaleAlert;
  const doubleSaleWeight = weights.doubleSale;
  allRules.push({
    rule: RISK_RULES_REGISTRY.find((r) => r.key === 'doubleSale')!,
    weight: doubleSaleWeight,
    triggered: doubleSaleTriggered,
    actualPointsAdded: doubleSaleTriggered ? doubleSaleWeight : 0,
    evidence: doubleSaleTriggered
      ? doubleSaleAlert!.description
      : 'No active competing deed or duplicate sale records found.',
  });
  if (doubleSaleTriggered) {
    totalScore += doubleSaleWeight;
    breakdown.push({
      label: 'Double Sale / Competing Deed Conflict',
      points: doubleSaleWeight,
      category: 'ALERT',
      description: doubleSaleAlert!.description,
    });
  }

  // 3. State Khas Land
  const khasTriggered = plot.isKhasLand || plotAlerts.some((a) => a.type === 'KHAS_DISPUTE');
  const khasWeight = weights.khasLand;
  allRules.push({
    rule: RISK_RULES_REGISTRY.find((r) => r.key === 'khasLand')!,
    weight: khasWeight,
    triggered: khasTriggered,
    actualPointsAdded: khasTriggered ? khasWeight : 0,
    evidence: khasTriggered
      ? 'Parcel is recorded as State Vested Khas Land in Upazila Revenue records.'
      : 'Clean non-khas private ownership record.',
  });
  if (khasTriggered) {
    totalScore += khasWeight;
    breakdown.push({
      label: 'Government Khas Land (খাস জমি)',
      points: khasWeight,
      category: 'KHAS',
      description: 'Land belongs to State Khas registry. Private conveyances are void.',
    });
  }

  // 4. Double Mortgage
  const doubleMortgageAlert = plotAlerts.find((a) => a.type === 'DOUBLE_MORTGAGE');
  const doubleMortgageTriggered = !!doubleMortgageAlert || activeMortgages.length >= 2;
  const doubleMortgageWeight = weights.doubleMortgage;
  allRules.push({
    rule: RISK_RULES_REGISTRY.find((r) => r.key === 'doubleMortgage')!,
    weight: doubleMortgageWeight,
    triggered: doubleMortgageTriggered,
    actualPointsAdded: doubleMortgageTriggered ? doubleMortgageWeight : 0,
    evidence: doubleMortgageTriggered
      ? `Plot has ${activeMortgages.length} simultaneous active bank mortgages without release.`
      : activeMortgages.length === 1
      ? `Single active mortgage (${activeMortgages[0].bankName}) within allowable single-lien limit.`
      : 'No active bank mortgage encumbrances.',
  });
  if (doubleMortgageTriggered) {
    totalScore += doubleMortgageWeight;
    breakdown.push({
      label: 'Double Bank Mortgage Detected',
      points: doubleMortgageWeight,
      category: 'MORTGAGE',
      description: `Plot is pledged to ${activeMortgages.length || 2} financial institutions simultaneously without loan satisfaction.`,
    });
  }

  // 5. Active Court Litigation
  const courtTriggered = plot.courtCaseStatus === 'pending' || plotAlerts.some((a) => a.type === 'COURT_INJUNCTION');
  const courtWeight = weights.activeCourtCase;
  allRules.push({
    rule: RISK_RULES_REGISTRY.find((r) => r.key === 'activeCourtCase')!,
    weight: courtWeight,
    triggered: courtTriggered,
    actualPointsAdded: courtTriggered ? courtWeight : 0,
    evidence: courtTriggered
      ? plot.caseDetails || 'Active title lawsuit or stay order pending in civil court.'
      : plot.courtCaseStatus === 'disposed'
      ? 'Past court dispute formally disposed and decree entered.'
      : 'No pending civil court suits on record.',
  });
  if (courtTriggered) {
    totalScore += courtWeight;
    breakdown.push({
      label: 'Pending Court Case / Stay Order',
      points: courtWeight,
      category: 'COURT',
      description: plot.caseDetails || 'Active lawsuit pending in civil court.',
    });
  }

  // 6. Government Acquisition
  const acqTriggered = plot.govAcquisitionStatus === 'acquired';
  const acqWeight = weights.govAcquisition;
  allRules.push({
    rule: RISK_RULES_REGISTRY.find((r) => r.key === 'govAcquisition')!,
    weight: acqWeight,
    triggered: acqTriggered,
    actualPointsAdded: acqTriggered ? acqWeight : 0,
    evidence: acqTriggered
      ? plot.acquisitionDetails || 'Formally acquired by the state for public project.'
      : plot.govAcquisitionStatus === 'proposed'
      ? 'Proposed acquisition under Section 4 Gazette notice.'
      : 'No government acquisition orders on file.',
  });
  if (acqTriggered) {
    totalScore += acqWeight;
    breakdown.push({
      label: 'Government Acquisition Order',
      points: acqWeight,
      category: 'ACQUISITION',
      description: plot.acquisitionDetails || 'Formally acquired by the state.',
    });
  }

  // 7. Survey Mismatch
  const surveyTriggered = surveyMismatch.hasMismatch;
  const surveyWeight = weights.surveyMismatch;
  allRules.push({
    rule: RISK_RULES_REGISTRY.find((r) => r.key === 'surveyMismatch')!,
    weight: surveyWeight,
    triggered: surveyTriggered,
    actualPointsAdded: surveyTriggered ? surveyWeight : 0,
    evidence: surveyTriggered
      ? surveyMismatch.discrepancies.join('; ')
      : 'Historical CS, SA, RS, BS survey records are mathematically consistent.',
  });
  if (surveyTriggered) {
    totalScore += surveyWeight;
    breakdown.push({
      label: 'Cadastral Survey Discrepancy',
      points: surveyWeight,
      category: 'SURVEY',
      description: surveyMismatch.discrepancies[0] || 'Unexplained area changes across surveys.',
    });
  }

  // 8. Other open alerts (e.g. TAMPERED, MISMATCH)
  const otherAlerts = plotAlerts.filter(
    (a) => a.type !== 'DOUBLE_SALE' && a.type !== 'KHAS_DISPUTE' && a.type !== 'DOUBLE_MORTGAGE' && a.type !== 'COURT_INJUNCTION'
  );
  if (otherAlerts.length > 0) {
    const alertWeight = weights.openAlert;
    totalScore += alertWeight;
    breakdown.push({
      label: `Open Alert (${otherAlerts[0].type})`,
      points: alertWeight,
      category: 'ALERT',
      description: otherAlerts[0].description,
    });
  }

  // Clamp score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  let level: RiskLevel = 'SAFE';
  let summary = 'Plot has clear title, consistent historical surveys, and no active encumbrances.';

  if (finalScore >= 60) {
    level = 'RISKY';
    summary = 'HIGH RISK: Critical legal impediments, double sale, state khas status, or broken chain detected.';
  } else if (finalScore >= 25) {
    level = 'REVIEW';
    summary = 'REVIEW REQUIRED: Moderate risk indicators present. Legal verification advised prior to transaction.';
  }

  return {
    score: finalScore,
    level,
    breakdown,
    allRulesEvaluated: allRules,
    summary,
  };
}

/**
 * Standard plot risk assessment wrapper matching legacy function signature.
 */
export function calculatePlotRiskScore(
  plot: Plot,
  alerts: Alert[] = [],
  mortgages: Mortgage[] = [],
  isChainBroken = false
): PlotRiskAssessment {
  const result = evaluatePlotRiskExplainable(plot, alerts, mortgages, isChainBroken);
  return {
    score: result.score,
    level: result.level,
    breakdown: result.breakdown,
    summary: result.summary,
  };
}
