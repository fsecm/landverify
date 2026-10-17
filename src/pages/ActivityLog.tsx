/**
 * Activity Log Page
 * Lists all officer and citizen operations chronologically with tamper-proof timestamps.
 */

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Calendar,
  User,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { ActivityLogItem, Language } from '../types';
import { translations } from '../utils/translations';
import { PageId } from '../components/Sidebar';

interface ActivityLogProps {
  activities: ActivityLogItem[];
  lang: Language;
  onNavigate: (page: PageId, extra?: { plotId?: string; token?: string }) => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  activities,
  lang,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredActivities = activities.filter((act) => {
    if (roleFilter !== 'ALL' && act.actorRole !== roleFilter) return false;
    if (statusFilter !== 'ALL' && act.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchDetails = act.details.toLowerCase().includes(q);
      const matchPlot = act.plotId?.toLowerCase().includes(q) || false;
      const matchRole = act.actorRole.toLowerCase().includes(q);
      if (!matchTitle && !matchDetails && !matchPlot && !matchRole) return false;
    }
    return true;
  });

  const getStatusIcon = (status: ActivityLogItem['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'DANGER':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: ActivityLogItem['status']) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'WARNING':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'DANGER':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
              {lang === 'bn' ? 'সিস্টেম নিরীক্ষণ' : 'System Audit Trail'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Immutable Operating Journal</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {lang === 'bn' ? 'কার্যক্রম লগ (Activity Log)' : 'System Activity Audit Log'}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {lang === 'bn'
              ? 'দলিল নিবন্ধন, সত্যতা যাচাই, জালিয়াতি সতর্কীকরণ এবং কর্মকর্তাদের প্রতিটি পদক্ষেপের পূর্ণাঙ্গ ইতিহাস।'
              : 'Chronological recording of deed registrations, public verifications, fraud alerts, and bank mortgage updates.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
          <span>Total Recorded Events: {activities.length}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search activity by title, plot, actor role, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="ALL">All Roles</option>
              <option value="Sub-Registrar">Sub-Registrar</option>
              <option value="Public Citizen">Public Citizen</option>
              <option value="Bank Officer">Bank Officer</option>
              <option value="AC Land Officer">AC Land Officer</option>
              <option value="System Auditor">System Auditor</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning</option>
              <option value="DANGER">Danger / Fraud</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No activity log entries match your filter</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                    {getStatusIcon(act.status)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                        {act.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(act.status)}`}>
                        {act.actionType}
                      </span>
                      {act.plotId && (
                        <button
                          onClick={() => onNavigate('plotCheck', { plotId: act.plotId })}
                          className="font-mono text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-0.5 bg-emerald-50 px-2 py-0.5 rounded"
                        >
                          <span>{act.plotId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {act.details}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end text-xs text-slate-400">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px]">
                    {act.actorRole}
                  </span>
                  <span className="mt-1 text-[11px] font-mono">
                    {new Date(act.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
