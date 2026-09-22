import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./MyAttempts.css";

const MyAttempts = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/attempts/my-attempts");
      const data = res.data.attempts || res.data || [];
      setAttempts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your attempts.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = attempts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "passed") return a.passed === true;
    if (filter === "failed") return a.passed === false;
    if (filter === "pending") return a.status === "started" || a.status === "in_progress";
    return true;
  });

  const stats = {
    total: attempts.length,
    passed: attempts.filter((a) => a.passed === true).length,
    failed: attempts.filter((a) => a.passed === false).length,
    avgScore:
      attempts.length > 0
        ? (
            attempts.reduce((sum, a) => sum + (a.percentage ?? a.score ?? 0), 0) /
            attempts.length
          ).toFixed(1)
        : 0,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (secs) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getStatusChip = (attempt) => {
    if (attempt.status === "started" || attempt.status === "in_progress") {
      return <span className="status-chip ongoing">In Progress</span>;
    }
    if (attempt.passed === true) {
      return <span className="status-chip passed">Passed</span>;
    }
    if (attempt.passed === false) {
      return <span className="status-chip failed">Failed</span>;
    }
    return <span className="status-chip submitted">{attempt.status || "Submitted"}</span>;
  };

  const exportCSV = () => {
    if (!filtered || filtered.length === 0) return;

    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      "Test Title",
      "Subject",
      "Score",
      "Total Marks",
      "Percentage",
      "Status",
      "Time Taken",
      "Date"
    ];

    const rows = filtered.map((a) => {
      const isPassed = a.passed === true;
      const testTitle = a.testId?.title || "Assessment";
      const subject = a.testId?.subject || "General";
      const score = a.score ?? a.obtainedMarks ?? 0;
      const totalMarks = a.totalMarks ?? a.testId?.totalMarks ?? 100;
      const percentage = `${a.percentage ?? 0}%`;
      const status = a.status === "started" || a.status === "in_progress"
        ? "In Progress"
        : isPassed
        ? "Passed"
        : "Failed";
      const timeTaken = formatTime(a.timeTaken);
      const dateStr = a.createdAt ? new Date(a.createdAt).toLocaleString("en-IN") : "";

      return [
        escapeCell(testTitle),
        escapeCell(subject),
        score,
        totalMarks,
        escapeCell(percentage),
        escapeCell(status),
        escapeCell(timeTaken),
        escapeCell(dateStr)
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `my_exam_attempts_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="My Attempts">
      <div className="my-attempts-page">

        <div className="attempts-header">
          <div>
            <h2>My Test Attempts</h2>
            <p>Track your test history, scores, and performance over time.</p>
          </div>
          <div className="attempts-header-actions">
            <button
              className="btn-export-attempts"
              onClick={exportCSV}
              disabled={filtered.length === 0}
              title="Download exam attempts as CSV"
            >
              📥 Export CSV
            </button>
            <button
              className="btn-refresh-attempts"
              onClick={fetchAttempts}
              title="Refresh attempts"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="attempts-stats">
          <div className="attempt-stat total">
            <span className="as-icon">📝</span>
            <strong>{stats.total}</strong>
            <span>Total Attempts</span>
          </div>
          <div className="attempt-stat passed">
            <span className="as-icon">✅</span>
            <strong>{stats.passed}</strong>
            <span>Passed</span>
          </div>
          <div className="attempt-stat failed">
            <span className="as-icon">❌</span>
            <strong>{stats.failed}</strong>
            <span>Failed</span>
          </div>
          <div className="attempt-stat avg">
            <span className="as-icon">📊</span>
            <strong>{stats.avgScore}%</strong>
            <span>Avg Score</span>
          </div>
        </div>

        {/* Filter */}
        <div className="attempts-filter-row">
          {["all", "passed", "failed", "pending"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && (
          <div className="attempts-state">
            <div className="spinner"></div>
            <p>Loading your attempts...</p>
          </div>
        )}

        {!loading && error && (
          <div className="attempts-state">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="attempts-state">
            <span>📋</span>
            <h3>No attempts found</h3>
            <p>{filter === "all" ? "You haven't taken any tests yet." : `No ${filter} attempts.`}</p>
            <button className="btn-go-tests" onClick={() => navigate("/student/available-tests")}>
              🎯 Browse Available Tests
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="attempts-table-wrapper">
            <table className="attempts-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Test</th>
                  <th>Score</th>
                  <th>%</th>
                  <th>Time Taken</th>
                  <th>Status</th>
                  <th>Policy & Remaining</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((attempt, idx) => (
                  <tr key={attempt._id}>
                    <td className="attempt-idx">{idx + 1}</td>
                    <td className="attempt-test">
                      <div className="attempt-test-info">
                        <span className="test-icon-sm">📝</span>
                        <div>
                          <strong>{attempt.testId?.title || "Untitled Test"}</strong>
                          {attempt.testId?.subject && (
                            <span className="test-subject-sm">{attempt.testId.subject}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="attempt-score">
                      <span className="score-display">
                        {attempt.score ?? "—"}/{attempt.totalMarks ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`pct-badge ${attempt.passed === true ? "good" : attempt.passed === false ? "bad" : ""}`}>
                        {attempt.percentage != null ? `${attempt.percentage.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="attempt-time">
                      {formatTime(attempt.timeTaken)}
                    </td>
                    <td>{getStatusChip(attempt)}</td>
                    <td className="attempt-policy">
                      <div className="policy-cell">
                        {attempt.hasPassed ? (
                          <span className="policy-badge qualified">
                            ✓ Qualified (0 pending)
                          </span>
                        ) : attempt.attemptsPending > 0 ? (
                          <span className="policy-badge pending">
                            {attempt.attemptsPending} re-attempt{attempt.attemptsPending > 1 ? "s" : ""} pending
                          </span>
                        ) : (
                          <span className="policy-badge exhausted">
                            Attempts Exhausted
                          </span>
                        )}
                        <span className="policy-mode-label">
                          {attempt.attemptMode === "best_of_n"
                            ? `Best of ${attempt.maxAttempts || 1} Attempts`
                            : `Re-attempts on Fail (Max ${attempt.maxAttempts || 1})`}
                        </span>
                      </div>
                    </td>
                    <td className="attempt-date">{formatDate(attempt.submittedAt || attempt.createdAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        {(attempt.status === "submitted" || attempt.status === "evaluated") && (
                          <button
                            className="btn-view-result"
                            onClick={() => navigate(`/student/result/${attempt._id}`)}
                          >
                            View Result
                          </button>
                        )}
                        {(attempt.status === "started" || attempt.status === "in_progress") && (
                          <button
                            className="btn-resume"
                            onClick={() => navigate(`/student/test/${attempt._id}/take`)}
                          >
                            Resume →
                          </button>
                        )}
                        {attempt.canReattempt && (
                          <button
                            className="btn-reattempt-action"
                            onClick={() => navigate(`/student/test/${attempt.testId?._id || attempt.testId}/instructions`)}
                            title="Start re-attempt for this assessment"
                          >
                            Re-attempt →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default MyAttempts;
