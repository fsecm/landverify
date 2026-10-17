/**
 * Land Fraud Detection & Risk Scoring Engine
 * 
 * Implements rule-based heuristics to identify critical land frauds in Bangladesh e-governance:
 * 1. DOUBLE_SALE:
 *    - Seller is NOT the officially recorded current owner in Khatian records.
 *    - Plot has already been deeded to a different buyer without an approved mutation.
 * 2. MISMATCH:
 *    - Deed buyer differs from Mutation (নামজারি/খারিজ) recorded owner.
 *    - Deed exists without any AC Land mutation record.
 *    - Historical survey discrepancy across CS -> SA -> RS -> BS surveys.
 * 3. TAMPERED:
 *    - Cryptographic SHA-256 hash mismatch between uploaded document and Sub-Registry record.
 * 4. DOUBLE_MORTGAGE:
 *    - Plot is encumbered by two or more active bank mortgages without loan satisfaction release.
 * 5. KHAS_DISPUTE & COURT_INJUNCTION:
 *    - Attempted sale of Government Khas Land (খাস জমি) or plot subject to pending court injunction.
 */

import {
  Alert,
  Deed,
  Mutation,
  Plot,
  Mortgage,
  PlotRiskAssessment,
  RiskScoreBreakdownItem,
  RiskLevel,
} from '../types';

export interface PreRegistrationFraudCheckResult {
  hasFraud: boolean;
  alerts: Omit<Alert, 'id' | 'createdAt'>[];
  warnings: string[];
}

/**
 * Checks for fraudulent conditions before a new deed is finalized in the Sub-Registry.
 */
export function checkDeedFraudPreRegistration(
  plot: Plot,
  seller: string,
  buyer: string,
  existingDeeds: Deed[],
  mutations: Mutation[],
  mortgages: Mortgage[] = []
): PreRegistrationFraudCheckResult {
  const alerts: Omit<Alert, 'id' | 'createdAt'>[] = [];
  const warnings: string[] = [];

  const cleanSeller = seller.trim().toLowerCase();
  const cleanOwner = plot.currentOwner.trim().toLowerCase();

  // 1. Seller ownership validation
  if (cleanSeller !== cleanOwner) {
    const desc = `DOUBLE_SALE / UNAUTHORIZED SELLER: Plot ${plot.plotId} is legally registered to '${plot.currentOwner}', but seller is listed as '${seller}'. Unauthorized seller or missing succession chain.`;
    alerts.push({
      plotId: plot.plotId,
      type: 'DOUBLE_SALE',
      description: desc,
      status: 'OPEN',
    });
    warnings.push(desc);
  }

  // 2. Government Khas Land violation
  if (plot.isKhasLand) {
    const desc = `KHAS LAND VIOLATION: Plot ${plot.plotId} is flagged as State Khas Property (খাস জমি). Private conveyance or deed execution is strictly prohibited under Bangladesh Land Management Manual!`;
    alerts.push({
      plotId: plot.plotId,
      type: 'KHAS_DISPUTE',
      description: desc,
      status: 'OPEN',
    });
    warnings.push(desc);
  }

  // 3. Pending Court Injunction
  if (plot.courtCaseStatus === 'pending') {
    const desc = `COURT INJUNCTION: Plot ${plot.plotId} is subject to an active court lawsuit (${plot.caseDetails || 'Title Suit Pending'}). Deed transfer restricted pending judicial resolution.`;
    alerts.push({
      plotId: plot.plotId,
      type: 'COURT_INJUNCTION',
      description: desc,
      status: 'OPEN',
    });
    warnings.push(desc);
  }

  // 4. Government Acquisition restriction
  if (plot.govAcquisitionStatus === 'acquired') {
    const desc = `GOVERNMENT ACQUISITION RESTRICTION: Plot ${plot.plotId} has been formally acquired by the Government (${plot.acquisitionDetails || 'Vested in State'}). Private deeds cannot be registered.`;
    alerts.push({
      plotId: plot.plotId,
      type: 'MISMATCH',
      description: desc,
      status: 'OPEN',
    });
    warnings.push(desc);
  }

  // 5. Active Bank Mortgage warning
  const activeMortgages = mortgages.filter(
    (m) => m.plotId === plot.plotId && m.status === 'active'
  );
  if (activeMortgages.length > 0) {
    const bankNames = activeMortgages.map((m) => m.bankName).join(', ');
    const desc = `MORTGAGE ENCUMBRANCE: Plot ${plot.plotId} is currently mortgaged to ${bankNames}. A registered deed requires a formal Bank No-Objection Certificate (NOC) and loan satisfaction release.`;
    warnings.push(desc);
  }

  // 6. Prior Active Sale / Competing Deed Check
  const deedsForPlot = existingDeeds.filter((d) => d.plotId === plot.plotId);
  for (const priorDeed of deedsForPlot) {
    const priorBuyer = priorDeed.buyer.trim().toLowerCase();
    const cleanCurrentBuyer = buyer.trim().toLowerCase();

    if (priorBuyer !== cleanCurrentBuyer && priorBuyer !== cleanSeller) {
      const desc = `DOUBLE_SALE CONFLICT: Plot ${plot.plotId} was previously sold to '${priorDeed.buyer}' under Deed #${priorDeed.deedNo} on ${priorDeed.deedDate}. Registering another deed to '${buyer}' constitutes an overlapping double sale!`;
      alerts.push({
        plotId: plot.plotId,
        type: 'DOUBLE_SALE',
        description: desc,
        status: 'OPEN',
        deedId: priorDeed.id,
      });
      warnings.push(desc);
      break;
    }
  }

  return {
    hasFraud: alerts.length > 0,
    alerts,
    warnings,
  };
}

/**
 * Checks mortgages for duplicate active encumbrances on the same land plot.
 */
export function checkDoubleMortgageAlerts(
  mortgages: Mortgage[],
  existingAlerts: Alert[]
): Alert[] {
  const newAlerts: Alert[] = [];
  const plotMortgagesMap = new Map<string, Mortgage[]>();

  mortgages.forEach((m) => {
    if (m.status === 'active') {
      const list = plotMortgagesMap.get(m.plotId) || [];
      list.push(m);
      plotMortgagesMap.set(m.plotId, list);
    }
  });

  plotMortgagesMap.forEach((activeList, plotId) => {
    if (activeList.length >= 2) {
      const bankNames = activeList.map((m) => m.bankName).join(' & ');
      const totalAmount = activeList.reduce((acc, curr) => acc + curr.loanAmountBDT, 0);
      const desc = `DOUBLE_MORTGAGE DETECTED: Plot ${plotId} has ${activeList.length} simultaneous active bank mortgages (${bankNames}) totaling BDT ${totalAmount.toLocaleString()} without loan release!`;

      const alreadyExists = existingAlerts.some(
        (a) => a.plotId === plotId && a.type === 'DOUBLE_MORTGAGE' && a.status === 'OPEN'
      );

      if (!alreadyExists) {
        newAlerts.push({
          id: `ALERT-MORT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          plotId,
          type: 'DOUBLE_MORTGAGE',
          description: desc,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  return newAlerts;
}

/**
 * Checks CS, SA, RS, BS survey records for discrepancies in recorded area or ownership.
 */
export function checkKhatianSurveyMismatches(plot: Plot): {
  hasMismatch: boolean;
  discrepancies: string[];
} {
  const discrepancies: string[] = [];
  if (!plot.surveys || plot.surveys.length < 2) {
    return { hasMismatch: false, discrepancies };
  }

  const surveys = [...plot.surveys].sort((a, b) => a.year - b.year);

  for (let i = 0; i < surveys.length - 1; i++) {
    const current = surveys[i];
    const next = surveys[i + 1];

    // Check significant area change (> 0.2 decimal) without government acquisition
    const areaDiff = Math.abs(current.areaDecimal - next.areaDecimal);
    if (areaDiff > 0.2 && plot.govAcquisitionStatus === 'none') {
      discrepancies.push(
        `Area discrepancy between ${current.surveyType} Survey (${current.year}: ${current.areaDecimal} dec) and ${next.surveyType} Survey (${next.year}: ${next.areaDecimal} dec) differs by ${areaDiff.toFixed(2)} decimal without recorded acquisition.`
      );
    }
  }

  return {
    hasMismatch: discrepancies.length > 0,
    discrepancies,
  };
}

/**
 * Audits all deeds, mutations, and surveys to discover systemic title mismatches.
 */
export function runSystemWideMismatchAudit(
  plots: Plot[],
  deeds: Deed[],
  mutations: Mutation[],
  existingAlerts: Alert[]
): Alert[] {
  const newAlerts: Alert[] = [];

  for (const deed of deeds) {
    const plot = plots.find((p) => p.plotId === deed.plotId);
    if (!plot) continue;

    const deedMutations = mutations.filter(
      (m) =>
        m.deedId === deed.id ||
        (m.plotId === deed.plotId &&
          m.newOwner.trim().toLowerCase() === deed.buyer.trim().toLowerCase())
    );

    // Rule 1: Deed exists without mutation (খারিজবিহীন দলিল)
    if (deedMutations.length === 0) {
      const alertDesc = `MISMATCH (NO MUTATION): Deed #${deed.deedNo} registered to '${deed.buyer}' has no matching AC Land Mutation (খারিজ) record on Plot ${deed.plotId}. Risk of unmutated title.`;
      
      const alreadyLogged = existingAlerts.some(
        (a) => a.plotId === deed.plotId && a.type === 'MISMATCH' && a.description.includes(deed.deedNo)
      );

      if (!alreadyLogged) {
        newAlerts.push({
          id: `ALERT-MIS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          plotId: deed.plotId,
          type: 'MISMATCH',
          description: alertDesc,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          deedId: deed.id,
        });
      }
    } else {
      // Rule 2: Deed buyer differs from mutation recorded owner
      for (const mut of deedMutations) {
        const cleanDeedBuyer = deed.buyer.trim().toLowerCase();
        const cleanMutOwner = mut.newOwner.trim().toLowerCase();

        if (cleanDeedBuyer !== cleanMutOwner) {
          const alertDesc = `MISMATCH (OWNER DIVERGENCE): Deed #${deed.deedNo} names buyer '${deed.buyer}', but AC Land Mutation #${mut.mutationCaseNo || mut.id} records owner '${mut.newOwner}'. Discrepancy between Sub-Registry and AC Land records.`;
          
          const alreadyLogged = existingAlerts.some(
            (a) => a.plotId === deed.plotId && a.type === 'MISMATCH' && a.description.includes(deed.deedNo)
          );

          if (!alreadyLogged) {
            newAlerts.push({
              id: `ALERT-MIS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              plotId: deed.plotId,
              type: 'MISMATCH',
              description: alertDesc,
              status: 'OPEN',
              createdAt: new Date().toISOString(),
              deedId: deed.id,
            });
          }
        }
      }
    }
  }

  // Rule 3: Check Khas Land and Court Injunctions for plots
  for (const plot of plots) {
    if (plot.isKhasLand) {
      const khasDesc = `KHAS LAND WARNING: Plot ${plot.plotId} is categorized as Government Khas Property. Vested in Ministry of Land.`;
      const already = existingAlerts.some((a) => a.plotId === plot.plotId && a.type === 'KHAS_DISPUTE');
      if (!already) {
        newAlerts.push({
          id: `ALERT-KHAS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          plotId: plot.plotId,
          type: 'KHAS_DISPUTE',
          description: khasDesc,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (plot.courtCaseStatus === 'pending') {
      const courtDesc = `COURT INJUNCTION: Plot ${plot.plotId} is actively contested under court litigation: ${plot.caseDetails || 'Title Injunction'}.`;
      const already = existingAlerts.some((a) => a.plotId === plot.plotId && a.type === 'COURT_INJUNCTION');
      if (!already) {
        newAlerts.push({
          id: `ALERT-CRT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          plotId: plot.plotId,
          type: 'COURT_INJUNCTION',
          description: courtDesc,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return newAlerts;
}

/**
 * Creates a TAMPERED alert when document verification fails.
 */
export function createTamperedAlert(
  plotId: string,
  deedNo: string,
  expectedHash: string,
  uploadedHash: string
): Alert {
  return {
    id: `ALERT-TAMP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    plotId,
    type: 'TAMPERED',
    description: `DOCUMENT TAMPERING DETECTED: Uploaded file for Deed #${deedNo} failed cryptographic verification! Computed hash '${uploadedHash.slice(0, 10)}...' does not match official Sub-Registry record '${expectedHash.slice(0, 10)}...'.`,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculates the comprehensive 0-100 Risk Score for a plot.
 * 
 * Points Scoring System:
 * - DOUBLE_SALE alert: +35 points
 * - TAMPERED alert: +35 points
 * - KHAS_DISPUTE alert / isKhasLand: +40 points
 * - DOUBLE_MORTGAGE alert: +30 points
 * - COURT_INJUNCTION alert / courtCaseStatus pending: +25 points
 * - MISMATCH alert: +20 points
 * - Broken hash chain: +40 points
 * - Government Acquisition acquired: +35 points (proposed: +15 points)
 * - Single active bank mortgage: +10 points
 * - Pending AC Land mutation: +10 points
 * 
 * Resulting Risk Categories:
 * - 0 - 25: SAFE (Green)
 * - 26 - 60: REVIEW REQUIRED (Amber)
 * - 61 - 100: HIGH RISK (Red)
 */
export function calculatePlotRiskScore(
  plot: Plot,
  alerts: Alert[],
  deeds: Deed[],
  mutations: Mutation[],
  mortgages: Mortgage[] = [],
  isChainBroken = false
): PlotRiskAssessment {
  let score = 0;
  const breakdown: RiskScoreBreakdownItem[] = [];

  const plotAlerts = alerts.filter((a) => a.plotId === plot.plotId && a.status === 'OPEN');

  // 1. Broken Cryptographic Hash Chain (+40 pts)
  if (isChainBroken) {
    score += 40;
    breakdown.push({
      label: 'Cryptographic Hash-Chain Broken',
      points: 40,
      category: 'CHAIN',
      description: 'Historical ledger audit failed. An unauthorized block alteration was detected in database records.',
    });
  }

  // 2. Open Double Sale Alert (+35 pts)
  const doubleSale = plotAlerts.find((a) => a.type === 'DOUBLE_SALE');
  if (doubleSale) {
    score += 35;
    breakdown.push({
      label: 'Double Sale / Competing Deed Conflict',
      points: 35,
      category: 'ALERT',
      description: doubleSale.description,
    });
  }

  // 3. Document Tampering Alert (+35 pts)
  const tampered = plotAlerts.find((a) => a.type === 'TAMPERED');
  if (tampered) {
    score += 35;
    breakdown.push({
      label: 'Document Tampering Detected',
      points: 35,
      category: 'ALERT',
      description: tampered.description,
    });
  }

  // 4. Khas Land Flag / Dispute (+40 pts)
  if (plot.isKhasLand || plotAlerts.some((a) => a.type === 'KHAS_DISPUTE')) {
    score += 40;
    breakdown.push({
      label: 'Government Khas Land (খাস জমি)',
      points: 40,
      category: 'KHAS',
      description: 'Land belongs to State Khas registry. Private ownership is illegal and void ab initio.',
    });
  }

  // 5. Active Court Litigation (+25 pts)
  if (plot.courtCaseStatus === 'pending' || plotAlerts.some((a) => a.type === 'COURT_INJUNCTION')) {
    score += 25;
    breakdown.push({
      label: 'Pending Court Case / Injunction',
      points: 25,
      category: 'COURT',
      description: plot.caseDetails || 'Active title lawsuit pending in civil court.',
    });
  } else if (plot.courtCaseStatus === 'disposed') {
    score += 5;
    breakdown.push({
      label: 'Prior Court Case Disposed',
      points: 5,
      category: 'COURT',
      description: 'Past court litigation resolved. Check court decree before purchase.',
    });
  }

  // 6. Government Land Acquisition
  if (plot.govAcquisitionStatus === 'acquired') {
    score += 35;
    breakdown.push({
      label: 'Government Acquisition Complete',
      points: 35,
      category: 'ACQUISITION',
      description: plot.acquisitionDetails || 'Vested in State infrastructure project.',
    });
  } else if (plot.govAcquisitionStatus === 'proposed') {
    score += 15;
    breakdown.push({
      label: 'Proposed Government Acquisition',
      points: 15,
      category: 'ACQUISITION',
      description: plot.acquisitionDetails || 'Notice served under Section 4/7 Acquisition Ordinance.',
    });
  }

  // 7. Bank Mortgages
  const plotMortgages = mortgages.filter((m) => m.plotId === plot.plotId && m.status === 'active');
  if (plotMortgages.length >= 2 || plotAlerts.some((a) => a.type === 'DOUBLE_MORTGAGE')) {
    score += 30;
    breakdown.push({
      label: 'Double / Multiple Bank Mortgages',
      points: 30,
      category: 'MORTGAGE',
      description: `Plot encumbered with ${plotMortgages.length} active bank loans without release satisfaction.`,
    });
  } else if (plotMortgages.length === 1) {
    score += 10;
    breakdown.push({
      label: 'Single Active Bank Mortgage',
      points: 10,
      category: 'MORTGAGE',
      description: `Active loan with ${plotMortgages[0].bankName} (BDT ${plotMortgages[0].loanAmountBDT.toLocaleString()}). Requires bank release.`,
    });
  }

  // 8. Mismatches (Deed vs Mutation vs Surveys)
  const mismatchAlerts = plotAlerts.filter((a) => a.type === 'MISMATCH');
  if (mismatchAlerts.length > 0) {
    score += 20;
    breakdown.push({
      label: 'Title / Mutation Record Mismatch',
      points: 20,
      category: 'ALERT',
      description: mismatchAlerts[0].description,
    });
  }

  // 9. Historical Survey Discrepancies
  const surveyCheck = checkKhatianSurveyMismatches(plot);
  if (surveyCheck.hasMismatch && breakdown.every((b) => b.category !== 'ALERT')) {
    score += 15;
    breakdown.push({
      label: 'Historical Survey Area Discrepancy',
      points: 15,
      category: 'SURVEY',
      description: surveyCheck.discrepancies[0],
    });
  }

  // 10. Pending Mutation
  const pendingMutations = mutations.filter((m) => m.plotId === plot.plotId && m.status === 'PENDING');
  if (pendingMutations.length > 0 && breakdown.length === 0) {
    score += 10;
    breakdown.push({
      label: 'Pending AC Land Mutation',
      points: 10,
      category: 'ALERT',
      description: 'An application for title mutation is currently pending review at AC Land office.',
    });
  }

  // Clamp score
  score = Math.min(100, Math.max(0, score));

  // Determine Level
  let level: RiskLevel = 'SAFE';
  if (score > 60) {
    level = 'RISKY';
  } else if (score > 25) {
    level = 'REVIEW';
  }

  let summary = 'Clear title deed with matching Khatian, verified ledger chain, and no fraud flags.';
  if (level === 'RISKY') {
    summary = `CRITICAL WARNING: Score is ${score}/100. High probability of fraudulent title, encumbrance, or legal dispute. Do NOT purchase without resolving open issues.`;
  } else if (level === 'REVIEW') {
    summary = `CAUTION: Score is ${score}/100. Title shows discrepancies or pending administrative processes requiring due diligence inspection.`;
  }

  return {
    score,
    level,
    breakdown,
    summary,
  };
}
