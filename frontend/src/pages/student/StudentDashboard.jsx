// Student Learning & Assessment Dashboard
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import {
  FileTextIcon,
  GraduationCapIcon,
  BarChartIcon,
  TargetIcon,
  BuildingIcon,
  ClockIcon,
  ShieldIcon
} from "../../components/common/Icons.jsx";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [availableTests, setAvailableTests] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        const [testsRes, reportRes] = await Promise.all([
          api.get("/attempts/available-tests").catch(() => ({ data: { tests: [] } })),
          api.get("/reports/student").catch(() => ({ data: { report: null } }))
        ]);

        setAvailableTests(testsRes.data?.tests || []);
        setReport(reportRes.data?.report || null);
      } catch (err) {
        console.error("Student dashboard fetch error:", err);
        setError("Unable to load latest student evaluation data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatScheduleDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getScheduleBadge = (test) => {
    const status = test.scheduleStatus || "active";
    if (status === "upcoming") {
      return (
        <span className="schedule-badge badge-upcoming">
          <span className="badge-dot dot-amber"></span>
          Upcoming ({formatScheduleDate(test.startDate) || "Scheduled"})
        </span>
      );
    }
    if (status === "closed") {
      return (
        <span className="schedule-badge badge-closed">
          <span className="badge-dot dot-slate"></span>
          Window Closed
        </span>
      );
    }
    return (
      <span className="schedule-badge badge-active">
        <span className="badge-dot dot-emerald"></span>
        Active Now
      </span>
    );
  };

  return (
    <DashboardLayout title="Student Academic Portal">
      <div className="student-dashboard">
        {/* Welcome Academic Banner */}
        <div className="academic-welcome-card">
          <div className="banner-left">
            <div className="academic-tag">
              <span className="academic-crest-icon"><BuildingIcon size={14} /></span>
              <span>Institutional Examination Portal</span>
            </div>
            <h2>Welcome, {user?.name || "Student Scholar"}</h2>
            <p>
              Access timed academic assessments, monitor real-time verification scores,
              and review your subject-wise competencies.
            </p>
            <div className="banner-quick-stats">
              <div className="quick-pill">
                <span className="pill-num">{report?.availableTestsCount ?? availableTests.length}</span>
                <span className="pill-lbl">Available Exams</span>
              </div>
              {report?.upcomingTestsCount > 0 && (
                <div className="quick-pill pill-highlight">
                  <span className="pill-num">{report.upcomingTestsCount}</span>
                  <span className="pill-lbl">Upcoming Schedules</span>
                </div>
              )}
              {report?.testsInProgressCount > 0 && (
                <div className="quick-pill pill-warning">
                  <span className="pill-num">{report.testsInProgressCount}</span>
                  <span className="pill-lbl">In Progress</span>
                </div>
              )}
            </div>
          </div>
          <div className="banner-action-area">
            <Link to="/student/available-tests" className="btn-academic-primary">
              Take Assessment →
            </Link>
            <Link to="/student/my-attempts" className="btn-academic-secondary">
              View Transcript
            </Link>
          </div>
        </div>

        {error && (
          <div className="academic-alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* 4-Stat Core Performance Metrics */}
        <div className="academic-kpi-grid">
          <div 
            className="kpi-card clickable"
            onClick={() => navigate("/student/available-tests")}
            role="button"
            tabIndex={0}
            title="Click to view all available assessments"
          >
            <div className="kpi-header">
              <span className="kpi-title">Active Assessments</span>
              <span className="kpi-icon-wrap icon-blue"><FileTextIcon size={18} /></span>
            </div>
            <div className="kpi-body">
              <div className="kpi-value">{report?.availableTestsCount ?? availableTests.length}</div>
              <div className="kpi-meta">
                {report?.upcomingTestsCount > 0
                  ? `+${report.upcomingTestsCount} scheduled to open`
                  : "Ready for immediate attempt"}
              </div>
            </div>
          </div>

          <div 
            className="kpi-card clickable"
            onClick={() => navigate("/student/my-attempts")}
            role="button"
            tabIndex={0}
            title="Click to view test transcripts and records"
          >
            <div className="kpi-header">
              <span className="kpi-title">Completed Exams</span>
              <span className="kpi-icon-wrap icon-teal"><GraduationCapIcon size={18} /></span>
            </div>
            <div className="kpi-body">
              <div className="kpi-value">{report?.completedTestsCount ?? 0}</div>
              <div className="kpi-meta">Official evaluation records</div>
            </div>
          </div>

          <div 
            className="kpi-card clickable"
            onClick={() => navigate("/student/my-attempts")}
            role="button"
            tabIndex={0}
            title="Click to view score breakdowns"
          >
            <div className="kpi-header">
              <span className="kpi-title">Cumulative Average</span>
              <span className="kpi-icon-wrap icon-purple"><BarChartIcon size={18} /></span>
            </div>
            <div className="kpi-body">
              <div className="kpi-value">
                {report?.averageScore !== undefined ? `${report.averageScore}%` : "N/A"}
              </div>
              <div className="kpi-meta">
                {report?.passRate !== undefined ? `${report.passRate}% Qualification Rate` : "No attempts recorded"}
              </div>
            </div>
          </div>

          <div 
            className="kpi-card clickable"
            onClick={() => navigate("/student/my-attempts")}
            role="button"
            tabIndex={0}
            title="Click to view attempt accuracy"
          >
            <div className="kpi-header">
              <span className="kpi-title">Accuracy Rate</span>
              <span className="kpi-icon-wrap icon-gold"><TargetIcon size={18} /></span>
            </div>
            <div className="kpi-body">
              <div className="kpi-value">
                {report?.accuracyRate !== undefined ? `${report.accuracyRate}%` : "N/A"}
              </div>
              <div className="kpi-meta">Questions answered correctly</div>
            </div>
          </div>
        </div>

        {/* Subject Domain Breakdown (Only rendered when live MongoDB data exists) */}
        {report?.subjectPerformance && report.subjectPerformance.length > 0 && (
          <div className="academic-section-card">
            <div className="section-header">
              <div>
                <h3>Subject Competency Breakdown</h3>
                <p>Real performance analytics derived from evaluated test submissions</p>
              </div>
              <span className="badge-subject-count">{report.subjectPerformance.length} Subjects Evaluated</span>
            </div>

            <div className="subject-bars-grid">
              {report.subjectPerformance.map((subj) => (
                <div key={subj.subject} className="subject-bar-card">
                  <div className="subject-card-top">
                    <span className="subject-name">{subj.subject}</span>
                    <span className="subject-score">{subj.avgPercentage}% Avg</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, subj.avgPercentage))}%`,
                        backgroundColor: subj.avgPercentage >= 70 ? "#059669" : subj.avgPercentage >= 40 ? "#d97706" : "#dc2626"
                      }}
                    ></div>
                  </div>
                  <div className="subject-card-bottom">
                    <span>{subj.testsTaken} {subj.testsTaken === 1 ? "Exam" : "Exams"} taken</span>
                    <span>{subj.passRate}% Pass rate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Split Grid: Ready Assessments vs Latest Verified Results */}
        <div className="academic-split-grid">
          {/* Left: Available Assessments */}
          <div className="academic-section-card">
            <div className="section-header">
              <div>
                <h3>Featured Assessments</h3>
                <p>Verified institutional MCQ examinations matching your curriculum</p>
              </div>
              <Link to="/student/available-tests" className="academic-link">
                View All ({availableTests.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="academic-loading">
                <div className="spinner"></div>
                <p>Loading examination catalog...</p>
              </div>
            ) : availableTests.length > 0 ? (
              <div className="assessments-list">
                {availableTests.slice(0, 4).map((test) => (
                  <div key={test._id} className="assessment-item">
                    <div className="assessment-main">
                      <div className="assessment-meta-tags">
                        <span className="subject-chip">{test.subject}</span>
                        {getScheduleBadge(test)}
                        <span className="duration-chip">⏱️ {test.duration} min</span>
                      </div>
                      <h4 className="assessment-title">{test.title}</h4>
                      <div className="assessment-details-row">
                        <span>{test.questionCount || 0} Questions</span>
                        <span>•</span>
                        <span>Pass Mark: {test.passingPercentage || 40}%</span>
                        {test.organizationId?.name && (
                          <>
                            <span>•</span>
                            <span className="org-label">{test.organizationId.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="assessment-action">
                      {test.activeAttemptId ? (
                        <button
                          className="btn-academic-accent btn-sm"
                          onClick={() => navigate(`/student/attempt/${test.activeAttemptId}`)}
                        >
                          <ClockIcon size={14} className="inline-icon mr-1" /> Resume Exam
                        </button>
                      ) : test.scheduleStatus === "upcoming" ? (
                        <button className="btn-academic-disabled btn-sm" disabled>
                          Opens Soon
                        </button>
                      ) : test.scheduleStatus === "closed" ? (
                        <button className="btn-academic-disabled btn-sm" disabled>
                          Closed
                        </button>
                      ) : test.canAttempt ? (
                        <button
                          className="btn-academic-primary btn-sm"
                          onClick={() => navigate(`/student/available-tests`)}
                        >
                          Start Exam →
                        </button>
                      ) : (
                        <button
                          className="btn-academic-secondary btn-sm"
                          onClick={() => navigate(`/student/available-tests`)}
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="academic-empty-state">
                <div className="empty-icon"><FileTextIcon size={36} /></div>
                <h4>No Exams Currently Published</h4>
                <p>Assessments published by your institution faculty will appear here automatically.</p>
              </div>
            )}
          </div>

          {/* Right: Latest Verified Results */}
          <div className="academic-section-card">
            <div className="section-header">
              <div>
                <h3>Latest Evaluation Records</h3>
                <p>Recent certified examination submissions</p>
              </div>
              <Link to="/student/my-attempts" className="academic-link">
                History →
              </Link>
            </div>

            {loading ? (
              <div className="academic-loading">
                <div className="spinner"></div>
                <p>Loading evaluation records...</p>
              </div>
            ) : report?.recentResults && report.recentResults.length > 0 ? (
              <div className="results-list">
                {report.recentResults.map((res) => (
                  <div key={res._id} className="result-item">
                    <div className="result-info">
                      <div className="result-header-row">
                        <strong className="result-test-title">
                          {res.testId?.title || "Academic Assessment"}
                        </strong>
                        <span className={`result-verdict-badge ${res.passed || res.result === "pass" ? "badge-pass" : "badge-fail"}`}>
                          {res.passed || res.result === "pass" ? "PASSED" : "NEEDS RETAKE"}
                        </span>
                      </div>
                      <div className="result-meta-row">
                        <span>Subject: {res.testId?.subject || "General"}</span>
                        <span>•</span>
                        <span>Submitted: {res.createdAt ? new Date(res.createdAt).toLocaleDateString() : "Recent"}</span>
                      </div>
                    </div>

                    <div className="result-score-block">
                      <div className="result-percentage">{res.percentage ?? 0}%</div>
                      <button
                        className="btn-academic-secondary btn-xs"
                        onClick={() => navigate(`/student/result/${res._id}`)}
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="academic-empty-state">
                <div className="empty-icon"><GraduationCapIcon size={36} /></div>
                <h4>No Examination History</h4>
                <p>Complete your first scheduled assessment to view certified performance transcripts.</p>
                <Link to="/student/available-tests" className="btn-academic-primary btn-sm mt-3">
                  Browse Assessments
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Academic Integrity & Schedule Notice Banner */}
        <div className="academic-notice-banner">
          <div className="notice-icon"><ShieldIcon size={28} /></div>
          <div className="notice-content">
            <h4>Institutional Integrity Guidelines</h4>
            <p>
              All examinations enforce strict session timing, question randomization, and automated result auditing.
              Ensure you possess a stable internet connection before beginning an exam.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
