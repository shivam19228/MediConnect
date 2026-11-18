import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Activity,
  Server,
  Layers,
  Database,
  Brain,
  HardDrive,
  Loader2,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import { apiClient, ApiDoctorCaseSummary, ApiDoctorSummary, ApiTriageStats } from '../../services/apiClient';
import { CaseStatusBadge } from '../../components/doctor/CaseStatusBadge';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ApiDoctorCaseSummary[]>([]);
  const [doctors, setDoctors] = useState<ApiDoctorSummary[]>([]);
  const [selectedDoctorMap, setSelectedDoctorMap] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<ApiTriageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assigningCaseId, setAssigningCaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [casesRes, statsRes, doctorsRes] = await Promise.all([
        apiClient.getCases({ page: 0, size: 50 }, true),
        apiClient.getTriageStats(true),
        apiClient.getDoctors().catch(() => [] as ApiDoctorSummary[]),
      ]);
      const fetchedCases = casesRes.content || [];
      setCases(fetchedCases);
      setStats(statsRes);
      setDoctors(doctorsRes);

      // Prepopulate selection map with currently assigned doctors
      const initialMap: Record<string, string> = {};
      fetchedCases.forEach((c) => {
        const id = c.id || (c as any).caseId;
        if (id && c.reviewedByDoctorId) {
          initialMap[id] = c.reviewedByDoctorId;
        }
      });
      setSelectedDoctorMap(initialMap);

      setBackendHealth('ONLINE');
    } catch (err: any) {
      console.error('Failed to load admin data from backend', err);
      setError(err.message || 'Failed to connect to MediConnect backend administration APIs.');
      setBackendHealth('OFFLINE');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDoctorSelect = (caseId: string, doctorId: string) => {
    setSelectedDoctorMap((prev) => ({
      ...prev,
      [caseId]: doctorId,
    }));
  };

  const handleAssignDoctor = async (caseId: string) => {
    const targetDoctorId = selectedDoctorMap[caseId] || null;
    setAssigningCaseId(caseId);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedCase = await apiClient.assignDoctor(caseId, targetDoctorId);
      setCases((prev) =>
        prev.map((c) => {
          const currentId = c.id || (c as any).caseId;
          return currentId === caseId ? { ...c, ...updatedCase } : c;
        })
      );

      const assignedDoc = doctors.find((d) => d.id === targetDoctorId);
      const doctorDisplayName = assignedDoc ? assignedDoc.fullName : 'Doctor';
      setSuccessMessage(
        targetDoctorId
          ? `Successfully assigned Case #${updatedCase.tokenNumber || caseId} to ${doctorDisplayName}.`
          : `Case #${updatedCase.tokenNumber || caseId} has been unassigned and returned to the general triage queue.`
      );

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to assign doctor to case', err);
      setError(err.message || 'Failed to assign doctor. Please verify permissions and try again.');
    } finally {
      setAssigningCaseId(null);
    }
  };

  const totalPatients = stats?.totalSubmitted ?? cases.length;
  const pendingReviews = stats?.pendingReview ?? cases.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length;
  const completedReviews = stats?.reviewedCases ?? cases.filter((c) => c.reviewStatus === 'REVIEWED').length;
  const urgentCases = stats?.urgentCases ?? cases.filter((c) => c.isEmergencyFlagged || c.reviewStatus === 'URGENT').length;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            MediConnect Administration Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            System activity overview, triage metrics, role accounts, and server-side case records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-700 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Backend Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Backend Connection Notice:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : totalPatients}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total submitted intakes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Doctor Review</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900 mt-2">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-amber-300" /> : pendingReviews}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Awaiting clinical evaluation</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Reviewed Cases</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-900 mt-2">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-300" /> : completedReviews}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Clinician review completed</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Urgent Alerts</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-900 mt-2">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-rose-300" /> : urgentCases}
          </div>
          <p className="text-[11px] text-rose-700 mt-1">High-priority triage triggers</p>
        </div>
      </div>

      {/* Grid: Role Permissions & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Access Matrix */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <span>Role Permissions & Access Control</span>
            </h3>
            <span className="text-xs text-slate-400">Database Role Hierarchy</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Patient Portal</span>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-900 text-[10px] font-black rounded uppercase">
                    ROLE_PATIENT
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Voice-guided intake, symptom questionnaire, medical history, document upload, and OPD token tracking.
                </p>
              </div>
              <div className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 self-start sm:self-center shrink-0">
                Self-Intake Scope
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Clinical Triage & Review</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-black rounded uppercase">
                    ROLE_DOCTOR
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  OPD triage queue, case review, Gemini AI clinical summary generation, document inspection, and recommendations.
                </p>
              </div>
              <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 self-start sm:self-center shrink-0">
                Clinical Scope
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">System Administration</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 text-[10px] font-black rounded uppercase">
                    ROLE_ADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overall hospital administration, complete case record inspection, audit oversight, and system health monitoring.
                </p>
              </div>
              <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 self-start sm:self-center shrink-0">
                Full System Scope
              </div>
            </div>
          </div>
        </div>

        {/* System & Architecture Status Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-teal-600" />
              <span>Integrated Architecture</span>
            </h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                backendHealth === 'ONLINE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {backendHealth === 'ONLINE' ? 'Backend Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Frontend Layer</span>
              </span>
              <span className="font-bold text-emerald-700">React + TS + Vite (5173)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-teal-600" />
                <span>Spring Boot API</span>
              </span>
              <span className="font-bold text-emerald-700">Port 8081 /api/v1</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span>Database</span>
              </span>
              <span className="font-bold text-emerald-700">MySQL 8 + Flyway</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-teal-600" />
                <span>AI Clinical Engine</span>
              </span>
              <span className="font-bold text-emerald-700">Google Gemini 3.5 Flash</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-teal-600" />
                <span>Document Storage</span>
              </span>
              <span className="font-bold text-emerald-700">Secure Local Storage</span>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Case Dispatch Successful</strong>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Case Triage & Doctor Dispatch Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <span>Case Triage & Doctor Dispatch Console</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign or reassign submitted patient cases to verified clinical doctors in real time.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-center">
            {isLoading ? 'Loading...' : `${cases.length} Total Cases`}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
            <p className="text-xs font-medium">Fetching cases and doctor roster from backend...</p>
          </div>
        ) : cases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Case Reference / Patient</th>
                  <th className="py-3.5 px-3">Submitted</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4">Assigned Doctor</th>
                  <th className="py-3.5 px-4">Doctor Dispatch Action</th>
                  <th className="py-3.5 px-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => {
                  const targetCaseId = c.id || (c as any).caseId;
                  const isAssigned = !!c.reviewedByDoctorName;
                  const selectedDoctorId = selectedDoctorMap[targetCaseId] ?? (c.reviewedByDoctorId || '');
                  const isCurrentlyAssigning = assigningCaseId === targetCaseId;

                  return (
                    <tr key={targetCaseId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Case & Patient Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {c.tokenNumber ? (
                              <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                                {c.tokenNumber}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-slate-500">#{targetCaseId.slice(0, 8)}</span>
                            )}
                            {c.isEmergencyFlagged && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-slate-900 text-xs">
                            {c.patientName ? `${c.patientName} • ` : ''}
                            {c.patientAge ? `${c.patientAge}y ` : ''}
                            {c.patientGender ? `${c.patientGender}` : 'Patient'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {c.primarySymptoms?.join(', ') || 'No symptoms listed'}
                          </p>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-600">
                        {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Review Status Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <CaseStatusBadge status={c.reviewStatus || 'PENDING_REVIEW'} />
                      </td>

                      {/* Currently Assigned Doctor */}
                      <td className="py-3.5 px-4">
                        {isAssigned ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold">
                            <Stethoscope className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[140px]">Dr. {c.reviewedByDoctorName}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Unassigned (Queue)</span>
                          </div>
                        )}
                      </td>

                      {/* Doctor Assignment Selector & Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedDoctorId}
                            onChange={(e) => handleDoctorSelect(targetCaseId, e.target.value)}
                            disabled={isCurrentlyAssigning}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 max-w-[170px]"
                          >
                            <option value="">-- General Queue --</option>
                            {doctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.fullName} {doc.specialty ? `(${doc.specialty})` : ''}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleAssignDoctor(targetCaseId)}
                            disabled={isCurrentlyAssigning}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 shadow-sm shrink-0"
                            title="Commit Assignment"
                          >
                            {isCurrentlyAssigning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            <span>{isAssigned ? 'Reassign' : 'Assign'}</span>
                          </button>
                        </div>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/doctor/cases/${targetCaseId}`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No patient cases found in the database.
          </div>
        )}
      </div>
    </div>
  );
};
