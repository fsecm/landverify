import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  ShieldCheck,
  Search,
  History,
  AlertOctagon,
  FileCode,
  Globe,
  Building2,
  ChevronRight,
  Landmark,
  ScrollText,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';

export type PageId =
  | 'dashboard'
  | 'register'
  | 'verify'
  | 'plotCheck'
  | 'timeline'
  | 'alerts'
  | 'bankCheck'
  | 'activityLog';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  openAlertsCount: number;
  lang: Language;
  onToggleLang: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSampleModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  openAlertsCount,
  lang,
  onToggleLang,
  isOpenMobile,
  onCloseMobile,
  onOpenSampleModal,
}) => {
  const t = translations[lang];

  const menuItems = [
    {
      id: 'dashboard' as PageId,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      badge: null,
      desc: lang === 'bn' ? 'সারসংক্ষেপ ও মেট্রিক্স' : 'System Overview & Metrics',
    },
    {
      id: 'register' as PageId,
      label: t.nav.registerDeed,
      icon: FilePlus,
      badge: lang === 'bn' ? 'অফিসার' : 'Officer',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      desc: lang === 'bn' ? 'সাব-রেজিস্ট্রি পোর্টাল' : 'Sub-Registry Entry',
    },
    {
      id: 'verify' as PageId,
      label: t.nav.verifyDoc,
      icon: ShieldCheck,
      badge: lang === 'bn' ? 'পাবলিক' : 'Citizen',
      badgeColor: 'bg-blue-100 text-blue-800',
      desc: lang === 'bn' ? 'SHA-256 ও কিউআর যাচাই' : 'Cryptographic Hash & QR',
    },
    {
      id: 'plotCheck' as PageId,
      label: t.nav.plotCheck,
      icon: Search,
      badge: null,
      desc: lang === 'bn' ? 'ক্রেতার সতর্কতা যাচাই' : 'Buyer Due Diligence',
    },
    {
      id: 'timeline' as PageId,
      label: t.nav.timeline,
      icon: History,
      badge: null,
      desc: lang === 'bn' ? 'হ্যাশ-চেইন্ড অডিট লগ' : 'Tamper-Evident Chain',
    },
    {
      id: 'bankCheck' as PageId,
      label: t.nav.bankCheck,
      icon: Landmark,
      badge: lang === 'bn' ? 'ব্যাংক' : 'Bank',
      badgeColor: 'bg-purple-100 text-purple-900',
      desc: lang === 'bn' ? 'দ্বৈত বন্ধকী ও লিয়েন যাচাই' : 'Lien & Double Mortgage',
    },
    {
      id: 'alerts' as PageId,
      label: t.nav.alerts,
      icon: AlertOctagon,
      badge: openAlertsCount > 0 ? `${openAlertsCount}` : null,
      badgeColor: 'bg-red-500 text-white font-bold',
      desc: lang === 'bn' ? 'জালিয়াতি প্রতিরোধ ব্যবস্থা' : 'Automated Triage Queue',
    },
    {
      id: 'activityLog' as PageId,
      label: t.nav.activityLog,
      icon: ScrollText,
      badge: null,
      desc: lang === 'bn' ? 'সিস্টেম কার্যক্রম ইতিহাস' : 'Action Audit Journal',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-slate-100 flex flex-col border-r border-emerald-950/40 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Land<span className="text-emerald-400">Verify</span>
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Gov-Tech
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/70 font-medium truncate max-w-[170px]">
                Bangladesh E-Governance
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400/70">
            {lang === 'bn' ? 'মেন্যু' : 'Navigation'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectPage(item.id);
                  onCloseMobile();
                }}
                className={`w-full text-left flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm tracking-tight truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
                </div>
              </button>
            );
          })}

          {/* Quick Helper Button */}
          <div className="pt-4 px-1">
            <button
              onClick={() => {
                onOpenSampleModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-700/40 hover:border-emerald-500/70 transition text-left group"
            >
              <div className="flex items-center space-x-2.5">
                <FileCode className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-bold text-emerald-200">
                    {lang === 'bn' ? 'নমুনা দলিল কিট' : 'Sample Test Deeds'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'যাচাই ও টেম্পারিং টেস্ট' : 'Authentic & Tampered files'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-500/60" />
            </button>
          </div>
        </div>

        {/* Footer Language & Architecture Note */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 space-y-3">
          {/* Language Switcher */}
          <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-xl border border-white/5">
            <div className="flex items-center space-x-2 text-xs text-slate-300 pl-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'ভাষা / Language' : 'Language'}</span>
            </div>
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={onToggleLang}
                className={`px-2.5 py-1 rounded-md transition ${
                  lang === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={onToggleLang}
                className={`px-2.5 py-1 rounded-md transition ${
                  lang === 'bn' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                বাং
              </button>
            </div>
          </div>

          {/* Hackathon Prototype Tag */}
          <div className="text-[10px] text-slate-400 text-center leading-tight">
            Web Crypto API SHA-256
            <div className="text-emerald-400/70 font-semibold mt-0.5">
              Hash-Chained Audit Engine
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
