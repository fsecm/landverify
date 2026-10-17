import React from 'react';
import {
  FilePlus,
  Compass,
  Landmark,
  Search,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { UserRole, Language, PageId } from '../types';
import { ROLE_CONFIGS, RoleConfig } from '../utils/roles';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole, targetPage?: PageId) => void;
  lang: Language;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  lang,
}) => {
  if (!isOpen) return null;

  const roles: RoleConfig[] = Object.values(ROLE_CONFIGS);

  const getRoleIcon = (roleId: UserRole) => {
    switch (roleId) {
      case 'sub_registrar':
        return <FilePlus className="w-5 h-5 text-emerald-700" />;
      case 'ac_land':
        return <Compass className="w-5 h-5 text-amber-600" />;
      case 'bank_officer':
        return <Landmark className="w-5 h-5 text-indigo-600" />;
      case 'citizen':
        return <Search className="w-5 h-5 text-sky-600" />;
      case 'admin':
        return <ShieldCheck className="w-5 h-5 text-slate-800" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-switcher-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800">
                {lang === 'bn' ? 'সিমুলেটেড এক্সেস' : 'Simulated GovTech Access'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                {lang === 'bn' ? 'কোনো পাসওয়ার্ড ছাড়াই রোল পরিবর্তন করুন' : 'No password required for hackathon testing'}
              </span>
            </div>
            <h3 id="role-switcher-title" className="text-xl font-extrabold text-slate-900 mt-1">
              {lang === 'bn' ? 'অফিসার / নাগরিক ভূমিকা নির্বাচন' : 'Switch Role & Officer Persona'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="p-6 overflow-y-auto space-y-3.5">
          <p className="text-xs text-slate-500 mb-2">
            {lang === 'bn'
              ? 'ভূমি ব্যবস্থাপনার বিভিন্ন স্টেকহোল্ডারদের দৃষ্টিকোণ থেকে সিস্টেমের কার্যক্রম পরীক্ষা করুন:'
              : 'Select a stakeholder persona to experience the tailored workflow, permissions, and audit trails:'}
          </p>

          {roles.map((role) => {
            const isSelected = role.id === currentRole;
            return (
              <div
                key={role.id}
                onClick={() => {
                  onSelectRole(role.id, role.defaultPage);
                  onClose();
                }}
                className={`group p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getRoleIcon(role.id)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {lang === 'bn' ? role.titleBn : role.titleEn}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {lang === 'bn' ? role.officeBn : role.officeEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {lang === 'bn' ? role.descriptionBn : role.descriptionEn}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {lang === 'bn' ? 'কার্যপরিধি:' : 'Key Tools:'}
                        </span>
                        <span>
                          {role.allowedPages.slice(0, 4).join(', ')}
                          {role.allowedPages.length > 4 ? ` +${role.allowedPages.length - 4} more` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    {isSelected ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-700 flex items-center space-x-1 px-2 py-1">
                        <span>{lang === 'bn' ? 'নির্বাচন' : 'Select'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">
            {lang === 'bn' ? 'দলিল সম্পাদনকালে স্বাক্ষরকারী রোল অডিট ট্রেইলে সংরক্ষিত হবে।' : 'Officer digital signatures will automatically attach this role.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition text-xs"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
