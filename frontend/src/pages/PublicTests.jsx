import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import {
  ClockIcon,
  HelpCircleIcon,
  AwardIcon,
  GlobeIcon,
  GraduationCapIcon,
  SearchIcon,
  AlertTriangleIcon
} from "../components/common/Icons.jsx";
import "./PublicTests.css";

const PublicTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchPublicTests();
  }, []);

  const fetchPublicTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tests/public");
      const data = res.data.tests || res.data || [];
      setTests(Array.isArray(data) ? data : []);
      const uniqueSubjects = [...new Set(data.map((t) => t.subject).filter(Boolean))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load public tests.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = tests.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "all" || t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const getDifficultyColor = (marks) => {
    if (marks <= 20) return "easy";
    if (marks <= 50) return "medium";
    return "hard";
  };

  return (
    <div className="public-tests-page">
      {/* Navbar */}
      <nav className="public-nav">
        <Link to="/" className="public-nav-brand">
          <span className="brand-mark">IQ</span>
          <span className="brand-name">AssessIQ</span>
        </Link>
        <div className="public-nav-actions">
          <Link to="/login" className="btn-outline">Sign In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="public-tests-hero">
        <div className="hero-content">
          <span className="hero-badge">🌐 Public Test Library</span>
          <h1>Explore Free MCQ Tests</h1>
          <p>Browse hundreds of publicly available tests from verified creators and institutions. No account required to preview.</p>
          <div className="public-search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by title, subject, or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="public-search"
            />
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>{tests.length}</strong>
            <span>Public Tests</span>
          </div>
          <div className="hero-stat">
            <strong>{subjects.length}</strong>
            <span>Subjects</span>
          </div>
          <div className="hero-stat">
            <strong>Free</strong>
            <span>To Explore</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="public-tests-body">
        <div className="filter-bar">
          <span className="filter-label">Filter by Subject:</span>
          <div className="filter-chips">
            <button
              className={`filter-chip ${subjectFilter === "all" ? "active" : ""}`}
              onClick={() => setSubjectFilter("all")}
            >
              All
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                className={`filter-chip ${subjectFilter === s ? "active" : ""}`}
                onClick={() => setSubjectFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="filter-count">{filtered.length} tests found</span>
        </div>

        {loading && (
          <div className="public-tests-loading">
            <div className="spinner"></div>
            <p>Loading public tests...</p>
          </div>
        )}

        {!loading && error && (
          <div className="public-tests-error">
            <AlertTriangleIcon size={18} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="public-tests-empty">
            <SearchIcon size={28} />
            <p>{search ? `No tests found for "${search}"` : "No public tests available yet."}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="public-tests-grid">
            {filtered.map((test) => (
              <div className="public-test-card" key={test._id}>
                <div className="test-card-header">
                  <span className={`test-difficulty ${getDifficultyColor(test.totalMarks)}`}>
                    {getDifficultyColor(test.totalMarks) === "easy"
                      ? "Beginner"
                      : getDifficultyColor(test.totalMarks) === "medium"
                      ? "Intermediate"
                      : "Advanced"}
                  </span>
                  <span className="test-type-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <GlobeIcon size={12} /> Public
                  </span>
                </div>
                <div className="test-card-body">
                  <h3>{test.title}</h3>
                  {test.subject && (
                    <span className="test-subject-chip" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <GraduationCapIcon size={12} /> {test.subject}
                    </span>
                  )}
                  <p className="test-description">
                    {test.instructions
                      ? test.instructions.slice(0, 100) + (test.instructions.length > 100 ? "..." : "")
                      : "Take this test to assess your knowledge and skills."}
                  </p>
                  <div className="test-meta">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <ClockIcon size={13} /> {test.duration} min
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <HelpCircleIcon size={13} /> {Array.isArray(test.questions) ? test.questions.length : test.questionCount || 0} questions
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <AwardIcon size={13} /> {test.totalMarks || 0} marks
                    </span>
                  </div>
                </div>
                <div className="test-card-footer">
                  <div className="test-creator-info">
                    <div className="creator-avatar">
                      {test.createdBy?.name?.charAt(0) || "C"}
                    </div>
                    <span>{test.createdBy?.name || "Anonymous"}</span>
                  </div>
                  <button
                    className="btn-take-test"
                    onClick={() => navigate("/register")}
                  >
                    Take Test →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="public-cta">
        <h2>Ready to take tests?</h2>
        <p>Create a free account to start taking tests, track your progress, and compete with others.</p>
        <div className="cta-actions">
          <Link to="/register" className="btn-primary-lg">Create Free Account</Link>
          <Link to="/login" className="btn-ghost">Already have an account?</Link>
        </div>
      </section>
    </div>
  );
};

export default PublicTests;
