import React from 'react';
import { Menu, Database, RotateCcw, FileText, Globe, Search, Sparkles } from 'lucide-react';
import { PageId } from './Sidebar';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  currentPage: PageId;
  onOpenMobileSidebar: () => void;
  lang: Language;
  onToggleLang: () => void;
  onLoadDemo: () => void;
  onResetData: () => void;
  onOpenSampleModal: () => void;
  onOpenSearchModal: () => void;
  onOpenDemoTour: () => void;
  isSeeding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  lang,
  onToggleLang,
  onLoadDemo,
  onResetData,
  onOpenSampleModal,
  onOpenSearchModal,
  onOpenDemoTour,
  isSeeding,
}) => {
  const t = translations[lang];

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return t.nav.dashboard;
      case 'register':
        return t.nav.registerDeed;
      case 'verify':
        return t.nav.verifyDoc;
      case 'plotCheck':
        return t.nav.plotCheck;
      case 'timeline':
        return t.nav.timeline;
      case 'alerts':
        return t.nav.alerts;
      case 'bankCheck':
        return t.nav.bankCheck;
      case 'activityLog':
        return t.nav.activityLog;
      default:
        return 'LandVerify';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & breadcrumb */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden hover:bg-slate-100 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                LandVerify e-Gov
              </span>
              <span className="text-slate-300">/</span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {lang === 'bn' 
                ? 'ভূমি মন্ত্রণালয় ও সাব-রেজিস্ট্রি অটোমেশন প্রকল্প' 
                : 'Ministry of Land & Sub-Registry Automation Prototype'}
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Global Search trigger */}
          <button
            onClick={onOpenSearchModal}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
            title="Global Search across Plots, Deeds, and Owners"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'অনুসন্ধান' : 'Search'}</span>
          </button>

          {/* Guided Demo button */}
          <button
            onClick={onOpenDemoTour}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-lg shadow-xs transition"
            title="Run interactive hackathon story tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden md:inline">{lang === 'bn' ? 'গাইডেড ডেমো' : 'Guided Demo'}</span>
            <span className="md:hidden">Tour</span>
          </button>

          {/* Sample deeds test kit */}
          <button
            onClick={onOpenSampleModal}
            className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'bn' ? 'নমুনা দলিল' : 'Sample Deeds'}</span>
          </button>

          {/* Load demo data */}
          <button
            onClick={onLoadDemo}
            disabled={isSeeding}
            className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
            title="Seed 15 plots and 3 planted fraud cases"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSeeding ? 'Loading...' : t.dashboard.loadDemo}
            </span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Reset data */}
          <button
            onClick={onResetData}
            className="inline-flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-700 text-xs font-medium rounded-lg border border-slate-200 transition"
            title="Reset localStorage data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.dashboard.resetData}</span>
          </button>

          {/* Language Toggle in Header */}
          <button
            onClick={onToggleLang}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition"
            title="Toggle English / বাংলা"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
