/**
 * LandVerify - Bangladesh Land Deed Verification & Fraud Detection
 * E-Governance Hackathon Prototype
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { DemoBanner } from './components/DemoBanner';
import { SampleDeedsModal } from './components/SampleDeedsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { GuidedDemoModal } from './components/GuidedDemoModal';

import { Dashboard } from './pages/Dashboard';
import { RegisterDeed } from './pages/RegisterDeed';
import { VerifyDocument } from './pages/VerifyDocument';
import { PlotCheck } from './pages/PlotCheck';
import { OwnershipTimeline } from './pages/OwnershipTimeline';
import { AlertsQueue } from './pages/AlertsQueue';
import { BankCheck } from './pages/BankCheck';
import { ActivityLog } from './pages/ActivityLog';

import {
  Alert,
  Deed,
  LedgerEntry,
  Mutation,
  Plot,
  Mortgage,
  ActivityLogItem,
  Language,
} from './types';
import {
  initializeDataIfEmpty,
  seedDemoData,
  resetAllData,
  getVerifiedCount,
  getStoredLanguage,
  saveStoredLanguage,
} from './utils/storage';
import { getStoredActivities } from './utils/activity';
import { translations } from './utils/translations';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Core application data in state
  const [plots, setPlots] = useState<Plot[]>([]);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);

  // Contextual routing extras (e.g. pre-selected plotId or token when navigating)
  const [navigationExtra, setNavigationExtra] = useState<{
    plotId?: string;
    token?: string;
  }>({});

  // Initialize data on mount
  useEffect(() => {
    const savedLang = getStoredLanguage();
    setLang(savedLang);

    const loadInitial = async () => {
      setIsSeeding(true);
      const data = await initializeDataIfEmpty();
      setPlots(data.plots);
      setDeeds(data.deeds);
      setMutations(data.mutations);
      setMortgages(data.mortgages || []);
      setLedger(data.ledger);
      setAlerts(data.alerts);
      setActivities(getStoredActivities());
      setVerifiedCount(getVerifiedCount());
      setIsSeeding(false);
    };

    loadInitial();
  }, []);

  // Language toggle
  const handleToggleLang = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    saveStoredLanguage(nextLang);
  };

  // Seed demo data handler
  const handleLoadDemo = async () => {
    setIsSeeding(true);
    const data = await seedDemoData();
    setPlots(data.plots);
    setDeeds(data.deeds);
    setMutations(data.mutations);
    setMortgages(data.mortgages || []);
    setLedger(data.ledger);
    setAlerts(data.alerts);
    setActivities(getStoredActivities());
    setVerifiedCount(getVerifiedCount());
    setIsSeeding(false);
  };

  // Reset data handler
  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all data and re-seed clean prototype state?')) {
      resetAllData();
      await handleLoadDemo();
    }
  };

  // Navigation handler
  const handleNavigate = (page: PageId, extra?: { plotId?: string; token?: string }) => {
    setCurrentPage(page);
    if (extra) {
      setNavigationExtra(extra);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Deed registered callback
  const handleDeedRegistered = (
    newDeed: Deed,
    updatedLedger: LedgerEntry[],
    updatedAlerts: Alert[]
  ) => {
    setDeeds((prev) => [newDeed, ...prev]);
    setLedger(updatedLedger);
    setAlerts(updatedAlerts);
    setActivities(getStoredActivities());
  };

  // Alerts updated callback
  const handleAlertsUpdated = (updatedAlerts: Alert[]) => {
    setAlerts(updatedAlerts);
    setActivities(getStoredActivities());
  };

  // Ledger updated callback
  const handleLedgerUpdated = (updatedLedger: LedgerEntry[]) => {
    setLedger(updatedLedger);
    setActivities(getStoredActivities());
  };

  // Data imported from JSON callback
  const handleDataImported = (imported: {
    plots: Plot[];
    deeds: Deed[];
    mutations: Mutation[];
    mortgages: Mortgage[];
    ledger: LedgerEntry[];
    alerts: Alert[];
  }) => {
    setPlots(imported.plots);
    setDeeds(imported.deeds);
    setMutations(imported.mutations);
    setMortgages(imported.mortgages || []);
    setLedger(imported.ledger);
    setAlerts(imported.alerts);
    setActivities(getStoredActivities());
    setVerifiedCount(getVerifiedCount());
  };

  const openAlertsCount = alerts.filter((a) => a.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans flex flex-col">
      {/* 1. Synthetic Prototype Visible Warning Banner */}
      <DemoBanner
        lang={lang}
        onOpenSampleModal={() => setIsSampleModalOpen(true)}
      />

      <div className="flex-1 flex flex-row">
        {/* 2. Left Sidebar Navigation */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={handleNavigate}
          openAlertsCount={openAlertsCount}
          lang={lang}
          onToggleLang={handleToggleLang}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          onOpenSampleModal={() => setIsSampleModalOpen(true)}
        />

        {/* 3. Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
          {/* Top Header */}
          <Header
            currentPage={currentPage}
            onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
            lang={lang}
            onToggleLang={handleToggleLang}
            onLoadDemo={handleLoadDemo}
            onResetData={handleResetData}
            onOpenSampleModal={() => setIsSampleModalOpen(true)}
            onOpenSearchModal={() => setIsSearchModalOpen(true)}
            onOpenDemoTour={() => setIsGuidedDemoOpen(true)}
            isSeeding={isSeeding}
          />

          {/* Page Routing */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentPage === 'dashboard' && (
              <Dashboard
                plots={plots}
                deeds={deeds}
                mutations={mutations}
                ledger={ledger}
                alerts={alerts}
                verifiedCount={verifiedCount}
                lang={lang}
                onNavigate={handleNavigate}
                onLoadDemo={handleLoadDemo}
                onResetData={handleResetData}
                onOpenSampleModal={() => setIsSampleModalOpen(true)}
                onDataImported={handleDataImported}
                isSeeding={isSeeding}
              />
            )}

            {currentPage === 'register' && (
              <RegisterDeed
                plots={plots}
                deeds={deeds}
                mutations={mutations}
                ledger={ledger}
                alerts={alerts}
                lang={lang}
                onDeedRegistered={handleDeedRegistered}
              />
            )}

            {currentPage === 'verify' && (
              <VerifyDocument
                deeds={deeds}
                alerts={alerts}
                plots={plots}
                lang={lang}
                onAlertCreated={handleAlertsUpdated}
                onOpenSampleModal={() => setIsSampleModalOpen(true)}
                initialToken={navigationExtra.token}
              />
            )}

            {currentPage === 'plotCheck' && (
              <PlotCheck
                plots={plots}
                deeds={deeds}
                mutations={mutations}
                mortgages={mortgages}
                alerts={alerts}
                lang={lang}
                onNavigate={handleNavigate}
                initialPlotId={navigationExtra.plotId}
              />
            )}

            {currentPage === 'timeline' && (
              <OwnershipTimeline
                plots={plots}
                ledger={ledger}
                lang={lang}
                onLedgerUpdated={handleLedgerUpdated}
                onRestoreData={handleLoadDemo}
                initialPlotId={navigationExtra.plotId}
              />
            )}

            {currentPage === 'bankCheck' && (
              <BankCheck
                mortgages={mortgages}
                plots={plots}
                alerts={alerts}
                lang={lang}
                onMortgagesUpdated={(updatedMortgages, updatedAlerts) => {
                  setMortgages(updatedMortgages);
                  setAlerts(updatedAlerts);
                  setActivities(getStoredActivities());
                }}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'activityLog' && (
              <ActivityLog
                activities={activities}
                lang={lang}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'alerts' && (
              <AlertsQueue
                alerts={alerts}
                plots={plots}
                deeds={deeds}
                mutations={mutations}
                lang={lang}
                onAlertsUpdated={handleAlertsUpdated}
                onNavigate={handleNavigate}
              />
            )}
          </main>

          {/* Footer with synthetic data declaration */}
          <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
            <div className="max-w-5xl mx-auto space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2 font-medium text-slate-600">
                <span>LandVerify e-Governance Hackathon Prototype</span>
                <span>•</span>
                <span>Sub-Registry & AC Land Cryptographic Verification</span>
                <span>•</span>
                <span className="font-mono text-emerald-800">SHA-256 Web Crypto</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {translations[lang].common.disclaimer}
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* 4. Sample Deeds & Test Kit Modal */}
      <SampleDeedsModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        lang={lang}
      />

      {/* 5. Global Search Across Plots, Deeds, and Owners */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        plots={plots}
        deeds={deeds}
        alerts={alerts}
        lang={lang}
        onNavigate={(page, extra) => {
          setIsSearchModalOpen(false);
          handleNavigate(page, extra);
        }}
      />

      {/* 6. Guided Demo Story Modal */}
      <GuidedDemoModal
        isOpen={isGuidedDemoOpen}
        onClose={() => setIsGuidedDemoOpen(false)}
        onNavigate={handleNavigate}
        lang={lang}
      />
    </div>
  );
}
