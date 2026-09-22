import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import {
  FileTextIcon,
  AwardIcon,
  BarChartIcon,
  HelpCircleIcon,
  TagIcon
} from "../../components/common/Icons.jsx";
import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({
    totalTests: 0,
    draftTests: 0,
    publishedTests: 0,
    scheduledTests: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    completedAttempts: 0,
    completionRate: 0,
    avgScore: 0,
    passRate: 0,
    recentTests: [],
    recentAttempts: []
  });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/reports/teacher");
      if (res.data?.report) {
        setMetrics(res.data.report);
      }
    } catch (err) {
      console.error("Teacher Dashboard error:", err);
      setError("Unable to load teacher performance analytics.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Faculty Teacher Dashboard">
      <div className="teacher-dash">
        {/* Welcome Header */}
        <div className="dash-welcome">
          <div>
            <span className="dash-role-badge">FACULTY PORTAL • {user?.subject ? `${user.subject} Department` : "Academic"}</span>
            <h2>Welcome, {user?.name || "Teacher"}!</h2>
            <p>Author and schedule assessments, build question banks, and monitor student evaluations.</p>
          </div>
          <button
            className="btn-create-test-action"
            onClick={() => navigate("/teacher/tests?action=create")}
          >
            + New Assessment
          </button>
        </div>

        {error && <div className="dash-alert error">Notice: {error}</div>}

        {/* Real KPI Cards - Clickable & Animated */}
        <div className="dash-kpi-grid">
          <div
            className="kpi-card card-tests"
            onClick={() => navigate("/teacher/tests")}
            role="button"
            tabIndex={0}
            title="Click to view tests"
          >
            <div className="kpi-icon" style={{ color: "#2563eb" }}>
              <FileTextIcon size={24} />
            </div>
            <div className="kpi-body">
              <strong>{loading ? "..." : metrics.totalTests}</strong>
              <span>My Tests</span>
              <small>{metrics.publishedTests} Published • {metrics.draftTests} Drafts</small>
            </div>
          </div>

          <div
            className="kpi-card card-questions"
            onClick={() => navigate("/teacher/batches")}
            role="button"
            tabIndex={0}
            title="Click to manage student batches"
          >
            <div className="kpi-icon" style={{ color: "#d97706" }}>
              <TagIcon size={24} />
            </div>
            <div className="kpi-body">
              <strong>Cohorts</strong>
              <span>Course Batches</span>
              <small>Manage student limits & cohorts</small>
            </div>
          </div>

          <div
            className="kpi-card card-attempts"
            onClick={() => navigate("/teacher/results")}
            role="button"
            tabIndex={0}
            title="Click to view student results"
          >
            <div className="kpi-icon" style={{ color: "#059669" }}>
              <BarChartIcon size={24} />
            </div>
            <div className="kpi-body">
              <strong>{loading ? "..." : metrics.totalAttempts}</strong>
              <span>Student Attempts</span>
              <small>{metrics.completedAttempts} Evaluated ({metrics.completionRate}%)</small>
            </div>
          </div>

          <div
            className="kpi-card card-score"
            onClick={() => navigate("/teacher/results")}
            role="button"
            tabIndex={0}
            title="Click to view score distribution"
          >
            <div className="kpi-icon" style={{ color: "#7c3aed" }}>
              <AwardIcon size={24} />
            </div>
            <div className="kpi-body">
              <strong>{loading ? "..." : `${metrics.avgScore}%`}</strong>
              <span>Average Student Score</span>
              <small>{metrics.passRate}% Pass Threshold</small>
            </div>
          </div>
        </div>

        {/* Secondary Split: Recent Tests & Recent Student Submissions */}
        <div className="teacher-split-grid">
          {/* Recent Tests Authored */}
          <div className="dash-card-box">
            <div className="dash-card-header">
              <h3>My Recent Examination Papers</h3>
              <button
                type="button"
                className="btn-header-link"
                onClick={() => navigate("/teacher/tests")}
              >
                View All ({metrics.totalTests}) →
              </button>
            </div>

            {metrics.recentTests?.length === 0 ? (
              <div className="dash-empty">
                <p>You haven't authored any examination papers yet.</p>
                <button
                  className="btn-create"
                  onClick={() => navigate("/teacher/tests?action=create")}
                >
                  + Create Your First Test
                </button>
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentTests.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <strong>{t.title}</strong>
                        </td>
                        <td>{t.subject || "General"}</td>
                        <td>{t.duration} Mins</td>
                        <td>
                          <span className={`status-pill ${t.status}`}>{t.status}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-table-sub"
                            onClick={() => navigate(`/teacher/tests/${t._id}/questions`)}
                          >
                            Edit Questions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Student Submissions on Teacher's Tests */}
          <div className="dash-card-box">
            <div className="dash-card-header">
              <h3>Recent Student Results</h3>
              <button
                type="button"
                className="btn-header-link"
                onClick={() => navigate("/teacher/results")}
              >
                All Results →
              </button>
            </div>

            {metrics.recentAttempts?.length === 0 ? (
              <div className="dash-empty">
                <p>No student submissions received on your tests yet.</p>
              </div>
            ) : (
              <div className="dash-attempts-list">
                {metrics.recentAttempts.map((item) => (
                  <div className="teacher-submission-row" key={item._id}>
                    <div className="student-initial">
                      {typeof item.studentId === "object" && item.studentId?.name
                        ? item.studentId.name.charAt(0).toUpperCase()
                        : "S"}
                    </div>
                    <div className="sub-info">
                      <div className="sub-top-row">
                        <strong>
                          {typeof item.studentId === "object" && item.studentId?.name
                            ? item.studentId.name
                            : "Enrolled Student"}
                        </strong>
                        <span className={`sub-score-badge ${item.passed ? "passed" : "failed"}`}>
                          {item.percentage ?? 0}% ({item.passed ? "Pass" : "Fail"})
                        </span>
                      </div>
                      <span className="sub-test-title">
                        {typeof item.testId === "object" && item.testId?.title
                          ? item.testId.title
                          : "Assessment Paper"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
