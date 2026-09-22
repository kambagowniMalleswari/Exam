import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  ClockIcon,
  HelpCircleIcon,
  AwardIcon,
  TargetIcon,
  RepeatIcon,
  BuildingIcon,
  GlobeIcon,
  LockIcon,
  HourglassIcon,
  FileTextIcon,
  SparklesIcon,
  SearchIcon
} from "../../components/common/Icons.jsx";
import "./AvailableTests.css";

const AvailableTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/attempts/available-tests");
      const data = res.data.tests || res.data || [];
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load available tests.");
    } finally {
      setLoading(false);
    }
  };

  const orgTestsCount = tests.filter((t) => t.organizationId).length;
  const publicTestsCount = tests.filter((t) => !t.organizationId).length;

  const filtered = tests.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "org" && t.organizationId) ||
      (filter === "public" && !t.organizationId);
    return matchesSearch && matchesFilter;
  });

  const handleStartTest = (testId) => {
    navigate(`/student/test/${testId}/instructions`);
  };

  return (
    <DashboardLayout title="Available Assessments">
      <div className="available-tests-page">

        {/* Hero Banner with Background Image */}
        <div className="available-hero-banner">
          <div className="hero-banner-overlay"></div>
          <div className="hero-banner-content">
            <div className="hero-banner-pill">
              <span className="live-pulse"></span>
              <span>AssessIQ Examination Catalog</span>
            </div>
            <h2>Available Assessments & Certifications</h2>
            <p>
              Browse tests assigned by your institution or challenge yourself with public skill certifications with real-time automatic grading.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="available-stats">
          <div className="available-stat-card card-total">
            <div className="stat-icon-wrap icon-total">
              <FileTextIcon size={20} />
            </div>
            <div>
              <strong>{tests.length}</strong>
              <span>Total Available</span>
            </div>
          </div>
          <div className="available-stat-card card-org">
            <div className="stat-icon-wrap icon-org">
              <BuildingIcon size={20} />
            </div>
            <div>
              <strong>{orgTestsCount}</strong>
              <span>Organization Tests</span>
            </div>
          </div>
          <div className="available-stat-card card-public">
            <div className="stat-icon-wrap icon-public">
              <GlobeIcon size={20} />
            </div>
            <div>
              <strong>{publicTestsCount}</strong>
              <span>Public Certifications</span>
            </div>
          </div>
          <div className="available-stat-card card-showing">
            <div className="stat-icon-wrap icon-showing">
              <SparklesIcon size={20} />
            </div>
            <div>
              <strong>{filtered.length}</strong>
              <span>Matching Filter</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="available-filter-bar">
          <div className="search-wrapper">
            <SearchIcon size={16} />
            <input
              type="text"
              placeholder="Search by test title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="available-search"
            />
          </div>

          <div className="filter-tabs">
            {[
              { id: "all", label: "All Tests", count: tests.length, icon: <FileTextIcon size={14} /> },
              { id: "org", label: "My Organization", count: orgTestsCount, icon: <BuildingIcon size={14} /> },
              { id: "public", label: "Public Tests", count: publicTestsCount, icon: <GlobeIcon size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`filter-tab ${filter === tab.id ? "active" : ""}`}
                onClick={() => setFilter(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="available-loading">
            <div className="spinner"></div>
            <p>Loading available assessments...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="available-error">
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="available-empty">
            <FileTextIcon size={32} />
            <h3>No assessments found</h3>
            <p>
              {search
                ? "No assessments match your search query."
                : "No tests found in this category right now. Check back soon!"}
            </p>
          </div>
        )}

        {/* Test Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="tests-grid">
            {filtered.map((test) => {
              const isOrg = Boolean(test.organizationId);
              const now = new Date();
              const isUpcoming = test.startDate && now < new Date(test.startDate);
              const isClosed = test.endDate && now > new Date(test.endDate);
              const scheduleStatus = isUpcoming ? "upcoming" : isClosed ? "closed" : "active";
              const canStart = (test.canAttempt ?? true) && scheduleStatus === "active";

              return (
                <div className="test-card" key={test._id}>
                  <div className="test-card-top">
                    <div className={`test-type-badge ${isOrg ? "org" : "pub"}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {isOrg ? <BuildingIcon size={13} /> : <GlobeIcon size={13} />}
                      <span>{isOrg ? "Organization Test" : "Public Exam"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      {scheduleStatus === "upcoming" && (
                        <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <HourglassIcon size={12} /> Upcoming
                        </span>
                      )}
                      {scheduleStatus === "closed" && (
                        <span style={{ fontSize: "0.72rem", background: "#fee2e2", color: "#b91c1c", padding: "3px 8px", borderRadius: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <LockIcon size={12} /> Closed
                        </span>
                      )}
                      {test.subject && (
                        <span className="subject-badge">{test.subject}</span>
                      )}
                    </div>
                  </div>

                  <div className="test-card-mid">
                    <h3>{test.title}</h3>
                    {test.description ? (
                      <p className="test-instructions-preview">
                        {test.description.slice(0, 100)}
                        {test.description.length > 100 ? "..." : ""}
                      </p>
                    ) : test.instructions ? (
                      <p className="test-instructions-preview">
                        {test.instructions.slice(0, 100)}
                        {test.instructions.length > 100 ? "..." : ""}
                      </p>
                    ) : null}

                    <div className="test-info-grid">
                      <div className="info-item">
                        <span className="info-icon"><ClockIcon size={14} /></span>
                        <span>{test.duration} min</span>
                      </div>
                      <div className="info-item">
                        <span className="info-icon"><HelpCircleIcon size={14} /></span>
                        <span>
                          {Array.isArray(test.questions)
                            ? test.questions.length
                            : test.questionCount || "?"}{" "}
                          Questions
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-icon"><AwardIcon size={14} /></span>
                        <span>{test.totalMarks || "—"} Marks</span>
                      </div>
                      <div className="info-item">
                        <span className="info-icon"><TargetIcon size={14} /></span>
                        <span>Pass: {test.passingPercentage || test.passingMarks || "—"}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="test-card-bot">
                    <div className="attempt-limit" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.78rem" }}>
                        <RepeatIcon size={13} />
                        <span>
                          {test.attemptMode === "best_of_n"
                            ? `Best of ${test.maxAttempts || 1}`
                            : `Re-attempts on Fail (Max ${test.maxAttempts || 1})`}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.74rem", color: test.hasPassed ? "#059669" : test.attemptsPending > 0 ? "#b45309" : "#64748b", fontWeight: 600 }}>
                        {test.hasPassed
                          ? "✓ Qualified (Passed)"
                          : test.studentAttemptsCount > 0
                          ? `${test.studentAttemptsCount}/${test.maxAttempts || 1} used • ${test.attemptsPending} remaining`
                          : `${test.attemptsPending || test.maxAttempts || 1} attempt(s) available`}
                      </span>
                    </div>

                    {test.activeAttemptId ? (
                      <button
                        className="btn-start"
                        style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
                        onClick={() => navigate(`/student/attempt/${test.activeAttemptId}`)}
                      >
                        Resume Attempt →
                      </button>
                    ) : canStart ? (
                      <button
                        className="btn-start"
                        onClick={() => handleStartTest(test._id)}
                      >
                        {test.studentAttemptsCount > 0 ? "Re-attempt Exam →" : "Start Test →"}
                      </button>
                    ) : (
                      <button
                        className="btn-start"
                        disabled
                        style={{
                          opacity: 0.85,
                          cursor: "not-allowed",
                          background: test.hasPassed ? "#ecfdf5" : "#f1f5f9",
                          color: test.hasPassed ? "#059669" : "#64748b",
                          border: test.hasPassed ? "1px solid #a7f3d0" : "1px solid #cbd5e1"
                        }}
                      >
                        {test.hasPassed ? "Qualified ✓" : isUpcoming ? "Upcoming" : isClosed ? "Closed" : "Exhausted"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AvailableTests;
