import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Trash2,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { ReportRecord } from '../types';
import {
  listenToReports,
  updateReportStatus,
  suspendUser
} from '../services/safetyService';
import { deletePost } from '../services/postService';

interface AdminModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModerationModal: React.FC<AdminModerationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = listenToReports((list) => {
      setReports(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = async (reportId: string) => {
    await updateReportStatus(reportId, 'dismissed');
  };

  const handleActionReport = async (report: ReportRecord) => {
    const confirmed = window.confirm(
      `Take action on this report? If targeting a post, it will be deleted. If targeting a user, they will be suspended.`
    );
    if (!confirmed) return;

    try {
      if (report.targetType === 'post') {
        await deletePost(report.targetId);
      } else if (report.targetType === 'user' && report.targetUserId) {
        await suspendUser(report.targetUserId, true);
      }
      await updateReportStatus(report.id, 'actioned');
    } catch (err) {
      console.error('Failed to action report:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#1E1120] rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-950/60 p-6 sm:p-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Admin Moderation Queue
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Review flagged reports, remove violating posts, and protect the community.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-xs text-neutral-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                Moderation Queue is Clean
              </h3>
              <p className="text-xs text-neutral-400 mt-1">No pending reports at this time.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-2xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/20 dark:bg-neutral-900/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                      {report.targetType} Report
                    </span>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">
                      {report.reason}
                    </h4>
                    {report.details && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 italic">
                        "{report.details}"
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      report.status === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        : report.status === 'actioned'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>

                {report.targetContent && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E1120] text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">
                      Flagged Content:
                    </span>
                    {report.targetContent}
                  </div>
                )}

                {report.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-50 dark:border-rose-950/40">
                    <button
                      onClick={() => handleDismiss(report.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleActionReport(report)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      Action (Remove / Suspend)
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
