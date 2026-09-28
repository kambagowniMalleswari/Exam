// Organisation Admin Dashboard with 100% Real Live Metrics & Institutional Design
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import {
  GraduationCapIcon,
  UsersIcon,
  FileTextIcon,
  AwardIcon,
  AlertTriangleIcon,
  HourglassIcon
} from "../../components/common/Icons.jsx";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    pendingTeacherRequests: 0,
    totalTests: 0,
    publishedTests: 0,
    draftTests: 0,
    totalAttempts: 0,
    completedAttempts: 0,
    passRate: 0,
    averagePercentage: 0,
    highestPercentage: 0,
    recentAttempts: [],
    subjectBreakdown: []
  });
  const [recentTests, setRecentTests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [reportRes, testsRes] = await Promise.all([
        api.get("/reports/organization"),
        api.get("/tests")
      ]);

      const rep = reportRes.data?.report || {};
      const tests = testsRes.data?.tests || [];

      setStats({
        totalStudents: rep.totalStudents || 0,
        activeStudents: rep.activeStudents || 0,
        totalTeachers: rep.totalTeachers || 0,
        activeTeachers: rep.activeTeachers || 0,
        pendingTeacherRequests: rep.pendingTeacherRequests || 0,
        totalTests: rep.totalTests || tests.length,
        publishedTests: rep.publishedTests || tests.filter((t) => t.status === "published").length,
        draftTests: rep.draftTests || tests.filter((t) => t.status === "draft").length,
        totalAttempts: rep.totalAttempts || 0,
        completedAttempts: rep.completedAttempts || 0,
        passRate: rep.passRate || 0,
        averagePercentage: rep.averagePercentage || 0,
        highestPercentage: rep.highestPercentage || 0,
        recentAttempts: rep.recentAttempts || [],
        subjectBreakdown: rep.subjectBreakdown || []
      });

      setRecentTests(tests.slice(0, 5));
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      setError("Failed to load organization metrics.");
    } finally {
      setLoading(false);
    }
  };

  const orgName = user?.organizationId?.name || "Institution";

  return (
    <DashboardLayout title="Organisation Administration">
      <div className="admin-dashboard">
        {/* Top Welcome Banner */}
        <div className="admin-dashboard-intro">
          <div>
            <span className="admin-org-pill">INSTITUTIONAL PORTAL • {orgName}</span>
            <h2>{orgName} Overview</h2>
            <p>Real-time academic monitoring of faculty rosters, student examinations, and score distributions.</p>
          </div>

          <div className="admin-intro-actions">
            {stats.pendingTeacherRequests > 0 && (
              <button
                type="button"
                className="btn-pending-faculty"
                onClick={() => navigate("/admin/teacher-requests")}
              >
                <FileTextIcon size={16} />
                <strong>{stats.pendingTeacherRequests} Faculty Request{stats.pendingTeacherRequests > 1 ? "s" : ""}</strong>
              </button>
            )}
            <button
              className="admin-primary-button"
              onClick={() => navigate("/admin/tests?action=create")}
            >
              + Create Examination
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-alert error">
            <AlertTriangleIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Grid (4 Columns) - Clickable & Animated */}
        <div className="admin-stats-grid">
          {/* Students Card */}
          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/students")}
            role="button"
            tabIndex={0}
            title="Click to view students"
          >
            <div className="admin-stat-header">
              <span>Total Students</span>
              <div className="admin-stat-icon" style={{ color: "#2563eb" }}>
                <GraduationCapIcon size={22} />
              </div>
            </div>
            <h3>{loading ? "..." : stats.totalStudents}</h3>
            <div className="admin-stat-meta">
              <span className="meta-green">● {stats.activeStudents} Active</span>
              <span>{stats.totalStudents - stats.activeStudents} Inactive</span>
            </div>
          </div>

          {/* Teachers Card */}
          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/teachers")}
            role="button"
            tabIndex={0}
            title="Click to view faculty teachers"
          >
            <div className="admin-stat-header">
              <span>Faculty Teachers</span>
              <div className="admin-stat-icon" style={{ color: "#059669" }}>
                <UsersIcon size={22} />
              </div>
            </div>
            <h3>{loading ? "..." : stats.totalTeachers}</h3>
            <div className="admin-stat-meta">
              <span className="meta-green">● {stats.activeTeachers} Active</span>
              {stats.pendingTeacherRequests > 0 && (
                <span className="meta-amber"><HourglassIcon size={13} /> {stats.pendingTeacherRequests} Pending</span>
              )}
            </div>
          </div>

          {/* Tests Card */}
          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/tests")}
            role="button"
            tabIndex={0}
            title="Click to view examination modules"
          >
            <div className="admin-stat-header">
              <span>Examination Modules</span>
              <div className="admin-stat-icon" style={{ color: "#d97706" }}>
                <FileTextIcon size={22} />
              </div>
            </div>
            <h3>{loading ? "..." : stats.totalTests}</h3>
            <div className="admin-stat-meta">
              <span className="meta-blue">{stats.publishedTests} Published</span>
              <span>{stats.draftTests} Drafts</span>
            </div>
          </div>

          {/* Attempts & Performance */}
          <div
            className="admin-stat-card"
            onClick={() => navigate("/admin/results")}
            role="button"
            tabIndex={0}
            title="Click to view student pass rates and scores"
          >
            <div className="admin-stat-header">
              <span>Student Pass Rate</span>
              <div className="admin-stat-icon" style={{ color: "#7c3aed" }}>
                <AwardIcon size={22} />
              </div>
            </div>
            <h3>{loading ? "..." : `${stats.passRate}%`}</h3>
            <div className="admin-stat-meta">
              <span>Avg: {stats.averagePercentage}%</span>
              <span>High: {stats.highestPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Analytics Section Split: Subject Breakdown & Recent Student Activity */}
        <div className="admin-analytics-row">
          {/* Subject Distribution */}
          <div className="admin-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>Subject-Wise Performance</h3>
                <p>Exam volume and student average percentage per subject</p>
              </div>
              <span className="panel-badge">{stats.subjectBreakdown.length} Subjects</span>
            </div>

            {stats.subjectBreakdown.length === 0 ? (
              <div className="panel-empty-state">
                <p>No subject performance records available yet.</p>
              </div>
            ) : (
              <div className="panel-subject-list">
                {stats.subjectBreakdown.map((subj) => (
                  <div className="panel-subject-item" key={subj.subject}>
                    <div className="subj-title-row">
                      <strong>{subj.subject}</strong>
                      <span className="subj-pct">{subj.averagePercentage}% Avg</span>
                    </div>
                    <div className="subj-detail-bar">
                      <div
                        className="subj-bar-inner"
                        style={{ width: `${Math.min(subj.averagePercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="subj-footer-row">
                      <small>{subj.attempts} attempts completed</small>
                      <small className="pass-pill">{subj.passRate}% pass rate</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Student Exam Attempts */}
          <div className="admin-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>Recent Student Activity</h3>
                <p>Latest evaluated assessments submitted by enrolled students</p>
              </div>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => navigate("/admin/results")}
              >
                View All Results →
              </button>
            </div>

            {stats.recentAttempts.length === 0 ? (
              <div className="panel-empty-state">
                <p>No student exam attempts recorded yet.</p>
              </div>
            ) : (
              <div className="admin-activity-list">
                {stats.recentAttempts.map((item) => (
                  <div className="activity-item-row" key={item._id}>
                    <div className="act-avatar">
                      {item.studentId?.name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div className="act-details">
                      <div className="act-name-row">
                        <strong>{item.studentId?.name || "Student"}</strong>
                        <span className={`act-score-tag ${item.passed ? "passed" : "failed"}`}>
                          {item.percentage}% ({item.passed ? "Pass" : "Fail"})
                        </span>
                      </div>
                      <span className="act-test-name">{item.testId?.title || "Examination Module"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tests Table */}
        <div className="admin-table-card">
          <div className="table-card-top">
            <div>
              <h3>Organization Tests</h3>
              <p>Active examinations managed within your institutional boundary</p>
            </div>
            <button
              type="button"
              className="btn-outline-action"
              onClick={() => navigate("/admin/tests")}
            >
              Manage All Tests ({stats.totalTests})
            </button>
          </div>

          {recentTests.length === 0 ? (
            <div className="panel-empty-state">
              <p>No tests created for this organization yet.</p>
            </div>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-main-table">
                <thead>
                  <tr>
                    <th>Test Title</th>
                    <th>Subject</th>
                    <th>Duration</th>
                    <th>Passing Marks</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTests.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <strong>{t.title}</strong>
                      </td>
                      <td>
                        <span className="subject-tag">{t.subject || "General"}</span>
                      </td>
                      <td>{t.duration} Mins</td>
                      <td>{t.passingPercentage}% ({t.passingMarks || 0} pts)</td>
                      <td>
                        <span className={`status-pill ${t.status}`}>
                          {t.status === "published" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-preview"
                          onClick={() => navigate(`/admin/tests/${t._id}/questions`)}
                        >
                          Questions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;