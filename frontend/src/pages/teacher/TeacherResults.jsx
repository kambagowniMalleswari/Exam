import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  FileTextIcon,
  PrinterIcon,
  RefreshIcon,
  BarChartIcon,
  CheckCircleIcon,
  XIcon,
  TargetIcon,
  AwardIcon,
  SearchIcon,
  AlertTriangleIcon
} from "../../components/common/Icons.jsx";
import "./TeacherResults.css";

const TeacherResults = () => {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [testsRes, resultsRes] = await Promise.all([
        api.get("/tests"),
        api.get("/results/organization")
      ]);
      setTests(testsRes.data.tests || testsRes.data || []);
      setResults(resultsRes.data.results || resultsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load results data.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestFilterChange = async (testId) => {
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
    avgScore:
      results.length > 0
        ? (results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length).toFixed(1)
        : 0,
    topScore:
      results.length > 0
        ? Math.max(...results.map((r) => r.percentage || 0))
        : 0
  };

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    if (!filteredResults || filteredResults.length === 0) return;

    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      "Student Name",
      "Email",
      "Test Title",
      "Subject",
      "Score",
      "Total Marks",
      "Percentage",
      "Status",
      "Submitted At"
    ];

    const rows = filteredResults.map((r) => {
      const isPassed = r.passed || r.result === "pass";
      const studentName = r.studentId?.name || "Student";
      const studentEmail = r.studentId?.email || "";
      const testTitle = r.testId?.title || "Assessment";
      const subject = r.testId?.subject || "General";
      const score = r.score ?? r.obtainedMarks ?? 0;
      const totalMarks = r.totalMarks ?? r.testId?.totalMarks ?? 100;
      const percentage = `${r.percentage ?? 0}%`;
      const status = isPassed ? "Passed" : "Failed";
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "";

      return [
        escapeCell(studentName),
        escapeCell(studentEmail),
        escapeCell(testTitle),
        escapeCell(subject),
        score,
        totalMarks,
        escapeCell(percentage),
        escapeCell(status),
        escapeCell(dateStr)
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    let testSuffix = "all";
    if (selectedTest !== "all") {
      const activeTestObj = tests.find((t) => t._id === selectedTest);
      if (activeTestObj?.title) {
        testSuffix = activeTestObj.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `student_results_${testSuffix}_${today}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <DashboardLayout title="Student Results">
      <div className="teacher-results-page">
        {/* Header */}
        <div className="tr-header">
          <div>
            <h2>Student Test Results</h2>
            <p>Monitor student performance across all administered assessments.</p>
          </div>
          <div className="tr-actions">
            <button
              className="btn-export"
              onClick={exportCSV}
              disabled={filteredResults.length === 0}
              title="Export results table to CSV spreadsheet"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <FileTextIcon size={15} />
              <span>Export CSV</span>
            </button>
            <button
              className="btn-print"
              onClick={handlePrint}
              title="Print report or save as PDF"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <PrinterIcon size={15} />
              <span>Print Report</span>
            </button>
            <button
              className="btn-refresh"
              onClick={fetchInitialData}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshIcon size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="tr-stats-grid">
          <div className="tr-stat-card total">
            <span className="stat-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><BarChartIcon size={20} /></span>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Submissions</span>
            </div>
          </div>
          <div className="tr-stat-card passed">
            <span className="stat-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CheckCircleIcon size={20} /></span>
            <div className="stat-info">
              <span className="stat-value">{stats.passed}</span>
              <span className="stat-label">Passed</span>
            </div>
          </div>
          <div className="tr-stat-card failed">
            <span className="stat-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><XIcon size={20} /></span>
            <div className="stat-info">
              <span className="stat-value">{stats.failed}</span>
              <span className="stat-label">Failed</span>
            </div>
          </div>
          <div className="tr-stat-card avg">
            <span className="stat-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><TargetIcon size={20} /></span>
            <div className="stat-info">
              <span className="stat-value">{stats.avgScore}%</span>
              <span className="stat-label">Average Score</span>
            </div>
          </div>
          <div className="tr-stat-card top">
            <span className="stat-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><AwardIcon size={20} /></span>
            <div className="stat-info">
              <span className="stat-value">{stats.topScore}%</span>
              <span className="stat-label">Top Score</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="tr-controls">
          <div className="tr-search">
            <span style={{ display: "inline-flex", alignItems: "center" }}><SearchIcon size={16} /></span>
            <input
              type="text"
              placeholder="Search by student name, email, or test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="tr-filters">
            <select
              value={selectedTest}
              onChange={(e) => handleTestFilterChange(e.target.value)}
              className="tr-select"
            >
              <option value="all">All Tests</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>

            <div className="tr-status-tabs">
              <button
                className={`tab-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                className={`tab-btn ${statusFilter === "passed" ? "active" : ""}`}
                onClick={() => setStatusFilter("passed")}
              >
                Passed
              </button>
              <button
                className={`tab-btn ${statusFilter === "failed" ? "active" : ""}`}
                onClick={() => setStatusFilter("failed")}
              >
                Failed
              </button>
            </div>
          </div>
        </div>

        {/* Content State */}
        {loading && (
          <div className="tr-state">
            <div className="spinner"></div>
            <p>Loading results...</p>
          </div>
        )}

        {!loading && error && (
          <div className="tr-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><AlertTriangleIcon size={32} /></span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredResults.length === 0 && (
          <div className="tr-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><FileTextIcon size={32} /></span>
            <h3>No results found</h3>
            <p>{search ? "No submissions match your search query." : "No student has completed any tests yet."}</p>
          </div>
        )}

        {/* Results Table */}
        {!loading && !error && filteredResults.length > 0 && (
          <div className="tr-table-card">
            <table className="tr-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r) => {
                  const isPassed = r.passed || r.result === "pass";
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar">
                            {r.studentId?.name ? r.studentId.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="student-name">{r.studentId?.name || "Student"}</div>
                            <div className="student-email">{r.studentId?.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="test-name">{r.testId?.title || "Assessment"}</div>
                        <div className="test-sub">{r.testId?.subject || "General"}</div>
                      </td>
                      <td>
                        <span className="score-val">
                          {r.score ?? r.obtainedMarks ?? 0}
                        </span>
                        <span className="score-total">
                          /{r.totalMarks ?? r.testId?.totalMarks ?? 100}
                        </span>
                      </td>
                      <td>
                        <div className="percentage-bar-cell">
                          <span className="perc-num">{r.percentage ?? 0}%</span>
                          <div className="mini-progress">
                            <div
                              className={`mini-bar ${isPassed ? "pass" : "fail"}`}
                              style={{ width: `${Math.min(r.percentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${isPassed ? "pass" : "fail"}`}>
                          {isPassed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="date-cell">{formatDate(r.createdAt)}</td>
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

export default TeacherResults;
