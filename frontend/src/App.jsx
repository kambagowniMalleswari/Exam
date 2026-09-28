import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PublicTests from "./pages/PublicTests.jsx";
import ContactUs from "./pages/ContactUs.jsx";
import Donate from "./pages/Donate.jsx";
import TeacherRequest from "./pages/TeacherRequest.jsx";
import JoinWithUs from "./pages/JoinWithUs.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Dedicated Role-Separated Sign-in Portals
import TeacherLogin from "./pages/teacher/TeacherLogin.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";


// Super Admin
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard.jsx";
import Organizations from "./pages/superadmin/Organizations.jsx";
import OrgRequestsManager from "./pages/superadmin/OrgRequestsManager.jsx";
import SuperAdminReports from "./pages/superadmin/SuperAdminReports.jsx";
import SuperAdminSubscriptions from "./pages/superadmin/SuperAdminSubscriptions.jsx";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Students from "./pages/admin/Students.jsx";
import BatchesManager from "./pages/admin/BatchesManager.jsx";
import Teachers from "./pages/admin/Teachers.jsx";
import Tests from "./pages/admin/Tests.jsx";
import Questions from "./pages/admin/Questions.jsx";
import AdminResults from "./pages/admin/AdminResults.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";
import AdminSubscription from "./pages/admin/AdminSubscription.jsx";
import TeacherRequestsManager from "./pages/admin/TeacherRequestsManager.jsx";

// Teacher
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import TeacherTests from "./pages/teacher/TeacherTests.jsx";
import TeacherQuestions from "./pages/teacher/TeacherQuestions.jsx";
import TeacherResults from "./pages/teacher/TeacherResults.jsx";

// Student
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import AvailableTests from "./pages/student/AvailableTests.jsx";
import StudentBatches from "./pages/student/StudentBatches.jsx";
import TestInstructions from "./pages/student/TestInstructions.jsx";
import TakeTest from "./pages/student/TakeTest.jsx";
import AttemptResult from "./pages/student/AttemptResult.jsx";
import MyAttempts from "./pages/student/MyAttempts.jsx";

// Unified Profile
import Profile from "./pages/Profile.jsx";

function App() {
  return (
    <Routes>
      {/* Public Institutional Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join-us" element={<JoinWithUs />} />
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
  );
}

export default App;