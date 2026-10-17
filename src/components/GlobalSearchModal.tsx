/**
 * Global Search Modal
 * Searches across Plot IDs, owner names, deed numbers, and mouzas with instant jump navigation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, FileText, User, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { Plot, Deed, Alert, Language } from '../types';
import { PageId } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  plots: Plot[];
  deeds: Deed[];
  alerts: Alert[];
  lang: Language;
  onNavigate: (page: PageId, extra?: { plotId?: string; token?: string }) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  plots,
  deeds,
  alerts,
  lang,
  onNavigate,
}) => {
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Matched Plots
  const matchedPlots = cleanQuery
    ? plots.filter((p) => {
        return (
          p.plotId.toLowerCase().includes(cleanQuery) ||
          p.currentOwner.toLowerCase().includes(cleanQuery) ||
          p.mouza.toLowerCase().includes(cleanQuery) ||
          p.upazila.toLowerCase().includes(cleanQuery) ||
          p.khatianNo.toLowerCase().includes(cleanQuery)
        );
      }).slice(0, 5)
    : [];

  // Matched Deeds
  const matchedDeeds = cleanQuery
    ? deeds.filter((d) => {
        return (
          d.deedNo.toLowerCase().includes(cleanQuery) ||
          d.seller.toLowerCase().includes(cleanQuery) ||
          d.buyer.toLowerCase().includes(cleanQuery) ||
          d.qrToken.toLowerCase().includes(cleanQuery) ||
          d.plotId.toLowerCase().includes(cleanQuery)
        );
      }).slice(0, 5)
    : [];

  // Matched Alerts
  const matchedAlerts = cleanQuery
    ? alerts.filter((a) => {
        return (
          a.plotId.toLowerCase().includes(cleanQuery) ||
          a.description.toLowerCase().includes(cleanQuery) ||
          a.type.toLowerCase().includes(cleanQuery)
        );
      }).slice(0, 3)
    : [];

  const handleSelectPlot = (plotId: string) => {
    onNavigate('plotCheck', { plotId });
    onClose();
  };

  const handleSelectDeed = (qrToken: string) => {
    onNavigate('verify', { token: qrToken });
    onClose();
  };

  const handleSelectAlert = (plotId: string) => {
    onNavigate('alerts', { plotId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 backdrop-blur-xs p-4 pt-16 sm:pt-24 animate-in fade-in duration-100">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-emerald-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              lang === 'bn'
                ? 'প্লট আইডি, মালিকের নাম, বা দলিল নম্বর দিয়ে সন্ধান করুন...'
                : 'Search by Plot ID (e.g. DHK-MIR-001), Owner, or Deed No...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 focus:outline-hidden"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono border border-slate-300 px-1.5 py-0.5 rounded">
              ESC
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!cleanQuery ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-600">Quick Global Search</p>
              <p>Type any Plot ID, citizen name, deed number, or mouza name to find records instantly.</p>
              <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setQuery('DHK-MIR-004')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  DHK-MIR-004
                </button>
                <button
                  onClick={() => setQuery('DHK-SAV-016')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  DHK-SAV-016
                </button>
                <button
                  onClick={() => setQuery('Farzana')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Farzana
                </button>
                <button
                  onClick={() => setQuery('DEED-2026')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  DEED-2026
                </button>
              </div>
            </div>
          ) : matchedPlots.length === 0 && matchedDeeds.length === 0 && matchedAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No plots, deeds, or alerts found matching "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              {/* Matched Plots */}
              {matchedPlots.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                    Land Plots ({matchedPlots.length})
                  </div>
                  <div className="space-y-1">
                    {matchedPlots.map((plot) => (
                      <button
                        key={plot.plotId}
                        onClick={() => handleSelectPlot(plot.plotId)}
                        className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl transition flex items-center justify-between group border border-transparent hover:border-emerald-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {plot.plotId}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                • {plot.mouza}, {plot.upazila}
                              </span>
                              {plot.isKhasLand && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                  Khas Land
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              Owner: <span className="font-semibold text-slate-800">{plot.currentOwner}</span> ({plot.areaDecimal} Decimal)
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-700 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Deeds */}
              {matchedDeeds.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                    Registered Deeds ({matchedDeeds.length})
                  </div>
                  <div className="space-y-1">
                    {matchedDeeds.map((deed) => (
                      <button
                        key={deed.id}
                        onClick={() => handleSelectDeed(deed.qrToken)}
                        className="w-full text-left p-2.5 hover:bg-blue-50 rounded-xl transition flex items-center justify-between group border border-transparent hover:border-blue-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {deed.deedNo}
                              </span>
                              <span className="font-mono text-xs text-blue-700">
                                ({deed.plotId})
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              <span>From: {deed.seller}</span> → <span className="font-bold text-slate-900">To: {deed.buyer}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-700 font-bold opacity-0 group-hover:opacity-100 transition">
                          Verify File →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Alerts */}
              {matchedAlerts.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                    Fraud Alerts ({matchedAlerts.length})
                  </div>
                  <div className="space-y-1">
                    {matchedAlerts.map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => handleSelectAlert(alert.plotId)}
                        className="w-full text-left p-2.5 hover:bg-red-50 rounded-xl transition flex items-center justify-between group border border-transparent hover:border-red-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-100 text-red-800 rounded-lg">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-600 text-white">
                                {alert.type}
                              </span>
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {alert.plotId}
                              </span>
                            </div>
                            <p className="text-xs text-red-900 truncate max-w-md mt-0.5 font-medium">
                              {alert.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-700 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
