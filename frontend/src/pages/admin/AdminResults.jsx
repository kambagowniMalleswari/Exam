import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./AdminResults.css";

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, resultsRes] = await Promise.all([
        api.get("/tests"),
        api.get("/results/organization")
      ]);
      setTests(testsRes.data.tests || testsRes.data || []);
      setResults(resultsRes.data.results || resultsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load results.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestFilter = async (testId) => {
    setSelectedTest(testId);
    try {
      setLoading(true);
      if (testId === "all") {
        const res = await api.get("/results/organization");
        setResults(res.data.results || []);
      } else {
        const res = await api.get(`/results/test/${testId}`);
        setResults(res.data.results || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to filter results.");
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((r) => {
    const studentName = r.studentId?.name?.toLowerCase() || "";
    const studentEmail = r.studentId?.email?.toLowerCase() || "";
    const testTitle = r.testId?.title?.toLowerCase() || "";
    const matchesSearch =
      studentName.includes(search.toLowerCase()) ||
      studentEmail.includes(search.toLowerCase()) ||
      testTitle.includes(search.toLowerCase());

    const isPassed = r.passed || r.result === "pass";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "passed" && isPassed) ||
      (statusFilter === "failed" && !isPassed);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: results.length,
    passed: results.filter((r) => r.passed || r.result === "pass").length,
    failed: results.filter((r) => !r.passed && r.result !== "pass").length,
    passRate:
      results.length > 0
        ? ((results.filter((r) => r.passed || r.result === "pass").length / results.length) * 100).toFixed(1)
        : 0,
    avgScore:
      results.length > 0
        ? (results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length).toFixed(1)
        : 0,
    topScore:
      results.length > 0
        ? Math.max(...results.map((r) => r.percentage || 0))
        : 0
  };

  const exportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = ["Student Name", "Email", "Test Title", "Score", "Total Marks", "Percentage", "Status", "Date"];
    const rows = filteredResults.map((r) => [
      `"${r.studentId?.name || "Student"}"`,
      `"${r.studentId?.email || ""}"`,
      `"${r.testId?.title || ""}"`,
      r.score ?? r.obtainedMarks ?? 0,
      r.totalMarks ?? 100,
      `${r.percentage ?? 0}%`,
      r.passed || r.result === "pass" ? "Passed" : "Failed",
      `"${new Date(r.createdAt).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `results_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <DashboardLayout title="Organization Results">
      <div className="admin-results-page">
        {/* Header */}
        <div className="ar-header">
          <div>
            <h2>Assessment Results</h2>
            <p>Comprehensive overview of student examinations and performance across your organization.</p>
          </div>
          <div className="ar-header-actions">
            <button className="btn-secondary" onClick={exportCSV} disabled={filteredResults.length === 0}>
              📥 Export CSV
            </button>
            <button className="btn-primary" onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="ar-stats-grid">
          <div className="ar-kpi total">
            <div className="kpi-icon">📋</div>
            <div className="kpi-body">
              <span className="kpi-number">{stats.total}</span>
              <span className="kpi-title">Total Submissions</span>
            </div>
          </div>
          <div className="ar-kpi pass">
            <div className="kpi-icon">✅</div>
            <div className="kpi-body">
              <span className="kpi-number">{stats.passed}</span>
              <span className="kpi-title">Passed Tests</span>
            </div>
          </div>
          <div className="ar-kpi fail">
            <div className="kpi-icon">❌</div>
            <div className="kpi-body">
              <span className="kpi-number">{stats.failed}</span>
              <span className="kpi-title">Failed Tests</span>
            </div>
          </div>
          <div className="ar-kpi rate">
            <div className="kpi-icon">📈</div>
            <div className="kpi-body">
              <span className="kpi-number">{stats.passRate}%</span>
              <span className="kpi-title">Pass Rate</span>
            </div>
          </div>
          <div className="ar-kpi avg">
            <div className="kpi-icon">🎯</div>
            <div className="kpi-body">
              <span className="kpi-number">{stats.avgScore}%</span>
              <span className="kpi-title">Avg Score</span>
            </div>
          </div>
          <div className="ar-kpi top">
            <div className="kpi-icon">🏆</div>
            <div className="kpi-body">
              <span className="kpi-number">{stats.topScore}%</span>
              <span className="kpi-title">Top Score</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="ar-toolbar">
          <div className="ar-search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by student, email, or test title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ar-filter-group">
            <select
              value={selectedTest}
              onChange={(e) => handleTestFilter(e.target.value)}
              className="ar-select"
            >
              <option value="all">All Tests ({tests.length})</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>

            <div className="ar-status-pills">
              <button
                className={`pill-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                className={`pill-btn ${statusFilter === "passed" ? "active" : ""}`}
                onClick={() => setStatusFilter("passed")}
              >
                Passed
              </button>
              <button
                className={`pill-btn ${statusFilter === "failed" ? "active" : ""}`}
                onClick={() => setStatusFilter("failed")}
              >
                Failed
              </button>
            </div>
          </div>
        </div>

        {/* Content View */}
        {loading && (
          <div className="ar-state">
            <div className="spinner"></div>
            <p>Loading assessment records...</p>
          </div>
        )}

        {!loading && error && (
          <div className="ar-state">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredResults.length === 0 && (
          <div className="ar-state">
            <span>📊</span>
            <h3>No results matched your criteria</h3>
            <p>{search ? "Try adjusting your search terms or filter selection." : "No exams have been attempted yet."}</p>
          </div>
        )}

        {!loading && !error && filteredResults.length > 0 && (
          <div className="ar-table-card">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test Title</th>
                  <th>Score / Max</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r) => {
                  const isPassed = r.passed || r.result === "pass";
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="student-profile">
                          <div className="avatar">
                            {r.studentId?.name ? r.studentId.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="name">{r.studentId?.name || "Student"}</div>
                            <div className="email">{r.studentId?.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="test-name">{r.testId?.title || "Assessment"}</div>
                        <div className="test-subject">{r.testId?.subject || "General"}</div>
                      </td>
                      <td>
                        <span className="bold-score">{r.score ?? r.obtainedMarks ?? 0}</span>
                        <span className="dim-score"> / {r.totalMarks ?? r.testId?.totalMarks ?? 100}</span>
                      </td>
                      <td>
                        <div className="progress-cell">
                          <span className="perc-text">{r.percentage ?? 0}%</span>
                          <div className="progress-track">
                            <div
                              className={`progress-fill ${isPassed ? "pass" : "fail"}`}
                              style={{ width: `${Math.min(r.percentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`result-badge ${isPassed ? "pass" : "fail"}`}>
                          {isPassed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="date-col">{formatDate(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminResults;
