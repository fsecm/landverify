import React, { useState } from 'react';
import {
  FilePlus,
  Upload,
  QrCode,
  Download,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  FileText,
  User,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Deed, LedgerEntry, Mutation, Plot, Alert, Language } from '../types';
import { translations } from '../utils/translations';
import { computeFileHash, computeStringHash, formatHashShort } from '../utils/hash';
import { checkDeedFraudPreRegistration } from '../utils/fraud';
import { appendLedgerEntry } from '../utils/ledger';
import { generateQrDataUrl, downloadQrImage } from '../utils/qr';
import { saveStoredAlerts, saveStoredDeeds, saveStoredLedger, exportDeedsToCSV } from '../utils/storage';

interface RegisterDeedProps {
  plots: Plot[];
  deeds: Deed[];
  mutations: Mutation[];
  ledger: LedgerEntry[];
  alerts: Alert[];
  lang: Language;
  onDeedRegistered: (newDeed: Deed, newLedger: LedgerEntry[], newAlerts: Alert[]) => void;
}

export const RegisterDeed: React.FC<RegisterDeedProps> = ({
  plots,
  deeds,
  mutations,
  ledger,
  alerts,
  lang,
  onDeedRegistered,
}) => {
  const t = translations[lang];

  // Form states
  const [plotId, setPlotId] = useState<string>(plots[0]?.plotId || '');
  const [deedNo, setDeedNo] = useState<string>(`DEED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [seller, setSeller] = useState<string>('');
  const [buyer, setBuyer] = useState<string>('');
  const [deedDate, setDeedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContentText, setFileContentText] = useState<string>('');

  // Processing & result states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fraudWarnings, setFraudWarnings] = useState<string[]>([]);
  const [createdDeed, setCreatedDeed] = useState<Deed | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [registrySearch, setRegistrySearch] = useState<string>('');

  // Selected plot details
  const selectedPlot = plots.find((p) => p.plotId === plotId);

  // Auto-fill seller with current owner on plot selection
  const handleSelectPlot = (id: string) => {
    setPlotId(id);
    const p = plots.find((item) => item.plotId === id);
    if (p) {
      setSeller(p.currentOwner);
    }
  };

  // Quick fill sample deed file in browser
  const handleGenerateSyntheticDeed = () => {
    const p = selectedPlot || plots[0];
    const generatedContent = `================================================================================
                    GOVERNMENT OF BANGLADESH - SUB-REGISTRY
                      DEED OF SALE (সাফ কবলা দলিল) - SYNTHETIC PROTOTYPE
================================================================================
Deed Registration No: ${deedNo}
Sub-Registry Office: Mirpur Sub-Registry, Dhaka
Execution Date: ${deedDate}

PLOT PARTICULARS:
- Plot Identification: ${p.plotId}
- District: Dhaka | Upazila: Mirpur | Mouza: ${p.mouza}
- Khatian No: ${p.khatianNo} | Dag No: ${p.dagNo}
- Area: ${p.areaDecimal} Decimal (শতক)

PARTIES:
- First Party (Seller): ${seller || p.currentOwner}
- Second Party (Buyer): ${buyer || 'Farhan Chowdhury (Dummy)'}

CONSIDERATION & TERMS:
Total Consideration: BDT 5,500,000 (Fifty-Five Lakh Taka Only)
Full consideration received. Peaceful possession handed over without encumbrance.

[STAMP & SEAL: SUB-REGISTRAR MIRPUR - OFFICIAL HACKATHON SYNTHETIC DOCUMENT]
================================================================================`;

    setFileContentText(generatedContent);
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const file = new File([blob], `${deedNo}.txt`, { type: 'text/plain' });
    setSelectedFile(file);
    if (!buyer) setBuyer('Farhan Chowdhury (Dummy)');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlot || !deedNo || !seller || !buyer || !selectedFile) {
      alert('Please fill in all required fields and upload or generate a deed file.');
      return;
    }

    setIsProcessing(true);
    setFraudWarnings([]);

    try {
      // 1. Calculate SHA-256 of file bytes via Web Crypto API
      const fileHash = await computeFileHash(selectedFile);

      // 2. Run fraud heuristics BEFORE saving
      const fraudCheck = checkDeedFraudPreRegistration(
        selectedPlot,
        seller,
        buyer,
        deeds,
        mutations
      );

      const newAlertsList: Alert[] = [...alerts];
      if (fraudCheck.hasFraud) {
        setFraudWarnings(fraudCheck.warnings);
        // Create alert records in localStorage
        fraudCheck.alerts.forEach((alertData) => {
          const alertObj: Alert = {
            id: `ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            createdAt: new Date().toISOString(),
            ...alertData,
          };
          newAlertsList.unshift(alertObj);
        });
        saveStoredAlerts(newAlertsList);
      }

      // 3. Create unique QR token
      const qrToken = `LV-DOC-${selectedPlot.plotId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 4. Create Deed record
      const newDeed: Deed = {
        id: `DEED-${Date.now()}`,
        deedNo,
        plotId: selectedPlot.plotId,
        seller,
        buyer,
        deedDate,
        fileName: selectedFile.name,
        fileHash,
        qrToken,
        createdAt: new Date().toISOString(),
        subRegistryOffice: 'Mirpur Sub-Registry',
        considerationAmountBDT: 5000000,
      };

      // 5. Append to hash-chained audit log
      const { newEntry, updatedLedger } = await appendLedgerEntry(
        ledger,
        selectedPlot.plotId,
        newDeed.id,
        'DEED_REGISTERED',
        `Deed ${deedNo} registered from '${seller}' to '${buyer}'`
      );

      // 6. Generate live QR Code containing the qrToken
      const qrUrl = await generateQrDataUrl(qrToken);
      setQrDataUrl(qrUrl);
      setCreatedDeed(newDeed);

      // 7. Save to localStorage
      const updatedDeeds = [newDeed, ...deeds];
      saveStoredDeeds(updatedDeeds);
      saveStoredLedger(updatedLedger);

      // Notify parent app
      onDeedRegistered(newDeed, updatedLedger, newAlertsList);
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Error registering deed. Please check the uploaded file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string, type: 'token' | 'hash') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (qrDataUrl && createdDeed) {
      downloadQrImage(qrDataUrl, `QR_${createdDeed.deedNo}_${createdDeed.plotId}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              {lang === 'bn' ? 'সাব-রেজিস্ট্রার পোর্টাল' : 'Sub-Registry Portal'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Department of Registration, Bangladesh</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {t.register.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t.register.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportDeedsToCSV(deeds)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 transition shadow-2xs shrink-0"
          title="Export all deeds to CSV for offline reporting and auditing"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          <span>{lang === 'bn' ? 'দলিল তালিকা এক্সপোর্ট (CSV)' : 'Export Deeds (CSV)'}</span>
        </button>
      </div>

      {/* Fraud Warning Box if triggered */}
      {fraudWarnings.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500/80 rounded-2xl p-5 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <h3 className="text-base font-extrabold text-red-950 uppercase tracking-wide">
                  {t.register.fraudWarningTitle}
                </h3>
                <p className="text-xs text-red-800 mt-0.5">
                  {t.register.fraudWarningSub}
                </p>
              </div>

              <div className="space-y-1.5 mt-2">
                {fraudWarnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white/90 rounded-xl border border-red-200 text-xs text-red-900 font-semibold flex items-start space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Deed No & Plot ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.register.deedNo} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={deedNo}
                    onChange={(e) => setDeedNo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.register.plotId} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={plotId}
                    onChange={(e) => handleSelectPlot(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {plots.map((p) => (
                      <option key={p.plotId} value={p.plotId}>
                        {p.plotId} - {p.mouza} (Dag: {p.dagNo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Live Plot Information Snapshot */}
            {selectedPlot && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-emerald-800/80 block text-[10px] uppercase font-bold">
                    Official Owner:
                  </span>
                  <span className="font-bold text-emerald-950 truncate block">
                    {selectedPlot.currentOwner}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-[10px] uppercase font-bold">
                    Mouza & Khatian:
                  </span>
                  <span className="font-semibold text-emerald-950 block">
                    {selectedPlot.mouza} ({selectedPlot.khatianNo})
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-[10px] uppercase font-bold">
                    Dag No:
                  </span>
                  <span className="font-semibold text-emerald-950 block">
                    {selectedPlot.dagNo}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-[10px] uppercase font-bold">
                    Area (শতক):
                  </span>
                  <span className="font-bold text-emerald-950 block">
                    {selectedPlot.areaDecimal} Decimal
                  </span>
                </div>
              </div>
            )}

            {/* Seller & Buyer Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.register.seller} <span className="text-red-500">*</span>
                  </label>
                  {selectedPlot && seller !== selectedPlot.currentOwner && (
                    <span className="text-[10px] text-red-600 font-bold">
                      ⚠ Mismatch with recorded owner
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Seller Full Name"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.register.buyer} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Buyer Full Name"
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.register.deedDate} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={deedDate}
                  onChange={(e) => setDeedDate(e.target.value)}
                  className="w-full sm:w-1/2 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* File Upload / Generation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.register.fileUpload} <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSyntheticDeed}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Test Deed In Browser</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 sm:p-6 text-center transition bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="file"
                  id="deed-file-upload"
                  accept=".pdf,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="deed-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedFile ? (
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      'Click to upload Deed file (PDF, TXT, Image)'
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {t.register.fileHelp}
                  </p>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <FilePlus className="w-4 h-4" />
                <span>
                  {isProcessing ? 'Computing SHA-256 & Linking Chain...' : t.register.submitBtn}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Result & QR Output */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
          {createdDeed && qrDataUrl ? (
            <div className="w-full space-y-4 animate-in fade-in duration-200">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <Check className="w-3.5 h-3.5" />
                <span>{t.register.successTitle}</span>
              </div>

              {/* QR Code image */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto">
                <img
                  src={qrDataUrl}
                  alt="Deed QR Token"
                  className="w-44 h-44 mx-auto rounded-lg"
                />
              </div>

              {/* QR Token with copy */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-bold">{t.register.qrToken}</span>
                  <button
                    onClick={() => handleCopy(createdDeed.qrToken, 'token')}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                  >
                    {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs font-bold text-slate-900 truncate">
                  {createdDeed.qrToken}
                </div>
              </div>

              {/* SHA-256 Hash with copy */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-bold">{t.register.fileHash}</span>
                  <button
                    onClick={() => handleCopy(createdDeed.fileHash, 'hash')}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                  >
                    {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-emerald-900 break-all bg-white p-2 rounded-lg border">
                  {createdDeed.fileHash}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={handleDownloadQr}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.register.downloadQr}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 space-y-3 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <QrCode className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                QR & Hash Preview
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Fill the deed form on the left and submit. The cryptographic token, SHA-256 hash, and QR code will generate here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Registry Official Deeds Record Table with CSV Export */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'সাব-রেজিস্ট্রি দলিল রেজিস্টার' : 'Sub-Registry Official Deeds Record'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {deeds.length} {lang === 'bn' ? 'টি দলিল' : 'Deeds'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'অফিসারদের অফলাইন রিপোর্টিং এবং বিশ্লেষণের জন্য দলিল তালিকা CSV ফরম্যাটে ডাউনলোড করুন।'
                : 'Official ledger entries with cryptographic fingerprints. Export for offline analysis or departmental reporting.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => exportDeedsToCSV(deeds)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
              title="Download entire deeds list as CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'CSV ডাউনলোড' : 'Export Deeds CSV'}</span>
            </button>
          </div>
        </div>

        {/* Search bar inside registry */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'দলিল নং, প্লট, বা ক্রেতা খুঁজুন...' : 'Search by Deed No, Plot, Buyer, or Seller...'}
              value={registrySearch}
              onChange={(e) => setRegistrySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {registrySearch.trim() && (
            <button
              onClick={() => {
                const filtered = deeds.filter((d) => {
                  const q = registrySearch.toLowerCase();
                  return (
                    d.deedNo.toLowerCase().includes(q) ||
                    d.plotId.toLowerCase().includes(q) ||
                    d.seller.toLowerCase().includes(q) ||
                    d.buyer.toLowerCase().includes(q)
                  );
                });
                exportDeedsToCSV(filtered, `landverify_deeds_filtered_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline shrink-0"
            >
              {lang === 'bn' ? 'ফিল্টার করা ফলাফল CSV এক্সপোর্ট' : 'Export Filtered CSV'}
            </button>
          )}
        </div>

        {/* Deeds Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-bold">Deed No</th>
                <th className="py-2.5 px-3 font-bold">Plot ID</th>
                <th className="py-2.5 px-3 font-bold">Seller</th>
                <th className="py-2.5 px-3 font-bold">Buyer</th>
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">SHA-256 Hash</th>
                <th className="py-2.5 px-3 font-bold">QR Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deeds
                .filter((d) => {
                  if (!registrySearch.trim()) return true;
                  const q = registrySearch.toLowerCase();
                  return (
                    d.deedNo.toLowerCase().includes(q) ||
                    d.plotId.toLowerCase().includes(q) ||
                    d.seller.toLowerCase().includes(q) ||
                    d.buyer.toLowerCase().includes(q)
                  );
                })
                .map((deed) => (
                  <tr key={deed.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900">
                      {deed.deedNo}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-800">
                      {deed.plotId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{deed.seller}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">{deed.buyer}</td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{deed.deedDate}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {formatHashShort(deed.fileHash, 6, 6)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700 font-semibold">
                      {deed.qrToken}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
