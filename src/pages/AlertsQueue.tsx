import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle,
  XCircle,
  Filter,
  ShieldAlert,
  Search,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Alert, AlertStatus, AlertType, Deed, Mutation, Plot, Language } from '../types';
import { translations } from '../utils/translations';
import { saveStoredAlerts } from '../utils/storage';
import { runSystemWideMismatchAudit } from '../utils/fraud';
import { downloadAlertsCSV } from '../utils/export';
import { PageId } from '../components/Sidebar';

interface AlertsQueueProps {
  alerts: Alert[];
  plots: Plot[];
  deeds: Deed[];
  mutations: Mutation[];
  lang: Language;
  onAlertsUpdated: (updatedAlerts: Alert[]) => void;
  onNavigate: (page: PageId, extra?: { plotId?: string; token?: string }) => void;
}

export const AlertsQueue: React.FC<AlertsQueueProps> = ({
  alerts,
  plots,
  deeds,
  mutations,
  lang,
  onAlertsUpdated,
  onNavigate,
}) => {
  const t = translations[lang];

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | AlertStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AlertType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Status update handler
  const handleUpdateStatus = (alertId: string, newStatus: AlertStatus) => {
    const updated = alerts.map((a) => {
      if (a.id === alertId) {
        return { ...a, status: newStatus };
      }
      return a;
    });

    saveStoredAlerts(updated);
    onAlertsUpdated(updated);
  };

  // Re-run system-wide audit scan
  const handleRunSystemAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const discoveredAlerts = runSystemWideMismatchAudit(plots, deeds, mutations, alerts);
      if (discoveredAlerts.length > 0) {
        const combined = [...discoveredAlerts, ...alerts];
        saveStoredAlerts(combined);
        onAlertsUpdated(combined);
      }
      setIsAuditing(false);
    }, 400);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlot = a.plotId.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchType = a.type.toLowerCase().includes(q);
      if (!matchPlot && !matchDesc && !matchType) return false;
    }
    return true;
  });

  // Category counts
  const openCount = alerts.filter((a) => a.status === 'OPEN').length;
  const approvedCount = alerts.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = alerts.filter((a) => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
              {lang === 'bn' ? 'জালিয়াতি প্রতিরোধ' : 'Fraud Prevention'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Sub-Registrar & AC Land Triage</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {t.alertsQueue.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t.alertsQueue.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => downloadAlertsCSV(filteredAlerts.length > 0 ? filteredAlerts : alerts)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Export alerts as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'bn' ? 'সিএসভি ডাউনলোড' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handleRunSystemAudit}
            disabled={isAuditing}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing Database...' : 'Run System Audit Scan'}</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Flagged
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {alerts.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">
            Open / Pending Action
          </span>
          <span className="text-2xl font-black text-red-600 mt-1 block">
            {openCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Approved / Cleared
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {approvedCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Rejected / Frozen Title
          </span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">
            {rejectedCount}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Plot ID, keyword, or violation description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
          {/* Status filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider">
              {t.alertsQueue.filterStatus}:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="ALL">{t.alertsQueue.all}</option>
              <option value="OPEN">OPEN</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider">
              {t.alertsQueue.filterType}:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="ALL">{t.alertsQueue.all}</option>
              <option value="DOUBLE_SALE">DOUBLE_SALE</option>
              <option value="MISMATCH">MISMATCH</option>
              <option value="TAMPERED">TAMPERED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <AlertOctagon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              {t.alertsQueue.noAlerts}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">{t.alertsQueue.colPlot}</th>
                  <th className="py-3 px-4 font-bold">{t.alertsQueue.colType}</th>
                  <th className="py-3 px-4 font-bold">{t.alertsQueue.colDesc}</th>
                  <th className="py-3 px-4 font-bold">{t.alertsQueue.colStatus}</th>
                  <th className="py-3 px-4 font-bold">{t.alertsQueue.colDate}</th>
                  <th className="py-3 px-4 font-bold text-right">{t.alertsQueue.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`transition hover:bg-slate-50/80 ${
                      alert.status === 'OPEN' ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* Plot ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        onClick={() => onNavigate('plotCheck', { plotId: alert.plotId })}
                        className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1"
                      >
                        <span>{alert.plotId}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    {/* Alert Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          alert.type === 'DOUBLE_SALE'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : alert.type === 'TAMPERED'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {alert.type}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-slate-800 font-medium max-w-md">
                      {alert.description}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          alert.status === 'OPEN'
                            ? 'bg-red-600 text-white'
                            : alert.status === 'APPROVED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(alert.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions: Approve / Reject */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {alert.status === 'OPEN' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition"
                              title="Officially approve resolution after field investigation"
                            >
                              {t.alertsQueue.approveBtn}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition"
                              title="Reject registration / freeze land record"
                            >
                              {t.alertsQueue.rejectBtn}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'OPEN')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] border border-slate-200 transition"
                          >
                            Re-Open
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
