import React, { Suspense, lazy } from "react";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public Pages (Lazy Loaded for maximum initial load performance)
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ContactUs = lazy(() => import("./pages/ContactUs.jsx"));
const Donate = lazy(() => import("./pages/Donate.jsx"));
const PublicTests = lazy(() => import("./pages/PublicTests.jsx"));
const JoinWithUs = lazy(() => import("./pages/JoinWithUs.jsx"));
const AboutUs = lazy(() => import("./pages/AboutUs.jsx"));
const PolicyPage = lazy(() => import("./pages/PolicyPage.jsx"));
const Unauthorized = lazy(() => import("./pages/Unauthorized.jsx"));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard.jsx"));
const Organizations = lazy(() => import("./pages/superadmin/Organizations.jsx"));
const OrgRequestsManager = lazy(() => import("./pages/superadmin/OrgRequestsManager.jsx"));
const SuperAdminReports = lazy(() => import("./pages/superadmin/SuperAdminReports.jsx"));
const SuperAdminSubscriptions = lazy(() => import("./pages/superadmin/SuperAdminSubscriptions.jsx"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const Students = lazy(() => import("./pages/admin/Students.jsx"));
const BatchesManager = lazy(() => import("./pages/admin/BatchesManager.jsx"));
const Teachers = lazy(() => import("./pages/admin/Teachers.jsx"));
const Tests = lazy(() => import("./pages/admin/Tests.jsx"));
const Questions = lazy(() => import("./pages/admin/Questions.jsx"));
const AdminResults = lazy(() => import("./pages/admin/AdminResults.jsx"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports.jsx"));
const AdminSubscription = lazy(() => import("./pages/admin/AdminSubscription.jsx"));
const TeacherRequestsManager = lazy(() => import("./pages/admin/TeacherRequestsManager.jsx"));

// Teacher Pages
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard.jsx"));
const TeacherTests = lazy(() => import("./pages/teacher/TeacherTests.jsx"));
const TeacherQuestions = lazy(() => import("./pages/teacher/TeacherQuestions.jsx"));
const TeacherResults = lazy(() => import("./pages/teacher/TeacherResults.jsx"));

// Student Pages
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard.jsx"));
const AvailableTests = lazy(() => import("./pages/student/AvailableTests.jsx"));
const StudentBatches = lazy(() => import("./pages/student/StudentBatches.jsx"));
const TestInstructions = lazy(() => import("./pages/student/TestInstructions.jsx"));
const TakeTest = lazy(() => import("./pages/student/TakeTest.jsx"));
const AttemptResult = lazy(() => import("./pages/student/AttemptResult.jsx"));
const MyAttempts = lazy(() => import("./pages/student/MyAttempts.jsx"));

// Unified Profile
const Profile = lazy(() => import("./pages/Profile.jsx"));

const PageFallbackLoader = () => (
  <div style={{
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    gap: "14px"
  }}>
    <div style={{
      width: "38px",
      height: "38px",
      border: "3px solid #e2e8f0",
      borderTopColor: "#6366f1",
      borderRadius: "50%",
      animation: "vmsSpin 0.75s linear infinite"
    }} />
    <span style={{
      fontSize: "13.5px",
      fontWeight: 500,
      color: "#64748b",
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      Loading...
    </span>
    <style>{`
      @keyframes vmsSpin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageFallbackLoader />}>
      <Routes>
      {/* Public Institutional Routes & Unified Sign-In */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/teacher/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join-us" element={<JoinWithUs />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/terms" element={<PolicyPage defaultType="terms" />} />
      <Route path="/privacy" element={<PolicyPage defaultType="privacy" />} />
      <Route path="/refund-policy" element={<PolicyPage defaultType="refund" />} />
      <Route path="/shipping-policy" element={<PolicyPage defaultType="shipping" />} />
      <Route path="/policies/:policyType" element={<PolicyPage />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/public-tests" element={<PublicTests />} />

      {/* Super Admin Canonical Routes */}
      <Route
        path="/superadmin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/organizations"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <Organizations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/org-requests"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <OrgRequestsManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/teacher-requests"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <TeacherRequestsManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/reports"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/subscriptions"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminSubscriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/*"
        element={<Navigate to="/superadmin/dashboard" replace />}
      />

      {/* Super Admin Legacy/Transitional Route Redirects */}
      <Route path="/super-admin/dashboard" element={<Navigate to="/superadmin/dashboard" replace />} />
      <Route path="/super-admin/organizations" element={<Navigate to="/superadmin/organizations" replace />} />
      <Route path="/super-admin/org-requests" element={<Navigate to="/superadmin/org-requests" replace />} />
      <Route path="/super-admin/teacher-requests" element={<Navigate to="/superadmin/teacher-requests" replace />} />
      <Route path="/super-admin/reports" element={<Navigate to="/superadmin/reports" replace />} />
      <Route path="/super-admin/subscriptions" element={<Navigate to="/superadmin/subscriptions" replace />} />
      <Route path="/super-admin/*" element={<Navigate to="/superadmin/dashboard" replace />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/batches"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <BatchesManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <Teachers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teacher-requests"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <TeacherRequestsManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <Tests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests/:testId/questions"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <Questions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/results"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <AdminResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subscription"
        element={
          <ProtectedRoute allowedRoles={["admin", "org_admin"]}>
            <AdminSubscription />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Teacher Routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherTests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/batches"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <BatchesManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests/:testId/questions"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherQuestions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/results"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherResults />
          </ProtectedRoute>
        }
      />
      <Route path="/teacher/*" element={<Navigate to="/teacher/dashboard" replace />} />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/available-tests"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AvailableTests />
          </ProtectedRoute>
        }
      />
      <Route path="/student/tests" element={<Navigate to="/student/available-tests" replace />} />
      <Route
        path="/student/batches"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentBatches />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/test/:testId/instructions"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <TestInstructions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/test/:attemptId/take"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <TakeTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/result/:attemptId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AttemptResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-attempts"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyAttempts />
          </ProtectedRoute>
        }
      />
      <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />

      {/* Unified Profile Route for All Account Roles */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "admin", "org_admin", "teacher", "student"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Unknown Routes Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
  );
}

export default App;