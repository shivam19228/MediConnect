import React from 'react';
import { ReviewStatus } from '../../types/case';
import { Clock, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface CaseStatusBadgeProps {
  status: ReviewStatus;
}

export const CaseStatusBadge: React.FC<CaseStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PENDING_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Review</span>
        </span>
      );
    case 'REVIEWED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reviewed</span>
        </span>
      );
    case 'REQUIRES_FOLLOWUP':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
          <AlertCircle className="w-3.5 h-3.5 text-sky-600" />
          <span>Follow-up Needed</span>
        </span>
      );
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Urgent Priority</span>
        </span>
      );
    default:
      return null;
  }
};
