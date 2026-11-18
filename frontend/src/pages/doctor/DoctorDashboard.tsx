import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
  RefreshCw,
  Globe,
  Sparkles,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient, ApiDoctorCaseSummary, ApiTriageStats } from '../../services/apiClient';
import { DoctorSidebar } from '../../components/doctor/DoctorSidebar';
import { CaseStatusBadge } from '../../components/doctor/CaseStatusBadge';
import { SUPPORTED_LANGUAGES } from '../../data/translations';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [cases, setCases] = useState<ApiDoctorCaseSummary[]>([]);
  const [triageStats, setTriageStats] = useState<ApiTriageStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [symptomFilter, setSymptomFilter] = useState<string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED_TO_ME'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, statsRes] = await Promise.all([
        apiClient.getCases(
          {
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            search: searchTerm ? searchTerm : undefined,
            assignedToMe: assignmentFilter === 'ASSIGNED_TO_ME' ? true : undefined,
          },
          isAdmin
        ),
        apiClient.getTriageStats(isAdmin).catch(() => null),
      ]);
      setCases(casesRes.content || []);
      if (statsRes) setTriageStats(statsRes);
    } catch (err: any) {
      console.error('Failed to load doctor cases', err);
      setError(err.message || 'Failed to load cases from server.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, statusFilter, searchTerm, assignmentFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filter for symptoms if needed
  const filteredCases = cases.filter((c) => {
    if (symptomFilter !== 'ALL') {
      const hasSymptom = (c.primarySymptoms || []).includes(symptomFilter);
      if (!hasSymptom) return false;
    }
    return true;
  });

  const getLanguageName = (code?: string) => {
    if (!code) return 'Hindi';
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return found ? `${found.nativeName} (${found.name})` : code;
  };

  const pendingCount = triageStats?.pendingReview ?? cases.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length;
  const reviewedCount = triageStats?.reviewedCases ?? cases.filter((c) => c.reviewStatus === 'REVIEWED').length;
  const urgentCount = triageStats?.urgentCases ?? cases.filter((c) => c.isEmergencyFlagged || c.reviewStatus === 'URGENT').length;
  const totalCount = triageStats?.totalSubmitted ?? cases.length;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-slate-50 min-h-screen">
      {/* Doctor Workspace Sidebar */}
      <DoctorSidebar pendingCount={pendingCount} />

      {/* Main Clinical Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {isAdmin ? 'Supervisor Case Review Console' : 'Clinical Triage & Review'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Incoming Patient Cases
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Review AI-structured case intake summaries, patient questionnaires, and diagnostic reports together.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-colors"
              title="Refresh Cases"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Cases</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Clinical Statistics Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cases</span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{totalCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Submitted patient cases</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">{pendingCount}</div>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">Awaiting physician review</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Reviewed</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2">{reviewedCount}</div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Doctor notes recorded</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Urgent Priority</span>
              <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-900 mt-2">{urgentCount}</div>
            <p className="text-[11px] text-rose-700 font-semibold mt-1">Red flag alerts</p>
          </div>
        </div>

        {/* Queue Scope Tabs & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex bg-slate-200/70 p-1 rounded-2xl self-start">
            <button
              onClick={() => setAssignmentFilter('ALL')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                assignmentFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Triage Cases
            </button>
            <button
              onClick={() => setAssignmentFilter('ASSIGNED_TO_ME')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                assignmentFilter === 'ASSIGNED_TO_ME'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assigned to Me</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredCases.length} {assignmentFilter === 'ASSIGNED_TO_ME' ? 'assigned' : ''} cases
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by token, case ID, or symptoms..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium"
            />
          </div>

          {/* Status and Symptom Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="REQUIRES_FOLLOWUP">Follow-up Needed</option>
              <option value="URGENT">Urgent Priority</option>
            </select>

            <select
              value={symptomFilter}
              onChange={(e) => setSymptomFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Symptoms</option>
              <option value="fever">Fever</option>
              <option value="cough_cold">Cough / Cold</option>
              <option value="stomach_pain">Stomach Pain</option>
              <option value="headache">Headache</option>
              <option value="chest_discomfort">Chest Discomfort</option>
              <option value="breathing_difficulty">Breathing Difficulty</option>
            </select>
          </div>
        </div>

        {/* Incoming Cases Table / List */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-4 px-5">Patient Details</th>
                  <th className="py-4 px-4">Token Number</th>
                  <th className="py-4 px-5">Chief Complaint / Symptoms</th>
                  <th className="py-4 px-4">Assigned Doctor</th>
                  <th className="py-4 px-4">Language</th>
                  <th className="py-4 px-4 text-center">Reports</th>
                  <th className="py-4 px-5">Review Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading cases from server...
                    </td>
                  </tr>
                ) : filteredCases.length > 0 ? (
                  filteredCases.map((c) => {
                    const isUrgent = c.isEmergencyFlagged || c.reviewStatus === 'URGENT';
                    const targetCaseId = c.id || (c as any).caseId;

                    return (
                      <tr
                        key={targetCaseId}
                        onClick={() => navigate(`/doctor/cases/${targetCaseId}`)}
                        className={`hover:bg-teal-50/40 cursor-pointer transition-colors ${
                          isUrgent ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* Patient info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                isUrgent
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              <User className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span>
                                  {c.patientAge ? `${c.patientAge}y ` : ''}
                                  {c.patientGender ? `${c.patientGender}` : 'Patient'}
                                </span>
                                {isUrgent && (
                                  <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                    Urgent
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate font-mono">
                                {targetCaseId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Token Number */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {c.tokenNumber ? (
                            <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                              {c.tokenNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </td>

                        {/* Complaint & severity */}
                        <td className="py-4 px-5 max-w-xs">
                          <p className="font-semibold text-slate-800 line-clamp-2">
                            {(c.primarySymptoms || []).join(', ') || 'Clinical Evaluation'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-400">
                              Severity: <strong>{c.severity || 'Moderate'}</strong>
                            </span>
                            {c.duration && (
                              <span className="text-[11px] text-slate-400">• {c.duration}</span>
                            )}
                            {c.hasAiReport && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                <Sparkles className="w-2.5 h-2.5" />
                                AI Report
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assigned Doctor */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {c.reviewedByDoctorName ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold">
                              <Stethoscope className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Dr. {c.reviewedByDoctorName}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium">
                              <span>Unassigned</span>
                            </span>
                          )}
                        </td>

                        {/* Language */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                            <Globe className="w-3 h-3 text-teal-600" />
                            <span>{getLanguageName(c.language)}</span>
                          </span>
                        </td>

                        {/* Reports Count */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                              (c.uploadedReportCount || 0) > 0
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {c.uploadedReportCount || 0}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <CaseStatusBadge status={c.reviewStatus || 'PENDING_REVIEW'} />
                        </td>

                        {/* Action link */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800">
                            <span>Review Case</span>
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No incoming cases found matching the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
