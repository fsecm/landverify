import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface DemoBannerProps {
  lang: Language;
  onOpenSampleModal: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ lang, onOpenSampleModal }) => {
  const t = translations[lang];

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 px-4 py-2 shadow-xs border-b border-amber-600/40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium">
        <div className="flex items-center space-x-2 text-center sm:text-left">
          <span className="p-1 bg-slate-950 text-amber-300 rounded font-bold uppercase tracking-wider text-[10px] shrink-0">
            HACKATHON
          </span>
          <span className="font-bold flex items-center gap-1.5 text-slate-950">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0 inline" />
            {t.syntheticNotice}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenSampleModal}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'bn' ? 'নমুনা দলিল ডাউনলোড' : 'Download Sample Deeds'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
