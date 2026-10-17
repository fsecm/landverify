/**
 * Core Data Models for LandVerify
 * E-Governance Land Deed Verification & Fraud Detection Prototype
 * Extended with rich plot metadata, historical surveys, bank mortgages, and activity logs.
 */

export type LandType = 'agricultural' | 'residential' | 'commercial' | 'pond';
export type KhatianType = 'CS' | 'SA' | 'RS' | 'BS';
export type GovAcquisitionStatus = 'none' | 'proposed' | 'acquired';
export type CourtCaseStatus = 'none' | 'pending' | 'disposed';

/**
 * Historical Survey Record (Cadastral / State Acquisition / Revisional / City Surveys)
 */
export interface SurveyRecord {
  surveyType: KhatianType;
  year: number;
  recordedOwner: string;
  areaDecimal: number;
  khatianNo: string;
  dagNo: string;
  notes?: string;
}

export interface Plot {
  plotId: string;               // e.g. DHK-MIR-001, DHK-SAV-002
  division: string;             // e.g. Dhaka
  district: string;             // e.g. Dhaka
  upazila: string;              // e.g. Mirpur, Savar, Dhanmondi, Amin Bazar
  mouza: string;                // e.g. Senpara Parbata, Paikpara, Savar Cantonment, Amin Bazar
  khatianType: KhatianType;     // CS, SA, RS, BS
  khatianNo: string;            // e.g. RS-4102
  dagNo: string;                // e.g. 5042
  landType: LandType;           // agricultural, residential, commercial, pond
  areaDecimal: number;          // Land area in decimal (শতক)
  currentOwner: string;         // Registered owner (synthetic dummy name)
  isKhasLand: boolean;          // true if government vested / khas land (খাস জমি)
  govAcquisitionStatus: GovAcquisitionStatus; // none, proposed, acquired (সরকারি অধিগ্রহণ)
  courtCaseStatus: CourtCaseStatus;           // none, pending, disposed (আদালতের মামলা)
  caseDetails?: string;         // e.g. "Title Suit 41/2025 at Joint District Judge Court"
  acquisitionDetails?: string;  // e.g. "Proposed for Dhaka Metro Extension Project"
  surveys?: SurveyRecord[];     // Historical CS/SA/RS/BS survey records
}

export interface Deed {
  id: string;
  deedNo: string;               // e.g. DEED-2026-0841
  plotId: string;
  seller: string;
  buyer: string;
  deedDate: string;             // YYYY-MM-DD
  fileName: string;
  fileHash: string;             // SHA-256 hash of deed document
  qrToken: string;              // Unique token encoded in QR code (e.g. LV-DOC-...)
  createdAt: string;            // ISO timestamp
  subRegistryOffice?: string;   // e.g. Mirpur Sub-Registry Office
  considerationAmountBDT?: number; // e.g. 4,500,000 BDT
  // Digital Signature (simulated PKI via Web Crypto ECDSA P-256)
  signature?: string;           // Hex-encoded ECDSA P-256 digital signature of deed hash
  signerRole?: string;          // e.g. "Sub-Registrar (Savar)", "Sub-Registrar (Mirpur)"
  signerPublicKey?: string;     // Exported public key in JSON Web Key (JWK) string format
  keyAlgorithm?: string;        // e.g. "ECDSA P-256 / SHA-256"
  signatureValid?: boolean;
}

export type MutationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Mutation {
  id: string;
  plotId: string;
  deedId: string;
  newOwner: string;
  status: MutationStatus;
  date: string;
  mutationCaseNo?: string;      // e.g. MUT-2026-114
  acLandOffice?: string;
  // E-Mutation Workflow pipeline
  stage?: MutationStage;        // SUBMITTED | UNDER_REVIEW | HEARING | APPROVED | REJECTED
  applicantName?: string;       // Name of citizen applying for mutation
  hearingDate?: string;         // YYYY-MM-DD
  remarks?: string;
  history?: MutationHistoryEntry[];
  isDivergentApplicant?: boolean; // Flagged if applicant does not match deed buyer
}

export interface LedgerEntry {
  id: string;
  plotId: string;
  deedId: string;
  eventType: 'DEED_REGISTERED' | 'MUTATION_APPROVED' | 'OWNERSHIP_TRANSFERRED' | 'ALERT_FLAGGED' | 'MORTGAGE_REGISTERED';
  prevHash: string;             // "GENESIS" for the first entry
  recordHash: string;           // SHA-256(prevHash + plotId + deedId + eventType + createdAt)
  createdAt: string;            // ISO timestamp
  note?: string;
}

export type AlertType = 
  | 'DOUBLE_SALE' 
  | 'MISMATCH' 
  | 'TAMPERED' 
  | 'DOUBLE_MORTGAGE' 
  | 'KHAS_DISPUTE' 
  | 'COURT_INJUNCTION';

export type AlertStatus = 'OPEN' | 'APPROVED' | 'REJECTED';

export interface Alert {
  id: string;
  plotId: string;
  type: AlertType;
  description: string;
  status: AlertStatus;
  createdAt: string;
  deedId?: string;
}

export type MortgageStatus = 'active' | 'released';

export interface Mortgage {
  id: string;
  plotId: string;
  bankName: string;             // Synthetic bank name e.g. "Sonar Bangla Bank (Dummy)"
  loanAmountBDT: number;        // e.g. 5,000,000 BDT
  mortgageDate: string;         // YYYY-MM-DD
  status: MortgageStatus;       // active or released
  branch?: string;              // e.g. "Mirpur Branch"
  mortgageDeedNo?: string;      // e.g. "MORT-2026-081"
  registeredAt: string;         // ISO timestamp
}

export type UserRole = 'sub_registrar' | 'ac_land' | 'bank_officer' | 'citizen' | 'admin';

export type PageId =
  | 'dashboard'
  | 'register'
  | 'verify'
  | 'plotCheck'
  | 'timeline'
  | 'bankCheck'
  | 'mutationQueue'
  | 'alerts'
  | 'compare'
  | 'analytics'
  | 'activityLog'
  | 'howItWorks'
  | 'architecture'
  | 'security'
  | 'systemHealth';

export type MutationStage = 'SUBMITTED' | 'UNDER_REVIEW' | 'HEARING' | 'APPROVED' | 'REJECTED';

export interface MutationHistoryEntry {
  stage: MutationStage;
  timestamp: string;
  note: string;
  actor: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actionType:
    | 'DEED_REGISTERED'
    | 'VERIFICATION_ATTEMPTED'
    | 'TAMPER_SIMULATED'
    | 'CHAIN_RESTORED'
    | 'ALERT_APPROVED'
    | 'ALERT_REJECTED'
    | 'ALERT_REOPENED'
    | 'MORTGAGE_CREATED'
    | 'MORTGAGE_RELEASED'
    | 'MUTATION_ADVANCED'
    | 'MUTATION_APPROVED'
    | 'MUTATION_REJECTED'
    | 'DOCUMENT_COMPARED'
    | 'WEIGHTS_UPDATED'
    | 'DATA_IMPORTED'
    | 'DATA_RESET'
    | 'DEMO_SEEDED';
  actorRole: 'Sub-Registrar' | 'Public Citizen' | 'Bank Officer' | 'AC Land Officer' | 'System Auditor';
  title: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO';
  plotId?: string;
  deedId?: string;
}

export type RiskLevel = 'SAFE' | 'REVIEW' | 'RISKY';

export interface RiskScoreBreakdownItem {
  label: string;
  points: number;
  category: 'ALERT' | 'COURT' | 'KHAS' | 'ACQUISITION' | 'MORTGAGE' | 'CHAIN' | 'SURVEY';
  description: string;
}

export interface PlotRiskAssessment {
  score: number;                // 0 to 100
  level: RiskLevel;
  breakdown: RiskScoreBreakdownItem[];
  summary: string;
}

export interface RiskEngineWeights {
  openAlert: number;
  doubleSale: number;
  khasDispute: number;
  courtInjunction: number;
  doubleMortgage: number;
  surveyMismatch: number;
  activeCourtCase: number;
  khasLand: number;
  govAcquisition: number;
  brokenHashChain: number;
}

export type Language = 'en' | 'bn';

