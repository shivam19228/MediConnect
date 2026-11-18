import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { LanguageSelectPage } from './pages/patient/LanguageSelectPage';
import { QuestionnairePage } from './pages/patient/QuestionnairePage';
import { MedicalHistoryPage } from './pages/patient/MedicalHistoryPage';
import { UploadReportsPage } from './pages/patient/UploadReportsPage';
import { ReviewPage } from './pages/patient/ReviewPage';
import { GeneratedReportPage } from './pages/patient/GeneratedReportPage';
import { TokenConfirmationPage } from './pages/patient/TokenConfirmationPage';


// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorCaseReviewPage } from './pages/doctor/DoctorCaseReviewPage';

// Admin Page
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CaseProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
            {/* Top Navigation */}
            <Navbar />

            {/* Main Application Routing */}
            <main className="flex-1 flex flex-col">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Patient Routes (Protected for PATIENT role) */}
                <Route
                  path="/patient/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/language"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <LanguageSelectPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/questionnaire"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <QuestionnairePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/medical-history"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <MedicalHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/upload-reports"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <UploadReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/review"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <ReviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/generated-report"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <GeneratedReportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/token/:caseId"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']}>
                      <TokenConfirmationPage />
                    </ProtectedRoute>
                  }
                />


                {/* Doctor Routes (Protected for DOCTOR and ADMIN) */}
                <Route
                  path="/doctor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/cases/:caseId"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                      <DoctorCaseReviewPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes (Protected for ADMIN role) */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Medical Footer */}
            <Footer />
          </div>
        </CaseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
