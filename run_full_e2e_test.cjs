// run_full_e2e_test.cjs
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';

// Minimal valid 1x1 PNG bytes
function createSyntheticPng() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82
  ]);
}

// Minimal valid PDF bytes with medical prescription text
function createSyntheticPdf() {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 12 Tf 72 712 Td (Rx: Paracetamol 500mg BID x 3 days) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
318
%%EOF`;
  return Buffer.from(content, 'utf8');
}

const testResults = [];

function recordResult(testName, status, details) {
  testResults.push({ testName, status, details });
  console.log(`[${status}] ${testName}: ${details}`);
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let json = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json') || contentType.includes('application/vnd.spring-boot.actuator')) {
    json = await res.json().catch(() => null);
  }
  return { status: res.status, headers: res.headers, json, res };
}

async function runAllTests() {
  console.log('=== STARTING MEDICONNECT E2E VERIFICATION SUITE ===\n');

  // ----------------------------------------------------
  // 1. Health & CORS Checks
  // ----------------------------------------------------
  try {
    const health = await request('/actuator/health');
    if (health.status === 200 && health.json?.status === 'UP') {
      recordResult('Health Endpoint (/actuator/health)', 'PASS', `Status 200, status: ${health.json.status}`);
    } else {
      recordResult('Health Endpoint (/actuator/health)', 'FAIL', `Expected 200 UP, got ${health.status}`);
    }
  } catch (err) {
    recordResult('Health Endpoint (/actuator/health)', 'FAIL', err.message);
  }

  try {
    const cors = await request('/api/v1/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    const allowOrigin = cors.headers.get('access-control-allow-origin');
    if (cors.status === 200 && (allowOrigin === 'http://localhost:5173' || allowOrigin === '*')) {
      recordResult('CORS Preflight (OPTIONS /api/v1/auth/login)', 'PASS', `Status 200, Allowed: ${allowOrigin}`);
    } else {
      recordResult('CORS Preflight (OPTIONS /api/v1/auth/login)', 'FAIL', `Status ${cors.status}, Allowed: ${allowOrigin}`);
    }
  } catch (err) {
    recordResult('CORS Preflight (OPTIONS /api/v1/auth/login)', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // 2. Authentication & Credentials Verification
  // ----------------------------------------------------
  let patientToken = null;
  let doctorToken = null;
  let adminToken = null;

  try {
    const patAuth = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@demo.com', password: 'Patient@123' })
    });
    if (patAuth.status === 200 && patAuth.json?.token) {
      patientToken = patAuth.json.token;
      recordResult('Patient Login (patient@demo.com)', 'PASS', `Token generated for ${patAuth.json.user?.name}`);
    } else {
      recordResult('Patient Login (patient@demo.com)', 'FAIL', `Status ${patAuth.status}`);
    }
  } catch (err) {
    recordResult('Patient Login (patient@demo.com)', 'FAIL', err.message);
  }

  try {
    const docAuth = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@demo.com', password: 'Doctor@123' })
    });
    if (docAuth.status === 200 && docAuth.json?.token) {
      doctorToken = docAuth.json.token;
      recordResult('Doctor Login (doctor@demo.com)', 'PASS', `Token generated for ${docAuth.json.user?.name}`);
    } else {
      recordResult('Doctor Login (doctor@demo.com)', 'FAIL', `Status ${docAuth.status}`);
    }
  } catch (err) {
    recordResult('Doctor Login (doctor@demo.com)', 'FAIL', err.message);
  }

  try {
    const admAuth = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Admin@123' })
    });
    if (admAuth.status === 200 && admAuth.json?.token) {
      adminToken = admAuth.json.token;
      recordResult('Admin Login (admin@demo.com)', 'PASS', `Token generated for ${admAuth.json.user?.name}`);
    } else {
      recordResult('Admin Login (admin@demo.com)', 'FAIL', `Status ${admAuth.status}`);
    }
  } catch (err) {
    recordResult('Admin Login (admin@demo.com)', 'FAIL', err.message);
  }

  try {
    const badAuth = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@demo.com', password: 'IncorrectPassword!@#' })
    });
    if (badAuth.status === 401) {
      recordResult('Invalid Credentials Rejection', 'PASS', `Status 401, error: ${badAuth.json?.message}`);
    } else {
      recordResult('Invalid Credentials Rejection', 'FAIL', `Expected 401, got ${badAuth.status}`);
    }
  } catch (err) {
    recordResult('Invalid Credentials Rejection', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // 3. Role-Based Authorization Enforcement
  // ----------------------------------------------------
  try {
    const patientDoctorAccess = await request('/api/v1/doctor/cases', {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (patientDoctorAccess.status === 403) {
      recordResult('Role Authorization: Patient blocked from Doctor APIs', 'PASS', `Status 403 Forbidden`);
    } else {
      recordResult('Role Authorization: Patient blocked from Doctor APIs', 'FAIL', `Expected 403, got ${patientDoctorAccess.status}`);
    }
  } catch (err) {
    recordResult('Role Authorization: Patient blocked from Doctor APIs', 'FAIL', err.message);
  }

  try {
    const patientAdminAccess = await request('/api/v1/admin/overview', {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (patientAdminAccess.status === 403) {
      recordResult('Role Authorization: Patient blocked from Admin APIs', 'PASS', `Status 403 Forbidden`);
    } else {
      recordResult('Role Authorization: Patient blocked from Admin APIs', 'FAIL', `Expected 403, got ${patientAdminAccess.status}`);
    }
  } catch (err) {
    recordResult('Role Authorization: Patient blocked from Admin APIs', 'FAIL', err.message);
  }

  try {
    const doctorAdminAccess = await request('/api/v1/admin/overview', {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    if (doctorAdminAccess.status === 403) {
      recordResult('Role Authorization: Doctor blocked from Admin APIs', 'PASS', `Status 403 Forbidden`);
    } else {
      recordResult('Role Authorization: Doctor blocked from Admin APIs', 'FAIL', `Expected 403, got ${doctorAdminAccess.status}`);
    }
  } catch (err) {
    recordResult('Role Authorization: Doctor blocked from Admin APIs', 'FAIL', err.message);
  }

  try {
    const unauthAccess = await request('/api/v1/cases');
    if (unauthAccess.status === 401) {
      recordResult('Unauthenticated Access Rejection', 'PASS', `Status 401 Unauthorized`);
    } else {
      recordResult('Unauthenticated Access Rejection', 'FAIL', `Expected 401, got ${unauthAccess.status}`);
    }
  } catch (err) {
    recordResult('Unauthenticated Access Rejection', 'FAIL', err.message);
  }

  // ----------------------------------------------------
  // 4. Patient End-to-End Workflow
  // ----------------------------------------------------
  let testCaseId = null;

  try {
    // A. Create Case Draft
    const draftRes = await request('/api/v1/cases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${patientToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patientName: 'Synthetic QA Patient',
        patientAge: 38,
        patientGender: 'Female',
        patientPhone: '+91 98765 43210',
        language: 'hi',
        severity: 'MODERATE',
        duration: '3 days',
        isEmergencyFlagged: false,
        primarySymptoms: ['headache', 'fever']
      })
    });
    if (draftRes.status === 201 && draftRes.json?.id) {
      testCaseId = draftRes.json.id;
      recordResult('Patient Workflow: Create Case Draft', 'PASS', `Created Case ID: ${testCaseId}, Status: ${draftRes.json.status}`);
    } else {
      recordResult('Patient Workflow: Create Case Draft', 'FAIL', `Status ${draftRes.status}`);
    }
  } catch (err) {
    recordResult('Patient Workflow: Create Case Draft', 'FAIL', err.message);
  }

  if (testCaseId) {
    try {
      // B. Save Case Questionnaire Answers
      const answersRes = await request(`/api/v1/cases/${testCaseId}/answers`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${patientToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: [
            { questionId: 'q_onset', questionText: 'When did your fever start?', answer: '3 days ago with moderate chills', audioUsed: false },
            { questionId: 'q_severity', questionText: 'How severe is the headache?', answer: 'Throbbing, worse in the afternoon', audioUsed: false }
          ]
        })
      });
      if (answersRes.status === 200 && answersRes.json?.symptomAnswers?.length === 2) {
        recordResult('Patient Workflow: Save Questionnaire Answers', 'PASS', `Saved ${answersRes.json.symptomAnswers.length} answers`);
      } else {
        recordResult('Patient Workflow: Save Questionnaire Answers', 'FAIL', `Status ${answersRes.status}, answers count: ${answersRes.json?.symptomAnswers?.length}`);
      }
    } catch (err) {
      recordResult('Patient Workflow: Save Questionnaire Answers', 'FAIL', err.message);
    }

    try {
      // C. Save Medical History
      const medHistoryRes = await request(`/api/v1/cases/${testCaseId}/medical-history`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${patientToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conditions: 'None',
          medications: 'Occasional paracetamol 500mg',
          allergies: 'Penicillin allergy noted in childhood',
          pastSurgeries: 'None',
          familyHistory: 'No major hereditary conditions',
          provided: true
        })
      });
      if (medHistoryRes.status === 200 && medHistoryRes.json?.medications) {
        recordResult('Patient Workflow: Save Medical History', 'PASS', `Saved medical history, allergies: ${medHistoryRes.json.allergies}`);
      } else {
        recordResult('Patient Workflow: Save Medical History', 'FAIL', `Status ${medHistoryRes.status}`);
      }
    } catch (err) {
      recordResult('Patient Workflow: Save Medical History', 'FAIL', err.message);
    }

    // D. Test Invalid File Upload (Disallowed Extension)
    try {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const invalidBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="malicious_script.exe"\r\nContent-Type: application/x-msdownload\r\n\r\nFakeExeContent\r\n--${boundary}--\r\n`)
      ]);
      const invalidUpload = await request(`/api/v1/patient/cases/${testCaseId}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${patientToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: invalidBody
      });
      if (invalidUpload.status === 400) {
        recordResult('Security & Validation: Reject Disallowed File (.exe)', 'PASS', `Status 400 Bad Request`);
      } else {
        recordResult('Security & Validation: Reject Disallowed File (.exe)', 'FAIL', `Expected 400, got ${invalidUpload.status}`);
      }
    } catch (err) {
      recordResult('Security & Validation: Reject Disallowed File (.exe)', 'FAIL', err.message);
    }

    // E. Upload Synthetic Prescription PNG Image
    let prescriptionImageReportId = null;
    try {
      const pngBytes = createSyntheticPng();
      const boundary = '----WebKitFormBoundaryPng7MA4YWxk';
      const pngBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="synthetic_prescription.png"\r\nContent-Type: image/png\r\n\r\n`),
        pngBytes,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);
      const uploadPngRes = await request(`/api/v1/patient/cases/${testCaseId}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${patientToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: pngBody
      });
      if (uploadPngRes.status === 201 && uploadPngRes.json?.id) {
        prescriptionImageReportId = uploadPngRes.json.id;
        recordResult('Patient Workflow: Upload Synthetic Prescription PNG', 'PASS', `Report ID: ${prescriptionImageReportId}, Name: ${uploadPngRes.json.name}`);
      } else {
        recordResult('Patient Workflow: Upload Synthetic Prescription PNG', 'FAIL', `Status ${uploadPngRes.status}`);
      }
    } catch (err) {
      recordResult('Patient Workflow: Upload Synthetic Prescription PNG', 'FAIL', err.message);
    }

    // F. Upload Synthetic Prescription PDF Document
    let prescriptionPdfReportId = null;
    try {
      const pdfBytes = createSyntheticPdf();
      const boundary = '----WebKitFormBoundaryPdf7MA4YWxk';
      const pdfBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="synthetic_rx_history.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
        pdfBytes,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);
      const uploadPdfRes = await request(`/api/v1/patient/cases/${testCaseId}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${patientToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: pdfBody
      });
      if (uploadPdfRes.status === 201 && uploadPdfRes.json?.id) {
        prescriptionPdfReportId = uploadPdfRes.json.id;
        recordResult('Patient Workflow: Upload Synthetic Prescription PDF', 'PASS', `Report ID: ${prescriptionPdfReportId}, Name: ${uploadPdfRes.json.name}`);
      } else {
        recordResult('Patient Workflow: Upload Synthetic Prescription PDF', 'FAIL', `Status ${uploadPdfRes.status}`);
      }
    } catch (err) {
      recordResult('Patient Workflow: Upload Synthetic Prescription PDF', 'FAIL', err.message);
    }

    // G. Verify Patient can list uploaded reports
    try {
      const listReports = await request(`/api/v1/patient/cases/${testCaseId}/reports`, {
        headers: { 'Authorization': `Bearer ${patientToken}` }
      });
      if (listReports.status === 200 && Array.isArray(listReports.json) && listReports.json.length >= 2) {
        recordResult('Patient Workflow: List Uploaded Documents', 'PASS', `Found ${listReports.json.length} documents attached to case`);
      } else {
        recordResult('Patient Workflow: List Uploaded Documents', 'FAIL', `Status ${listReports.status}`);
      }
    } catch (err) {
      recordResult('Patient Workflow: List Uploaded Documents', 'FAIL', err.message);
    }

    // H. Submit Case & Generate Token
    let generatedTokenNumber = null;
    try {
      const submitRes = await request(`/api/v1/cases/${testCaseId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${patientToken}` }
      });
      if (submitRes.status === 200 && submitRes.json?.token) {
        generatedTokenNumber = submitRes.json.token.tokenNumber;
        recordResult('Patient Workflow: Case Submission & Token Generation', 'PASS', `Token: ${generatedTokenNumber}, Dept: ${submitRes.json.token.department}`);
      } else {
        recordResult('Patient Workflow: Case Submission & Token Generation', 'FAIL', `Status ${submitRes.status}`);
      }
    } catch (err) {
      recordResult('Patient Workflow: Case Submission & Token Generation', 'FAIL', err.message);
    }

    // I. Test Resubmission Protection (prevent duplicate token / duplicate submission)
    try {
      const resubmit = await request(`/api/v1/cases/${testCaseId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${patientToken}` }
      });
      if (resubmit.status === 400 && resubmit.json?.message?.includes('already been submitted')) {
        recordResult('Patient Workflow: Submission Idempotency & Duplicate Prevention', 'PASS', `Safely rejected with 400: "${resubmit.json.message}"`);
      } else {
        recordResult('Patient Workflow: Submission Idempotency & Duplicate Prevention', 'FAIL', `Expected 400 rejection, got status ${resubmit.status}`);
      }
    } catch (err) {
      recordResult('Patient Workflow: Submission Idempotency & Duplicate Prevention', 'FAIL', err.message);
    }

    // ----------------------------------------------------
    // 5. Doctor End-to-End Workflow
    // ----------------------------------------------------
    try {
      // A. Doctor views triage queue and finds submitted case
      const doctorCases = await request('/api/v1/doctor/cases', {
        headers: { 'Authorization': `Bearer ${doctorToken}` }
      });
      const matchingCase = doctorCases.json?.content?.find(c => c.id === testCaseId);
      if (doctorCases.status === 200 && matchingCase) {
        recordResult('Doctor Workflow: Visibility in Triage Queue', 'PASS', `Found case ${testCaseId} in queue with token ${matchingCase.tokenNumber}`);
      } else {
        recordResult('Doctor Workflow: Visibility in Triage Queue', 'FAIL', `Case not found in queue or status ${doctorCases.status}`);
      }
    } catch (err) {
      recordResult('Doctor Workflow: Visibility in Triage Queue', 'FAIL', err.message);
    }

    try {
      // B. Doctor opens full case detail
      const caseDetail = await request(`/api/v1/doctor/cases/${testCaseId}`, {
        headers: { 'Authorization': `Bearer ${doctorToken}` }
      });
      if (caseDetail.status === 200 && caseDetail.json?.id === testCaseId) {
        recordResult('Doctor Workflow: Open Case Details', 'PASS', `Retrieved full case details, ${caseDetail.json.uploadedReports?.length || 0} reports, ${caseDetail.json.symptomAnswers?.length || 0} answers`);
      } else {
        recordResult('Doctor Workflow: Open Case Details', 'FAIL', `Status ${caseDetail.status}`);
      }
    } catch (err) {
      recordResult('Doctor Workflow: Open Case Details', 'FAIL', err.message);
    }

    try {
      // C. Doctor downloads/views original uploaded prescription
      if (prescriptionImageReportId) {
        const viewDoc = await fetch(`${BASE_URL}/api/v1/doctor/cases/${testCaseId}/reports/${prescriptionImageReportId}/view`, {
          headers: { 'Authorization': `Bearer ${doctorToken}` }
        });
        const contentType = viewDoc.headers.get('content-type');
        const docBuffer = await viewDoc.arrayBuffer();
        if (viewDoc.status === 200 && contentType?.includes('image/png') && docBuffer.byteLength > 0) {
          recordResult('Doctor Workflow: View Original Prescription Image', 'PASS', `Status 200, Content-Type: ${contentType}, Size: ${docBuffer.byteLength} bytes`);
        } else {
          recordResult('Doctor Workflow: View Original Prescription Image', 'FAIL', `Status ${viewDoc.status}, Type: ${contentType}`);
        }
      }
    } catch (err) {
      recordResult('Doctor Workflow: View Original Prescription Image', 'FAIL', err.message);
    }

    // D. Doctor generates AI Clinical Report using real Gemini model
    let generatedAiReport = null;
    try {
      console.log('Invoking Gemini generate-report for case:', testCaseId);
      let aiReportRes = await request(`/api/v1/doctor/cases/${testCaseId}/generate-report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${doctorToken}` }
      });
      if (aiReportRes.status !== 200) {
        console.log(`Initial generate-report returned status ${aiReportRes.status}. Retrying after 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        aiReportRes = await request(`/api/v1/doctor/cases/${testCaseId}/generate-report`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${doctorToken}` }
        });
      }
      if (aiReportRes.status === 200 && aiReportRes.json?.chiefComplaint) {
        generatedAiReport = aiReportRes.json;
        recordResult('Doctor Workflow: Generate AI Clinical Report via Gemini', 'PASS', 
          `Model: ${generatedAiReport.modelName}, DemoGenerated: ${generatedAiReport.isDemoGenerated}, ChiefComplaint: "${generatedAiReport.chiefComplaint.substring(0, 60)}..."`);
      } else {
        recordResult('Doctor Workflow: Generate AI Clinical Report via Gemini', 'FAIL', `Status ${aiReportRes.status}, Body: ${JSON.stringify(aiReportRes.json)}`);
      }
    } catch (err) {
      recordResult('Doctor Workflow: Generate AI Clinical Report via Gemini', 'FAIL', err.message);
    }

    // E. Doctor retrieves existing AI Clinical Report
    try {
      const getReportRes = await request(`/api/v1/doctor/cases/${testCaseId}/report`, {
        headers: { 'Authorization': `Bearer ${doctorToken}` }
      });
      if (getReportRes.status === 200 && getReportRes.json?.chiefComplaint) {
        recordResult('Doctor Workflow: Retrieve Generated AI Report', 'PASS', `Retrieved report successfully`);
      } else {
        recordResult('Doctor Workflow: Retrieve Generated AI Report', 'FAIL', `Status ${getReportRes.status}`);
      }
    } catch (err) {
      recordResult('Doctor Workflow: Retrieve Generated AI Report', 'FAIL', err.message);
    }

    // F. Doctor submits clinical review notes and recommendations
    try {
      const reviewRes = await request(`/api/v1/doctor/cases/${testCaseId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'REVIEWED',
          doctorNotes: 'Patient reviewed via intake queue. Mild viral prodrome suspected. Rest and hydration recommended.',
          followUpRequired: true,
          clinicalRecommendations: 'Monitor temperature. If fever exceeds 101F after 48h, order CBC and dengue serology.'
        })
      });
      if (reviewRes.status === 200 && reviewRes.json?.status === 'REVIEWED') {
        recordResult('Doctor Workflow: Submit Clinical Review', 'PASS', `Status set to REVIEWED, Review ID: ${reviewRes.json.id}`);
      } else {
        recordResult('Doctor Workflow: Submit Clinical Review', 'FAIL', `Status ${reviewRes.status}`);
      }
    } catch (err) {
      recordResult('Doctor Workflow: Submit Clinical Review', 'FAIL', err.message);
    }

    // ----------------------------------------------------
    // 6. Admin End-to-End Workflow
    // ----------------------------------------------------
    try {
      const overviewRes = await request('/api/v1/admin/overview', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (overviewRes.status === 200 && overviewRes.json?.status === 'ACTIVE') {
        recordResult('Admin Workflow: Admin Overview', 'PASS', `Admin dashboard overview active`);
      } else {
        recordResult('Admin Workflow: Admin Overview', 'FAIL', `Status ${overviewRes.status}`);
      }
    } catch (err) {
      recordResult('Admin Workflow: Admin Overview', 'FAIL', err.message);
    }

    try {
      const adminCasesRes = await request('/api/v1/admin/cases', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (adminCasesRes.status === 200 && Array.isArray(adminCasesRes.json?.content)) {
        recordResult('Admin Workflow: List All System Cases', 'PASS', `Total cases in system: ${adminCasesRes.json.totalElements}`);
      } else {
        recordResult('Admin Workflow: List All System Cases', 'FAIL', `Status ${adminCasesRes.status}`);
      }
    } catch (err) {
      recordResult('Admin Workflow: List All System Cases', 'FAIL', err.message);
    }

    try {
      const triageStats = await request('/api/v1/admin/triage/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (triageStats.status === 200 && triageStats.json?.totalSubmitted !== undefined) {
        recordResult('Admin Workflow: Live Triage Queue Metrics', 'PASS', `Submitted: ${triageStats.json.totalSubmitted}, Pending: ${triageStats.json.pendingReview}, Reviewed: ${triageStats.json.reviewedCases}`);
      } else {
        recordResult('Admin Workflow: Live Triage Queue Metrics', 'FAIL', `Status ${triageStats.status}`);
      }
    } catch (err) {
      recordResult('Admin Workflow: Live Triage Queue Metrics', 'FAIL', err.message);
    }

    // ----------------------------------------------------
    // 7. Doctor Assignment & Dispatch Workflows (Priority 1)
    // ----------------------------------------------------
    let assignedDoctorId = null;
    let assignedDoctorName = null;

    // A. Admin fetches registered doctors
    try {
      const docsRes = await request('/api/v1/admin/doctors', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (docsRes.status === 200 && Array.isArray(docsRes.json) && docsRes.json.length > 0) {
        const docUser = docsRes.json.find(d => d.email === 'doctor@demo.com') || docsRes.json[0];
        assignedDoctorId = docUser.id;
        assignedDoctorName = docUser.name;
        recordResult('Admin Workflow: List Available Doctors', 'PASS', `Found ${docsRes.json.length} active doctor(s), Selected: ${assignedDoctorName} (${docUser.email})`);
      } else {
        recordResult('Admin Workflow: List Available Doctors', 'FAIL', `Status ${docsRes.status}`);
      }
    } catch (err) {
      recordResult('Admin Workflow: List Available Doctors', 'FAIL', err.message);
    }

    // B. Role enforcement: Patient cannot fetch doctor list
    try {
      const patientDocList = await request('/api/v1/admin/doctors', {
        headers: { 'Authorization': `Bearer ${patientToken}` }
      });
      if (patientDocList.status === 403) {
        recordResult('Security RBAC: Patient Forbidden from /admin/doctors', 'PASS', `HTTP 403 Forbidden correctly enforced`);
      } else {
        recordResult('Security RBAC: Patient Forbidden from /admin/doctors', 'FAIL', `Expected 403, got ${patientDocList.status}`);
      }
    } catch (err) {
      recordResult('Security RBAC: Patient Forbidden from /admin/doctors', 'FAIL', err.message);
    }

    // C. Role enforcement: Doctor cannot fetch admin doctor list
    try {
      const doctorDocList = await request('/api/v1/admin/doctors', {
        headers: { 'Authorization': `Bearer ${doctorToken}` }
      });
      if (doctorDocList.status === 403) {
        recordResult('Security RBAC: Doctor Forbidden from /admin/doctors', 'PASS', `HTTP 403 Forbidden correctly enforced`);
      } else {
        recordResult('Security RBAC: Doctor Forbidden from /admin/doctors', 'FAIL', `Expected 403, got ${doctorDocList.status}`);
      }
    } catch (err) {
      recordResult('Security RBAC: Doctor Forbidden from /admin/doctors', 'FAIL', err.message);
    }

    // D. Security enforcement: Patient cannot assign doctor
    try {
      const patientAssign = await request(`/api/v1/admin/cases/${testCaseId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${patientToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doctorId: assignedDoctorId })
      });
      if (patientAssign.status === 403) {
        recordResult('Security RBAC: Patient Forbidden from Assigning Doctor', 'PASS', `HTTP 403 Forbidden correctly enforced`);
      } else {
        recordResult('Security RBAC: Patient Forbidden from Assigning Doctor', 'FAIL', `Expected 403, got ${patientAssign.status}`);
      }
    } catch (err) {
      recordResult('Security RBAC: Patient Forbidden from Assigning Doctor', 'FAIL', err.message);
    }

    // E. Security enforcement: Unauthorized doctor cannot call admin assignment endpoint
    try {
      const doctorAssign = await request(`/api/v1/admin/cases/${testCaseId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doctorId: assignedDoctorId })
      });
      if (doctorAssign.status === 403) {
        recordResult('Security RBAC: Doctor Forbidden from /admin/cases/assign', 'PASS', `HTTP 403 Forbidden correctly enforced`);
      } else {
        recordResult('Security RBAC: Doctor Forbidden from /admin/cases/assign', 'FAIL', `Expected 403, got ${doctorAssign.status}`);
      }
    } catch (err) {
      recordResult('Security RBAC: Doctor Forbidden from /admin/cases/assign', 'FAIL', err.message);
    }

    // F. Admin successfully assigns doctor to case
    try {
      const assignRes = await request(`/api/v1/admin/cases/${testCaseId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doctorId: assignedDoctorId })
      });
      if (assignRes.status === 200 && assignRes.json?.reviewedByDoctorId === assignedDoctorId) {
        recordResult('Admin Workflow: Assign Doctor to Submitted Case', 'PASS', 
          `Assigned case ${testCaseId} to ${assignRes.json.reviewedByDoctorName} (ID: ${assignRes.json.reviewedByDoctorId})`);
      } else {
        recordResult('Admin Workflow: Assign Doctor to Submitted Case', 'FAIL', `Status ${assignRes.status}, Body: ${JSON.stringify(assignRes.json)}`);
      }
    } catch (err) {
      recordResult('Admin Workflow: Assign Doctor to Submitted Case', 'FAIL', err.message);
    }

    // G. Doctor sees assigned case when filtering by 'assignedToMe=true'
    try {
      const assignedQueueRes = await request('/api/v1/doctor/cases?assignedToMe=true', {
        headers: { 'Authorization': `Bearer ${doctorToken}` }
      });
      const items = assignedQueueRes.json?.content || [];
      const foundInQueue = items.some(c => (c.id === testCaseId || c.caseId === testCaseId));
      if (assignedQueueRes.status === 200 && foundInQueue) {
        recordResult('Doctor Workflow: Case Visible in Assigned Queue (assignedToMe=true)', 'PASS', 
          `Case ${testCaseId} found in doctor's personalized assigned queue (${items.length} total assigned)`);
      } else {
        recordResult('Doctor Workflow: Case Visible in Assigned Queue (assignedToMe=true)', 'FAIL', 
          `Status: ${assignedQueueRes.status}, Found: ${foundInQueue}, Queue Size: ${items.length}`);
      }
    } catch (err) {
      recordResult('Doctor Workflow: Case Visible in Assigned Queue (assignedToMe=true)', 'FAIL', err.message);
    }

    // H. Admin unassigns case back to general queue (doctorId: null)
    try {
      const unassignRes = await request(`/api/v1/admin/cases/${testCaseId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doctorId: null })
      });
      if (unassignRes.status === 200 && unassignRes.json?.reviewedByDoctorId == null) {
        recordResult('Admin Workflow: Unassign Doctor (Return to General Queue)', 'PASS', `Case ${testCaseId} returned to unassigned general queue`);
      } else {
        recordResult('Admin Workflow: Unassign Doctor (Return to General Queue)', 'FAIL', `Status ${unassignRes.status}`);
      }
    } catch (err) {
      recordResult('Admin Workflow: Unassign Doctor (Return to General Queue)', 'FAIL', err.message);
    }

    // I. Doctor assigned queue no longer contains unassigned case
    try {
      const afterUnassignQueue = await request('/api/v1/doctor/cases?assignedToMe=true', {
        headers: { 'Authorization': `Bearer ${doctorToken}` }
      });
      const items = afterUnassignQueue.json?.content || [];
      const foundInQueue = items.some(c => (c.id === testCaseId || c.caseId === testCaseId));
      if (afterUnassignQueue.status === 200 && !foundInQueue) {
        recordResult('Doctor Workflow: Unassigned Case Excluded from Assigned Queue', 'PASS', `Confirmed case no longer present in assignedToMe list`);
      } else {
        recordResult('Doctor Workflow: Unassigned Case Excluded from Assigned Queue', 'FAIL', `Found unexpectedly: ${foundInQueue}`);
      }
    } catch (err) {
      recordResult('Doctor Workflow: Unassigned Case Excluded from Assigned Queue', 'FAIL', err.message);
    }

    // J. Reassign back to doctor to maintain final clinical assignment state
    try {
      const reassignRes = await request(`/api/v1/admin/cases/${testCaseId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doctorId: assignedDoctorId })
      });
      if (reassignRes.status === 200 && reassignRes.json?.reviewedByDoctorId === assignedDoctorId) {
        recordResult('Admin Workflow: Finalize Doctor Assignment', 'PASS', `Case ${testCaseId} reassigned to ${assignedDoctorName}`);
      } else {
        recordResult('Admin Workflow: Finalize Doctor Assignment', 'FAIL', `Status ${reassignRes.status}`);
      }
    } catch (err) {
      recordResult('Admin Workflow: Finalize Doctor Assignment', 'FAIL', err.message);
    }
  }

  // ----------------------------------------------------
  // Summary Report
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log('                 FINAL TEST MATRIX                    ');
  console.log('======================================================');
  let passCount = 0;
  let failCount = 0;
  for (const r of testResults) {
    if (r.status === 'PASS') passCount++;
    else failCount++;
    console.log(`${r.status.padEnd(5)} | ${r.testName.padEnd(48)} | ${r.details}`);
  }
  console.log('======================================================');
  console.log(`TOTAL: ${testResults.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('======================================================\n');
}

runAllTests();
