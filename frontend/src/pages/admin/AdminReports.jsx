import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  PrinterIcon,
  RefreshIcon,
  AlertTriangleIcon,
  BarChartIcon,
  GraduationCapIcon,
  UsersIcon,
  FileTextIcon,
  TargetIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AwardIcon
} from "../../components/common/Icons.jsx";
import "./AdminReports.css";

const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports/organization");
      setReport(res.data.report || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics report.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <DashboardLayout title="Organization Analytics & Reports">
      <div className="admin-reports-page">
        {/* Header */}
        <div className="rep-header">
          <div>
            <h2>Organization Analytics & Reports</h2>
            <p>Comprehensive institutional performance, exam telemetry, and subject mastery breakdown.</p>
          </div>
          <div className="rep-actions">
            <button className="btn-print" onClick={handlePrint}>
              <PrinterIcon size={15} />
              <span>Print Report</span>
            </button>
            <button className="btn-refresh" onClick={fetchReport}>
              <RefreshIcon size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="rep-state">
            <div className="spinner"></div>
            <p>Compiling organization report telemetry...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rep-state">
            <AlertTriangleIcon size={32} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !report && (
          <div className="rep-state">
            <BarChartIcon size={32} />
            <h3>No data available</h3>
            <p>Activity will appear here once tests are created and attempted.</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && report && (
          <div className="rep-content">
            {/* Top KPI Grid */}
            <div className="rep-kpi-grid">
              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#2563eb" }}>
                  <GraduationCapIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">{report.totalStudents}</span>
                  <span className="rep-label">Enrolled Students</span>
                </div>
              </div>

              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#059669" }}>
                  <UsersIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">{report.totalTeachers}</span>
                  <span className="rep-label">Active Instructors</span>
                </div>
              </div>

              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#d97706" }}>
                  <FileTextIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">
                    {report.publishedTests} <small>/ {report.totalTests}</small>
                  </span>
                  <span className="rep-label">Published / Total Tests</span>
                </div>
              </div>

              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#7c3aed" }}>
                  <TargetIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">{report.totalAttempts}</span>
                  <span className="rep-label">Total Exam Attempts</span>
                </div>
              </div>

              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#16a34a" }}>
                  <TrendingUpIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">{report.passRate}%</span>
                  <span className="rep-label">Institutional Pass Rate</span>
                </div>
              </div>

              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#0284c7" }}>
                  <BarChartIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">{report.averagePercentage}%</span>
                  <span className="rep-label">Average Score</span>
                </div>
              </div>

              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#eab308" }}>
                  <AwardIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">{report.highestPercentage}%</span>
                  <span className="rep-label">Highest Score</span>
                </div>
              </div>

              <div className="rep-card">
                <div className="rep-card-icon" style={{ color: "#dc2626" }}>
                  <TrendingDownIcon size={22} />
                </div>
                <div className="rep-card-body">
                  <span className="rep-num">{report.lowestPercentage}%</span>
                  <span className="rep-label">Lowest Score</span>
                </div>
              </div>
            </div>

            {/* Visual Section: Pass/Fail Breakdown & Subject Breakdown */}
            <div className="rep-two-col">
              {/* Exam Outcome Gauge */}
              <div className="rep-panel">
                <h3>Exam Success Distribution</h3>
                <p className="panel-desc">Pass vs fail ratio across all student submissions.</p>

                <div className="outcome-stats">
                  <div className="outcome-box passed">
                    <span className="outcome-count">{report.passed}</span>
                    <span className="outcome-label">Passed Exams</span>
                  </div>
                  <div className="outcome-box failed">
                    <span className="outcome-count">{report.failed}</span>
                    <span className="outcome-label">Failed Exams</span>
                  </div>
                </div>

                <div className="outcome-progress-wrapper">
                  <div className="outcome-progress-labels">
                    <span>Pass: {report.passRate}%</span>
                    <span>Fail: {(100 - report.passRate).toFixed(1)}%</span>
                  </div>
                  <div className="outcome-bar-track">
                    <div
                      className="outcome-bar-pass"
                      style={{ width: `${report.passRate}%` }}
                    ></div>
                    <div
                      className="outcome-bar-fail"
                      style={{ width: `${100 - report.passRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="rep-panel">
                <h3>Subject Mastery Breakdown</h3>
                <p className="panel-desc">Average percentage performance per subject area.</p>

                {(!report.subjectBreakdown || report.subjectBreakdown.length === 0) ? (
                  <p className="no-sub-data">No subject performance data available yet.</p>
                ) : (
                  <div className="subject-bars-list">
                    {report.subjectBreakdown.map((subj, idx) => (
                      <div className="subject-bar-row" key={idx}>
                        <div className="subj-info">
                          <span className="subj-title">{subj.subject}</span>
                          <span className="subj-meta">
                            {subj.attempts} attempts • {subj.averagePercentage}% avg
                          </span>
                        </div>
                        <div className="subj-track">
                          <div
                            className="subj-fill"
                            style={{ width: `${Math.min(subj.averagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Exam Submissions */}
            <div className="rep-panel recent-panel">
              <div className="panel-title-row">
                <div>
                  <h3>Recent Examination Attempts</h3>
                  <p className="panel-desc">Latest student completions in real-time.</p>
                </div>
              </div>

              {(!report.recentAttempts || report.recentAttempts.length === 0) ? (
                <p className="no-sub-data">No recent attempts logged.</p>
              ) : (
                <div className="rep-table-wrap">
                  <table className="rep-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Test / Subject</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Result</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.recentAttempts.map((att) => {
                        const isPass = att.passed || att.result === "pass";
                        return (
                          <tr key={att._id}>
                            <td>
                              <div className="student-info">
                                <span className="s-name">{att.studentId?.name || "Student"}</span>
                                <span className="s-email">{att.studentId?.email || "—"}</span>
                              </div>
                            </td>
                            <td>
                              <span className="t-title">{att.testId?.title || "Test"}</span>
                              <span className="t-sub">{att.testId?.subject || "General"}</span>
                            </td>
                            <td>
                              <span className="score-val">{att.score ?? att.obtainedMarks ?? 0}</span>
                              <span className="score-max">/{att.totalMarks ?? 100}</span>
                            </td>
                            <td>
                              <span className="perc-highlight">{att.percentage ?? 0}%</span>
                            </td>
                            <td>
                              <span className={`pill ${isPass ? "pass" : "fail"}`}>
                                {isPass ? "Passed" : "Failed"}
                              </span>
                            </td>
                            <td className="date-cell">{formatDate(att.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
