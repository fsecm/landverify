# LandVerify - Bangladesh Land Deed Verification & Fraud Detection Prototype

> **CRITICAL DISCLAIMER: PROTOTYPE WITH SYNTHETIC DATA ONLY.**  
> All citizen names, National ID (NID) numbers, Khatians, Dags, and deed records contained within this project are **100% synthetic dummy data** generated solely for hackathon demonstration. No real government databases or personal records are utilized.

---

## 🇧🇩 Problem Statement & Hackathon Vision
In Bangladesh, land litigation accounts for over **70% of all civil court cases**. Common fraudulent activities include:
1. **Double / Overlapping Sales:** Sellers deed the same land to multiple unsuspecting buyers before mutation records update.
2. **Forged / Tampered Deeds (জাল দলিল):** Modification of land area or buyer names on paper deeds.
3. **Registry-Mutation Desynchronization:** Sub-Registry offices (Ministry of Law) and Assistant Commissioner Land / AC Land offices (Ministry of Land) operating in informational silos.
4. **Double Mortgages & Hidden Bank Liens:** Borrowers pledging the same land deed to multiple commercial banks simultaneously.
5. **Encroachment on State Khas (খাস জমি) & Acquired Land:** Attempted private conveyance of state-owned properties or plots under court injunction.
6. **Cadastral Survey Discrepancies:** Unexplained land area inflation or owner alterations across historical surveys (CS ➔ SA ➔ RS ➔ BS).

**LandVerify** introduces a sovereign, zero-gas-fee, cryptographic verification and due diligence layer designed for Bangladesh e-governance:
- **Client-Side SHA-256 Fingerprinting:** Native browser Web Crypto API guarantees bit-for-bit document integrity without transmitting sensitive documents to external servers.
- **Hash-Chained Audit Log:** Mathematical proof of ownership sequence (tamper-evident like Git or Certificate Transparency).
- **Automated Title Fraud Barrier:** Intercepts unauthorized sellers, duplicate buyers, unmutated land deeds, and state khas land violations.
- **0–100 Citizen Risk Score:** Multi-factor due diligence rating explaining legal, mortgage, survey, and chain risks in plain language.

---

## 🚀 Key Modules & Pages

### 1. Dashboard (`/`)
- Real-time counts: **Total Plots** (30 demo plots across 4 mouzas), **Total Deeds**, **Verified Deeds**, **Open Fraud Alerts**, and **Review Required**.
- Interactive **Bar Chart** powered by Recharts categorizing alerts across all 6 fraud types:
  - `DOUBLE_SALE` (দ্বৈত বিক্রয়)
  - `MISMATCH` (তথ্য অমিল)
  - `TAMPERED` (জাল দলিল)
  - `DOUBLE_MORTGAGE` (দ্বৈত বন্ধকী)
  - `KHAS_DISPUTE` (খাস জমি)
  - `COURT_INJUNCTION` (আদালতের মামলা)
- **JSON Export & Import:** Full system snapshot export (`Export JSON`) and one-click restore (`Import JSON`) for judges and auditor verification.
- **CSV Export:** Instant download of registered deeds list for offline spreadsheet analysis.
- **Instant Demo Story Shortcuts:** Jump straight to planted test scenarios.

### 2. Register Deed (Sub-Registry Officer Portal)
- Formal entry for Deed Number, Plot ID, Seller Name, Buyer Name, Deed Date, and Deed Document upload.
- Selecting a plot automatically retrieves the legal owner from Khatian records.
- **Automated Fraud Barrier:** Pre-registration checks flag violations (e.g. seller is not the recorded owner, or plot is government khas land) before registration is committed.
- Computes **SHA-256** hash, generates a unique **QR Token**, and creates a downloadable high-resolution **QR Code**.
- Automatically appends a new block to the plot's cryptographic ledger.
- Full searchable deeds register with CSV download.

### 3. Verify Document (Public Citizen Portal)
- Enter/paste QR Token and upload a signed deed document (PDF, TXT, or Image).
- Computes SHA-256 of uploaded bytes and compares with the registered hash:
  - **GREEN "AUTHENTIC":** Bit-for-bit 100% match. Confetti celebration!
  - **RED "TAMPERED":** Hashes differ. Side-by-side hash comparison highlighting mismatched characters. Automatically logs a `TAMPERED` alert.
  - **GRAY "NOT FOUND":** Token does not exist in registry.
- **Printable A4 Verification Certificate:** One-click generation of an official verification certificate with `@media print` styling, cryptographic QR, and disclaimer watermark.
- Quick buttons to test authentic and pre-tampered sample files in 1 click.

### 4. Plot Check ("Check Before You Buy" / Citizen Due Diligence)
- Search any Plot ID to view:
  - **Richer Plot Metadata:** Division, District, Upazila, Mouza, Land Type (agricultural, residential, commercial, pond), Area in decimals (শতক), Khas Land status, Government Acquisition status, and Court Case status.
  - **0–100 Dynamic Risk Score Gauge:** Color-coded severity (Safe 0-24, Review 25-59, Risky 60-100).
  - **"Why this score?" Breakdown:** Clear itemized list of point additions for open alerts, court cases, khas land, double mortgages, broken hash chains, and survey discrepancies.
  - **Cadastral Survey Comparison (CS • SA • RS • BS):** Historical survey table detecting area inflation and unrecorded owner transfers across surveys.
  - **Bank Mortgage Lien Status:** Details of active vs released bank loans.
  - Registered deed records and AC Land mutation orders.

### 5. Bank Check (Bank Mortgage Module)
- Financial institutional portal for banks, non-banking financial institutions (NBFIs), and sub-registrars.
- Search and filter registered mortgages by status (`active` or `released`).
- **Automated Double Mortgage Detection:** Automatically detects if a plot has 2 or more active bank loans and raises a `DOUBLE_MORTGAGE` alert.
- Register new synthetic mortgage liens or release satisfied loans.

### 6. Ownership Timeline & Hash-Chain Audit
- Vertical timeline of all events (deed registration, mutation orders, mortgage liens, fraud alerts).
- Live verification banner: **"Chain valid ✔"** or **"Chain broken ✘"**.
- **"Simulate Tampering" button:** Secretly modifies an older database record in `localStorage` to demonstrate how the cryptographic audit algorithm instantly catches the tampered block and reveals the discrepancy!
- One-click restore to recompute and re-verify integrity.

### 7. System Activity Log
- Comprehensive chronological journal tracking every action: deed registrations, public verifications, tamper detections, alert resolutions, mortgage updates, and data imports.
- Filterable by actor role (`Sub-Registrar`, `Public Citizen`, `Bank Officer`, `AC Land Officer`, `System Auditor`) and status.

### 8. Fraud & Review Queue (Sub-Registrar & AC Land Triage)
- Centralized triage table of all flagged alerts.
- Filter by status (`OPEN`, `APPROVED`, `REJECTED`) and alert category.
- Actions: **Approve Title**, **Reject / Freeze Title**, or **Re-Open**.
- **Run System Audit Scan:** Scans entire database for missing mutations or divergent owners.

### 9. Global Search & Guided Demo Tour
- **Global Search:** Fast search modal across plots, deeds, owner names, and mouzas with instant jump navigation.
- **Guided Demo Tour:** Step-by-step interactive walk-through guiding hackathon judges through the complete 7-step story with auto-navigation.

---

## 🔒 How Cryptographic Verification & Hash-Chaining Work

### 1. Web Crypto API SHA-256 Document Verification
- When a deed document is registered or uploaded for verification, the browser reads the raw bytes using `crypto.subtle.digest('SHA-256', buffer)`.
- Because cryptographic hash functions possess the **Avalanche Effect**, altering even a single whitespace or punctuation mark completely scrambles all 256 bits of the resulting hexadecimal hash string.
- The document file never leaves the client browser, preserving citizen privacy and avoiding massive server storage overhead.

### 2. Hash-Chained Audit Log vs Blockchain
- **What it is:** A cryptographically linked ledger where each record contains:
  ```
  recordHash = SHA-256(prevHash + plotId + deedId + eventType + createdAt)
  ```
- The initial entry for any plot uses `prevHash = "GENESIS"`.
- **Why NOT a blockchain?**
  - **Zero Gas Fees / Energy Waste:** No proof-of-work mining or volatile crypto-tokens.
  - **Instant Verification:** The browser verifies the entire sequence of hundreds of blocks in less than 2 milliseconds.
  - **Tamper Evidence:** If an unauthorized database administrator attempts to edit an old record, every subsequent block's `prevHash` breaks immediately.

---

## 🧪 Planted Demo Cases for Hackathon Judges

When you click **"Load Demo Data"**, 30 synthetic plots across 4 Mouzas (*Senpara Parbata*, *Savar Cantonment*, *Amin Bazar*, *Dhanmondi R/A*) are initialized with these planted test cases:

1. **Plot `DHK-MIR-004` (DOUBLE_SALE):**
   - The plot is registered under Rafiqul Islam.
   - Sold to Anisur Rahman, then re-sold to Kabir Hossain without an approved title transfer.
   - Flagged with a critical `DOUBLE_SALE` alert.
2. **Plot `DHK-SAV-016` (DOUBLE_MORTGAGE):**
   - Active loan of BDT 4,500,000 at Sonar Bangla Bank.
   - Second active mortgage of BDT 6,000,000 registered at Dhaka National Bank without releasing the first lien.
   - Flagged with a `DOUBLE_MORTGAGE` alert and reflected on the Plot Check Risk Gauge.
3. **Plot `DHK-AMN-018` (KHAS LAND VIOLATION):**
   - Flagged as Government Vested Khas Land (`isKhasLand: true`).
   - Private sale attempts trigger immediate block in the pre-registration fraud barrier.
4. **Plot `DHK-DHN-022` (COURT INJUNCTION):**
   - Subject to pending civil Title Suit 41/2025 at Joint District Judge Court.
   - Risk score penalized with active injunction warning.
5. **Plot `DHK-AMN-025` (GOVERNMENT ACQUIRED):**
   - Formally acquired by the state for the Dhaka Metro Extension Project.
6. **Plot `DHK-MIR-029` (SURVEY MISMATCH):**
   - Area unexplainedly inflated from 5.20 decimal in CS/SA to 8.40 decimal in RS/BS without recorded transfer or settlement deed.
7. **Plot `DHK-MIR-001` (Clean Sample & Tampering Test):**
   - Authentic Sample Deed ➔ Result: **AUTHENTIC** (with downloadable A4 certificate).
   - Tampered Sample Deed (area modified from 6.50 to 9.50) ➔ Result: **TAMPERED** (with side-by-side hash diff).

---

## 🛠️ Tech Stack & Architecture
- **Framework:** React 19 + TypeScript (Vite)
- **Styling:** Tailwind CSS (Government Emerald, Navy, and Slate palette)
- **Icons:** Lucide React
- **Visuals & Charts:** Recharts
- **Cryptography:** Native browser Web Crypto API (`window.crypto.subtle`)
- **QR Engine:** `qrcode`
- **Data Persistence:** Client-side `localStorage` (100% offline-first capable)
- **Bilingual:** English and বাংলা (Bengali) terminology

---

## 🏃 Running the Application

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Visit `http://localhost:3000` to interact with the prototype.
